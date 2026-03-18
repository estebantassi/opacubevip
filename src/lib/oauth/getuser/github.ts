import axios from "axios";
import qs from "qs";

const LOG_ERRORS = Boolean(process.env.LOG_ERRORS === "true");
const clientid = String(process.env.GITHUB_CLIENT_ID);
const clientsecret = String(process.env.GITHUB_CLIENT_SECRET);

export const GetGithubUser = async (redirectURI: string, codeVerifier: string, code: string) => {
    try {
        const tokenResponse = await axios.post(
            "https://github.com/login/oauth/access_token",
            qs.stringify({
                client_id: clientid,
                client_secret: clientsecret,
                redirect_uri: redirectURI,
                code_verifier: codeVerifier,
                code,
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json"
                }
            }
        );

        const userResponse = await axios.get("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
        });

        const emailResponse = await axios.get("https://api.github.com/user/emails", {
            headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
        });
        if (!userResponse || !emailResponse) return null;

        const user = userResponse.data;
        if (!user) return null;

        /* eslint-disable @typescript-eslint/no-explicit-any */
        const primaryEmailObj = emailResponse.data.find((e: { primary: any; verified: any; }) => e.primary && e.verified);
        /* eslint-enable @typescript-eslint/no-explicit-any*/

        const avatarURL = user.avatar_url ? user.avatar_url + "?s=512" : null;
        const username = (String(user.name) || String(user.login) || "User").slice(0, 30);
        const email = String(primaryEmailObj.email) || null;
        const verified = primaryEmailObj != null;

        return { username, email, verified, avatarURL };
    } catch (err) {
        if (LOG_ERRORS) console.error(err);
        return null;
    }
};