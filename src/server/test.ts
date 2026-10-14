"use server";

import { ActionHandler } from "./handler";
import { ratelimiters } from "./ratelimiters";

export const test = ActionHandler({
    ratelimiter: ratelimiters.oauthlogin,
    requireAdmin: true,

    handler: async ({ auth }) => {
        console.log(auth);

        return { success: true, message: "Successfully tested", data: null };
    }
});