import redis from "redis";

const appName = process.env.APPNAME;
const redisURL = process.env.REDIS_URL;

const redisClient = redis.createClient({
    url: redisURL,
});

redisClient.on('error', (err) => {
    console.error('Redis connection error: ', err);
});

async function connectRedis() {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
}

export async function getCachedValue(key: string) {
    await connectRedis();
    return await redisClient.get(appName + "/" + key);
}

export async function setCachedValue(key: string, ttlInSeconds: number, value: string) {
    await connectRedis();
    await redisClient.setEx(appName + "/" + key, ttlInSeconds, value);
}

export async function deleteCachedValue(key: string) {
    await connectRedis();
    await redisClient.del(appName + "/" + key);
}