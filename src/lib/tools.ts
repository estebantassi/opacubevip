import crypto from "crypto";

import z from "zod";
import { ActionResult } from "@mytypes/types";

export function validateSchema<TInput>(input: TInput | null, schema?: z.ZodType<TInput> | null): ActionResult<TInput> {
    let validatedInput: TInput;
    if (schema) {
        const result = schema.safeParse(input);
        if (!result.success) return { success: false, message: result.error.issues[0]?.message ?? "Invalid input", authorized: true }
        validatedInput = result.data;
    } else validatedInput = input as TInput;

    return { success: true, message: "Valid input", data: validatedInput }
}

export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const encrypt = (valuetoencrypt: string, secret: string): string => {
    const KEY = Buffer.from(secret, 'hex');

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);

    const encrypted = Buffer.concat([
        cipher.update(valuetoencrypt, 'utf8'),
        cipher.final()
    ]);

    const tag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
};

export const decrypt = (valuetodecrypt: string, secret: string): string => {
    const KEY = Buffer.from(secret, 'hex');

    const [ivHex, tagHex, encryptedHex] = valuetodecrypt.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
    ]);

    return decrypted.toString('utf8');
}