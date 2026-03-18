import axios from "axios";
import qs from "qs";

const LOG_ERRORS = Boolean(process.env.LOG_ERRORS === "true");
const clientid = String(process.env.DISCORD_CLIENT_ID);
const clientsecret = String(process.env.DISCORD_CLIENT_SECRET);

export const GetDiscordUser = async (redirectURI: string, codeVerifier: string, code: string) => {
    try {
        const tokenResponse = await axios.post(
            "https://discord.com/api/oauth2/token",
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

        const userResponse = await axios.get("https://discord.com/api/users/@me", {
            headers: {
                Authorization: `Bearer ${tokenResponse.data.access_token}`
            }
        });
        const user = userResponse.data;
        if (!user) return null;

        const format = user?.avatar?.startsWith("a_") ? "gif" : "png";
        const defaultAvatar = Number((BigInt(user.id) >> BigInt(22)) % BigInt(6));
        const avatarURL = user?.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${format}?size=512` : `https://cdn.discordapp.com/embed/avatars/${defaultAvatar}.png`;
        const username: string = (user.global_name || user.username || "User").slice(0, 30);
        const email: string | null = user.email || null;
        const verified: boolean = user.verified || false;

        return { username, email, verified, avatarURL };
    } catch (err) {
        if (LOG_ERRORS) console.error(err);
        return null;
    }
};