"use server";

import { Token } from "@server/token";
import { deleteCachedValue } from "@lib/redis";
import { ActionHandler } from "@server/handler";
import { ratelimiters } from "@server/ratelimiters";

export const logout = ActionHandler({
    requireAuth: true,
    authType: Token.Type.refresh,
    ratelimiter: ratelimiters.logout,

    handler: async ({ tx, auth }) => {

        try { await tx.tokens.delete({ where: { jti: auth.jti } }); } catch (err) { if (process.env.LOG_ERRORS === 'true') console.error(err); }

        try { deleteCachedValue(`${auth.useruuid}/tokens/${Token.Type.access}/${auth.accessjti}`); } catch (err) { if (process.env.LOG_ERRORS === 'true') console.error(err); }

        return { success: true, message: "Successfully logged out", data: null };
    }
});