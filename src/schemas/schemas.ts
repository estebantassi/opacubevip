import { z } from "zod";
import { UUID } from "@mytypes/types";

export const UserProfileSchema = z
    .object({
        uuid: UUID,
    })

export type UserProfileInput = z.infer<typeof UserProfileSchema>;