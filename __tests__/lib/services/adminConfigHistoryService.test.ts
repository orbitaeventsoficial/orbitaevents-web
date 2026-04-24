import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    adminLog: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  normalizePackPricingConfigHistory,
  readPackPricingModelHistory,
  readProfitabilityConfigHistory,
} from '@/lib/services/adminConfigHistoryService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.adminLog.findMany.mockResolvedValue([]);
});

describe('normalizePackPricingConfigHistory', () => {
  it('normalitza i limita valors fora de rang usant fallback quan cal', () => {
    const fallback = {
      marginTargetPct: 0.55,
      socialSecurityPct: 0.32,
      withholdingPct: 0.15,
      operatorNetCostPerHour: 18,
      specialistNetCostPerHour: 26,
      operatorCostPerHour: 22,
      specialistCostPerHour: 31,
      specialistServices: ['bodas'],
      supportOperatorMinGuests: 150,
      supportOperatorMinDjHours: 6,
      supportOperatorMinWatts: 6000,
      fixedPackCost: 35,
      alertDivergencePct: 20,
    };

    const result = normalizePackPricingConfigHistory(
      {
        marginTargetPct: 1.5,
        socialSecurityPct: -1,
        specialistServices: ' bodas, empresas ',
        supportOperatorMinGuests: 0,
        fixedPackCost: '44',
      },
      fallback
    );

    expect(result).toEqual({
      ...fallback,
      marginTargetPct: 0.9,
      socialSecurityPct: 0,
      specialistServices: ['bodas', 'empresas'],
      supportOperatorMinGuests: 1,
      fixedPackCost: 44,
    });
  });
});

describe('readProfitabilityConfigHistory', () => {
  it('llegeix l’historial de profitabilityConfig i el mapeja a entries tipades', async () => {
    mockPrisma.adminLog.findMany.mockResolvedValue([
      {
        id: 'log-1',
        createdAt: new Date('2026-04-24T10:00:00Z'),
        details: {
          role: 'ADMIN',
          before: { packCostRatio: 0.3 },
          after: { packCostRatio: 0.4 },
        },
      },
    ]);

    const result = await readProfitabilityConfigHistory(30);

    expect(mockPrisma.adminLog.findMany).toHaveBeenCalledWith({
      where: {
        entity: 'setting',
        entityId: 'finance.profitabilityConfig',
        action: 'UPDATE',
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    expect(result[0]).toMatchObject({
      id: 'log-1',
      createdAt: '2026-04-24T10:00:00.000Z',
      role: 'ADMIN',
    });
    expect(result[0].before.packCostRatio).toBe(0.3);
    expect(result[0].after.packCostRatio).toBe(0.4);
  });
});

describe('readPackPricingModelHistory', () => {
  it('llegeix l’historial de pricing.pack.modelConfig i normalitza before/after', async () => {
    mockPrisma.adminLog.findMany.mockResolvedValue([
      {
        id: 'log-pack-1',
        createdAt: new Date('2026-04-24T11:00:00Z'),
        details: {
          before: { marginTargetPct: 0.5 },
          after: { marginTargetPct: 0.65, specialistServices: ['bodas', 'empresas'] },
        },
      },
    ]);

    const fallback = {
      marginTargetPct: 0.55,
      socialSecurityPct: 0.32,
      withholdingPct: 0.15,
      operatorNetCostPerHour: 18,
      specialistNetCostPerHour: 26,
      operatorCostPerHour: 22,
      specialistCostPerHour: 31,
      specialistServices: ['bodas'],
      supportOperatorMinGuests: 150,
      supportOperatorMinDjHours: 6,
      supportOperatorMinWatts: 6000,
      fixedPackCost: 35,
      alertDivergencePct: 20,
    };

    const result = await readPackPricingModelHistory(fallback, 50);

    expect(mockPrisma.adminLog.findMany).toHaveBeenCalledWith({
      where: {
        entity: 'setting',
        entityId: 'pricing.pack.modelConfig',
        action: 'UPDATE',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    expect(result[0]).toMatchObject({
      id: 'log-pack-1',
      createdAt: '2026-04-24T11:00:00.000Z',
      role: 'OWNER',
    });
    expect(result[0].before.marginTargetPct).toBe(0.5);
    expect(result[0].after.marginTargetPct).toBe(0.65);
    expect(result[0].after.specialistServices).toEqual(['bodas', 'empresas']);
  });
});
