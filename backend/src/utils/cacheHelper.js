import { getCache, setCache, invalidatePattern, delCache } from "../config/redis.js";

/**
 * Builds a deterministic, normalized cache key from a namespace and optional query object or parameters.
 * @param {string} namespace - e.g. "sms:students:list"
 * @param {object|string|number} [params] - Express req.query object or URL params
 * @returns {string}
 */
export const buildCacheKey = (namespace, params) => {
  if (!params) return namespace;
  if (typeof params !== "object") return `${namespace}:${params}`;

  const keys = Object.keys(params).sort();
  if (keys.length === 0) return namespace;

  const serialized = keys
    .map((key) => {
      const val = params[key];
      if (val === undefined || val === null || val === "") return null;
      return `${key}=${String(val).trim()}`;
    })
    .filter(Boolean)
    .join("&");

  return serialized ? `${namespace}:${serialized}` : namespace;
};

/**
 * Executes Cache-Aside pattern for read operations.
 * @param {string} cacheKey
 * @param {number} ttlSeconds
 * @param {Function} fetchFn - DB query execution function returning raw data
 * @returns {Promise<any>}
 */
export const fetchWithCache = async (cacheKey, ttlSeconds, fetchFn) => {
  const cachedData = await getCache(cacheKey);
  if (cachedData !== null) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Redis HIT] ${cacheKey}`);
    }
    return cachedData;
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[Redis MISS] ${cacheKey}`);
  }

  const freshData = await fetchFn();
  if (freshData !== null && freshData !== undefined) {
    // Non-blocking set to Redis
    setCache(cacheKey, freshData, ttlSeconds).catch((err) => {
      console.error(`[Redis SET Error] ${cacheKey}:`, err.message);
    });
  }

  return freshData;
};

/**
 * Invalidates related cache key patterns for a module
 * @param {string[]} patterns - Array of pattern strings to clear, e.g. ["sms:students:*", "sms:admissions:stats"]
 */
export const clearCachePatterns = async (patterns = []) => {
  for (const pattern of patterns) {
    if (pattern.includes("*")) {
      await invalidatePattern(pattern);
    } else {
      await delCache(pattern);
    }
  }
};
