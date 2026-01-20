/**
 * CSRF Protection Tests
 * Security-critical: ensures CSRF protection works correctly
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('CSRF Protection', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('CSRF_SECRET', 'test-csrf-secret-at-least-32-characters-long-for-testing');
    vi.stubEnv('NODE_ENV', 'test');
  });

  describe('generateCsrfToken', () => {
    it('should generate token with correct format', async () => {
      const { generateCsrfToken } = await import('@/lib/csrf');
      const token = generateCsrfToken();

      // Token format: randomBytes.timestamp.signature
      const parts = token.split('.');
      expect(parts).toHaveLength(3);

      // Random part should be hex
      expect(parts[0]).toMatch(/^[a-f0-9]+$/);

      // Timestamp should be numeric
      expect(parseInt(parts[1], 10)).toBeGreaterThan(0);

      // Signature should be present
      expect(parts[2].length).toBeGreaterThan(0);
    });
  });

  describe('shouldEnforceCsrf', () => {
    it('should enforce CSRF for admin routes', async () => {
      const { shouldEnforceCsrf } = await import('@/lib/csrf');

      const mockRequest = {
        nextUrl: { pathname: '/api/admin/settings' },
      } as any;

      expect(shouldEnforceCsrf(mockRequest)).toBe(true);
    });

    it('should skip CSRF for public routes', async () => {
      const { shouldEnforceCsrf } = await import('@/lib/csrf');

      const publicPaths = ['/api/health', '/api/contact', '/api/google-reviews'];

      for (const path of publicPaths) {
        const mockRequest = {
          nextUrl: { pathname: path },
        } as any;

        expect(shouldEnforceCsrf(mockRequest)).toBe(false);
      }
    });
  });

  describe('CSRF_SECRET validation', () => {
    it('should reject short secrets', async () => {
      vi.stubEnv('CSRF_SECRET', 'short');
      vi.resetModules();

      await expect(async () => {
        const { generateCsrfToken } = await import('@/lib/csrf');
        generateCsrfToken();
      }).rejects.toThrow(/at least 32 characters/);
    });

    it('should reject missing secrets in production', async () => {
      vi.stubEnv('CSRF_SECRET', '');
      vi.stubEnv('NODE_ENV', 'production');
      vi.resetModules();

      await expect(async () => {
        const { generateCsrfToken } = await import('@/lib/csrf');
        generateCsrfToken();
      }).rejects.toThrow(/CSRF_SECRET/);
    });
  });
});
