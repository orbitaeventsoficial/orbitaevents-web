import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    booking: {
      fields: {
        depositAmount: { name: 'depositAmount' },
        remainingAmount: { name: 'remainingAmount' },
        total: { name: 'total' },
      },
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { listAdminBookings } from '@/lib/services/bookingListService';

function fieldName(fieldRef: unknown): string | undefined {
  return (fieldRef as { name?: string })?.name;
}

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

  it('filtra per customerId quan la llista ve del Customer Hub o del kanban', async () => {
    await listAdminBookings({ locale: 'ca', page: 1, limit: 10, customerId: 'customer-1' });

    const call = mockPrisma.booking.findMany.mock.calls[0][0];
    const andClauses = call.where.AND as Record<string, unknown>[];
    expect(andClauses.some((c: Record<string, unknown>) => c.customerId === 'customer-1')).toBe(true);
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

// Regressió: `listAdminBookings` ha d'acceptar un `now?: Date` injectable per
// calcular les finestres de `overdue` i `due-soon` de manera determinista.
// Abans, cridava `new Date()` intern a la línia 41 i els tests no podien
// verificar que les boundaries (eventDate < now+30, now+37, etc.) es
// calculaven correctament segons un instant fix.
describe('propagació de `now` a filtres de pagament', () => {
  it('payment=overdue: usa `now` injectat per al límit d\'eventDate (depositPaid:false → now+30)', async () => {
    const injectedNow = new Date('2026-06-15T00:00:00Z');

    await listAdminBookings(
      { locale: 'ca', page: 1, limit: 10, payment: 'overdue' },
      injectedNow,
    );

    const call = mockPrisma.booking.findMany.mock.calls[0][0];
    const andClauses = call.where.AND as Record<string, unknown>[];
    const orClause = andClauses.find((c) => c.OR) as { OR: any[] };
    const [deposit, remaining] = orClause.OR;
    expect(deposit.eventDate?.lt).toEqual(new Date('2026-07-15T00:00:00Z'));
    expect(fieldName(deposit.OR[1].cashAmount.lt)).toBe('depositAmount');
    expect(remaining.eventDate?.lt).toEqual(new Date('2026-06-22T00:00:00Z'));
    expect(fieldName(remaining.OR[1].cashAmount.lt)).toBe('remainingAmount');
    expect(fieldName(remaining.OR[2].cashAmount.lt)).toBe('total');
  });

  it('payment=due-soon: usa `now` injectat per a les finestres de deposit/remaining', async () => {
    const injectedNow = new Date('2026-06-15T00:00:00Z');

    await listAdminBookings(
      { locale: 'ca', page: 1, limit: 10, payment: 'due-soon' },
      injectedNow,
    );

    const call = mockPrisma.booking.findMany.mock.calls[0][0];
    const andClauses = call.where.AND as Record<string, unknown>[];
    const orClause = andClauses.find((c) => c.OR) as { OR: any[] };
    const [deposit, remaining] = orClause.OR;
    expect(deposit.eventDate).toEqual({
      gte: new Date('2026-07-15T00:00:00Z'),
      lte: new Date('2026-07-22T00:00:00Z'),
    });
    expect(fieldName(deposit.OR[1].cashAmount.lt)).toBe('depositAmount');
    expect(remaining.eventDate).toEqual({
      gte: new Date('2026-06-22T00:00:00Z'),
      lte: new Date('2026-06-29T00:00:00Z'),
    });
    expect(fieldName(remaining.OR[1].cashAmount.lt)).toBe('remainingAmount');
    expect(fieldName(remaining.OR[2].cashAmount.lt)).toBe('total');
  });

  it('sense `now` explícit, usa un default (Date) i no llança', async () => {
    const result = await listAdminBookings({ locale: 'ca', page: 1, limit: 10, payment: 'overdue' });
    expect(result.ok).toBe(true);
  });
});
