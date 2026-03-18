import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockGetProfitabilityConfig } = vi.hoisted(() => ({
  mockPrisma: {
    lead: {
      groupBy: vi.fn(),
    },
  },
  mockGetProfitabilityConfig: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/profitabilityService', () => ({
  getProfitabilityConfig: mockGetProfitabilityConfig,
}));

import { buildCacAnalysis } from '@/lib/services/cacAnalysis';

const DEFAULT_CONFIG = {
  channelCac: {
    WEBSITE: 15,
    INSTAGRAM: 25,
    REFERRAL: 5,
    GOOGLE: 30,
    UNKNOWN: 20,
  },
};

describe('cacAnalysis — buildCacAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProfitabilityConfig.mockResolvedValue(DEFAULT_CONFIG);
  });

  it('retorna array buit si no hi ha leads', async () => {
    mockPrisma.lead.groupBy
      .mockResolvedValueOnce([]) // leadsBySource
      .mockResolvedValueOnce([]); // wonBySource

    const result = await buildCacAnalysis();
    expect(result).toEqual([]);
  });

  it('calcula conversionRate correctament', async () => {
    mockPrisma.lead.groupBy
      .mockResolvedValueOnce([
        { source: 'WEBSITE', _count: { id: 100 } },
        { source: 'INSTAGRAM', _count: { id: 50 } },
      ])
      .mockResolvedValueOnce([
        { source: 'WEBSITE', _count: { id: 20 } },
        { source: 'INSTAGRAM', _count: { id: 5 } },
      ]);

    const result = await buildCacAnalysis();

    const website = result.find((r) => r.channel === 'WEBSITE')!;
    expect(website.totalLeads).toBe(100);
    expect(website.wonLeads).toBe(20);
    expect(website.conversionRate).toBeCloseTo(0.2);

    const insta = result.find((r) => r.channel === 'INSTAGRAM')!;
    expect(insta.totalLeads).toBe(50);
    expect(insta.wonLeads).toBe(5);
    expect(insta.conversionRate).toBeCloseTo(0.1);
  });

  it('calcula realCac ponderat per conversió (baseline 15%)', async () => {
    mockPrisma.lead.groupBy
      .mockResolvedValueOnce([{ source: 'WEBSITE', _count: { id: 100 } }])
      .mockResolvedValueOnce([{ source: 'WEBSITE', _count: { id: 30 } }]); // 30% conversió

    const result = await buildCacAnalysis();
    const row = result[0];

    // realCac = estimatedCac * (0.15 / 0.30) = 15 * 0.5 = 7.5 → arrodonit 8
    expect(row.estimatedCac).toBe(15);
    expect(row.realCac).toBe(Math.round(15 * (0.15 / 0.3)));
  });

  it('realCac és null si no hi ha won leads', async () => {
    mockPrisma.lead.groupBy
      .mockResolvedValueOnce([{ source: 'WEBSITE', _count: { id: 50 } }])
      .mockResolvedValueOnce([]); // cap WON

    const result = await buildCacAnalysis();
    expect(result[0].realCac).toBeNull();
    expect(result[0].wonLeads).toBe(0);
    expect(result[0].conversionRate).toBe(0);
  });

  it('usa estimatedCac del config per canal', async () => {
    mockPrisma.lead.groupBy
      .mockResolvedValueOnce([
        { source: 'GOOGLE', _count: { id: 20 } },
        { source: 'REFERRAL', _count: { id: 10 } },
      ])
      .mockResolvedValueOnce([
        { source: 'GOOGLE', _count: { id: 4 } },
        { source: 'REFERRAL', _count: { id: 3 } },
      ]);

    const result = await buildCacAnalysis();
    const google = result.find((r) => r.channel === 'GOOGLE')!;
    const referral = result.find((r) => r.channel === 'REFERRAL')!;

    expect(google.estimatedCac).toBe(30);
    expect(referral.estimatedCac).toBe(5);
  });

  it('usa UNKNOWN com a fallback per canals no configurats', async () => {
    mockPrisma.lead.groupBy
      .mockResolvedValueOnce([{ source: 'TIKTOK', _count: { id: 5 } }])
      .mockResolvedValueOnce([]);

    const result = await buildCacAnalysis();
    expect(result[0].estimatedCac).toBe(20); // UNKNOWN fallback
  });

  it('ordena per totalLeads descendent', async () => {
    mockPrisma.lead.groupBy
      .mockResolvedValueOnce([
        { source: 'REFERRAL', _count: { id: 10 } },
        { source: 'WEBSITE', _count: { id: 100 } },
        { source: 'GOOGLE', _count: { id: 50 } },
      ])
      .mockResolvedValueOnce([]);

    const result = await buildCacAnalysis();
    expect(result.map((r) => r.channel)).toEqual(['WEBSITE', 'GOOGLE', 'REFERRAL']);
  });

  it('canal amb conversió baixa té realCac alt', async () => {
    // 5% conversió → realCac = estimatedCac * (0.15/0.05) = 15 * 3 = 45
    mockPrisma.lead.groupBy
      .mockResolvedValueOnce([{ source: 'WEBSITE', _count: { id: 100 } }])
      .mockResolvedValueOnce([{ source: 'WEBSITE', _count: { id: 5 } }]);

    const result = await buildCacAnalysis();
    expect(result[0].realCac).toBe(Math.round(15 * (0.15 / 0.05))); // 45
  });

  it('canal amb conversió alta té realCac baix', async () => {
    // 50% conversió → realCac = estimatedCac * (0.15/0.5) = 15 * 0.3 = 4.5 → 5
    mockPrisma.lead.groupBy
      .mockResolvedValueOnce([{ source: 'WEBSITE', _count: { id: 100 } }])
      .mockResolvedValueOnce([{ source: 'WEBSITE', _count: { id: 50 } }]);

    const result = await buildCacAnalysis();
    expect(result[0].realCac).toBe(Math.round(15 * (0.15 / 0.5))); // 5
  });
});
