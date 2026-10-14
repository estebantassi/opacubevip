import { z } from "zod";
import { Tag } from "@mytypes/types";

export const UserProfileSchema = z
    .object({
        tag: Tag,
    })

export type UserProfileInput = z.infer<typeof UserProfileSchema>;