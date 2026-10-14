export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { encrypt } from "@lib/tools";
import axios from "axios";
import { compressImage } from "@lib/compressimage";
import { Token } from "@server/token";
import { getBucket } from "@lib/gcs";
import { ActionResult, User } from "@mytypes/types";
import { GetGoogleUser } from "@lib/oauth/getuser/google";
import { GetDiscordUser } from "@lib/oauth/getuser/discord";
import { GetGitlabUser } from "@lib/oauth/getuser/gitlab";
import { GetTwitchUser } from "@lib/oauth/getuser/twitch";
import { GetGithubUser } from "@lib/oauth/getuser/github";
import { prisma } from "@lib/prisma";
import { v7 as uuidv7 } from 'uuid';

const LOG_ERRORS = Boolean(process.env.LOG_ERRORS === "true");

const CLIENT_URL = String(process.env.CLIENT_URL);
const SERVER_URL = String(process.env.SERVER_URL);

const EMAIL_HASH_SECRET = String(process.env.EMAIL_HASH_SECRET);
const EMAIL_ENCRYPTION_SECRET_VERSION = String(process.env.EMAIL_ENCRYPTION_SECRET_VERSION);
const EMAIL_ENCRYPTION_SECRET = String(process.env['EMAIL_ENCRYPTION_SECRET_V' + EMAIL_ENCRYPTION_SECRET_VERSION]);

const GOOGLEBUCKETPUBLICURL = String(process.env.GOOGLE_BUCKET_PUBLIC_URL);

export async function GET(req: Request) {
    //Add rate limiting here

    const url = new URL(req.url);

    const errorURL = CLIENT_URL + `/oauth?oauth=error&error=`;
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

    let oauthlogintoken: Token | undefined;
    try {
        let avatar: Buffer<ArrayBufferLike> | null;
        if (user.avatarURL) {
            const avatarReq = await axios.get(user.avatarURL, { responseType: 'arraybuffer' });
            const compressedAvatar = await compressImage(avatarReq.data, "avatar");
            avatar = compressedAvatar.success ? compressedAvatar.data : null;
        }

        await prisma.$transaction(async (tx) => {
            const images_version = uuidv7();
            const avatar_version = avatar != null ? images_version : null;
            const [request] = await tx.$queryRaw<{ handle: string; uuid: string; username: string; auth_method: string; banner_version: string; avatar_version: string | null; biography: string; admin: boolean; inserted: boolean }[]>`
                INSERT INTO users (created_at, hashed_email, encrypted_email, auth_method, username, avatar_version)
                VALUES (${new Date().toISOString()}, ${emailHash}, ${emailEncrypted}, ${providerPretty}, ${user.username}, ${avatar_version})
                ON CONFLICT (hashed_email)
                DO UPDATE SET hashed_email = users.hashed_email
                RETURNING handle, uuid, username, auth_method, banner_version, avatar_version, biography, admin, (xmax = 0) AS inserted;
            `;
            if (!request) throw { success: false, message: "Error creating user" };

            if (providerPretty != request.auth_method) throw { success: false, message: `You already have an account associated with this email using another service ('${request.auth_method}')` };

            let avatarPath = avatar ? `users/${request.uuid}/avatar?v=${request.avatar_version}` : `Default/avatar`;
            if (request.inserted && avatar) {
                try {
                    await getBucket().file(`users/${request.uuid}/avatar`).save(avatar, {
                        metadata: {
                            contentType: 'image/webp',
                            cacheControl: 'public, max-age=3600',
                                metadata: {
                                version: images_version,
                            },
                        }
                    });
                } catch (err) {
                    if (LOG_ERRORS) console.error(err);
                    throw { success: false, message: "Error with Google Cloud Storage" };
                }
                avatarPath = `users/${request.uuid}/avatar?v=${images_version}`;
            }
            
            const avatarURL = `${GOOGLEBUCKETPUBLICURL}${avatarPath}`;
            const bannerPath = request.banner_version ? `users/${request.uuid}/banner?v=${request.banner_version}` : `Default/banner`;
            const bannerURL = `${GOOGLEBUCKETPUBLICURL}${bannerPath}`;

            const userToReturn: User = {
                handle: request.handle,
                uuid: request.uuid,
                username: request.username,
                avatar: avatarURL,
                banner: bannerURL,
                biography: request.biography,
                admin: request.admin,
            };

            oauthlogintoken = new Token(userToReturn.uuid, Token.Type.oauthlogin, Token.StorageType.CACHE, null, null, userToReturn, request.admin);
            if (!await oauthlogintoken.Save(tx)) throw { success: false, message: "Error creating a token" };
        });

        if (!oauthlogintoken) return NextResponse.redirect(errorURL + encodeURIComponent(`OAuth token couldn't be created`));

        const response = NextResponse.redirect(`${CLIENT_URL}/oauth?oauth=success`);

        response.cookies.set({
            name: "token_" + oauthlogintoken.type,
            value: oauthlogintoken.version + ":" + oauthlogintoken.token,
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.SECURE === "true",
            maxAge: oauthlogintoken.duration / 1000,
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