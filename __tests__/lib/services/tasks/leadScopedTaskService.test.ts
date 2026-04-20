import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  createLeadScopedTask,
  deleteLeadScopedTask,
  findTaskLinkByTaskOrLegacyId,
  listLeadScopedTasks,
  updateLeadScopedTask,
} from '@/lib/services/tasks/leadScopedTaskService';

const NOW = new Date('2026-04-09T10:00:00Z');

const mockTask = (overrides = {}) => ({
  id: 'task-1',
  title: 'Trucar client',
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
});

describe('leadScopedTaskService', () => {
  it('llista tasques normalitzades per lead', async () => {
    mockPrisma.task.findMany.mockResolvedValue([mockTask()]);

    const result = await listLeadScopedTasks('lead-1');

    expect(result).toEqual([
      expect.objectContaining({
        id: 'task-1',
        createdAt: NOW.toISOString(),
        dueDate: null,
      }),
    ]);
    expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
      where: { leadId: 'lead-1' },
      orderBy: { createdAt: 'desc' },
      select: expect.any(Object),
    });
  });

  it('crea tasca amb defaults i converteix dueDate', async () => {
    await createLeadScopedTask('lead-1', 'cust-1', {
      title: 'Preparar proposta',
      dueDate: '2026-04-15',
    });

    expect(mockPrisma.task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: 'lead-1',
        customerId: 'cust-1',
        title: 'Preparar proposta',
        status: 'OPEN',
        priority: 'MEDIUM',
        createdBy: 'Admin',
        dueDate: expect.any(Date),
        completedAt: null,
      }),
      select: expect.any(Object),
    });
  });

  it('propaga source canònic al crear la tasca', async () => {
    await createLeadScopedTask('lead-1', 'cust-1', {
      title: 'Tasca manual',
      source: 'AUTOMATION',
    });

    expect(mockPrisma.task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: 'lead-1',
        customerId: 'cust-1',
        source: 'AUTOMATION',
      }),
      select: expect.any(Object),
    });
  });

  it('desa source null per defecte si no es proporciona', async () => {
    await createLeadScopedTask('lead-1', null, {
      title: 'Tasca sense source',
    });

    expect(mockPrisma.task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        source: null,
      }),
      select: expect.any(Object),
    });
  });

  it('marca completedAt en crear una tasca DONE', async () => {
    mockPrisma.task.create.mockResolvedValue(mockTask({ status: 'DONE', completedAt: NOW }));

    await createLeadScopedTask('lead-1', null, {
      title: 'Tancar task',
      status: 'DONE',
      priority: 'HIGH',
    });

    expect(mockPrisma.task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: 'DONE',
        priority: 'HIGH',
        completedAt: expect.any(Date),
      }),
      select: expect.any(Object),
    });
  });

  it('llança TASK_NOT_FOUND si update no pertany al lead', async () => {
    await expect(updateLeadScopedTask('task-1', 'lead-1', { title: 'Nou titol' })).rejects.toThrow('TASK_NOT_FOUND');
  });

  it('neteja completedAt en reobrir una tasca i admet dueDate null', async () => {
    mockPrisma.task.findFirst.mockResolvedValue({ id: 'task-1' });
    mockPrisma.task.update.mockResolvedValue(mockTask({ dueDate: null, completedAt: null, status: 'OPEN' }));

    await updateLeadScopedTask('task-1', 'lead-1', { status: 'OPEN', dueDate: null });

    expect(mockPrisma.task.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: expect.objectContaining({
        status: 'OPEN',
        dueDate: null,
        completedAt: null,
      }),
      select: expect.any(Object),
    });
  });

  it('resol link directe o legacy', async () => {
    mockPrisma.task.findUnique.mockResolvedValueOnce({ customerId: 'cust-1', leadId: 'lead-1' });
    const direct = await findTaskLinkByTaskOrLegacyId('task-1');
    expect(direct).toEqual({ customerId: 'cust-1', leadId: 'lead-1' });

    mockPrisma.task.findUnique.mockResolvedValueOnce(null);
    mockPrisma.task.findFirst.mockResolvedValueOnce({ customerId: 'cust-2', leadId: 'lead-2' });
    const legacy = await findTaskLinkByTaskOrLegacyId('legacy-1');
    expect(legacy).toEqual({ customerId: 'cust-2', leadId: 'lead-2' });
  });

  it('elimina task per id i leadId', async () => {
    mockPrisma.task.findFirst.mockResolvedValue({ id: 'task-1' });

    await deleteLeadScopedTask('task-1', 'lead-1');

    expect(mockPrisma.task.delete).toHaveBeenCalledWith({ where: { id: 'task-1' } });
  });
});
