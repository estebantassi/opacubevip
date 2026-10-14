"use server";

import { GetProfileInput, GetProfileSchema } from "@schemas/profile/schemas";
import { User } from "@mytypes/types";
import { ActionHandler } from "@server/handler";
import { ratelimiters } from "@server/ratelimiters";

const GOOGLEBUCKETPUBLICURL = String(process.env.GOOGLE_BUCKET_PUBLIC_URL);

export const getProfile = ActionHandler<GetProfileInput, User>({
    schema: GetProfileSchema,
    ratelimiter: ratelimiters.getprofile,

    handler: async ({ input, tx }) => {

        const request = await tx.users.findUnique({
            where: { handle: input.handle },
            select: {
                username: true,
                uuid: true,
                handle: true,
                avatar_version: true,
                banner_version: true,
                biography: true,
                admin: true,
            },
        });

        if (!request) return { success: false, message: "User not found" };

        const avatarURL = request.avatar_version ? `users/${request.uuid}/avatar?v=${request.avatar_version}` : `Default/avatar`;
        const avatar = `${GOOGLEBUCKETPUBLICURL}${avatarURL}`;
        const bannerURL = request.banner_version ? `users/${request.uuid}/banner?v=${request.banner_version}` : `Default/banner`;
        const banner = `${GOOGLEBUCKETPUBLICURL}${bannerURL}`;

        const user: User = {
            handle: request.handle,
            avatar,
            banner,
            uuid: request.uuid,
            username: request.username,
            biography: request.biography,
            admin: request.admin
        };

        return { success: true, message: "Successfully fetched user", data: user };
    }
});