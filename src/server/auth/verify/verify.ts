"use server";

import { GetImage } from "../../../lib/gcs/images";
import { deleteCachedValue } from "../../../lib/redis";
import { VerifyInput, VerifySchema } from "../../../schemas/register/schemas";
import { ActionHandler } from "../../handler";
import { Token } from "../../token";

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
    authType: Token.Type.VERIFY,

    handler: async ({ input, tx, auth }) => {

        const [request] = await tx<{ uuid: string, username: string, avatar: boolean }[]>`
            UPDATE users
            SET verified = true
            WHERE uuid = ${auth.useruuid}
            RETURNING uuid, username, avatar
        `;
        if (!request) return { success: false, message: "User not found" };

        const avatarURL = request.avatar ? `users/${request.uuid}/avatar` : `Default/avatar`;
        const avatar = await GetImage(avatarURL);
        if (!avatar) return { success: false, message: "Error fetching avatar" };

        const accessToken = new Token(request.uuid, Token.Type.ACCESS, Token.StorageType.CACHE);
        if (!await accessToken.Save(tx)) return { success: false, message: "Error creating a token" };

        const refreshToken = new Token(request.uuid, Token.Type.REFRESH, Token.StorageType.BOTH, null, accessToken.content.jti);
        if (!await refreshToken.Save(tx)) return { success: false, message: "Error creating a token" };

        Token.Remove("token_" + Token.Type.VERIFY.toLowerCase());
        deleteCachedValue(`${request.uuid}/signup/codes/${input.code}`);

        const user = {
            avatar,
            uuid: request.uuid,
            username: request.username
        }

        return { success: true, message: "Successfully created an account", data: { user } };
    }
});