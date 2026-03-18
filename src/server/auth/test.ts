"use server";

import { ActionHandler } from "../handler";

export const test = ActionHandler({
    requireAuth: true,

    handler: async () => {
        return { success: true, message: "Successfully successed", data: null };
    }
});