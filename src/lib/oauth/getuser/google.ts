import axios from "axios";
import { OAuth2Client } from "google-auth-library";

const LOG_ERRORS = Boolean(process.env.LOG_ERRORS === "true");
const clientid = String(process.env.GOOGLE_CLIENT_ID);
const clientsecret = String(process.env.GOOGLE_CLIENT_SECRET);
const client = new OAuth2Client(clientid);

export const GetGoogleUser = async (redirectURI: string, codeVerifier: string, code: string) => {
    try {
        const tokenResponse = await axios.post(
            "https://oauth2.googleapis.com/token",
            {
                client_id: clientid,
                client_secret: clientsecret,
                code,
                code_verifier: codeVerifier,
                redirect_uri: redirectURI,
                grant_type: "authorization_code",
            },
            { headers: { "Content-Type": "application/json", }, }
        );

        const ticket = await client.verifyIdToken({
            idToken: tokenResponse.data.id_token,
            audience: clientid,
        });
        const payload = ticket.getPayload();
        if (!payload) return null;

        const avatarURL = payload?.picture?.replace(/=s\d+(-c)?$/, "=s512-c") || null;
        const username = (payload.name || payload.given_name || "User").slice(0, 30);
        const email = payload.email || null;
        const verified = payload.email_verified || false;

        return { username, email, verified, avatarURL };
    } catch (err) {
        if (LOG_ERRORS) console.error(err);
        return null;
    }
};