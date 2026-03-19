import redis from "redis";

let cachedRedis: ReturnType<typeof redis.createClient> | null = null;
let appName: string | null = null;

export default function getRedis() {
    if (!appName) appName = String(process.env.APPNAME);
    if (cachedRedis) return cachedRedis;

    const redisClient = redis.createClient({
        url: process.env.REDIS_URL,
    });

    redisClient.on('error', (err) => {
        console.error('Redis connection error: ', err);
    });

    cachedRedis = redisClient;
    return cachedRedis;
}

async function connectRedis() {
    if (!getRedis().isOpen) {
        await getRedis().connect();
    }
}

export async function getCachedValue(key: string) {
    await connectRedis();
    return await getRedis().get(appName + "/" + key);
}

export async function setCachedValue(key: string, ttlInSeconds: number, value: string) {
    await connectRedis();
    await getRedis().setEx(appName + "/" + key, ttlInSeconds, value);
}

export async function deleteCachedValue(key: string) {
    await connectRedis();
    await getRedis().del(appName + "/" + key);
}