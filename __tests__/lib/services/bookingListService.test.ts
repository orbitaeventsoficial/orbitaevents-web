import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    booking: {
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { listAdminBookings } from '@/lib/services/bookingListService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.booking.findMany.mockResolvedValue([]);
  mockPrisma.booking.count.mockResolvedValue(0);
  mockPrisma.booking.groupBy.mockResolvedValue([]);
});

describe('listAdminBookings', () => {
  it('retorna estructura correcta', async () => {
    const result = await listAdminBookings({ locale: 'ca', page: 1, limit: 10 });

    expect(result.ok).toBe(true);
    expect(result.bookings).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(0);
    expect(result.stats).toBeDefined();
  });

  it('calcula totalPages correctament', async () => {
    mockPrisma.booking.count.mockResolvedValue(25);

    const result = await listAdminBookings({ locale: 'ca', page: 1, limit: 10 });

    expect(result.totalPages).toBe(3);
  });

  it('filtra per status vàlid', async () => {
    await listAdminBookings({ locale: 'ca', page: 1, limit: 10, status: 'CONFIRMED' });

    const call = mockPrisma.booking.findMany.mock.calls[0][0];
    const andClauses = call.where.AND as Record<string, unknown>[];
    expect(andClauses).toBeDefined();
    expect(andClauses.some((c: Record<string, unknown>) => c.status === 'CONFIRMED')).toBe(true);
  });

  it('ignora status invàlid', async () => {
    await listAdminBookings({ locale: 'ca', page: 1, limit: 10, status: 'INVALID' });

    const call = mockPrisma.booking.findMany.mock.calls[0][0];
    // No AND clauses → empty where
    expect(call.where.AND).toBeUndefined();
  });

  it('filtra per eventType', async () => {
    await listAdminBookings({ locale: 'ca', page: 1, limit: 10, eventType: 'WEDDING' });

    const call = mockPrisma.booking.findMany.mock.calls[0][0];
    const andClauses = call.where.AND as Record<string, unknown>[];
    expect(andClauses).toBeDefined();
    expect(andClauses.some((c: Record<string, unknown>) => c.eventType === 'WEDDING')).toBe(true);
  });

  it('filtra per rang de dates', async () => {
    await listAdminBookings({
      locale: 'ca', page: 1, limit: 10,
      fromDate: '2026-09-01', toDate: '2026-09-30',
    });

    const call = mockPrisma.booking.findMany.mock.calls[0][0];
    const andClauses = call.where.AND as Record<string, unknown>[];
    const dateClause = andClauses.find((c: Record<string, unknown>) => c.eventDate) as { eventDate: { gte?: Date; lte?: Date } };
    expect(dateClause).toBeDefined();
    expect(dateClause.eventDate.gte).toBeInstanceOf(Date);
    expect(dateClause.eventDate.lte).toBeInstanceOf(Date);
  });

  it('filtra per cerca textual', async () => {
    await listAdminBookings({ locale: 'ca', page: 1, limit: 10, search: 'Maria' });

    const call = mockPrisma.booking.findMany.mock.calls[0][0];
    const andClauses = call.where.AND as Record<string, unknown>[];
    const searchClause = andClauses.find((c: Record<string, unknown>) => c.OR) as { OR: unknown[] };
    expect(searchClause).toBeDefined();
    expect(searchClause.OR).toHaveLength(4);
  });

  it('agrupa estadístiques per status', async () => {
    mockPrisma.booking.groupBy.mockResolvedValue([
      { status: 'CONFIRMED', _count: 5, _sum: { total: 3000 } },
      { status: 'PENDING', _count: 2, _sum: { total: 800 } },
    ]);

    const result = await listAdminBookings({ locale: 'ca', page: 1, limit: 10 });

    expect(result.stats.CONFIRMED).toEqual({ count: 5, revenue: 3000 });
    expect(result.stats.PENDING).toEqual({ count: 2, revenue: 800 });
  });

  it('paginació skip correcte', async () => {
    await listAdminBookings({ locale: 'ca', page: 3, limit: 10 });

    expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 })
    );
  });
});
