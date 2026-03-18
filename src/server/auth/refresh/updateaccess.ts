"use server";

import { cookies } from "next/headers";
import { ActionResult } from "../../../types/types";
import { Token } from "../../token";
import db from "../../../lib/db";
import { deleteCachedValue } from "../../../lib/redis";

export const updateAccess = async (): Promise<ActionResult> => {
    const tokenData = await Token.GetData((await cookies()).get("token_" + Token.Type.REFRESH.toLowerCase())?.value, Token.Type.REFRESH);
    if (!tokenData.success) return tokenData;

    const accessToken = new Token(tokenData.data.useruuid, Token.Type.ACCESS, Token.StorageType.CACHE);
    if (!await accessToken.Save()) return { success: false, message: "Error creating a token" };

    const refreshToken = new Token(tokenData.data.useruuid, Token.Type.REFRESH, Token.StorageType.BOTH, null, accessToken.content.jti);
    if (!await refreshToken.Save()) return { success: false, message: "Error creating a token" };

    try {
        await db`
            DELETE FROM tokens
            WHERE useruuid=${tokenData.data.useruuid} AND jti=${tokenData.data.jti} AND type=${Token.Type.REFRESH}
        `

        deleteCachedValue(`${tokenData.data.useruuid}/tokens/${Token.Type.ACCESS}/${tokenData.data.accessjti}`);
    } catch (err) { if (process.env.LOG_ERRORS === 'true') console.error(err); }

    return { success: true, message: "Access granted", data: null };
};