import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockGetProfitabilityConfig, mockGetChannelSpendSummary } = vi.hoisted(() => ({
  mockPrisma: {
    lead: {
      groupBy: vi.fn(),
      count: vi.fn(),
    },
  },
  mockGetProfitabilityConfig: vi.fn(),
  mockGetChannelSpendSummary: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/profitabilityService', () => ({
  getProfitabilityConfig: mockGetProfitabilityConfig,
}));
vi.mock('@/lib/services/marketingSpendService', () => ({
  getChannelSpendSummary: mockGetChannelSpendSummary,
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
    mockGetChannelSpendSummary.mockResolvedValue(new Map()); // sense despesa per defecte
    mockPrisma.lead.count.mockResolvedValue(0);
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
    expect(insta.conversionRate).toBeCloseTo(0.1);
  });

  it('realCac i realSpend són null si no hi ha despesa carregada', async () => {
    mockPrisma.lead.groupBy
      .mockResolvedValueOnce([{ source: 'WEBSITE', _count: { id: 100 } }])
      .mockResolvedValueOnce([{ source: 'WEBSITE', _count: { id: 30 } }]);

    const result = await buildCacAnalysis();
    expect(result[0].realSpend).toBeNull();
    expect(result[0].realCac).toBeNull();
    // sense despesa no es compta cap won del període
    expect(mockPrisma.lead.count).not.toHaveBeenCalled();
  });

  it('realCac = despesa / guanyats del període cobert', async () => {
    mockPrisma.lead.groupBy
      .mockResolvedValueOnce([{ source: 'GOOGLE', _count: { id: 100 } }])
      .mockResolvedValueOnce([{ source: 'GOOGLE', _count: { id: 20 } }]);
    // 600€ de despesa carregada per GOOGLE entre 2026/01 i 2026/03
    mockGetChannelSpendSummary.mockResolvedValue(new Map([
      ['GOOGLE', { totalSpend: 600, fromYear: 2026, fromMonth: 1, toYear: 2026, toMonth: 3 }],
    ]));
    // 8 clients guanyats dins el període
    mockPrisma.lead.count.mockResolvedValue(8);

    const result = await buildCacAnalysis();
    const google = result.find((r) => r.channel === 'GOOGLE')!;
    expect(google.realSpend).toBe(600);
    expect(google.realCac).toBe(Math.round(600 / 8)); // 75
    // el rang de count: gte inici 2026/01, lt inici 2026/04
    expect(mockPrisma.lead.count).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ source: 'GOOGLE', status: 'WON' }),
    }));
  });

  it('realCac és null si hi ha despesa però cap guanyat al període', async () => {
    mockPrisma.lead.groupBy
      .mockResolvedValueOnce([{ source: 'INSTAGRAM', _count: { id: 40 } }])
      .mockResolvedValueOnce([]);
    mockGetChannelSpendSummary.mockResolvedValue(new Map([
      ['INSTAGRAM', { totalSpend: 120, fromYear: 2026, fromMonth: 6, toYear: 2026, toMonth: 6 }],
    ]));
    mockPrisma.lead.count.mockResolvedValue(0);

    const result = await buildCacAnalysis();
    expect(result[0].realSpend).toBe(120);
    expect(result[0].realCac).toBeNull();
  });

  it('usa estimatedCac del config per canal (i UNKNOWN com a fallback)', async () => {
    mockPrisma.lead.groupBy
      .mockResolvedValueOnce([
        { source: 'GOOGLE', _count: { id: 20 } },
        { source: 'REFERRAL', _count: { id: 10 } },
        { source: 'TIKTOK', _count: { id: 5 } },
      ])
      .mockResolvedValueOnce([]);

    const result = await buildCacAnalysis();
    expect(result.find((r) => r.channel === 'GOOGLE')!.estimatedCac).toBe(30);
    expect(result.find((r) => r.channel === 'REFERRAL')!.estimatedCac).toBe(5);
    expect(result.find((r) => r.channel === 'TIKTOK')!.estimatedCac).toBe(20); // UNKNOWN
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
});
