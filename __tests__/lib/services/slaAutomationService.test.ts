import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockCreateUniversalTask } = vi.hoisted(() => ({
  mockPrisma: {
    lead: {
      count: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    task: { count: vi.fn() },
    leadActivity: { create: vi.fn() },
  },
  mockCreateUniversalTask: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/tasks/taskCreation', () => ({
  createUniversalTask: mockCreateUniversalTask,
}));

import { getSlaSnapshot, enforceLeadSla } from '@/lib/services/slaAutomationService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.lead.count.mockResolvedValue(0);
  mockPrisma.lead.findMany.mockResolvedValue([]);
  mockPrisma.lead.update.mockResolvedValue({});
  mockPrisma.task.count.mockResolvedValue(0);
  mockPrisma.leadActivity.create.mockResolvedValue({});
  mockCreateUniversalTask.mockResolvedValue({});
});

// ─────────────────────────────────────────────────────────────────────────
// getSlaSnapshot
// ─────────────────────────────────────────────────────────────────────────
describe('getSlaSnapshot', () => {
  it('retorna estructura correcta', async () => {
    const result = await getSlaSnapshot();

    expect(result.slaHours).toBe(24);
    expect(result.staleLeads).toBe(0);
    expect(result.openAutoTasks).toBe(0);
  });

  it('retorna comptadors reals', async () => {
    mockPrisma.lead.count.mockResolvedValue(5);
    mockPrisma.task.count.mockResolvedValue(3);

    const result = await getSlaSnapshot();

    expect(result.staleLeads).toBe(5);
    expect(result.openAutoTasks).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// enforceLeadSla
// ─────────────────────────────────────────────────────────────────────────
describe('enforceLeadSla', () => {
  it('retorna resum buit si no hi ha leads obsolets', async () => {
    const result = await enforceLeadSla();

    expect(result.slaHours).toBe(24);
    expect(result.staleLeads).toBe(0);
    expect(result.createdTasks).toBe(0);
    expect(result.escalatedPriority).toBe(0);
    expect(result.affectedLeadIds).toHaveLength(0);
  });

  it('crea tasca per lead sense tasques SLA existents', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      { id: 'lead-1', customerId: 'cust-1', assignedTo: 'admin', priority: 'HIGH', universalTasks: [] },
    ]);

    const result = await enforceLeadSla();

    expect(result.createdTasks).toBe(1);
    expect(result.affectedLeadIds).toContain('lead-1');
    expect(mockCreateUniversalTask).toHaveBeenCalledWith(
      expect.objectContaining({
        leadId: 'lead-1',
        customerId: 'cust-1',
        priority: 'URGENT',
        createdBy: 'SLA Bot',
        assignedTo: 'admin',
      })
    );
  });

  it('ignora leads que ja tenen tasques SLA obertes', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      {
        id: 'lead-1',
        customerId: null,
        assignedTo: null,
        priority: 'MEDIUM',
        universalTasks: [{ id: 'task-1', status: 'OPEN', createdBy: 'SLA Bot' }],
      },
    ]);

    const result = await enforceLeadSla();

    expect(result.createdTasks).toBe(0);
    expect(mockCreateUniversalTask).not.toHaveBeenCalled();
  });

  it('crea activity per cada lead afectat', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      { id: 'lead-1', customerId: null, assignedTo: null, priority: 'HIGH', universalTasks: [] },
    ]);

    await enforceLeadSla();

    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: 'lead-1',
        type: 'TASK',
        createdBy: 'SLA Bot',
      }),
    });
  });

  it('escala prioritat de LOW a HIGH', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      { id: 'lead-1', customerId: null, assignedTo: null, priority: 'LOW', universalTasks: [] },
    ]);

    const result = await enforceLeadSla();

    expect(result.escalatedPriority).toBe(1);
    expect(mockPrisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'lead-1' },
      data: { priority: 'HIGH' },
    });
  });

  it('escala prioritat de MEDIUM a HIGH', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      { id: 'lead-1', customerId: null, assignedTo: null, priority: 'MEDIUM', universalTasks: [] },
    ]);

    const result = await enforceLeadSla();

    expect(result.escalatedPriority).toBe(1);
  });

  it('no escala si ja és HIGH', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      { id: 'lead-1', customerId: null, assignedTo: null, priority: 'HIGH', universalTasks: [] },
    ]);

    const result = await enforceLeadSla();

    expect(result.escalatedPriority).toBe(0);
    expect(mockPrisma.lead.update).not.toHaveBeenCalled();
  });

  it('no escala si ja és URGENT', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      { id: 'lead-1', customerId: null, assignedTo: null, priority: 'URGENT', universalTasks: [] },
    ]);

    const result = await enforceLeadSla();

    expect(result.escalatedPriority).toBe(0);
  });

  it('processa múltiples leads', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      { id: 'lead-1', customerId: null, assignedTo: null, priority: 'LOW', universalTasks: [] },
      { id: 'lead-2', customerId: 'cust-2', assignedTo: 'admin', priority: 'HIGH', universalTasks: [] },
      { id: 'lead-3', customerId: null, assignedTo: null, priority: 'MEDIUM', universalTasks: [{ id: 't1' }] },
    ]);

    const result = await enforceLeadSla();

    expect(result.staleLeads).toBe(3);
    expect(result.createdTasks).toBe(2); // lead-3 skipped (has tasks)
    expect(result.escalatedPriority).toBe(1); // only lead-1 escalated
    expect(result.affectedLeadIds).toEqual(['lead-1', 'lead-2']);
  });
});
