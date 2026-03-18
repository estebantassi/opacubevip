import axios from "axios";
import { createRemoteJWKSet, jwtVerify } from "jose";
import qs from "qs";

const LOG_ERRORS = Boolean(process.env.LOG_ERRORS === "true");
const clientid = String(process.env.GITLAB_CLIENT_ID);
const clientsecret = String(process.env.GITLAB_CLIENT_SECRET);

export const GetGitlabUser = async (redirectURI: string, codeVerifier: string, code: string) => {
    try {
        const tokenResponse = await axios.post(
            "https://gitlab.com/oauth/token",
            qs.stringify({
                client_id: clientid,
                client_secret: clientsecret,
                redirect_uri: redirectURI,
                grant_type: "authorization_code",
                code_verifier: codeVerifier,
                code
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const JWKS = createRemoteJWKSet(
            new URL("https://gitlab.com/oauth/discovery/keys")
        );

        const { payload } = await jwtVerify(tokenResponse.data.id_token, JWKS, {
            issuer: "https://gitlab.com",
            audience: clientid,
        });
        if (!payload) return null;

        const avatarURL = String(payload.picture) || null;
        const username = (String(payload.nickname) || String(payload.preferred_username) || "User").slice(0, 30);
        const email = String(payload.email) || null;
        const verified = Boolean(payload.email_verified) || false;

        return { username, email, verified, avatarURL };
    } catch (err) {
        if (LOG_ERRORS) console.error(err);
        return null;
    }
};