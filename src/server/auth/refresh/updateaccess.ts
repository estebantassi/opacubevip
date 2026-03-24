"use server";

import { Token } from "@server/token";
import { deleteCachedValue } from "@lib/redis";
import { ActionHandler } from "@server/handler";

export const updateAccess = ActionHandler({
    requireAuth: true,
    authType: Token.Type.refresh,

    handler: async ({ tx, auth }) => {

        const accessToken = new Token(auth.useruuid, Token.Type.access, Token.StorageType.CACHE);
        if (!await accessToken.Save()) return { success: false, message: "Error creating a token" };

        const refreshToken = new Token(auth.useruuid, Token.Type.refresh, Token.StorageType.BOTH, null, accessToken.content.jti);
        if (!await refreshToken.Save()) return { success: false, message: "Error creating a token" };

        try { await tx.tokens.delete({ where: { jti: auth.jti } }); } catch (err) { if (process.env.LOG_ERRORS === 'true') console.error(err); }

        try { deleteCachedValue(`${auth.useruuid}/tokens/${Token.Type.access}/${auth.accessjti}`); } catch (err) { if (process.env.LOG_ERRORS === 'true') console.error(err); }

        return { success: true, message: "Access granted", data: null };
    }
});