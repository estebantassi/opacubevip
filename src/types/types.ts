import { z } from "zod";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const Email = z
    .string()
    .refine((v) => emailRegex.test(v), { message: "Invalid email" })
    .transform(v => v.toLowerCase());

export const Username = z
    .string()
    .min(1, { message: "Username must be at least 1 character" })
    .max(30, { message: "Username must be less than 30 characters" });

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const UUID = z
    .string()
    .refine((v) => uuidRegex.test(v), { message: "Invalid UUID" });

export const Password = z
    .string()
    .min(12, { message: "Password must be at least 12 character" })
    .max(256, { message: "Username must be less than 256 characters" });

export const Code = z
    .string()
    .length(6, { message: "Code must be 6 characters" })

export type ActionResult<T = unknown> = { success: true; data: T; message: string } | { success: false; message: string; authorized?: boolean; };

export type User = {
    uuid: string;
    username: string;
    avatar: string;
};