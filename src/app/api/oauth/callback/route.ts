export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { GetGoogleUser } from "../../../../lib/oauth/getuser/google";
import { encrypt } from "../../../../lib/tools";
import axios from "axios";
import { compressImage } from "../../../../lib/compressimage";
import { Token } from "../../../../server/token";
import { getBucket } from "../../../../lib/gcs/gcs";
import { ActionResult, User } from "../../../../types/types";
import { GetImage } from "../../../../lib/gcs/images";
import { GetDiscordUser } from "../../../../lib/oauth/getuser/discord";
import { GetGitlabUser } from "../../../../lib/oauth/getuser/gitlab";
import { GetTwitchUser } from "../../../../lib/oauth/getuser/twitch";
import { GetGithubUser } from "../../../../lib/oauth/getuser/github";
import { prisma } from "@lib/prisma";

const LOG_ERRORS = Boolean(process.env.LOG_ERRORS === "true");

const CLIENT_URL = String(process.env.CLIENT_URL);
const SERVER_URL = String(process.env.SERVER_URL);

const EMAIL_HASH_SECRET = String(process.env.EMAIL_HASH_SECRET);
const EMAIL_ENCRYPTION_SECRET_VERSION = String(process.env.EMAIL_ENCRYPTION_SECRET_VERSION);
const EMAIL_ENCRYPTION_SECRET = String(process.env['EMAIL_ENCRYPTION_SECRET_V' + EMAIL_ENCRYPTION_SECRET_VERSION]);

export async function GET(req: Request) {
    const url = new URL(req.url);

    const errorURL = CLIENT_URL + `/login?oauth=error&error=`;
    const cookieStore = await cookies();

    const state = url.searchParams.get("state");
    const oauthState = cookieStore.get("oauthState")?.value;
    if (!state || !oauthState || state !== oauthState) return NextResponse.redirect(errorURL + encodeURIComponent("Invalid state"));

    const code = url.searchParams.get("code");
    const codeVerifier = cookieStore.get("codeVerifier")?.value;
    if (!code) return NextResponse.redirect(errorURL + encodeURIComponent("Error providing the code"));
    if (!codeVerifier) return NextResponse.redirect(errorURL + encodeURIComponent("Error providing the verifier"));

    cookieStore.delete("oauthState");
    cookieStore.delete("codeVerifier");

    const provider = url.searchParams.get("provider")?.toLowerCase();
    if (!provider || !["discord", "google", "gitlab", "twitch", "github"].includes(provider)) return NextResponse.redirect(errorURL + encodeURIComponent("Invalid OAuth provider"));

    const redirectURI = SERVER_URL + "/api/oauth/callback?provider=" + provider;

    let user: { username: string, avatarURL: string | null, email: string | null, verified: boolean } | null;
    switch (provider) {
        case "discord":
            user = await GetDiscordUser(redirectURI, codeVerifier, code);
            break;
        case "google":
            user = await GetGoogleUser(redirectURI, codeVerifier, code);
            break;
        case "gitlab":
            user = await GetGitlabUser(redirectURI, codeVerifier, code);
            break;
        case "twitch":
            user = await GetTwitchUser(redirectURI, codeVerifier, code);
            break;
        case "github":
            user = await GetGithubUser(redirectURI, codeVerifier, code);
            break;
        default:
            return NextResponse.redirect(errorURL + encodeURIComponent("Invalid OAuth provider"));
    }

    const providerPretty = provider.charAt(0).toUpperCase() + provider.slice(1);
    if (!user) return NextResponse.redirect(errorURL + encodeURIComponent(`Couldn't fetch user information from ${providerPretty}`));
    if (!user.verified) return NextResponse.redirect(errorURL + encodeURIComponent(`You must validate your email inside ${providerPretty}`));
    if (!user.email) return NextResponse.redirect(errorURL + encodeURIComponent(`Couldn't fetch email information from ${providerPretty}`));

    const emailHash = crypto.createHmac('sha256', EMAIL_HASH_SECRET).update(user.email).digest('hex');
    const emailEncrypted = EMAIL_ENCRYPTION_SECRET_VERSION + ":" + encrypt(user.email, EMAIL_ENCRYPTION_SECRET);

    try {
        let avatar: Buffer<ArrayBufferLike> | null;
        if (user.avatarURL) {
            const avatarReq = await axios.get(user.avatarURL, { responseType: 'arraybuffer' });
            const compressedAvatar = await compressImage(avatarReq.data, "avatar");
            avatar = compressedAvatar.success ? compressedAvatar.data : null;
        }

        const finalUser = await prisma.$transaction(async (tx) => {
            const [request] = await tx.$queryRaw<{ uuid: string; username: string; auth_method: string; avatar: boolean; inserted: boolean }[]>`
                INSERT INTO users (created_at, hashed_email, encrypted_email, auth_method, username, avatar)
                VALUES (${new Date().toISOString()}, ${emailHash}, ${emailEncrypted}, ${providerPretty}, ${user.username}, ${avatar != null})
                ON CONFLICT (hashed_email)
                DO UPDATE SET hashed_email = users.hashed_email
                RETURNING uuid, username, auth_method, avatar, (xmax = 0) AS inserted;
            `;
            if (!request) throw { success: false, message: "Error creating user" };

            if (providerPretty != request.auth_method) throw { success: false, message: `You already have an account associated with this email using another service ('${request.auth_method}')` };

            const accessToken = new Token(request.uuid, Token.Type.access, Token.StorageType.CACHE);
            if (!await accessToken.Save(tx)) throw { success: false, message: "Error creating a token" };

            const refreshToken = new Token(request.uuid, Token.Type.refresh, Token.StorageType.BOTH, null, accessToken.content.jti);
            if (!await refreshToken.Save(tx)) throw { success: false, message: "Error creating a token" };

            if (request.inserted && avatar) {
                try {
                    await getBucket().file(`users/${request.uuid}/avatar`).save(avatar, {
                        metadata: {
                            contentType: 'image/webp',
                            cacheControl: 'public, max-age=3600'
                        }
                    });
                } catch (err) {
                    if (LOG_ERRORS) console.error(err);
                    throw { success: false, message: "Error with Google Cloud Storage" };
                }
            }

            const avatarPath = avatar ? `users/${request.uuid}/avatar` : `Default/avatar`;
            const avatarURL = await GetImage(avatarPath);
            if (!avatarURL) throw { success: false, message: "Error fetching avatar" };

            const userToReturn: User = {
                uuid: request.uuid,
                username: request.username,
                avatar: avatarURL
            };

            return userToReturn;
        });

        const response = NextResponse.redirect(`${CLIENT_URL}/profile/${finalUser.uuid}?oauth=success`);

        response.cookies.set({
            name: "user",
            value: JSON.stringify(finalUser),
            sameSite: "strict",
            secure: process.env.NEXT_PUBLIC_SECURE === "true",
            maxAge: 60 * 60 * 24 * 7
        });

        return response;
    } catch (err) {
        if (LOG_ERRORS) console.error(err);
        return NextResponse.redirect(errorURL + encodeURIComponent(
            typeof err === "object" && err !== null && "message" in err
                ? (err as ActionResult).message
                : "Unknown internal error"
        ));
    }
}