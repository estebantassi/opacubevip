import { Bucket, Storage, GetSignedUrlConfig } from "@google-cloud/storage";
import { getCachedValue, setCachedValue, deleteCachedValue } from "@lib/redis";

let cachedBucket: Bucket | null = null;
let cachedPrivateBucket: Bucket | null = null;

export function getBucket() {
  if (cachedBucket) return cachedBucket;

  const base64 = process.env.GOOGLE_BUCKET_KEY_BASE64;
  const bucketName = process.env.GOOGLE_BUCKET_NAME;

  if (!base64) throw new Error("Missing GOOGLE_BUCKET_KEY_BASE64");
  if (!bucketName) throw new Error("Missing GOOGLE_BUCKET_NAME");

  const keyJson = JSON.parse(
    Buffer.from(base64, "base64").toString("utf8")
  );

  const storage = new Storage({ credentials: keyJson });
  cachedBucket = storage.bucket(bucketName);
  return cachedBucket;
}

export function getPrivateBucket() {
  if (cachedPrivateBucket) return cachedPrivateBucket;

  const base64 = process.env.GOOGLE_BUCKET_KEY_BASE64;
  const bucketName = process.env.GOOGLE_PRIVATE_BUCKET_NAME;

  if (!base64) throw new Error("Missing GOOGLE_BUCKET_KEY_BASE64");
  if (!bucketName) throw new Error("Missing GOOGLE_PRIVATE_BUCKET_NAME");

  const keyJson = JSON.parse(
    Buffer.from(base64, "base64").toString("utf8")
  );

  const storage = new Storage({ credentials: keyJson });
  cachedPrivateBucket = storage.bucket(bucketName);
  return cachedPrivateBucket;
}

type BucketType = "public" | "private";

export const GetFile = async (filepath: string) => {
    try {
        const cachedUrl = await getCachedValue(filepath);
        if (cachedUrl) return cachedUrl;

        const options: GetSignedUrlConfig = {
            version: 'v4',
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000,
        };
        const [signedUrl] = await getPrivateBucket().file(filepath).getSignedUrl(options);

        await setCachedValue(filepath, 55 * 60, signedUrl);
        return signedUrl;
    } catch (err) {
        if (process.env.LOG_ERRORS === 'true') console.error(err);
        return null;
    }
};

export const DeleteFile = async (filepath: string, type: BucketType = "public") => {
    try {
        const bucket = type === "public" ? getBucket() : getPrivateBucket();
        await bucket.file(filepath).delete();
        await deleteCachedValue(filepath);
    } catch (err) {
        if (process.env.LOG_ERRORS === 'true') console.error(err);
    }
};

export const GetFilesFromFolder = async (folderpath: string) => {
    try {
        const cached = await getCachedValue(folderpath);
        const cachedUrl = cached ? JSON.parse(cached) : null;
        if (cachedUrl) return cachedUrl;

        const [files] = await getPrivateBucket().getFiles({ prefix: folderpath });

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

export const DeleteFilesFromFolder = async (folderpath: string, type: BucketType = "public") => {
    try {
        const bucket = type === "public" ? getBucket() : getPrivateBucket();
        await bucket.deleteFiles({ prefix: folderpath });
        await deleteCachedValue(folderpath);
    } catch (err) {
        if (process.env.LOG_ERRORS === 'true') console.error(err);
    }
};