"use server";

import { DeleteFile } from "@lib/gcs";
import { A_DeleteUserInput } from "@schemas/admin/schemas";
import { ActionHandler } from "@server/handler";
import { ratelimiters } from "@server/ratelimiters";

export const A_deleteUser = ActionHandler<A_DeleteUserInput>({
    ratelimiter: ratelimiters.a_deleteuser,
    transaction: true,
    requireAdmin: true,

    handler: async ({ tx, input }) => {
        await tx.users.delete({ where: { uuid: input.uuid } });

        await DeleteFile(`users/${input.uuid}`);
        await DeleteFile(`users/${input.uuid}`, "private");

        return { success: true, message: "Successfully deleted user", data: null };
    }
});