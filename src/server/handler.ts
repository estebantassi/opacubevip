import z from "zod";
import db from "../lib/db";
import { ActionResult } from "../types/types";
import postgres from "postgres";
import { Token, TokenContent, TokenType } from "./token";
import { cookies } from "next/headers";

type HandlerOptionsBase<TInput> = {
    schema?: z.ZodType<TInput>;
    requireAuth?: boolean;
    authType?: TokenType;
};

type HandlerOptionsWithTx<TInput, TOutput> = HandlerOptionsBase<TInput> & {
    transaction: true;
    handler: (ctx: {
        input: TInput;
        auth: TokenContent;
        tx: postgres.Sql;
    }) => Promise<ActionResult<TOutput>>;
};

type HandlerOptionsWithoutTx<TInput, TOutput> = HandlerOptionsBase<TInput> & {
    transaction?: false;
    handler: (ctx: {
        input: TInput;
        auth: TokenContent;
    }) => Promise<ActionResult<TOutput>>;
};

type HandlerOptions<TInput, TOutput> = HandlerOptionsWithTx<TInput, TOutput> | HandlerOptionsWithoutTx<TInput, TOutput>;

export function ActionHandler<TInput, TOutput = unknown>(options:  HandlerOptions<TInput, TOutput>) {
    return async (input?: TInput): Promise<ActionResult<TOutput>> => {
        try {

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
                const type = options.authType ? options.authType : Token.Type.ACCESS;
                const tokenData = await Token.GetData((await cookies()).get("token_" + type.toLowerCase())?.value, type);
                if (!tokenData.success) return tokenData;
                authContent = tokenData.data;
            }

            //if transaction, return handler
            if (options.transaction) {
                return await db.begin(async (transaction) => {

                    const tx = (transaction as unknown as postgres.Sql);

                    const result = await options.handler({
                        input: validatedInput,
                        auth: authContent as TokenContent,
                        tx 
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
                auth: authContent as TokenContent
            });

        } catch (err) {
            if (process.env.LOG_ERRORS === 'true') console.error(err);
            return { success: false, message: "Internal server error" };
        }
    };
}