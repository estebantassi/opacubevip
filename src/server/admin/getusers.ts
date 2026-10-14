"use server";

import { ActionHandler } from "@server/handler";
import { ratelimiters } from "@server/ratelimiters";
import { A_GetUsersSchema, A_GetUsersInput } from "@schemas/admin/schemas";
import { A_TableUser } from "@mytypes/admin/types";

type A_getUsersType = {
    users: A_TableUser[],
    count?: number
}

export const A_getUsers = ActionHandler<A_GetUsersInput, A_getUsersType>({
    schema: A_GetUsersSchema,
    ratelimiter: ratelimiters.a_getusers,
    requireAdmin: true,

    handler: async ({ input, tx }) => {
        const date = input.fetchdate.toISOString();
        const reverse = input.reverse ? true : false;
        const cursor = reverse ? input.firstuuid ? { uuid: input.firstuuid } : undefined : input.lastuuid ? { uuid: input.lastuuid } : undefined;
        const batchSkip = (input.skip ? input.skip * input.batch : 0)
        const skip = (input.lastuuid ? 1 : 0) + (batchSkip != 0 ? batchSkip - input.batch : 0);

        const request = await tx.users.findMany({
            take: input.batch,
            cursor: cursor,
            skip: skip,
                where: {
                    created_at: {
                        lt: date,
                    },
                },
            orderBy: [
                { created_at: reverse ? 'asc' : 'desc' },
                { uuid: reverse ? 'asc' : 'desc' },
            ],
            select: {
                username: true,
                uuid: true,
                admin: true,
                created_at: true,
                handle: true,
            },
        });

        let total: number | undefined;
        if (!input.firstuuid) total = await tx.users.count({
            where: {
                created_at: {
                    lt: date,
                },
            },
        })

        if (!request || request.length === 0) return { success: false, message: "Reached end of users" };

        const result = reverse ? request.reverse() : request;

        return { success: true, message: "Successfully fetched users", data: { users: result as A_TableUser[], count: total } };
    }
});