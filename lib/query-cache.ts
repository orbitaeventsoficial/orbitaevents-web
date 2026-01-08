/**
 * Database Query Caching System
 *
 * Simple in-memory cache for frequently-accessed database queries.
 * Reduces load on database and improves response times for dashboard/stats.
 *
 * Features:
 * - TTL-based expiration
 * - LRU eviction when cache is full
 * - Type-safe wrapper for Prisma queries
 * - Automatic cache invalidation
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 60000 = 1 minute)
  maxSize?: number; // Maximum cache entries (default: 100)
}

const DEFAULT_TTL = 60 * 1000; // 1 minute
const DEFAULT_MAX_SIZE = 100;

class QueryCache {
  private cache: Map<string, CacheEntry<unknown>>;
  private maxSize: number;
  private hits: number;
  private misses: number;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || DEFAULT_MAX_SIZE;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cached data or execute query if cache miss
   */
  async get<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number = DEFAULT_TTL
  ): Promise<T> {
    // Check if cached and not expired
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;

    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < cached.ttl) {
        this.hits++;
        return cached.data;
      } else {
        // Expired, remove it
        this.cache.delete(key);
      }
    }

    // Cache miss - execute query
    this.misses++;
    const data = await queryFn();

    // Store in cache
    this.set(key, data, ttl);

    return data;
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
    // If cache is full, remove oldest entry (LRU)
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

  /**
   * Invalidate (delete) a specific cache key
   */
  invalidate(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalidate all keys matching a pattern
   * Example: invalidatePattern('dashboard:*')
   */
  invalidatePattern(pattern: string): number {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );

    let count = 0;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: hitRate.toFixed(2) + '%',
    };
  }

  /**
   * Get all cache keys
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }
}

// Singleton instance
const queryCache = new QueryCache({
  ttl: DEFAULT_TTL,
  maxSize: DEFAULT_MAX_SIZE,
});

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Cached wrapper for database queries
 *
 * @example
 * const leads = await cachedQuery(
 *   'dashboard:leads:count',
 *   () => prisma.lead.count(),
 *   60_000 // 1 minute TTL
 * );
 */
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  return queryCache.get(key, queryFn, ttl);
}

/**
 * Invalidate specific cache key
 *
 * @example
 * // After creating a lead, invalidate dashboard caches
 * invalidateCache('dashboard:leads:count');
 */
export function invalidateCache(key: string): boolean {
  return queryCache.invalidate(key);
}

/**
 * Invalidate all caches matching pattern
 *
 * @example
 * // Invalidate all dashboard caches
 * invalidateCachePattern('dashboard:*');
 *
 * // Invalidate all lead-related caches
 * invalidateCachePattern('*:leads:*');
 */
export function invalidateCachePattern(pattern: string): number {
  return queryCache.invalidatePattern(pattern);
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  queryCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return queryCache.getStats();
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS - PRE-BUILT CACHE KEYS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Standard cache key generators
 * Ensures consistent naming across the app
 */
export const CacheKeys = {
  // Dashboard
  dashboardStats: () => 'dashboard:stats',
  dashboardLeads: () => 'dashboard:leads:count',
  dashboardBookings: () => 'dashboard:bookings:count',
  dashboardRevenue: () => 'dashboard:revenue:total',

  // Leads
  leadsCount: (status?: string) =>
    status ? `leads:count:${status}` : 'leads:count:all',
  leadsList: (page: number, limit: number) => `leads:list:${page}:${limit}`,

  // Bookings
  bookingsCount: (status?: string) =>
    status ? `bookings:count:${status}` : 'bookings:count:all',
  bookingsList: (month: string) => `bookings:list:${month}`,

  // Testimonials
  testimonialsList: (locale?: string) =>
    locale ? `testimonials:list:${locale}` : 'testimonials:list:all',
  testimonialsCount: () => 'testimonials:count',

  // Packs & Extras
  packsList: (locale?: string) =>
    locale ? `packs:list:${locale}` : 'packs:list:all',
  extrasList: (locale?: string) =>
    locale ? `extras:list:${locale}` : 'extras:list:all',

  // Stats
  publicStats: () => 'public:stats',
  googleReviews: () => 'google:reviews',
};

// ═══════════════════════════════════════════════════════════════════════════
// RECOMMENDED TTL VALUES
// ═══════════════════════════════════════════════════════════════════════════

export const CacheTTL = {
  VERY_SHORT: 30 * 1000, // 30 seconds - Real-time critical data
  SHORT: 60 * 1000, // 1 minute - Dashboard stats
  MEDIUM: 5 * 60 * 1000, // 5 minutes - Lists, counts
  LONG: 15 * 60 * 1000, // 15 minutes - Public data, testimonials
  VERY_LONG: 60 * 60 * 1000, // 1 hour - Static content, config
};
