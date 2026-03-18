"use server";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";

const CLIENT_URL = String(process.env.CLIENT_URL);
const SERVER_URL = String(process.env.SERVER_URL);
const SECURE = Boolean(process.env.SECURE === "true");

export async function GET(req: Request) {
    const errorURL = CLIENT_URL + `/login?oauth=error&error=`;

    const url = new URL(req.url);
    const provider = url.searchParams.get("provider")?.toLowerCase();
    if (!provider || !["discord", "google", "gitlab", "twitch", "github"].includes(provider)) return NextResponse.redirect(errorURL + encodeURIComponent("Invalid OAuth provider"));

    const clientid = process.env[provider.toUpperCase() + "_CLIENT_ID"];
    const redirectURI = SERVER_URL + "/api/oauth/callback?provider=" + provider;

    let apiURL, scope;
    switch (provider) {
        case "discord":
            apiURL = "https://discord.com/api/oauth2/authorize";
            scope = "identify email";
            break;
        case "google":
            apiURL = "https://accounts.google.com/o/oauth2/v2/auth";
            scope = "openid profile email";
            break;
        case "gitlab":
            apiURL = "https://gitlab.com/oauth/authorize";
            scope = "openid profile email";
            break;
        case "twitch":
            apiURL = "https://id.twitch.tv/oauth2/authorize";
            scope = "user:read:email";
            break;
        case "github":
            apiURL = "https://github.com/login/oauth/authorize";
            scope = "read:user user:email";
            break;
        default:
            return NextResponse.redirect(errorURL + encodeURIComponent("Invalid OAuth provider"));
    }

    const state = crypto.randomUUID();

    const codeVerifier = crypto.randomBytes(32).toString("hex");
    const codeChallenge = crypto
        .createHash("sha256")
        .update(codeVerifier)
        .digest("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

    const cookieStore = await cookies();
    cookieStore.set({
        name: "oauthState",
        value: state,
        httpOnly: true,
        sameSite: "lax",
        secure: SECURE,
        maxAge: 5 * 60 * 1000
    });

    cookieStore.set({
        name: "codeVerifier",
        value: codeVerifier,
        httpOnly: true,
        sameSite: "lax",
        secure: SECURE,
        maxAge: 5 * 60 * 1000
    });

    const authURI =
        apiURL +
        `?client_id=${clientid}` +
        `&redirect_uri=${encodeURIComponent(redirectURI)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(scope)}` +
        `&state=${state}` +
        `&code_challenge=${codeChallenge}` +
        `&code_challenge_method=S256`;

    return NextResponse.redirect(authURI);
}