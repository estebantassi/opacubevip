import sharp from "sharp";
import { ActionResult } from "../types/types";

const LOG_ERRORS = Boolean(process.env.LOG_ERRORS === "true");

const maxAvatarSize = Number(process.env.AVATAR_MAXSIZE);
const maxAvatarFileSize = Number(process.env.AVATAR_MAXFSIZE);

const maxBannerSize = Number(process.env.BANNER_MAXSIZE);
const maxBannerFileSize = Number(process.env.BANNER_MAXFSIZE);

const maxDefaultSize = Number(process.env.DEFAULTIMAGE_MAXSIZE);
const maxDefaultFileSize = Number(process.env.DEFAULTIMAGE_MAXFSIZE);

export const compressImage = async (image: ArrayBuffer, type: "avatar" | "banner" | "" = "") : Promise<ActionResult<Buffer<ArrayBufferLike>>> => {

    let maxSize;
    let maxFileSize;
    switch (type) {
        case "avatar":
            maxSize = maxAvatarSize;
            maxFileSize = maxAvatarFileSize;
            break;
        case "banner":
            maxSize = maxBannerSize;
            maxFileSize = maxBannerFileSize;
            break;
        default:
            maxSize = maxDefaultSize;
            maxFileSize = maxDefaultFileSize;
            break;
    }

    const buffer = sharp(image, { animated: true });
    try {
        if (!buffer) return { success: false, message: "Error compressing image. Is it the right format ?" };

        const metadata = await buffer.metadata();
        if (!metadata) return { success: false, message: "Error compressing image. Is it the right format ?" };

        const height = Math.floor(metadata?.pageHeight ?? metadata.height);
        const width = Math.floor(metadata.width);

        let targetheight = height;
        let targetwidth = width;
        let ratio = 1;
        switch (type) {
            case "avatar":
                if (width > targetheight) targetheight = width;
                if (targetheight > maxSize) targetheight = maxSize;
                targetwidth = targetheight;
                break;
            case "banner":
                targetheight = Math.min(targetheight, maxSize);
                targetwidth = targetheight * 3;
                break;
            default:
                if (height > width) {
                    if (height > maxSize) {
                        targetheight = maxSize;
                        ratio = height / targetheight;
                        targetwidth /= ratio;
                    }
                }
                else {
                    if (width > maxSize) {
                        targetwidth = maxSize;
                        ratio = width / targetwidth;
                        targetheight /= ratio;
                    }
                }
                break;
        }

        let quality = 75;
        let output = await buffer
            .resize({
                width: Number(targetwidth),
                height: Number(targetheight),
                fit: 'cover'
            })
            .webp({ quality })
            .toBuffer();

        while (output.length > maxFileSize * 1024 && quality > 10) {
            quality -= 5;
            output = await buffer
                .resize({
                    width: Number(targetwidth),
                    height: Number(targetheight),
                    fit: "cover"
                })
                .webp({ quality })
                .toBuffer();
        }

        if (output.length > maxFileSize * 1024) return { success: false, message: "File size exceeds " + maxFileSize + "KB" };

        return { success: true, data: output, message: "Successfully compressed image" };
    } catch (err) {
        if (LOG_ERRORS) console.error(err);
        return { success: false, message: "Error compressing image. Is it the right format ?" };
    }
};