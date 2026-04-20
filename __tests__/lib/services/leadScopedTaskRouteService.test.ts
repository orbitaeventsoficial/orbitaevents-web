import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    lead: { findUnique: vi.fn() },
    leadActivity: { create: vi.fn() },
  },
}));

const { mockTaskService } = vi.hoisted(() => ({
  mockTaskService: {
    listLeadScopedTasks: vi.fn(),
    createLeadScopedTask: vi.fn(),
    updateLeadScopedTask: vi.fn(),
    deleteLeadScopedTask: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/tasks/leadScopedTaskService', () => mockTaskService);

import {
  createLeadScopedTaskForRoute,
  deleteLeadScopedTaskForRoute,
  listLeadScopedTasksForRoute,
  updateLeadScopedTaskForRoute,
} from '@/lib/services/leadScopedTaskRouteService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.lead.findUnique.mockResolvedValue({ customerId: 'cust-1' });
  mockPrisma.leadActivity.create.mockResolvedValue({ id: 'act-1' });
});

describe('leadScopedTaskRouteService', () => {
  describe('listLeadScopedTasksForRoute', () => {
    it('retorna la llista canònica de tasques del lead', async () => {
      const tasks = [{ id: 'task-1', title: 'Trucar client' }];
      mockTaskService.listLeadScopedTasks.mockResolvedValue(tasks);

      const result = await listLeadScopedTasksForRoute('lead-1');

      expect(result).toEqual({ ok: true, tasks });
      expect(mockTaskService.listLeadScopedTasks).toHaveBeenCalledWith('lead-1');
    });
  });

  describe('createLeadScopedTaskForRoute', () => {
    it('crea la tasca usant customerId del lead i registra activitat', async () => {
      const task = { id: 'task-1', title: 'Preparar proposta', status: 'OPEN', priority: 'HIGH' };
      mockTaskService.createLeadScopedTask.mockResolvedValue(task);

      const input = { title: 'Preparar proposta', createdBy: 'Admin' };
      const result = await createLeadScopedTaskForRoute('lead-1', input);

      expect(result).toEqual({ ok: true, task });
      expect(mockTaskService.createLeadScopedTask).toHaveBeenCalledWith('lead-1', 'cust-1', input);
      expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          leadId: 'lead-1',
          type: 'TASK',
          title: 'Tasca creada',
          description: 'Preparar proposta',
          createdBy: 'Admin',
          metadata: { taskId: 'task-1', status: 'OPEN', priority: 'HIGH' },
        }),
      });
    });

    it('usa Admin per defecte quan no arriba createdBy', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(null);
      mockTaskService.createLeadScopedTask.mockResolvedValue({ id: 'task-2', title: 'Seguiment', status: 'OPEN', priority: 'MEDIUM' });

      await createLeadScopedTaskForRoute('lead-2', { title: 'Seguiment' });

      expect(mockTaskService.createLeadScopedTask).toHaveBeenCalledWith('lead-2', null, { title: 'Seguiment' });
      expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ createdBy: 'Admin' }),
      });
    });
  });

  describe('updateLeadScopedTaskForRoute', () => {
    it('actualitza la tasca i deixa traça a leadActivity', async () => {
      const task = { id: 'task-3', title: 'Trucar venue', status: 'DONE', priority: 'URGENT' };
      mockTaskService.updateLeadScopedTask.mockResolvedValue(task);

      const result = await updateLeadScopedTaskForRoute('lead-3', 'task-3', { status: 'DONE' });

      expect(result).toEqual({ ok: true, task });
      expect(mockTaskService.updateLeadScopedTask).toHaveBeenCalledWith('task-3', 'lead-3', { status: 'DONE' });
      expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          leadId: 'lead-3',
          title: 'Tasca actualitzada',
          description: 'Trucar venue',
          metadata: { taskId: 'task-3', status: 'DONE', priority: 'URGENT' },
        }),
      });
    });
  });

  describe('deleteLeadScopedTaskForRoute', () => {
    it('elimina la tasca i registra l’activitat de tancament', async () => {
      mockTaskService.deleteLeadScopedTask.mockResolvedValue(undefined);

      const result = await deleteLeadScopedTaskForRoute('lead-4', 'task-4');

      expect(result).toEqual({ ok: true });
      expect(mockTaskService.deleteLeadScopedTask).toHaveBeenCalledWith('task-4', 'lead-4');
      expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          leadId: 'lead-4',
          type: 'TASK',
          title: 'Tasca eliminada',
          metadata: { taskId: 'task-4' },
        }),
      });
    });
  });
});
