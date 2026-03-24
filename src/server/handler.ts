import z from "zod";
import { ActionResult, WithTurnstile } from "@mytypes/types";
import { Token, TokenContent } from "@server/token";
import { cookies } from "next/headers";
import { prisma, DB } from "@lib/prisma";
import { token_type } from "@prisma/enums";
import { ValidateTurnstile } from "@lib/turnstile";

type HandlerOptions<TInput, TOutput> = {
    schema?: z.ZodType<TInput>;
    requireAuth?: boolean;
    authType?: token_type;
    transaction?: boolean;
    turnstile?: boolean;
    handler: (ctx: {
        input: TInput;
        auth: TokenContent;
        tx: DB;
    }) => Promise<ActionResult<TOutput>>;
};

export function ActionHandler<TInput, TOutput = unknown>(options:  HandlerOptions<TInput, TOutput>) {
    return async (input?: TInput): Promise<ActionResult<TOutput>> => {
        try {
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

            //if transaction, return handler
            if (options.transaction) {
                return await prisma.$transaction(async (transaction) => {

                    const result = await options.handler({
                        input: validatedInput,
                        auth: authContent as TokenContent,
                        tx: transaction
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
                tx: prisma
            });

        } catch (err) {
            if (process.env.LOG_ERRORS === 'true') console.error(err);
            return { success: false, message: "Internal server error" };
        }
    };
}