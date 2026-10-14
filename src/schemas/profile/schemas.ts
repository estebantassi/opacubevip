import { z } from "zod";
import { Avatar, Banner, Biography, Handle, Username } from "@mytypes/types";

export const GetProfileSchema = z
    .object({
        handle: Handle,
    })

export type GetProfileInput = z.infer<typeof GetProfileSchema>;

export const EditProfileSchema = z
    .object({
        avatar: Avatar.optional(),
        banner: Banner.optional(),
        username: Username.optional(),
        handle: Handle.optional(),
        biography: Biography.optional()
    })

export type EditProfileInput = z.infer<typeof EditProfileSchema>;

