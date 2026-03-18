import { Bucket, Storage } from "@google-cloud/storage";

let cachedBucket: Bucket | null = null;

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