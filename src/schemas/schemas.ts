import { z } from "zod";
import { UUID } from "../types/types";



export const UserProfileSchema = z
    .object({
        uuid: UUID,
    })

export type UserProfileInput = z.infer<typeof UserProfileSchema>;