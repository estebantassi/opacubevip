import { A_pageSkip, A_reverse, A_usersBatch } from "@mytypes/admin/types";
import { Date, Handle, Username, UUID } from "@mytypes/types";
import z from "zod";

export const A_GetUsersSchema = z
    .object({
        fetchdate: Date,
        batch: A_usersBatch,
        firstuuid: UUID.optional(),
        lastuuid: UUID.optional(),
        skip: A_pageSkip.optional(),
        reverse: A_reverse.optional(),
    })
export type A_GetUsersInput = z.infer<typeof A_GetUsersSchema>;

export const A_DeleteUserSchema = z
        .object({
            uuid: UUID.optional(),
        })
export type A_DeleteUserInput = z.infer<typeof A_DeleteUserSchema>;

export const A_ChangeUserSchema = z
    .object({
        username: Username.optional(),
        handle: Handle.optional(),
        uuid: UUID,
    })
export type A_ChangeUserInput = z.infer<typeof A_ChangeUserSchema>;
