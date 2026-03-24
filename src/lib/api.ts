import z from "zod";
import { ActionResult } from "@mytypes/types";
import { validateSchema } from "@lib/tools";

export async function APICall<TInput, TOutput>(fn: (input: TInput) => Promise<ActionResult<TOutput>>, input: TInput | null, schema: z.ZodType<TInput> | null): Promise<ActionResult<TOutput>> {
    try {
        const validatedInput = validateSchema(input, schema);
        if (!validatedInput.success) return validatedInput;

        return await fn(validatedInput.data);
    } catch (err) {
        console.error(err);
        return { success: false, message: "Internal server error", authorized: true };
    }
}