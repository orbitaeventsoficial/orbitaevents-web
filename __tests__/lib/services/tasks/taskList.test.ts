import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    task: { findMany: vi.fn(), count: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { fetchAdminTaskList } from '@/lib/services/tasks/taskList';

const TODAY = new Date('2026-03-18T00:00:00Z');

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.task.findMany.mockResolvedValue([]);
  mockPrisma.task.count.mockResolvedValue(0);
});

describe('fetchAdminTaskList', () => {
  it('retorna estructura amb tasks i total', async () => {
    const result = await fetchAdminTaskList({ page: 1, limit: 20, todayStart: TODAY });

    expect(result.tasks).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('aplica paginació', async () => {
    await fetchAdminTaskList({ page: 3, limit: 10, todayStart: TODAY });

    expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 })
    );
  });

  it('filtra per status', async () => {
    await fetchAdminTaskList({ page: 1, limit: 20, todayStart: TODAY, status: 'OPEN' as never });

    const call = mockPrisma.task.findMany.mock.calls[0][0];
    expect(call.where.status).toEqual({ equals: 'OPEN' });
  });

  it('filtra per customerId', async () => {
    await fetchAdminTaskList({ page: 1, limit: 20, todayStart: TODAY, customerId: 'cust-1' });

    const call = mockPrisma.task.findMany.mock.calls[0][0];
    expect(call.where.customerId).toBe('cust-1');
  });

  it('exclou tasques checklist obsoletes i cancel·lades', async () => {
    await fetchAdminTaskList({ page: 1, limit: 20, todayStart: TODAY });

    const call = mockPrisma.task.findMany.mock.calls[0][0];
    expect(call.where.NOT).toBeDefined();
    expect(call.where.NOT).toHaveLength(2);
  });

  it('filtra per taskIds abans de paginar', async () => {
    await fetchAdminTaskList({ page: 2, limit: 10, todayStart: TODAY, taskIds: ['t-vip-1', 't-vip-2'] });

    const findCall = mockPrisma.task.findMany.mock.calls[0][0];
    const countCall = mockPrisma.task.count.mock.calls[0][0];
    expect(findCall.where.id).toEqual({ in: ['t-vip-1', 't-vip-2'] });
    expect(countCall.where.id).toEqual({ in: ['t-vip-1', 't-vip-2'] });
    expect(findCall.skip).toBe(10);
  });

  it('retorna buit sense tocar Prisma si taskIds es buit', async () => {
    const result = await fetchAdminTaskList({ page: 1, limit: 10, todayStart: TODAY, taskIds: [] });

    expect(result).toEqual({ tasks: [], total: 0 });
    expect(mockPrisma.task.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.task.count).not.toHaveBeenCalled();
  });
  it('mapeja resultats amb lead i customer', async () => {
    mockPrisma.task.findMany.mockResolvedValue([
      {
        id: 't1', title: 'Tasca', status: 'OPEN', dueDate: null,
        lead: { id: 'l1', name: 'Lead 1' },
        customer: null,
      },
    ]);
    mockPrisma.task.count.mockResolvedValue(1);

    const result = await fetchAdminTaskList({ page: 1, limit: 20, todayStart: TODAY });

    expect(result.tasks[0].lead).toEqual({ id: 'l1', name: 'Lead 1' });
    expect(result.tasks[0].customer).toBeUndefined();
  });
});
