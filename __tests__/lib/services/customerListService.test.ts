import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    customer: { findMany: vi.fn(), count: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { listAdminCustomers } from '@/lib/services/customerListService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.customer.findMany.mockResolvedValue([]);
  mockPrisma.customer.count.mockResolvedValue(0);
});

describe('listAdminCustomers', () => {
  it('retorna estructura paginada', async () => {
    const result = await listAdminCustomers({ includeStats: false, page: 1, limit: 10, q: '' });

    expect(result.customers).toEqual([]);
    expect(result.page).toBe(1);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(1); // min 1
  });

  it('calcula totalPages correctament', async () => {
    mockPrisma.customer.count.mockResolvedValue(25);

    const result = await listAdminCustomers({ includeStats: false, page: 1, limit: 10, q: '' });

    expect(result.totalPages).toBe(3);
  });

  it('aplica cerca per query', async () => {
    await listAdminCustomers({ includeStats: false, page: 1, limit: 10, q: 'Maria' });

    expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({ OR: expect.any(Array) }),
          ]),
        }),
      })
    );
  });

  it('no aplica filtre sense query', async () => {
    await listAdminCustomers({ includeStats: false, page: 1, limit: 10, q: '' });

    const call = mockPrisma.customer.findMany.mock.calls[0][0];
    expect(call.where).toBeUndefined();
  });

  it('inclou stats si demanat', async () => {
    mockPrisma.customer.count.mockResolvedValue(10);

    const result = await listAdminCustomers({ includeStats: true, page: 1, limit: 10, q: '' });

    expect(result.stats).toBeDefined();
    const stats = result.stats as Record<string, number>;
    expect(stats.total).toBeDefined();
    expect(stats.withEvents).toBeDefined();
    expect(stats.vip).toBeDefined();
  });

  it('no inclou stats si no demanat', async () => {
    const result = await listAdminCustomers({ includeStats: false, page: 1, limit: 10, q: '' });

    expect(result.stats).toBeUndefined();
  });

  it('paginació skip correcte', async () => {
    await listAdminCustomers({ includeStats: false, page: 3, limit: 20, q: '' });

    expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 40, take: 20 })
    );
  });

  it('aplica filtre healthScoreMax', async () => {
    await listAdminCustomers({ includeStats: false, page: 1, limit: 10, q: '', healthScoreMax: 40 });

    expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({ healthScore: { lte: 40 } }),
          ]),
        }),
      })
    );
  });

  it('aplica filtre minSpent', async () => {
    await listAdminCustomers({ includeStats: false, page: 1, limit: 10, q: '', minSpent: 2000 });

    expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({ totalSpent: { gte: 2000 } }),
          ]),
        }),
      })
    );
  });

  it('stats inclou highValue count', async () => {
    mockPrisma.customer.count.mockResolvedValue(5);

    const result = await listAdminCustomers({ includeStats: true, page: 1, limit: 10, q: '' });

    const stats = result.stats as Record<string, number>;
    expect(stats.highValue).toBeDefined();
  });
});

// Regressió: `listAdminCustomers` ha d'acceptar un `now?: Date` injectable per
// calcular la finestra "recentMonth" (clients creats en els últims 30 dies).
// Abans, cridava `new Date()` intern a la línia 81 i la stat podia divergir
// del render si la page caiga a banda i banda d'una frontera horària.
describe('propagació de `now` a stat `recentMonth`', () => {
  it('stats=true amb `now` injectat: filtra createdAt > now-1mes', async () => {
    const injectedNow = new Date('2026-06-15T12:00:00Z');
    const expectedThreshold = new Date('2026-05-15T12:00:00Z');

    await listAdminCustomers(
      { includeStats: true, page: 1, limit: 10, q: '' },
      injectedNow,
    );

    const recentMonthCall = mockPrisma.customer.count.mock.calls.find((call) => {
      const where = call[0]?.where as { createdAt?: { gt?: Date } } | undefined;
      return where?.createdAt?.gt !== undefined;
    });
    expect(recentMonthCall).toBeDefined();
    const actualThreshold = recentMonthCall![0].where.createdAt.gt as Date;
    expect(actualThreshold.toISOString()).toBe(expectedThreshold.toISOString());
  });

  it('sense `now` explícit: usa default i no llança', async () => {
    mockPrisma.customer.count.mockResolvedValue(3);

    const result = await listAdminCustomers({ includeStats: true, page: 1, limit: 10, q: '' });

    const stats = result.stats as Record<string, number>;
    expect(stats.recentMonth).toBeDefined();
  });

  it('`now` injectat no muta entre crides (new Date(now) evita setMonth damnifiqui l\'argument)', async () => {
    const injectedNow = new Date('2026-06-15T12:00:00Z');
    const originalTime = injectedNow.getTime();

    await listAdminCustomers(
      { includeStats: true, page: 1, limit: 10, q: '' },
      injectedNow,
    );

    expect(injectedNow.getTime()).toBe(originalTime);
  });
});
