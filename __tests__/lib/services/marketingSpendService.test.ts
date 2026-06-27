import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    marketingSpend: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  },
}));
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  listMarketingSpend,
  upsertMarketingSpend,
  deleteMarketingSpend,
  getChannelSpendSummary,
} from '@/lib/services/marketingSpendService';

describe('marketingSpendService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('llista les entrades mapejades', async () => {
    mockPrisma.marketingSpend.findMany.mockResolvedValue([
      { id: 's1', channel: 'GOOGLE', year: 2026, month: 6, amount: 200, notes: null },
    ]);
    const out = await listMarketingSpend();
    expect(out).toEqual([{ id: 's1', channel: 'GOOGLE', year: 2026, month: 6, amount: 200, notes: null }]);
  });

  it('upsert per la clau única canal+any+mes', async () => {
    mockPrisma.marketingSpend.upsert.mockResolvedValue({ id: 's2', channel: 'INSTAGRAM', year: 2026, month: 5, amount: 50, notes: 'test' });
    const out = await upsertMarketingSpend({ channel: 'INSTAGRAM', year: 2026, month: 5, amount: 50, notes: 'test' });
    expect(mockPrisma.marketingSpend.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { channel_year_month: { channel: 'INSTAGRAM', year: 2026, month: 5 } },
    }));
    expect(out.amount).toBe(50);
  });

  it('elimina per id', async () => {
    mockPrisma.marketingSpend.delete.mockResolvedValue({});
    await deleteMarketingSpend('s9');
    expect(mockPrisma.marketingSpend.delete).toHaveBeenCalledWith({ where: { id: 's9' } });
  });

  it('resum per canal: suma import i calcula rang de mesos cobert', async () => {
    mockPrisma.marketingSpend.findMany.mockResolvedValue([
      { channel: 'GOOGLE', year: 2026, month: 3, amount: 100 },
      { channel: 'GOOGLE', year: 2026, month: 6, amount: 250 },
      { channel: 'GOOGLE', year: 2025, month: 12, amount: 80 },
      { channel: 'INSTAGRAM', year: 2026, month: 6, amount: 40 },
    ]);
    const map = await getChannelSpendSummary();

    const google = map.get('GOOGLE');
    expect(google?.totalSpend).toBe(430);
    // més antic = 2025/12, més recent = 2026/06
    expect(google?.fromYear).toBe(2025);
    expect(google?.fromMonth).toBe(12);
    expect(google?.toYear).toBe(2026);
    expect(google?.toMonth).toBe(6);

    const instagram = map.get('INSTAGRAM');
    expect(instagram?.totalSpend).toBe(40);
    expect(instagram?.fromMonth).toBe(6);
    expect(instagram?.toMonth).toBe(6);
  });

  it('resum buit si no hi ha despesa', async () => {
    mockPrisma.marketingSpend.findMany.mockResolvedValue([]);
    const map = await getChannelSpendSummary();
    expect(map.size).toBe(0);
  });
});
