import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    lead: { findMany: vi.fn() },
    booking: { findMany: vi.fn() },
    customer: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { searchAdminEntities } from '@/lib/services/adminSearchService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.lead.findMany.mockResolvedValue([]);
  mockPrisma.booking.findMany.mockResolvedValue([]);
  mockPrisma.customer.findMany.mockResolvedValue([]);
});

describe('searchAdminEntities', () => {
  it('retorna buit per query massa curta', async () => {
    const result = await searchAdminEntities('a');
    expect(result.ok).toBe(true);
    expect(result.leads).toEqual([]);
    expect(result.bookings).toEqual([]);
    expect(result.customers).toEqual([]);
    expect(mockPrisma.lead.findMany).not.toHaveBeenCalled();
  });

  it('retorna buit per query buida', async () => {
    const result = await searchAdminEntities('');
    expect(result.ok).toBe(true);
    expect(mockPrisma.lead.findMany).not.toHaveBeenCalled();
  });

  it('cerca en leads, bookings i customers', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([{ id: 'lead-1', name: 'Maria' }]);
    mockPrisma.booking.findMany.mockResolvedValue([{ id: 'booking-1', clientName: 'Maria' }]);
    mockPrisma.customer.findMany.mockResolvedValue([{ id: 'cust-1', name: 'Maria' }]);

    const result = await searchAdminEntities('Maria');

    expect(result.ok).toBe(true);
    expect(result.leads).toHaveLength(1);
    expect(result.bookings).toHaveLength(1);
    expect(result.customers).toHaveLength(1);
  });

  it('fa trim del query', async () => {
    await searchAdminEntities('  Maria  ');

    expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ name: { contains: 'Maria', mode: 'insensitive' } }),
          ]),
        }),
      })
    );
  });

  it('limita resultats a 5 per entitat', async () => {
    await searchAdminEntities('test');

    expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 })
    );
    expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 })
    );
    expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 })
    );
  });
});
