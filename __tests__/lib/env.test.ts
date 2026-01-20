/**
 * Environment Validation Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Environment Validation', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('env validation schema', () => {
    it('should validate required variables', async () => {
      vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/db');
      vi.stubEnv('ADMIN_USER', 'admin');
      vi.stubEnv('ADMIN_PASS', 'password123');
      vi.stubEnv('NODE_ENV', 'test');
      vi.resetModules();

      // Should not throw
      const { env } = await import('@/lib/env');
      expect(env).toBeDefined();
    });

    it('should reject short ADMIN_PASS in dev mode with warning', async () => {
      vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/db');
      vi.stubEnv('ADMIN_USER', 'admin');
      vi.stubEnv('ADMIN_PASS', 'short');
      vi.stubEnv('NODE_ENV', 'development');
      vi.resetModules();

      // In development mode it should warn but continue
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { env } = await import('@/lib/env');

      // Should have logged an error
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
      consoleWarn.mockRestore();
    });
  });

  describe('getEnv helpers', () => {
    it('should detect development mode', async () => {
      vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/db');
      vi.stubEnv('ADMIN_USER', 'admin');
      vi.stubEnv('ADMIN_PASS', 'password123');
      vi.stubEnv('NODE_ENV', 'development');
      vi.resetModules();

      const { getEnv } = await import('@/lib/env');

      expect(getEnv.isDev()).toBe(true);
      expect(getEnv.isProd()).toBe(false);
    });

    it('should detect production mode', async () => {
      vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/db');
      vi.stubEnv('ADMIN_USER', 'admin');
      vi.stubEnv('ADMIN_PASS', 'password123');
      vi.stubEnv('NODE_ENV', 'production');
      vi.resetModules();

      const { getEnv } = await import('@/lib/env');

      expect(getEnv.isDev()).toBe(false);
      expect(getEnv.isProd()).toBe(true);
    });

    it('should return default site URL', async () => {
      vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/db');
      vi.stubEnv('ADMIN_USER', 'admin');
      vi.stubEnv('ADMIN_PASS', 'password123');
      vi.stubEnv('NODE_ENV', 'test');
      vi.resetModules();

      const { getEnv } = await import('@/lib/env');

      expect(getEnv.siteUrl()).toBe('https://orbitaevents.com');
    });
  });
});
