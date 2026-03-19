"use server";

import getDB from "../lib/db";
import { GetImage } from "../lib/gcs/images";

import { validateSchema } from "../lib/tools";
import { UserProfileInput, UserProfileSchema } from "../schemas/schemas";
import { ActionResult, User } from "../types/types";

export const getUserProfile = async (data: UserProfileInput): Promise<ActionResult<User>> => {
    const result = validateSchema(data, UserProfileSchema);
    if (!result.success) return { success: false, message: result.message }

    try {
        const [request] = await getDB()<{ avatar: boolean, username: string, uuid: string }[]>`
            SELECT avatar, username, uuid
            FROM users
            WHERE uuid=${data.uuid}
            LIMIT 1
        `;
        if (!request) return { success: false, message: "User not found" };

        const avatarURL = request.avatar ? `users/${request.uuid}/avatar` : `Default/avatar`;
        const avatar = await GetImage(avatarURL);
        if (!avatar) return { success: false, message: "Error fetching avatar" };

        const user : User = {
            avatar,
            uuid: request.uuid,
            username: request.username
        };

        return { success: true, message: "Successfully fetched user", data: user };
    } catch (err) {
        if (process.env.LOG_ERRORS === 'true') console.log(err);
        return { success: false, message: "Internal error" };
    }
};