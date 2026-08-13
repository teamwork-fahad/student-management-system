import { Redis } from "@upstash/redis";
import env from "./env.js";

let redis = null;

const url = env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

if (url && token) {
  try {
    redis = new Redis({
      url,
      token,
    });
    console.log("[Redis] Client initialized successfully.");
  } catch (error) {
    console.error("[Redis] Initialization error:", error.message);
    redis = null;
  }
} else {
  console.log("[Redis] Redis environment variables not configured. Operating in direct database mode (Fail-Safe).");
}

/**
 * Safe Redis GET
 * @param {string} key
 * @returns {Promise<any|null>}
 */
export const getCache = async (key) => {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return typeof data === "string" ? JSON.parse(data) : data;
  } catch (error) {
    console.error(`[Redis Error] GET ${key} failed:`, error.message);
    return null;
  }
};

/**
 * Safe Redis SET with TTL in seconds
 * @param {string} key
 * @param {any} value
 * @param {number} ttlSeconds
 */
export const setCache = async (key, value, ttlSeconds = 60) => {
  if (!redis) return;
  try {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    await redis.set(key, serialized, { ex: ttlSeconds });
  } catch (error) {
    console.error(`[Redis Error] SET ${key} failed:`, error.message);
  }
};

/**
 * Safe Redis DEL
 * @param {string|string[]} keys
 */
export const delCache = async (keys) => {
  if (!redis) return;
  try {
    const keyList = Array.isArray(keys) ? keys : [keys];
    if (keyList.length > 0) {
      await redis.del(...keyList);
    }
  } catch (error) {
    console.error(`[Redis Error] DEL failed:`, error.message);
  }
};

/**
 * Safe Redis pattern invalidation (e.g. "sms:students:*")
 * @param {string} pattern
 */
export const invalidatePattern = async (pattern) => {
  if (!redis) return;
  try {
    const matchingKeys = await redis.keys(pattern);
    if (matchingKeys && matchingKeys.length > 0) {
      await redis.del(...matchingKeys);
    }
  } catch (error) {
    console.error(`[Redis Error] Invalidate pattern ${pattern} failed:`, error.message);
  }
};

export default redis;
