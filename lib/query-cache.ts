/**
 * Database Query Caching System
 *
 * Simple in-memory cache for frequently-accessed database queries.
 * Reduces load on database and improves response times for dashboard/stats.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number;
  maxSize?: number;
}

const DEFAULT_TTL = 60 * 1000;
const DEFAULT_MAX_SIZE = 250;

class QueryCache {
  private cache: Map<string, CacheEntry<unknown>>;
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || DEFAULT_MAX_SIZE;
  }

  async get<T>(key: string, queryFn: () => Promise<T>, ttl: number = DEFAULT_TTL): Promise<T> {
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;

    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < cached.ttl) {
        return cached.data;
      }
      this.cache.delete(key);
    }

    const data = await queryFn();
    this.set(key, data, ttl);
    return data;
  }

  private set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }
}

const queryCache = new QueryCache({
  ttl: DEFAULT_TTL,
  maxSize: DEFAULT_MAX_SIZE,
});

export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  return queryCache.get(key, queryFn, ttl);
}

export const CacheTTL = {
  VERY_SHORT: 60 * 1000,
  SHORT: 2 * 60 * 1000,
  MEDIUM: 5 * 60 * 1000,
  LONG: 15 * 60 * 1000,
  VERY_LONG: 60 * 60 * 1000,
};
