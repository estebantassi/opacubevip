import { headers } from "next/headers";

export const getClientIP = async () => {
    const headersList = headers();

    const forwardedFor = (await headersList).get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0] ?? "unknown";

    return ip;
}