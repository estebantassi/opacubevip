import z from "zod";

export const A_usersBatch = z
    .number()
    .min(1)
    .max(50)

export const A_pageSkip = z
    .number()
    .min(1)
    .max(100)

export const A_reverse = z
    .boolean()

export type A_TableUser = {
    username: string,
    uuid: string,
    admin: boolean,
    created_at: Date,
    handle: string,
};