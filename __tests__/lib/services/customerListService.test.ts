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
        where: expect.objectContaining({ OR: expect.any(Array) }),
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
});
