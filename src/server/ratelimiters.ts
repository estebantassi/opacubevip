import getRedis from "@lib/redis";
import { RateLimiterRedis } from "rate-limiter-flexible";

const appName = String(process.env.APPNAME);

export const ratelimiters = {
  getprofile: new RateLimiterRedis({
    storeClient: getRedis(),
    useRedisPackage: true,
    keyPrefix: `${appName}/rl/getprofile`,
    points: 10,
    duration: 10,
  }),

  editprofile: new RateLimiterRedis({
    storeClient: getRedis(),
    useRedisPackage: true,
    keyPrefix: `${appName}/rl/editprofile`,
    points: 10,
    duration: 10,
  }),

  register: new RateLimiterRedis({
    storeClient: getRedis(),
    useRedisPackage: true,
    keyPrefix: `${appName}/rl/register`,
    points: 10,
    duration: 10,
  }),

  loginstart: new RateLimiterRedis({
    storeClient: getRedis(),
    useRedisPackage: true,
    keyPrefix: `${appName}/rl/loginstart`,
    points: 10,
    duration: 10,
  }),

  login: new RateLimiterRedis({
    storeClient: getRedis(),
    useRedisPackage: true,
    keyPrefix: `${appName}/rl/login`,
    points: 10,
    duration: 10,
  }),

  oauthlogin: new RateLimiterRedis({
    storeClient: getRedis(),
    useRedisPackage: true,
    keyPrefix: `${appName}/rl/oauthlogin`,
    points: 10,
    duration: 10,
  }),

  logout: new RateLimiterRedis({
    storeClient: getRedis(),
    useRedisPackage: true,
    keyPrefix: `${appName}/rl/logout`,
    points: 10,
    duration: 10,
  }),

  updateaccess: new RateLimiterRedis({
    storeClient: getRedis(),
    useRedisPackage: true,
    keyPrefix: `${appName}/rl/updateaccess`,
    points: 10,
    duration: 10,
  }),

  verify: new RateLimiterRedis({
    storeClient: getRedis(),
    useRedisPackage: true,
    keyPrefix: `${appName}/rl/verify`,
    points: 10,
    duration: 10,
  }),

  a_getusers: new RateLimiterRedis({
    storeClient: getRedis(),
    useRedisPackage: true,
    keyPrefix: `${appName}/rl/a_getusers`,
    points: 500,
    duration: 10,
  }),

  a_createusers: new RateLimiterRedis({
    storeClient: getRedis(),
    useRedisPackage: true,
    keyPrefix: `${appName}/rl/a_createusers`,
    points: 500,
    duration: 10,
  }),

  a_deleteuser: new RateLimiterRedis({
    storeClient: getRedis(),
    useRedisPackage: true,
    keyPrefix: `${appName}/rl/a_deleteuser`,
    points: 500,
    duration: 10,
  }),

  a_changeuser: new RateLimiterRedis({
    storeClient: getRedis(),
    useRedisPackage: true,
    keyPrefix: `${appName}/rl/a_changeuser`,
    points: 500,
    duration: 10,
  }),
}