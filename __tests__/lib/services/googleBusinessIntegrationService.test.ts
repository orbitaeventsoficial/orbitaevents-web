import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    setting: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { getGoogleBusinessIntegrationConfig } from '@/lib/services/googleBusinessIntegrationService';

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.SKIP_DB_QUERIES;
  delete process.env.CI;
  delete process.env.NEXT_PHASE;
  process.env.DATABASE_URL = 'postgresql://test';
});

describe('getGoogleBusinessIntegrationConfig', () => {
  it('retorna config des de settings', async () => {
    mockPrisma.setting.findMany.mockResolvedValue([
      { key: 'integrations.google.refreshToken', value: 'rt123' },
      { key: 'integrations.google.accountId', value: 'acc1' },
      { key: 'integrations.google.locationId', value: 'loc1' },
      { key: 'integrations.google.locationName', value: 'Oficina BCN' },
    ]);

    const result = await getGoogleBusinessIntegrationConfig();

    expect(result).toEqual({
      refreshToken: 'rt123',
      accountId: 'acc1',
      locationId: 'loc1',
      locationName: 'Oficina BCN',
    });
  });

  it('retorna null si SKIP_DB_QUERIES=1', async () => {
    process.env.SKIP_DB_QUERIES = '1';

    expect(await getGoogleBusinessIntegrationConfig()).toBeNull();
  });

  it('retorna null si CI=true', async () => {
    process.env.CI = 'true';

    expect(await getGoogleBusinessIntegrationConfig()).toBeNull();
  });

  it('retorna null si és build de producció', async () => {
    process.env.NEXT_PHASE = 'phase-production-build';

    expect(await getGoogleBusinessIntegrationConfig()).toBeNull();
  });

  it('retorna null sense DATABASE_URL', async () => {
    delete process.env.DATABASE_URL;

    expect(await getGoogleBusinessIntegrationConfig()).toBeNull();
  });

  it('retorna undefined per settings no presents', async () => {
    mockPrisma.setting.findMany.mockResolvedValue([]);

    const result = await getGoogleBusinessIntegrationConfig();

    expect(result).toEqual({
      refreshToken: undefined,
      accountId: undefined,
      locationId: undefined,
      locationName: undefined,
    });
  });
});
