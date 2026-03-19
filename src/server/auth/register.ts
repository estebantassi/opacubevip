"use server";

import { setCachedValue } from "../../lib/redis";
import { encrypt } from "../../lib/tools";
import { RegisterInput, RegisterSchema } from "../../schemas/register/schemas";
import { ActionHandler } from "../handler";
import crypto from "crypto";
import { Token } from "../token";
import getTransporter from "../../lib/mailer";

const EMAIL_HASH_SECRET = String(process.env.EMAIL_HASH_SECRET);
const EMAIL_ENCRYPTION_SECRET_VERSION = String(process.env.EMAIL_ENCRYPTION_SECRET_VERSION);
const EMAIL_ENCRYPTION_SECRET = String(process.env['EMAIL_ENCRYPTION_SECRET_V' + EMAIL_ENCRYPTION_SECRET_VERSION]);
const SECURITY_EMAIL = process.env.SECURITY_EMAIL;

export const register = ActionHandler<RegisterInput>({
    schema: RegisterSchema,
    transaction: true,

    handler: async ({ input, tx }) => {

        const emailHash = crypto.createHmac('sha256', EMAIL_HASH_SECRET).update(input.email).digest('hex');
        const emailEncrypted = EMAIL_ENCRYPTION_SECRET_VERSION + ":" + encrypt(input.email, EMAIL_ENCRYPTION_SECRET);

        const provider = "OpacubeVIP";
        const [request] = await tx<{ uuid: string, username: string, auth_method: string, avatar: boolean, inserted: boolean }[]>`
            INSERT INTO users (created_at, hashed_email, encrypted_email, auth_method, username, avatar, srp_salt, srp_verifier)
            VALUES (${new Date().toISOString()}, ${emailHash}, ${emailEncrypted}, ${provider}, ${input.username}, ${false}, ${input.srpSalt}, ${input.srpVerifier})
            ON CONFLICT (hashed_email)
            DO UPDATE SET hashed_email = users.hashed_email
            RETURNING uuid, username, auth_method, avatar, (xmax = 0) AS inserted;
        `;
        if (!request) return { success: false, message: "Error creating user" };

        if (provider != request.auth_method) return { success: false, message: `You already have an account associated with this email using another service ('${request.auth_method}')` };
        if (!request.inserted) return { success: false, message: "An account associated with this email already exists" };

        const code = crypto.randomBytes(3).toString("hex").toUpperCase();
        await setCachedValue(`${request.uuid}/signup/codes/${code}`, 60 * 30, '1');

        const verifyToken = new Token(request.uuid, Token.Type.VERIFY, Token.StorageType.CACHE);
        if (!await verifyToken.Save(tx)) return { success: false, message: "Error saving token" };

        await getTransporter().sendMail({
            from: SECURITY_EMAIL,
            to: input.email,
            subject: "Verification Code",
            text: `Verify your email by using this code:\n\n${code}\n\nIf you didn’t request this, ignore this email.`,
            html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 500px; margin: 0 auto; padding: 20px;">
                <h2 style="margin-bottom: 10px;">Email Verification</h2>

                <p style="margin-top: 0; color: #333;">
                Use the verification code below to confirm your email address:
                </p>

                <div style="
                background: #f4f4f4;
                border: 1px solid #ddd;
                padding: 15px;
                text-align: center;
                font-size: 28px;
                font-weight: bold;
                letter-spacing: 6px;
                border-radius: 8px;
                margin: 20px 0;
                color: #111;
                ">
                ${code}
                </div>

                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                If you did not request this, you can safely ignore this email.
                </p>
            </div>
            `,
        });

        return { success: true, message: "Successfully created an account", data: null };
    }
});