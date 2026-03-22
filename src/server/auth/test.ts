"use server";

import { prisma } from "@lib/prisma";
import { ActionHandler } from "../handler";

export const test = ActionHandler({
    requireAuth: false,

    handler: async () => {
        const users = await prisma.users.findMany();

        return { success: true, message: "Successfully successed", data: users };
    }
});