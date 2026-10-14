import z from "zod";
import { ActionResult, WithTurnstile } from "@mytypes/types";
import { Token, TokenContent } from "@server/token";
import { cookies } from "next/headers";
import { prisma, DB } from "@lib/prisma";
import { token_type } from "@prisma/enums";
import { ValidateTurnstile } from "@lib/turnstile";
import { getClientIP } from "@lib/geo/tools";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { connectRedis, getCachedValue, setCachedValue } from "@lib/redis";

type HandlerOptions<TInput, TOutput> = {
    schema?: z.ZodType<TInput>;
    requireAuth?: boolean;
    authType?: token_type;
    transaction?: boolean;
    turnstile?: boolean;
    ratelimiter: RateLimiterRedis;
    requireAdmin?: boolean;
    handler: (ctx: {
        input: TInput;
        auth: TokenContent;
        tx: DB;
        ip: string;
    }) => Promise<ActionResult<TOutput>>;
};

export function ActionHandler<TInput, TOutput = unknown>(options:  HandlerOptions<TInput, TOutput>) {
    return async (input?: TInput): Promise<ActionResult<TOutput>> => {
        try {
            const ip = await getClientIP();
            try {
                await connectRedis();
                await options.ratelimiter.consume(ip);
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
            } catch (err: any) {
                if (!err?.msBeforeNext) return { success: false, message: "Internal server error while rate limiting" };

                const secs = Math.round(err.msBeforeNext / 1000) || 1;
                return { success: false, message: `You are rate limited, try again in ${secs}s` };
            }

            if (options.turnstile) {
                const { turnstileToken } = input as TInput & WithTurnstile;
                const turnstile = await ValidateTurnstile(turnstileToken);
                if (!turnstile) return { success: false, message: "Invalid turnstile" };
            }

            //check input
            let validatedInput: TInput;
            if (options.schema) {
                const result = options.schema.safeParse(input);
                if (!result.success) return { success: false, message: result.error.issues[0]?.message ?? "Invalid input" }
                validatedInput = result.data;
            } else validatedInput = input as TInput;

            //check authentication
            let authContent: TokenContent | null = null;
            if (options.requireAuth) {
                const type = options.authType ? options.authType : Token.Type.access;
                const tokenData = await Token.GetData((await cookies()).get("token_" + type.toLowerCase())?.value, type);
                if (!tokenData.success) return tokenData;
                authContent = tokenData.data;
            }

            //check admin
            if (options.requireAdmin) {
                const type = Token.Type.access;
                const tokenData = await Token.GetData((await cookies()).get("token_" + type.toLowerCase())?.value, type);
                if (!tokenData.success) return tokenData;
                authContent = tokenData.data;

                if (!authContent.admin) return { success: false, message: "You are not an administrator" };

                if (!(await getCachedValue(`${authContent.useruuid}/admin`))) {
                    const request = await prisma.users.findUnique({
                        where: { uuid: authContent.useruuid },
                        select: {
                            admin: true,
                        },
                    });

                    if (!request) return { success: false, message: "User not found" };
                    if (!request.admin) return { success: false, message: "You are not an administrator" };

                    await setCachedValue(`${authContent.useruuid}/admin`, 15 * 60, "1");
                }
            }

            //if transaction, return handler
            if (options.transaction) {
                return await prisma.$transaction(async (transaction) => {

                    const result = await options.handler({
                        input: validatedInput,
                        auth: authContent as TokenContent,
                        tx: transaction,
                        ip
                    });

                    if (!result.success) throw result;
                    return result;
                }).catch((err) => {
                    if (typeof err === "object" && err !== null && "success" in err) return err;
                    throw err;
                });
            }

            //else return without the transaction
            return await options.handler({
                input: validatedInput,
                auth: authContent as TokenContent,
                tx: prisma,
                ip
            });

        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        } catch (err: any) {
            if (process.env.LOG_ERRORS === 'true') console.error(err);
            if (err?.message) return { success: false, message: err.message };
            return { success: false, message: "Internal server error" };
        }
    };
}