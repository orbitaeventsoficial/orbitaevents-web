import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    task: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  listAdminTasks,
  createAdminTask,
  updateAdminTask,
  deleteAdminTask,
} from '@/lib/services/tasks/taskAdminService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.task.findMany.mockResolvedValue([]);
  mockPrisma.task.count.mockResolvedValue(0);
  mockPrisma.task.create.mockResolvedValue({ id: 't1', title: 'Test' });
  mockPrisma.task.update.mockResolvedValue({ id: 't1' });
  mockPrisma.task.delete.mockResolvedValue({});
});

describe('listAdminTasks', () => {
  it('retorna estructura paginada', async () => {
    const result = await listAdminTasks({ limit: 10, page: 1 });

    expect(result.ok).toBe(true);
    expect(result.tasks).toEqual([]);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.totalPages).toBe(1);
  });

  it('calcula totalPages', async () => {
    mockPrisma.task.count.mockResolvedValue(25);

    const result = await listAdminTasks({ limit: 10, page: 1 });

    expect(result.pagination.totalPages).toBe(3);
  });

  it('filtra per status vàlid', async () => {
    await listAdminTasks({ limit: 10, page: 1, status: 'OPEN' });

    const call = mockPrisma.task.findMany.mock.calls[0][0];
    expect(call.where.status).toBe('OPEN');
  });

  it('ignora status invàlid', async () => {
    await listAdminTasks({ limit: 10, page: 1, status: 'INVALID' });

    const call = mockPrisma.task.findMany.mock.calls[0][0];
    expect(call.where.status).toBeUndefined();
  });

  it('aplica skip correcte', async () => {
    await listAdminTasks({ limit: 20, page: 3 });

    expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 40, take: 20 })
    );
  });
});

describe('createAdminTask', () => {
  it('crea amb defaults', async () => {
    const result = await createAdminTask({ title: 'Nova tasca' });

    expect(result.ok).toBe(true);
    expect(mockPrisma.task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Nova tasca',
        status: 'OPEN',
        priority: 'MEDIUM',
        createdBy: 'Admin',
      }),
    });
  });

  it('posa completedAt si status DONE', async () => {
    await createAdminTask({ title: 'Feta', status: 'DONE' });

    expect(mockPrisma.task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: 'DONE',
        completedAt: expect.any(Date),
      }),
    });
  });

  it('parseja dueDate string', async () => {
    await createAdminTask({ title: 'Urgent', dueDate: '2026-04-01' });

    expect(mockPrisma.task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        dueDate: expect.any(Date),
      }),
    });
  });
});

describe('updateAdminTask', () => {
  it('actualitza camps proporcionats', async () => {
    await updateAdminTask('t1', { title: 'Actualitzada', priority: 'HIGH' });

    expect(mockPrisma.task.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: expect.objectContaining({ title: 'Actualitzada', priority: 'HIGH' }),
    });
  });

  it('posa completedAt quan DONE', async () => {
    await updateAdminTask('t1', { status: 'DONE' });

    const call = mockPrisma.task.update.mock.calls[0][0];
    expect(call.data.completedAt).toBeInstanceOf(Date);
  });

  it('esborra completedAt quan torna a OPEN', async () => {
    await updateAdminTask('t1', { status: 'OPEN' });

    const call = mockPrisma.task.update.mock.calls[0][0];
    expect(call.data.completedAt).toBeNull();
  });
});

describe('deleteAdminTask', () => {
  it('elimina per id', async () => {
    const result = await deleteAdminTask('t1');

    expect(result.ok).toBe(true);
    expect(mockPrisma.task.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
  });
});
