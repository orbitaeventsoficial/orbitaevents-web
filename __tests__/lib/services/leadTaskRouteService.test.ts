import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    lead: { findUnique: vi.fn() },
    leadActivity: { create: vi.fn() },
  },
}));

const { mockFacade } = vi.hoisted(() => ({
  mockFacade: {
    listLeadTasks: vi.fn(),
    createLeadTask: vi.fn(),
    updateLeadTask: vi.fn(),
    deleteLeadTask: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/tasks/leadTaskFacade', () => mockFacade);

import {
  listLeadTasksForRoute,
  createLeadTaskForRoute,
  updateLeadTaskForRoute,
  deleteLeadTaskForRoute,
} from '@/lib/services/leadTaskRouteService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.leadActivity.create.mockResolvedValue({ id: 'act1' });
});

describe('leadTaskRouteService', () => {
  // ═══════════ LIST ═══════════

  describe('listLeadTasksForRoute', () => {
    it('retorna llista de tasques', async () => {
      const tasks = [{ id: 't1', title: 'Test' }];
      mockFacade.listLeadTasks.mockResolvedValue(tasks);

      const result = await listLeadTasksForRoute('lead1');

      expect(result).toEqual({ ok: true, tasks });
      expect(mockFacade.listLeadTasks).toHaveBeenCalledWith('lead1');
    });

    it('retorna llista buida si no hi ha tasques', async () => {
      mockFacade.listLeadTasks.mockResolvedValue([]);

      const result = await listLeadTasksForRoute('lead1');

      expect(result).toEqual({ ok: true, tasks: [] });
    });
  });

  // ═══════════ CREATE ═══════════

  describe('createLeadTaskForRoute', () => {
    it('crea tasca i registra activitat', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({ customerId: 'cust1' });
      const task = { id: 't1', title: 'Nova tasca', status: 'OPEN', priority: 'MEDIUM' };
      mockFacade.createLeadTask.mockResolvedValue(task);

      const input = { title: 'Nova tasca', createdBy: 'Admin' };
      const result = await createLeadTaskForRoute('lead1', input);

      expect(result).toEqual({ ok: true, task });
      expect(mockFacade.createLeadTask).toHaveBeenCalledWith('lead1', 'cust1', input);
      expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          leadId: 'lead1',
          type: 'TASK',
          title: 'Tasca creada',
          description: 'Nova tasca',
          createdBy: 'Admin',
        }),
      });
    });

    it('usa null si lead no té customerId', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(null);
      mockFacade.createLeadTask.mockResolvedValue({ id: 't2', status: 'OPEN', priority: 'LOW' });

      await createLeadTaskForRoute('lead1', { title: 'Test' });

      expect(mockFacade.createLeadTask).toHaveBeenCalledWith('lead1', null, { title: 'Test' });
    });

    it('usa "Admin" per defecte si no hi ha createdBy', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({ customerId: null });
      mockFacade.createLeadTask.mockResolvedValue({ id: 't3', status: 'OPEN', priority: 'LOW' });

      await createLeadTaskForRoute('lead1', { title: 'Sense autor' });

      expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ createdBy: 'Admin' }),
      });
    });
  });

  // ═══════════ UPDATE ═══════════

  describe('updateLeadTaskForRoute', () => {
    it('actualitza tasca i registra activitat', async () => {
      const task = { id: 't1', title: 'Actualitzada', status: 'DONE', priority: 'HIGH' };
      mockFacade.updateLeadTask.mockResolvedValue(task);

      const result = await updateLeadTaskForRoute('lead1', 't1', { status: 'DONE' });

      expect(result).toEqual({ ok: true, task });
      expect(mockFacade.updateLeadTask).toHaveBeenCalledWith('t1', 'lead1', { status: 'DONE' });
      expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          leadId: 'lead1',
          type: 'TASK',
          title: 'Tasca actualitzada',
          description: 'Actualitzada',
          metadata: { taskId: 't1', status: 'DONE', priority: 'HIGH' },
        }),
      });
    });
  });

  // ═══════════ DELETE ═══════════

  describe('deleteLeadTaskForRoute', () => {
    it('elimina tasca i registra activitat', async () => {
      mockFacade.deleteLeadTask.mockResolvedValue(undefined);

      const result = await deleteLeadTaskForRoute('lead1', 't1');

      expect(result).toEqual({ ok: true });
      expect(mockFacade.deleteLeadTask).toHaveBeenCalledWith('t1', 'lead1');
      expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          leadId: 'lead1',
          type: 'TASK',
          title: 'Tasca eliminada',
          metadata: { taskId: 't1' },
        }),
      });
    });
  });
});
