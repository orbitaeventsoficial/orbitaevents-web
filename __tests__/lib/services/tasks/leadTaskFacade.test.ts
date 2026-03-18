import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    task: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    leadTask: { deleteMany: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  listLeadTasks,
  createLeadTask,
  updateLeadTask,
  deleteLeadTask,
  findLeadTaskLinkByTaskOrLegacyId,
} from '@/lib/services/tasks/leadTaskFacade';

const NOW = new Date('2026-03-18T12:00:00Z');

const mockTask = (overrides = {}) => ({
  id: 't1',
  title: 'Tasca',
  description: null,
  dueDate: null,
  status: 'OPEN',
  priority: 'MEDIUM',
  createdAt: NOW,
  updatedAt: NOW,
  assignedTo: null,
  createdBy: 'Admin',
  completedAt: null,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.task.findMany.mockResolvedValue([]);
  mockPrisma.task.findFirst.mockResolvedValue(null);
  mockPrisma.task.findUnique.mockResolvedValue(null);
  mockPrisma.task.create.mockResolvedValue(mockTask());
  mockPrisma.task.update.mockResolvedValue(mockTask());
  mockPrisma.task.delete.mockResolvedValue({});
  mockPrisma.leadTask.deleteMany.mockResolvedValue({ count: 0 });
});

describe('listLeadTasks', () => {
  it('retorna tasques normalitzades', async () => {
    mockPrisma.task.findMany.mockResolvedValue([mockTask()]);

    const result = await listLeadTasks('lead-1');

    expect(result).toHaveLength(1);
    expect(result[0].createdAt).toBe(NOW.toISOString());
    expect(result[0].dueDate).toBeNull();
  });
});

describe('createLeadTask', () => {
  it('crea amb defaults', async () => {
    const result = await createLeadTask('lead-1', 'cust-1', { title: 'Nova' });

    expect(result.title).toBe('Tasca');
    expect(mockPrisma.task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: 'lead-1',
        customerId: 'cust-1',
        title: 'Nova',
        status: 'OPEN',
        priority: 'MEDIUM',
        createdBy: 'Admin',
      }),
      select: expect.any(Object),
    });
  });

  it('posa completedAt si status DONE', async () => {
    mockPrisma.task.create.mockResolvedValue(mockTask({ completedAt: NOW }));

    await createLeadTask('lead-1', null, { title: 'Feta', status: 'DONE' });

    expect(mockPrisma.task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: 'DONE',
        completedAt: expect.any(Date),
      }),
      select: expect.any(Object),
    });
  });
});

describe('updateLeadTask', () => {
  it('llança error si tasca no pertany al lead', async () => {
    await expect(updateLeadTask('t1', 'lead-1', { title: 'Updated' })).rejects.toThrow('TASK_NOT_FOUND');
  });

  it('actualitza si existeix', async () => {
    mockPrisma.task.findFirst.mockResolvedValue({ id: 't1' });

    await updateLeadTask('t1', 'lead-1', { title: 'Updated' });

    expect(mockPrisma.task.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 't1' },
      })
    );
  });
});

describe('deleteLeadTask', () => {
  it('llança error si no existeix', async () => {
    await expect(deleteLeadTask('t1', 'lead-1')).rejects.toThrow('TASK_NOT_FOUND');
  });

  it('elimina tasca', async () => {
    mockPrisma.task.findFirst.mockResolvedValue({ id: 't1', legacyLeadTaskId: null });

    await deleteLeadTask('t1', 'lead-1');

    expect(mockPrisma.task.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
    expect(mockPrisma.leadTask.deleteMany).not.toHaveBeenCalled();
  });

  it('elimina legacy task si existeix', async () => {
    mockPrisma.task.findFirst.mockResolvedValue({ id: 't1', legacyLeadTaskId: 'legacy-1' });

    await deleteLeadTask('t1', 'lead-1');

    expect(mockPrisma.task.delete).toHaveBeenCalled();
    expect(mockPrisma.leadTask.deleteMany).toHaveBeenCalledWith({
      where: { id: 'legacy-1', leadId: 'lead-1' },
    });
  });
});

describe('findLeadTaskLinkByTaskOrLegacyId', () => {
  it('retorna directTask si existeix', async () => {
    mockPrisma.task.findUnique.mockResolvedValue({ customerId: 'c1', leadId: 'l1' });

    const result = await findLeadTaskLinkByTaskOrLegacyId('t1');

    expect(result).toEqual({ customerId: 'c1', leadId: 'l1' });
  });

  it('cerca per legacyId si directe no existeix', async () => {
    mockPrisma.task.findUnique.mockResolvedValue(null);
    mockPrisma.task.findFirst.mockResolvedValue({ customerId: 'c2', leadId: 'l2' });

    const result = await findLeadTaskLinkByTaskOrLegacyId('legacy-1');

    expect(result).toEqual({ customerId: 'c2', leadId: 'l2' });
    expect(mockPrisma.task.findFirst).toHaveBeenCalledWith({
      where: { legacyLeadTaskId: 'legacy-1' },
      select: { customerId: true, leadId: true },
    });
  });
});
