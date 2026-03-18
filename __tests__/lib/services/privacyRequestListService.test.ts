import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    dataRequest: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { listAdminPrivacyRequests } from '@/lib/services/privacyRequestListService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.dataRequest.findMany.mockResolvedValue([]);
});

describe('listAdminPrivacyRequests', () => {
  it('retorna llista buida', async () => {
    const result = await listAdminPrivacyRequests(null, null, 50);

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
    expect(result.count).toBe(0);
  });

  it('filtra per status', async () => {
    await listAdminPrivacyRequests('PENDING', null, 50);

    expect(mockPrisma.dataRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'PENDING' }),
      })
    );
  });

  it('filtra per type', async () => {
    await listAdminPrivacyRequests(null, 'ERASURE', 50);

    expect(mockPrisma.dataRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ requestType: 'ERASURE' }),
      })
    );
  });

  it('no filtra amb status "all"', async () => {
    await listAdminPrivacyRequests('all', 'all', 50);

    const call = mockPrisma.dataRequest.findMany.mock.calls[0][0];
    expect(call.where).toEqual({});
  });

  it('aplica limit', async () => {
    await listAdminPrivacyRequests(null, null, 10);

    expect(mockPrisma.dataRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 })
    );
  });

  it('ordena per status i legalDeadline', async () => {
    await listAdminPrivacyRequests(null, null, 50);

    expect(mockPrisma.dataRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ status: 'asc' }, { legalDeadline: 'asc' }],
      })
    );
  });
});
