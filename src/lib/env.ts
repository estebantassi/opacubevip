export const TurnstileEnabled = process.env.NEXT_PUBLIC_TURNSTILE === "true";
export const TurnstileKey = String(process.env.NEXT_PUBLIC_TURNSTILE_KEY);