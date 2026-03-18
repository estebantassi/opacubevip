"use server";

import { cookies } from "next/headers";
import { ActionResult } from "../../../types/types";
import { Token } from "../../token";
import db from "../../../lib/db";
import { deleteCachedValue } from "../../../lib/redis";

export const logout = async (): Promise<ActionResult> => {

    const tokenData = await Token.GetData((await cookies()).get("token_" + Token.Type.REFRESH.toLowerCase())?.value, Token.Type.REFRESH);
    if (!tokenData.success) return tokenData;

    try {
        await db`
            DELETE FROM tokens
            WHERE useruuid=${tokenData.data.useruuid} AND jti=${tokenData.data.jti} AND type=${Token.Type.REFRESH}
        `;

        deleteCachedValue(`${tokenData.data.useruuid}/tokens/${Token.Type.ACCESS}/${tokenData.data.accessjti}`);

        return { success: true, message: "Successfully logged out", data: null };
    } catch (err) {
        if (process.env.LOG_ERRORS === 'true') console.error(err);
        return { success: false, message: "Internal server error" };
    }

};