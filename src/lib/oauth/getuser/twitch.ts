import axios from "axios";
import qs from "qs";

const LOG_ERRORS = Boolean(process.env.LOG_ERRORS === "true");
const clientid = String(process.env.TWITCH_CLIENT_ID);
const clientsecret = String(process.env.TWITCH_CLIENT_SECRET);

export const GetTwitchUser = async (redirectURI: string, codeVerifier: string, code: string) => {
    try {
        const tokenResponse = await axios.post(
            "https://id.twitch.tv/oauth2/token",
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


        const userResponse = await axios.get("https://api.twitch.tv/helix/users", {
            headers: {
                Authorization: `Bearer ${tokenResponse.data.access_token}`,
                "Client-Id": clientid,
            },
        });
        const user = userResponse.data.data[0];
        if (!user) return null;

        const avatarURL = String(user.profile_image_url) || null;
        const username = (String(user.display_name) || String(user.login) || "User").slice(0, 30);
        const email = String(user.email) || null;
        const verified = true;

        return { username, email, verified, avatarURL };
    } catch (err) {
        if (LOG_ERRORS) console.error(err);
        return null;
    }
};