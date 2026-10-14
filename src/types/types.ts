import { TurnstileEnabled } from "@lib/env";
import { supportedFormats } from "@lib/ffmpeg";
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

export const BiographyMaxLength = 1000;
export const Biography = z
    .string()
    .min(1, { message: "Biography must be at least 1 character" })
    .max(BiographyMaxLength, { message: "Biography must be less than 300 characters" });

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const UUID = z
    .string()
    .refine((v) => uuidRegex.test(v), { message: "Invalid UUID" });

export const Date = z
    .date()

export const Handle = z
    .string()
    .min(1, { message: "Handle must be at least 1 character" })
    .max(36, { message: "Handle must be less than 36 characters" })
    .refine((val) => /^[a-z0-9_]+$/.test(val), {
        message: "Handle can only contain lowercase letters, numbers, and underscores",
    });

export const Password = z
    .string()
    .min(12, { message: "Password must be at least 12 character" })
    .max(256, { message: "Username must be less than 256 characters" });

export const Code = z
    .string()
    .length(6, { message: "Code must be 6 characters" })

export const TurnstileToken = z
    .string()
    .refine((v) => { if (!TurnstileEnabled) return true; return v !== ""; }, { message: "Turnstile is required" })

const MaxAvatarSizeBeforeCompression = 10 * 1024 * 1024;
export const Avatar = z
    .instanceof(File)
    .refine(file => !file || file.size <= MaxAvatarSizeBeforeCompression, {
        message: `File must be smaller than ${MaxAvatarSizeBeforeCompression / 1024 / 1024}MB`,
    })
    .refine(file => {
        if (!file) return true;
        const ext = file.name.split(".").pop()?.toLowerCase();
        return ext ? supportedFormats.includes(ext) : false;
    }, { message: `File must be one of: ${supportedFormats.join(", ")}` });

const MaxBannerSizeBeforeCompression = 10 * 1024 * 1024;
export const Banner = z
    .instanceof(File)
    .refine(file => !file || file.size <= MaxBannerSizeBeforeCompression, {
        message: `File must be smaller than ${MaxBannerSizeBeforeCompression / 1024 / 1024}MB`,
    })
    .refine(file => {
        if (!file) return true;
        const ext = file.name.split(".").pop()?.toLowerCase();
        return ext ? supportedFormats.includes(ext) : false;
    }, { message: `File must be one of: ${supportedFormats.join(", ")}` });

export type WithTurnstile = {
    turnstileToken: string;
};

export type ActionResult<T = unknown> = { success: true; data: T; message: string } | { success: false; message: string; authorized?: boolean; };

export type User = {
    uuid: string;
    username: string;
    avatar: string;
    handle: string;
    banner: string;
    biography: string;
    admin: boolean;
};