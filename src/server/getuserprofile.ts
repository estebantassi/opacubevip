"use server";

import { GetImage } from "@lib/gcs/images";

import { UserProfileInput, UserProfileSchema } from "@schemas/schemas";
import { User } from "@mytypes/types";
import { ActionHandler } from "@server/handler";

export const getUserProfile = ActionHandler<UserProfileInput, User>({
    schema: UserProfileSchema,

    handler: async ({ input, tx }) => {

        const request = await tx.users.findUnique({
            where: { uuid: input.uuid },
            select: {
                avatar: true,
                username: true,
                uuid: true,
            },
        });

        if (!request) return { success: false, message: "User not found" };

        const avatarURL = request.avatar ? `users/${request.uuid}/avatar` : `Default/avatar`;
        const avatar = await GetImage(avatarURL);
        if (!avatar) return { success: false, message: "Error fetching avatar" };

        const user: User = {
            avatar,
            uuid: request.uuid,
            username: request.username
        };

        return { success: true, message: "Successfully fetched user", data: user };
    }
});