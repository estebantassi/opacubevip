"use server";

import crypto from "crypto";

import { LoginInput, LoginSchema, LoginStartInput, LoginStartSchema } from "../../schemas/login/schemas";
import { Token } from "../token";
import srp from "secure-remote-password/server";
import { deleteCachedValue, getCachedValue, setCachedValue } from "../../lib/redis";

import { cookies } from "next/headers";
import { GetImage } from "../../lib/gcs/images";
import { ActionHandler } from "../handler";
import getDB from "../../lib/db";

const EMAIL_HASH_SECRET = String(process.env.EMAIL_HASH_SECRET);

type LoginStartReturnType = {
    srpSalt: string,
    srpServerEphemeral: string
}

export const loginStart = ActionHandler<LoginStartInput, LoginStartReturnType>({
    schema: LoginStartSchema,

    handler: async ({ input }) => {

        const emailHash = crypto.createHmac('sha256', EMAIL_HASH_SECRET).update(input.email).digest('hex');

        const [request] = await getDB()<{ uuid: string, srp_salt: string, srp_verifier: string, verified: boolean, auth_method: string }[]>`
            SELECT uuid, srp_salt, srp_verifier, verified, auth_method
            FROM users
            WHERE hashed_email=${emailHash}
            LIMIT 1
        `;
        if (!request) return { success: false, message: "User not found" };

        if (request.auth_method != "OpacubeVIP") return { success: false, message: `You already have an account associated with this email using another service (${request.auth_method})` };
        if (!request.verified) return { success: false, message: `Your account is not verified` };

        const loginToken = new Token(request.uuid, Token.Type.LOGIN, Token.StorageType.CACHE, 0);
        if (!await loginToken.Save()) return { success: false, message: `Error saving token` };

        const srpServerEphemeral = srp.generateEphemeral(request.srp_verifier);
        await setCachedValue(`${request.uuid}/login/ephemeral`, 60 * 5, srpServerEphemeral.secret);

        return { success: true, message: "Successfully fetched trial", data: { srpSalt: request.srp_salt, srpServerEphemeral: srpServerEphemeral.public } };
    }
});

type LoginReturnType = {
    srpProof: string,
    user: {
        avatar: string,
        uuid: string,
        username: string
    }
}

export const login = ActionHandler<LoginInput, LoginReturnType>({
    schema: LoginSchema,

    handler: async ({ input }) => {

        const tokenData = await Token.GetData((await cookies()).get("token_" + Token.Type.LOGIN.toLowerCase())?.value, Token.Type.LOGIN);
        if (!tokenData.success) return tokenData;
        if (tokenData.data.step != 0) return { success: false, message: "Invalid token step" }

        const emailHash = crypto.createHmac('sha256', EMAIL_HASH_SECRET).update(input.email).digest('hex');

        const [request] = await getDB()<{ uuid: string, srp_salt: string, srp_verifier: string, username: string, avatar: boolean }[]>`
            SELECT uuid, srp_salt, srp_verifier, username, avatar
            FROM users
            WHERE hashed_email=${emailHash}
            LIMIT 1
        `;
        if (!request) return { success: false, message: "User not found" };

        const srpSecretEphemeral = await getCachedValue(`${request.uuid}/login/ephemeral`);
        if (!srpSecretEphemeral) return { success: false, message: "Request took to long" };

        let srpServerSession: srp.Session;
        try {
            srpServerSession = srp.deriveSession(srpSecretEphemeral, input.srpEphemeral, request.srp_salt, input.email, request.srp_verifier, input.srpProof);
        } catch { return { success: false, message: "Wrong password" }; }
        if (!srpServerSession || !srpServerSession.proof) { return { success: false, message: "Wrong password" }; }

        const avatarURL = request.avatar ? `users/${request.uuid}/avatar` : `Default/avatar`;
        const avatar = await GetImage(avatarURL);
        if (!avatar) return { success: false, message: "Error fetching avatar" };

        const accessToken = new Token(request.uuid, Token.Type.ACCESS, Token.StorageType.CACHE);
        if (!await accessToken.Save()) return { success: false, message: "Error creating a token" };

        const refreshToken = new Token(request.uuid, Token.Type.REFRESH, Token.StorageType.BOTH, null, accessToken.content.jti);
        if (!await refreshToken.Save()) return { success: false, message: "Error creating a token" };

        Token.Remove("token_" + Token.Type.LOGIN.toLowerCase());
        deleteCachedValue(`${request.uuid}/tokens/${Token.Type.LOGIN}/${tokenData.data.jti}`);

        const user = {
            avatar,
            uuid: request.uuid,
            username: request.username
        }

        return { success: true, message: "Successfully logged in", data: { user, srpProof: srpServerSession.proof } };
    }
});