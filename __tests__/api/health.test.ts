/**
 * Health API Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    $disconnect: vi.fn(),
  },
}));

describe('Health API', () => {
  beforeEach(() => {
    vi.resetModules();
    // CI defineix NEXT_PHASE='phase-production-build' globalment; el neutralitzem
    // perquè la comprovació de BD s'executi de veritat i l'estat sigui 'healthy'.
    vi.stubEnv('NEXT_PHASE', '');
  });
  afterEach(() => vi.unstubAllEnvs());

  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const { GET } = await import('@/app/api/health/route');

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.timestamp).toBeDefined();
    });

    it('should include database check', async () => {
      const { GET } = await import('@/app/api/health/route');

      const response = await GET();
      const data = await response.json();

      expect(data.checks).toBeDefined();
      expect(data.checks.database).toBeDefined();
    });

    it('should include all required checks', async () => {
      const { GET } = await import('@/app/api/health/route');

      const response = await GET();
      const data = await response.json();

      expect(data.checks.server).toBeDefined();
      expect(data.checks.database).toBeDefined();
      expect(data.checks.api).toBeDefined();
    });
  });
});
