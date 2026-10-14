"use server";

import crypto from "crypto";

import { LoginInput, LoginSchema, LoginStartInput, LoginStartSchema } from "@schemas/login/schemas";
import { Token } from "@server/token";
import srp from "secure-remote-password/server";
import { deleteCachedValue, getCachedValue, setCachedValue } from "@lib/redis";

import { ActionHandler } from "@server/handler";
import { User } from "@mytypes/types";
import { ratelimiters } from "@server/ratelimiters";

const EMAIL_HASH_SECRET = String(process.env.EMAIL_HASH_SECRET);
const GOOGLEBUCKETPUBLICURL = String(process.env.GOOGLE_BUCKET_PUBLIC_URL);

type LoginStartReturnType = {
    srpSalt: string,
    srpServerEphemeral: string
}

export const loginStart = ActionHandler<LoginStartInput, LoginStartReturnType>({
    schema: LoginStartSchema,
    turnstile: true,
    ratelimiter: ratelimiters.loginstart,

    handler: async ({ input, tx }) => {
        const emailHash = crypto.createHmac('sha256', EMAIL_HASH_SECRET).update(input.email).digest('hex');

        const request = await tx.users.findUnique({
            where: { hashed_email: emailHash },
            select: {
                srp_verifier: true,
                srp_salt: true,
                uuid: true,
                verified: true,
                auth_method: true,
            },
        });
        if (!request) return { success: false, message: "User not found" };

        if (request.auth_method != "OpacubeVIP" || !request.srp_verifier || !request.srp_salt) return { success: false, message: `You already have an account associated with this email using another service (${request.auth_method})` };
        if (!request.verified) return { success: false, message: `Your account is not verified` };

        const loginToken = new Token(request.uuid, Token.Type.login, Token.StorageType.CACHE, 0);
        if (!await loginToken.Save()) return { success: false, message: `Error saving token` };

        const srpServerEphemeral = srp.generateEphemeral(request.srp_verifier);
        await setCachedValue(`${request.uuid}/login/ephemeral`, 60 * 5, srpServerEphemeral.secret);

        return { success: true, message: "Successfully fetched trial", data: { srpSalt: request.srp_salt, srpServerEphemeral: srpServerEphemeral.public } };
    }
});

type LoginReturnType = {
    srpProof: string,
    user: User
}

export const login = ActionHandler<LoginInput, LoginReturnType>({
    schema: LoginSchema,
    ratelimiter: ratelimiters.login,
    requireAuth: true,
    authType: "login",

    handler: async ({ input, tx, auth }) => {

        if (auth.step != 0) return { success: false, message: "Invalid token step" }

        const emailHash = crypto.createHmac('sha256', EMAIL_HASH_SECRET).update(input.email).digest('hex');

        const request = await tx.users.findUnique({
            where: { hashed_email: emailHash },
            select: {
                srp_verifier: true,
                srp_salt: true,
                uuid: true,
                username: true,
                handle: true,
                avatar_version: true,
                banner_version: true,
                biography: true,
                admin: true,
            },
        });
        if (!request) return { success: false, message: "User not found" };

        const srpSecretEphemeral = await getCachedValue(`${request.uuid}/login/ephemeral`);
        if (!srpSecretEphemeral) return { success: false, message: "Request took to long" };

        if (!request.srp_verifier || !request.srp_salt) return { success: false, message: "Error fetching password salt and verifier" };

        let srpServerSession: srp.Session;
        try {
            srpServerSession = srp.deriveSession(srpSecretEphemeral, input.srpEphemeral, request.srp_salt, input.email, request.srp_verifier, input.srpProof);
        } catch { return { success: false, message: "Wrong password" }; }
        if (!srpServerSession || !srpServerSession.proof) { return { success: false, message: "Wrong password" }; }

        const avatarURL = request.avatar_version ? `users/${request.uuid}/avatar?v=${request.avatar_version}` : `Default/avatar`;
        const avatar = `${GOOGLEBUCKETPUBLICURL}${avatarURL}`;
        const bannerURL = request.banner_version ? `users/${request.uuid}/banner?v=${request.banner_version}` : `Default/banner`;
        const banner = `${GOOGLEBUCKETPUBLICURL}${bannerURL}`;

        const accessToken = new Token(request.uuid, Token.Type.access, Token.StorageType.CACHE, null, null, null, request.admin);
        if (!await accessToken.Save()) return { success: false, message: "Error creating a token" };

        const refreshToken = new Token(request.uuid, Token.Type.refresh, Token.StorageType.BOTH, null, accessToken.content.jti, null, request.admin);
        if (!await refreshToken.Save()) return { success: false, message: "Error creating a token" };

        Token.Remove("token_" + Token.Type.login);
        deleteCachedValue(`${request.uuid}/tokens/${Token.Type.login}/${auth.jti}`);

        const user : User = {
            handle: request.handle,
            avatar,
            uuid: request.uuid,
            username: request.username,
            banner,
            biography: request.biography,
            admin: request.admin,
        }

        return { success: true, message: "Successfully logged in", data: { user, srpProof: srpServerSession.proof } };
    }
});

export const oauthlogin = ActionHandler<null, User>({
    ratelimiter: ratelimiters.oauthlogin,
    requireAuth: true,
    authType: Token.Type.oauthlogin,

    handler: async ({ auth }) => {
        const user = auth.user;
        if (!user) return { success: false, message: "User data not present inside the token" };

        const accessToken = new Token(auth.useruuid, Token.Type.access, Token.StorageType.CACHE, null, null, null, auth.admin);
        if (!await accessToken.Save()) return { success: false, message: "Error creating a token" };

        const refreshToken = new Token(auth.useruuid, Token.Type.refresh, Token.StorageType.BOTH, null, accessToken.content.jti, null, auth.admin);
        if (!await refreshToken.Save()) return { success: false, message: "Error creating a token" };

        Token.Remove("token_" + Token.Type.oauthlogin);
        deleteCachedValue(`${auth.useruuid}/tokens/${Token.Type.oauthlogin}/${auth.jti}`);

        return { success: true, message: "Successfully logged in", data: user };
    }
});