import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    lead: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { getPipelineLeads } from '@/lib/services/leads/pipeline';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.lead.findMany.mockResolvedValue([]);
});

describe('getPipelineLeads', () => {
  it('retorna leads amb select correcte', async () => {
    const leads = [{ id: 'l1', name: 'Test', status: 'NEW' }];
    mockPrisma.lead.findMany.mockResolvedValue(leads);

    const result = await getPipelineLeads(50);

    expect(result).toEqual(leads);
    expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 50,
        orderBy: { createdAt: 'desc' },
        select: expect.objectContaining({ id: true, name: true, cachedScore: true }),
      })
    );
  });

  it('normalitza limit mínim a 1', async () => {
    await getPipelineLeads(0);

    expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 1 })
    );
  });

  it('normalitza limit màxim a 500', async () => {
    await getPipelineLeads(1000);

    expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 500 })
    );
  });

  it('passa where filter', async () => {
    await getPipelineLeads(50, { status: 'NEW' });

    expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'NEW' } })
    );
  });
});
