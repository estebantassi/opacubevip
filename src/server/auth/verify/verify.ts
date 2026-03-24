"use server";

import { GetImage } from "@lib/gcs/images";
import { deleteCachedValue } from "@lib/redis";
import { VerifyInput, VerifySchema } from "@schemas/register/schemas";
import { ActionHandler } from "@server/handler";
import { Token } from "@server/token";

type VerifyReturnType = {
    user: {
        avatar: string,
        uuid: string,
        username: string
    }
}

export const verify = ActionHandler<VerifyInput, VerifyReturnType>({
    schema: VerifySchema,
    transaction: true,
    requireAuth: true,
    authType: Token.Type.verify,

    handler: async ({ input, tx, auth }) => {

        const request = await tx.users.update({
            where: { uuid: auth.useruuid },
            data: {
                verified: true,
            },
                select: {
                uuid: true,
                username: true,
                avatar: true
            }
        });
        if (!request) return { success: false, message: "User not found" };

        const avatarURL = request.avatar ? `users/${request.uuid}/avatar` : `Default/avatar`;
        const avatar = await GetImage(avatarURL);
        if (!avatar) return { success: false, message: "Error fetching avatar" };

        const accessToken = new Token(request.uuid, Token.Type.access, Token.StorageType.CACHE);
        if (!await accessToken.Save(tx)) return { success: false, message: "Error creating a token" };

        const refreshToken = new Token(request.uuid, Token.Type.refresh, Token.StorageType.BOTH, null, accessToken.content.jti);
        if (!await refreshToken.Save(tx)) return { success: false, message: "Error creating a token" };

        Token.Remove("token_" + Token.Type.verify);
        deleteCachedValue(`${request.uuid}/signup/codes/${input.code}`);

        const user = {
            avatar,
            uuid: request.uuid,
            username: request.username
        }

        return { success: true, message: "Successfully created an account", data: { user } };
    }
});