import { getBucket } from "@lib/gcs/gcs";
import { getCachedValue, setCachedValue, deleteCachedValue } from "@lib/redis";
import { GetSignedUrlConfig } from "@google-cloud/storage";

export const GetImage = async (filepath: string) => {
    try {
        const cachedUrl = await getCachedValue(filepath);
        if (cachedUrl) return cachedUrl;

        const options: GetSignedUrlConfig = {
            version: 'v4',
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000,
        };
        const [signedUrl] = await getBucket().file(filepath).getSignedUrl(options);

        await setCachedValue(filepath, 55 * 60, signedUrl);
        return signedUrl;
    } catch (err) {
        if (process.env.LOG_ERRORS === 'true') console.error(err);
        return null;
    }
};

export const DeleteImage = async (filepath: string) => {
    try {
        await getBucket().file(filepath).delete();
        await deleteCachedValue(filepath);
    } catch (err) {
        if (process.env.LOG_ERRORS === 'true') console.error(err);
    }
};

export const GetImagesFromFolder = async (folderpath: string) => {
    try {
        const cached = await getCachedValue(folderpath);
        const cachedUrl = cached ? JSON.parse(cached) : null;
        if (cachedUrl) return cachedUrl;

        const [files] = await getBucket().getFiles({ prefix: folderpath });

        const signedUrls = await Promise.all(
            
            files
                .filter(file => !file.name.endsWith('/'))
                .map(file => {
                    const options: GetSignedUrlConfig = {
                        version: 'v4',
                        action: 'read',
                        expires: Date.now() + 60 * 60 * 1000,
                    };
                    return file.getSignedUrl(options)
                        .then(([url]) => url);
                })
        );

        await setCachedValue(folderpath, 55 * 60, JSON.stringify(signedUrls));
        return signedUrls;
    } catch (err) {
        if (process.env.LOG_ERRORS === 'true') console.error(err);
        return null;
    }
};

export const DeleteImagesFromFolder = async (folderpath: string) => {
    try {
        await getBucket().deleteFiles({ prefix: folderpath });
        await deleteCachedValue(folderpath);
    } catch (err) {
        if (process.env.LOG_ERRORS === 'true') console.error(err);
    }
};