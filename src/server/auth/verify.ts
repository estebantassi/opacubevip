"use server";

import { deleteCachedValue } from "@lib/redis";
import { User } from "@mytypes/types";
import { VerifyInput, VerifySchema } from "@schemas/register/schemas";
import { ActionHandler } from "@server/handler";
import { ratelimiters } from "@server/ratelimiters";
import { Token } from "@server/token";

type VerifyReturnType = {
    user: User
}

const GOOGLEBUCKETPUBLICURL = String(process.env.GOOGLE_BUCKET_PUBLIC_URL);

export const verify = ActionHandler<VerifyInput, VerifyReturnType>({
    schema: VerifySchema,
    transaction: true,
    requireAuth: true,
    authType: Token.Type.verify,
    ratelimiter: ratelimiters.verify,

    handler: async ({ input, tx, auth }) => {

        const request = await tx.users.update({
            where: { uuid: auth.useruuid },
            data: {
                verified: true,
            },
                select: {
                uuid: true,
                username: true,
                handle: true,
                biography: true,
                admin: true,
            }
        });

        if (!request) return { success: false, message: "User not found" };

        const avatar = `${GOOGLEBUCKETPUBLICURL}Default/avatar`;
        const banner = `${GOOGLEBUCKETPUBLICURL}Default/banner`;

        const accessToken = new Token(request.uuid, Token.Type.access, Token.StorageType.CACHE);
        if (!await accessToken.Save(tx)) return { success: false, message: "Error creating a token" };

        const refreshToken = new Token(request.uuid, Token.Type.refresh, Token.StorageType.BOTH, null, accessToken.content.jti);
        if (!await refreshToken.Save(tx)) return { success: false, message: "Error creating a token" };

        Token.Remove("token_" + Token.Type.verify);
        deleteCachedValue(`${request.uuid}/signup/codes/${input.code}`);

        const user: User = {
            handle: request.handle,
            avatar,
            uuid: request.uuid,
            username: request.username,
            banner,
            biography: request.biography,
            admin: request.admin
        }

        return { success: true, message: "Successfully created an account", data: { user } };
    }
});