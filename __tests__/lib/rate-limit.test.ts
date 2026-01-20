/**
 * Rate Limiting Tests
 * Security-critical: ensures rate limiting works correctly
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Rate Limiting', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
  });

  describe('RATE_LIMITS configuration', () => {
    it('should have predefined rate limits', async () => {
      const { RATE_LIMITS } = await import('@/lib/rate-limit');

      expect(RATE_LIMITS.contact).toBeDefined();
      expect(RATE_LIMITS.contact.limit).toBe(5);
      expect(RATE_LIMITS.contact.windowSeconds).toBe(300);

      expect(RATE_LIMITS.privacy).toBeDefined();
      expect(RATE_LIMITS.uploads).toBeDefined();
      expect(RATE_LIMITS.api).toBeDefined();
    });

    it('should have appropriate limits for different endpoints', async () => {
      const { RATE_LIMITS } = await import('@/lib/rate-limit');

      // Contact should be more restrictive
      expect(RATE_LIMITS.contact.limit).toBeLessThan(RATE_LIMITS.api.limit);

      // Privacy requests should have longer window
      expect(RATE_LIMITS.privacy.windowSeconds).toBeGreaterThan(RATE_LIMITS.contact.windowSeconds);

      // API should allow more requests
      expect(RATE_LIMITS.api.limit).toBeGreaterThanOrEqual(100);
    });
  });

  describe('checkRateLimit', () => {
    it('should return null when under limit', async () => {
      const { checkRateLimit, RATE_LIMITS } = await import('@/lib/rate-limit');

      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '192.168.1.1';
            return null;
          },
        },
      } as any;

      const result = await checkRateLimit(mockRequest, {
        ...RATE_LIMITS.api,
        prefix: 'test-under-limit',
      });

      expect(result).toBeNull();
    });

    it('should return 429 response when over limit', async () => {
      const { checkRateLimit } = await import('@/lib/rate-limit');

      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '192.168.1.2';
            return null;
          },
        },
      } as any;

      const config = { limit: 2, windowSeconds: 60, prefix: 'test-over-limit' };

      // Make requests up to the limit
      await checkRateLimit(mockRequest, config);
      await checkRateLimit(mockRequest, config);

      // Third request should be blocked
      const result = await checkRateLimit(mockRequest, config);

      expect(result).not.toBeNull();
      expect(result?.status).toBe(429);
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return current rate limit status', async () => {
      const { getRateLimitStatus } = await import('@/lib/rate-limit');

      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '192.168.1.3';
            return null;
          },
        },
      } as any;

      const config = { limit: 10, windowSeconds: 60, prefix: 'test-status' };
      const status = await getRateLimitStatus(mockRequest, config);

      expect(status.limit).toBe(10);
      expect(status.remaining).toBeLessThanOrEqual(10);
      expect(status.reset).toBeGreaterThan(Date.now());
    });
  });
});
