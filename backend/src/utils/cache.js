/**
 * Lightweight In-Memory TTL Cache for database performance optimization
 */
class SimpleTTLCache {
  constructor(defaultTTLSeconds = 60) {
    this.cache = new Map();
    this.defaultTTL = defaultTTLSeconds * 1000;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value, ttlSeconds) {
    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  del(key) {
    this.cache.delete(key);
  }

  flushPattern(prefix) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
  }
}

export const queryCache = new SimpleTTLCache(30); // 30 seconds default TTL
