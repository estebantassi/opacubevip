"use server";


import { compressImage } from "@lib/compressimage";
import { getBucket } from "@lib/gcs";
import { EditProfileInput, EditProfileSchema } from "@schemas/profile/schemas";
import { ActionHandler } from "@server/handler";
import { ratelimiters } from "@server/ratelimiters";

import { v7 as uuidv7 } from 'uuid';

const LOG_ERRORS = Boolean(process.env.LOG_ERRORS === "true");
const GOOGLEBUCKETPUBLICURL = String(process.env.GOOGLE_BUCKET_PUBLIC_URL);

type EditProfileContent = {
    avatar: string | undefined,
    banner: string | undefined,
    handle: string | undefined,
    username: string | undefined,
    biography: string | undefined,
};

export const editProfile = ActionHandler<EditProfileInput, EditProfileContent>({
    schema: EditProfileSchema,
    requireAuth: true,
    ratelimiter: ratelimiters.editprofile,

    handler: async ({ input, tx, auth }) => {

        const versionUUID = uuidv7();

        let avatar: string | undefined;
        if (input.avatar) {
            const buffer = await input.avatar.arrayBuffer();
            const compressed = await compressImage(buffer, "avatar");
            if (!compressed.success) return compressed;

            try {
                await getBucket().file(`users/${auth.useruuid}/avatar`).save(compressed.data, {
                    metadata: {
                        contentType: 'image/webp',
                        cacheControl: 'public, max-age=3600',
                        metadata: {
                            version: versionUUID,
                        },
                    }
                });
            } catch (err) {
                if (LOG_ERRORS) console.error(err);
                throw { success: false, message: "Error with Google Cloud Storage" };
            }

            const avatarPath = `users/${auth.useruuid}/avatar?v=${versionUUID}`;
            avatar = `${GOOGLEBUCKETPUBLICURL}${avatarPath}`;
        }

        let banner: string | undefined;
        if (input.banner) {
            const buffer = await input.banner.arrayBuffer();
            const compressed = await compressImage(buffer, "banner");
            if (!compressed.success) return compressed;

            try {
                await getBucket().file(`users/${auth.useruuid}/banner`).save(compressed.data, {
                    metadata: {
                        contentType: 'image/webp',
                        cacheControl: 'public, max-age=3600',
                        metadata: {
                            version: versionUUID,
                        },
                    }
                });
            } catch (err) {
                if (LOG_ERRORS) console.error(err);
                throw { success: false, message: "Error with Google Cloud Storage" };
            }

            const bannerPath = `users/${auth.useruuid}/banner?v=${versionUUID}`;
            banner = `${GOOGLEBUCKETPUBLICURL}${bannerPath}`;
        }

        try {
            await tx.users.update({
                where: { uuid: auth.useruuid },
                data: {
                    ...(avatar && { avatar_version: versionUUID }),
                    ...(banner && { banner_version: versionUUID }),
                    ...(input.biography && { biography: input.biography }),
                    ...(input.username && { username: input.username }),
                    ...(input.handle && { handle: input.handle }),
                },
            });
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        } catch (error: any) {
            if (error?.code === "P2002") throw { success: false, message: "Handle already taken" };
            throw { success: false, message: "Error with database insert" };
        }

        return { success: true, message: "Successfully edited profile", data: { avatar, banner, biography: input.biography, handle: input.handle, username: input.username } };
    }
});