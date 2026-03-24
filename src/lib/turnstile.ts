import axios from "axios";
import { getClientIP } from "./geo/tools";

const turnstile = process.env.TURNSTILE;
const turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY;
const hostname = process.env.HOSTNAME;

export const ValidateTurnstile = async (token: string) => {
    if (turnstile == "false") return true;

    const ip = await getClientIP();

    try {
        const response = await axios.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            {
                secret: turnstileSecretKey,
                response: token,
                remoteip: ip,
            },
            {
                headers: { "Content-Type": "application/json" },
                timeout: 5000
            }
        );

        if (!response.data.success) return false;
        if (response.data.hostname !== hostname) return false;

        return true;
    } catch (err) {
        if (process.env.LOG_ERRORS === 'true') console.error(err);
        return false;
    }
};