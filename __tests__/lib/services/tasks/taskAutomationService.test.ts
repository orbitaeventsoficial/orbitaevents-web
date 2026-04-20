import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    lead: { findMany: vi.fn() },
    booking: { findMany: vi.fn() },
    customer: { findMany: vi.fn() },
    task: { findMany: vi.fn(), createMany: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { generateAutoTasks, runTaskAutomation, type AutoTaskInput, type AutoTaskEntity } from '@/lib/services/tasks/taskAutomationService';

const NOW = new Date('2026-04-10T10:00:00Z');

function makeInput(overrides: Partial<AutoTaskInput> = {}): AutoTaskInput {
  return {
    slaLeads: [],
    staleLeads: [],
    bookingsToPrep: [],
    overduePayments: [],
    postEventPending: [],
    atRiskClients: [],
    quoteFollowups: [],
    now: NOW,
    ...overrides,
  };
}

function entity(id: string, name: string, extra: Partial<AutoTaskEntity> = {}): AutoTaskEntity {
  return { id, name, ...extra };
}

describe('generateAutoTasks', () => {
  it('retorna buit sense entitats', () => {
    const result = generateAutoTasks(makeInput());
    expect(result).toHaveLength(0);
  });

  it('genera tasca URGENT per SLA broken', () => {
    const result = generateAutoTasks(makeInput({
      slaLeads: [entity('l1', 'Maria García')],
    }));
    expect(result).toHaveLength(1);
    expect(result[0].rule).toBe('SLA_BROKEN');
    expect(result[0].priority).toBe('URGENT');
    expect(result[0].title).toContain('Maria García');
    expect(result[0].leadId).toBe('l1');
    expect(result[0].dedupeKey).toBe('sla:l1');
  });

  it('genera tasca MEDIUM per lead estancat', () => {
    const result = generateAutoTasks(makeInput({
      staleLeads: [entity('l2', 'Joan Martí')],
    }));
    expect(result).toHaveLength(1);
    expect(result[0].rule).toBe('STALE_LEAD');
    expect(result[0].priority).toBe('MEDIUM');
    expect(result[0].leadId).toBe('l2');
  });

  it('genera tasca HIGH per preparar booking', () => {
    const result = generateAutoTasks(makeInput({
      bookingsToPrep: [entity('b1', 'Casament Serra', { customerId: 'c1' })],
    }));
    expect(result).toHaveLength(1);
    expect(result[0].rule).toBe('BOOKING_PREP');
    expect(result[0].priority).toBe('HIGH');
    expect(result[0].bookingId).toBe('b1');
    expect(result[0].customerId).toBe('c1');
  });

  it('genera tasca HIGH per pagament vençut', () => {
    const result = generateAutoTasks(makeInput({
      overduePayments: [entity('b2', 'Comunió Vila', { customerId: 'c2' })],
    }));
    expect(result).toHaveLength(1);
    expect(result[0].rule).toBe('PAYMENT_OVERDUE');
    expect(result[0].priority).toBe('HIGH');
    expect(result[0].bookingId).toBe('b2');
  });

  it('genera tasca MEDIUM per post-event', () => {
    const result = generateAutoTasks(makeInput({
      postEventPending: [entity('b3', 'Festa Corp', { customerId: 'c3' })],
    }));
    expect(result).toHaveLength(1);
    expect(result[0].rule).toBe('POST_EVENT');
    expect(result[0].priority).toBe('MEDIUM');
  });

  it('genera tasca MEDIUM per client en risc', () => {
    const result = generateAutoTasks(makeInput({
      atRiskClients: [entity('c4', 'Empresa XYZ')],
    }));
    expect(result).toHaveLength(1);
    expect(result[0].rule).toBe('AT_RISK_CLIENT');
    expect(result[0].customerId).toBe('c4');
  });

  it('genera tasca HIGH per seguiment pressupost', () => {
    const result = generateAutoTasks(makeInput({
      quoteFollowups: [entity('l3', 'Anna Puig')],
    }));
    expect(result).toHaveLength(1);
    expect(result[0].rule).toBe('QUOTE_FOLLOWUP');
    expect(result[0].priority).toBe('HIGH');
    expect(result[0].leadId).toBe('l3');
  });

  it('genera múltiples tasques de fonts diferents', () => {
    const result = generateAutoTasks(makeInput({
      slaLeads: [entity('l1', 'A')],
      staleLeads: [entity('l2', 'B')],
      bookingsToPrep: [entity('b1', 'C')],
      overduePayments: [entity('b2', 'D')],
      postEventPending: [entity('b3', 'E')],
      atRiskClients: [entity('c1', 'F')],
      quoteFollowups: [entity('l3', 'G')],
    }));
    expect(result).toHaveLength(7);
    const rules = result.map((p) => p.rule);
    expect(rules).toContain('SLA_BROKEN');
    expect(rules).toContain('STALE_LEAD');
    expect(rules).toContain('BOOKING_PREP');
    expect(rules).toContain('PAYMENT_OVERDUE');
    expect(rules).toContain('POST_EVENT');
    expect(rules).toContain('AT_RISK_CLIENT');
    expect(rules).toContain('QUOTE_FOLLOWUP');
  });

  it('genera una tasca per cada entitat', () => {
    const result = generateAutoTasks(makeInput({
      slaLeads: [entity('l1', 'A'), entity('l2', 'B'), entity('l3', 'C')],
    }));
    expect(result).toHaveLength(3);
    expect(result.map((p) => p.dedupeKey)).toEqual(['sla:l1', 'sla:l2', 'sla:l3']);
  });

  it('dedupeKey és únic per regla i entitat', () => {
    const result = generateAutoTasks(makeInput({
      slaLeads: [entity('x1', 'Lead')],
      staleLeads: [entity('x1', 'Lead')],
    }));
    expect(result).toHaveLength(2);
    expect(result[0].dedupeKey).toBe('sla:x1');
    expect(result[1].dedupeKey).toBe('stale:x1');
  });

  it('SLA due date és avui', () => {
    const result = generateAutoTasks(makeInput({
      slaLeads: [entity('l1', 'A')],
    }));
    const dueDate = result[0].dueDate;
    expect(dueDate.getFullYear()).toBe(2026);
    expect(dueDate.getMonth()).toBe(3); // April
    expect(dueDate.getDate()).toBe(10);
  });

  it('stale lead due date és demà', () => {
    const result = generateAutoTasks(makeInput({
      staleLeads: [entity('l1', 'A')],
    }));
    const dueDate = result[0].dueDate;
    expect(dueDate.getDate()).toBe(11);
  });

  it('entityName preservat correctament', () => {
    const result = generateAutoTasks(makeInput({
      bookingsToPrep: [entity('b1', 'Casament Premium')],
    }));
    expect(result[0].entityName).toBe('Casament Premium');
  });
});

describe('runTaskAutomation - persistència canònica', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.lead.findMany.mockResolvedValue([]);
    mockPrisma.booking.findMany.mockResolvedValue([]);
    mockPrisma.customer.findMany.mockResolvedValue([]);
    mockPrisma.task.findMany.mockResolvedValue([]);
    mockPrisma.task.createMany.mockResolvedValue({ count: 0 });
  });

  it('escriu source/autoRule/dedupeKey a columnes reals, no dins description', async () => {
    mockPrisma.lead.findMany
      .mockResolvedValueOnce([{ id: 'l1', name: 'Maria' }]) // slaLeads
      .mockResolvedValue([]);

    const result = await runTaskAutomation(new Date('2026-04-10T10:00:00Z'));

    expect(result.created).toBe(1);
    expect(mockPrisma.task.createMany).toHaveBeenCalledTimes(1);
    const call = mockPrisma.task.createMany.mock.calls[0][0];
    expect(call.data).toHaveLength(1);
    expect(call.data[0]).toMatchObject({
      source: 'AUTOMATION',
      autoRule: 'SLA_BROKEN',
      dedupeKey: 'sla:l1',
      createdBy: 'system:auto',
    });
    expect(call.data[0].description).not.toContain('[dedupeKey:');
    expect(call.skipDuplicates).toBe(true);
  });

  it('dedup canònic per columna dedupeKey (no regex a description)', async () => {
    mockPrisma.lead.findMany
      .mockResolvedValueOnce([{ id: 'l1', name: 'Maria' }]) // slaLeads
      .mockResolvedValue([]);
    mockPrisma.task.findMany.mockResolvedValue([{ dedupeKey: 'sla:l1' }]);

    const result = await runTaskAutomation(new Date('2026-04-10T10:00:00Z'));

    expect(result.proposed).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.created).toBe(0);
    expect(mockPrisma.task.createMany).not.toHaveBeenCalled();

    const findArgs = mockPrisma.task.findMany.mock.calls[0][0];
    expect(findArgs.where.source).toBe('AUTOMATION');
    expect(findArgs.where.dedupeKey).toEqual({ in: ['sla:l1'] });
    expect(findArgs.select).toEqual({ dedupeKey: true });
  });
});
