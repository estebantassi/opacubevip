"use server";

import { ActionHandler } from "@server/handler";
import { ratelimiters } from "@server/ratelimiters";
import crypto from "crypto";
import { encrypt } from "@lib/tools";
import { auth_type } from "@prisma/enums";

const EMAIL_HASH_SECRET = String(process.env.EMAIL_HASH_SECRET);
const EMAIL_ENCRYPTION_SECRET_VERSION = String(process.env.EMAIL_ENCRYPTION_SECRET_VERSION);
const EMAIL_ENCRYPTION_SECRET = String(process.env['EMAIL_ENCRYPTION_SECRET_V' + EMAIL_ENCRYPTION_SECRET_VERSION]);

export const A_createUsers = ActionHandler({
    ratelimiter: ratelimiters.a_createusers,
    requireAdmin: true,

    handler: async ({ tx }) => {

        const baseDate = new Date()

        const users = Array.from({ length: 1000 }).map((_, i) => {
            const email = `user${i}@test.com`
            const emailHash = crypto.createHmac('sha256', EMAIL_HASH_SECRET).update(email).digest('hex');
            const emailEncrypted = EMAIL_ENCRYPTION_SECRET_VERSION + ":" + encrypt(email, EMAIL_ENCRYPTION_SECRET);

            return {
                created_at: new Date(baseDate.getTime() - i * 60_000),
                hashed_email: emailHash,
                encrypted_email: emailEncrypted,
                username: `user_${i}`,
                auth_method: auth_type.OpacubeVIP,
                srp_salt: null,
                srp_verifier: null,
                verified: true,
                admin: false,
                biography: 'test user',
            }
        })

        await tx.users.createMany({
            data: users,
            skipDuplicates: true,
        })

        return { success: true, message: "Successfully created users", data: null };
    }
});