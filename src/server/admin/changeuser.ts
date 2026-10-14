"use server";

import { A_ChangeUserInput } from "@schemas/admin/schemas";
import { ActionHandler } from "@server/handler";
import { ratelimiters } from "@server/ratelimiters";

export const A_changeUser = ActionHandler<A_ChangeUserInput>({
    ratelimiter: ratelimiters.a_changeuser,
    requireAdmin: true,

    handler: async ({ tx, input }) => {
        try {

            await tx.users.update({
                where: { uuid: input.uuid },
                data: {
                    ...(input.username && { username: input.username }),
                    ...(input.handle && { handle: input.handle }),
                },
            });

            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        } catch (error: any) {
            if (error?.code === "P2002") throw { success: false, message: "Handle already taken" };
            throw { success: false, message: "Error with database insert" };
        }

        return { success: true, message: "Successfully changed user", data: null };
    }
});