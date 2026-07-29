import { describe, it, expect } from 'vitest';

import {
  assembleNextBestActions,
  buildNBAReport,
  type NBAAssemblyInput,
  type NBALeadInput,
  type NBACustomerInput,
  type NBATaskInput,
  type NextBestAction,
} from '@/lib/services/nextBestActionService';
import type { FollowUpSummary, PendingFollowUp } from '@/lib/services/responseTrackingService';
import type { CapacityConflictReport } from '@/lib/services/capacityConflictService';
import type { PipelineSuggestion } from '@/lib/services/leadPipelineSuggestionsService';

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date('2026-06-15T10:00:00Z');
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000);

const emptyFollowUps: FollowUpSummary = { generatedAt: '', total: 0, urgent: 0, normal: 0, low: 0, items: [] };
const emptyCapacity: CapacityConflictReport = { generatedAt: '', windowDays: 14, conflicts: [], verdict: '' };

function makeInput(overrides: Partial<NBAAssemblyInput> = {}): NBAAssemblyInput {
  return {
    leads: [],
    customers: [],
    tasks: [],
    followUps: emptyFollowUps,
    capacity: emptyCapacity,
    pipelineSuggestions: [],
    now,
    ...overrides,
  };
}

function makeLead(overrides: Partial<NBALeadInput> = {}): NBALeadInput {
  return {
    id: 'l1',
    name: 'Maria',
    status: 'NEW',
    priority: 'NORMAL',
    createdAt: hoursAgo(2),
    contactedAt: null,
    updatedAt: hoursAgo(2),
    eventDate: null,
    eventType: 'WEDDING',
    budget: null,
    phone: '600111222',
    hasBooking: false,
    lastActivityAt: null,
    overdueTasks: 0,
    ...overrides,
  };
}

function makeCustomer(overrides: Partial<NBACustomerInput> = {}): NBACustomerInput {
  return {
    id: 'c1',
    name: 'Jordi',
    lifecycleStage: 'ACTIVE',
    healthScore: 80,
    lastContactedAt: daysAgo(5),
    pendingPayment: 0,
    openTasks: 0,
    totalSpent: 500,
    ...overrides,
  };
}

function makeTask(overrides: Partial<NBATaskInput> = {}): NBATaskInput {
  return {
    id: 't1',
    title: 'Preparar equip',
    status: 'TODO',
    priority: 'NORMAL',
    dueDate: daysAgo(1),
    leadId: null,
    customerId: null,
    bookingId: null,
    entityName: null,
    ...overrides,
  };
}

function makeFollowUp(overrides: Partial<PendingFollowUp> = {}): PendingFollowUp {
  const base: PendingFollowUp = {
    leadId: 'l10',
    customerId: null,
    name: 'Follow-up Lead',
    email: 'fu@test.com',
    phone: '600222333',
    eventType: 'CORPORATE',
    status: 'CONTACTED',
    preferredLocale: 'ca',
    contactedAt: daysAgo(10),
    lastOutboundAt: daysAgo(6),
    daysSinceOutbound: 6,
    outboundCount: 2,
    hasInboundAfterOutbound: false,
    urgency: 'URGENT',
    suggestedAction: 'Trucar',
  };
  return { ...base, ...overrides, customerId: overrides.customerId ?? null };
}

// ── Lead Actions ──────────────────────────────────────────────────────────

describe('assembleNextBestActions — leads', () => {
  it('genera CONTACT_NOW per lead nou sense contactar', () => {
    const actions = assembleNextBestActions(makeInput({
      leads: [makeLead({ status: 'NEW', contactedAt: null, createdAt: hoursAgo(2) })],
    }));

    expect(actions.length).toBeGreaterThanOrEqual(1);
    expect(actions[0].actionType).toBe('CONTACT_NOW');
    expect(actions[0].urgency).toBe('HIGH'); // <4h = HIGH
  });

  it('marca CRITICAL si lead NEW >4h sense contactar', () => {
    const actions = assembleNextBestActions(makeInput({
      leads: [makeLead({ status: 'NEW', contactedAt: null, createdAt: hoursAgo(6) })],
    }));

    expect(actions[0].urgency).toBe('CRITICAL');
  });

  it('genera FOLLOW_QUOTE per QUOTE_SENT stale', () => {
    const actions = assembleNextBestActions(makeInput({
      leads: [makeLead({
        id: 'l2', status: 'QUOTE_SENT',
        contactedAt: daysAgo(10),
        lastActivityAt: daysAgo(5),
      })],
    }));

    const quote = actions.find((a) => a.actionType === 'FOLLOW_UP');
    expect(quote).toBeDefined();
    expect(quote!.subtitle).toContain('5 dies sense resposta');
  });

  it('genera CLOSE_DEAL per event proper sense reserva', () => {
    const actions = assembleNextBestActions(makeInput({
      leads: [makeLead({
        id: 'l3', status: 'CONTACTED',
        contactedAt: daysAgo(10),
        eventDate: daysFromNow(5),
        hasBooking: false,
      })],
    }));

    const close = actions.find((a) => a.actionType === 'CLOSE_DEAL');
    expect(close).toBeDefined();
    expect(close!.urgency).toBe('CRITICAL'); // <=7d
  });

  it('genera STALE_NEGOTIATION per negociació freda', () => {
    const actions = assembleNextBestActions(makeInput({
      leads: [makeLead({
        id: 'l4', status: 'NEGOTIATING',
        contactedAt: daysAgo(15),
        lastActivityAt: daysAgo(8),
      })],
    }));

    const stale = actions.find((a) => a.domain === 'lead');
    expect(stale).toBeDefined();
    expect(stale!.subtitle).toContain('dies sense moviment');
  });

  it('genera OVERDUE_TASK per lead amb tasques vençudes', () => {
    const actions = assembleNextBestActions(makeInput({
      leads: [makeLead({
        id: 'l5', status: 'CONTACTED',
        contactedAt: daysAgo(3),
        overdueTasks: 2,
      })],
    }));

    const overdue = actions.find((a) => a.actionType === 'COMPLETE_TASK' && a.domain === 'lead');
    expect(overdue).toBeDefined();
    expect(overdue!.title).toContain('2 tasques vençudes');
  });

  it('ignora leads WON amb reserva, LOST i DISQUALIFIED', () => {
    const actions = assembleNextBestActions(makeInput({
      leads: [
        makeLead({ id: 'won', status: 'WON', hasBooking: true }),
        makeLead({ id: 'lost', status: 'LOST' }),
        makeLead({ id: 'disq', status: 'DISQUALIFIED' }),
      ],
    }));

    expect(actions).toHaveLength(0);
  });

  it('avisa de lead GUANYAT SENSE reserva (forat negre: bolo tancat no materialitzat)', () => {
    const actions = assembleNextBestActions(makeInput({
      leads: [makeLead({ id: 'won-nobooking', name: 'Cristina', status: 'WON', hasBooking: false })],
    }));

    expect(actions).toHaveLength(1);
    expect(actions[0].actionType).toBe('CLOSE_DEAL');
    expect(actions[0].title).toContain('Crear reserva');
    expect(actions[0].title).toContain('Cristina');
  });

  it('lead guanyat amb event proper sense reserva → CRITICAL', () => {
    // 'now' del test és 2026-06-15; event 5 dies després = dins el llindar (<=14)
    const actions = assembleNextBestActions(makeInput({
      leads: [makeLead({ id: 'won-soon', status: 'WON', hasBooking: false, eventDate: new Date('2026-06-20T10:00:00Z') })],
    }));

    const wonAction = actions.find((a) => a.title.includes('Crear reserva'));
    expect(wonAction?.urgency).toBe('CRITICAL');
  });

  // Regressió: `estimateBudget` ha d'interpretar format europeu ("1.500,50"),
  // no només format americà ("1500.50"). Abans, "1.500" es parsejava com 1.5
  // i leads d'alt valor eren tractats com a normals al cockpit NBA.
  it('budget format europeu "1.500" → isHighValue (estimatedImpact HIGH)', () => {
    const actions = assembleNextBestActions(makeInput({
      leads: [makeLead({
        id: 'eu-1500', status: 'NEW', contactedAt: null,
        createdAt: hoursAgo(2), budget: '1.500',
      })],
    }));
    const contact = actions.find((a) => a.actionType === 'CONTACT_NOW');
    expect(contact).toBeDefined();
    expect(contact!.estimatedImpact).toBe('HIGH');
  });

  it('budget format europeu "1.500,50 €" → isHighValue (estimatedImpact HIGH)', () => {
    const actions = assembleNextBestActions(makeInput({
      leads: [makeLead({
        id: 'eu-decimal', status: 'NEW', contactedAt: null,
        createdAt: hoursAgo(2), budget: '1.500,50 €',
      })],
    }));
    const contact = actions.find((a) => a.actionType === 'CONTACT_NOW');
    expect(contact).toBeDefined();
    expect(contact!.estimatedImpact).toBe('HIGH');
  });

  it('budget baix ("300") → NO isHighValue (estimatedImpact MEDIUM)', () => {
    const actions = assembleNextBestActions(makeInput({
      leads: [makeLead({
        id: 'low', status: 'NEW', contactedAt: null,
        createdAt: hoursAgo(2), budget: '300', priority: 'NORMAL',
      })],
    }));
    const contact = actions.find((a) => a.actionType === 'CONTACT_NOW');
    expect(contact).toBeDefined();
    expect(contact!.estimatedImpact).toBe('MEDIUM');
  });
});

// ── Customer Actions ──────────────────────────────────────────────────────

describe('assembleNextBestActions — customers', () => {
  it('genera COLLECT_PAYMENT per pagament pendent', () => {
    const actions = assembleNextBestActions(makeInput({
      customers: [makeCustomer({ pendingPayment: 800 })],
    }));

    const pay = actions.find((a) => a.actionType === 'COLLECT_PAYMENT');
    expect(pay).toBeDefined();
    expect(pay!.urgency).toBe('HIGH'); // >500
  });

  it('genera AT_RISK per health score baix', () => {
    const actions = assembleNextBestActions(makeInput({
      customers: [makeCustomer({ healthScore: 20 })],
    }));

    const risk = actions.find((a) => a.actionType === 'REACTIVATE');
    expect(risk).toBeDefined();
    expect(risk!.urgency).toBe('HIGH');
  });

  it('genera RECONTACT per client sense contacte >30d', () => {
    const actions = assembleNextBestActions(makeInput({
      customers: [makeCustomer({ lastContactedAt: daysAgo(45) })],
    }));

    const recontact = actions.find((a) => a.actionType === 'FOLLOW_UP' && a.domain === 'customer');
    expect(recontact).toBeDefined();
    expect(recontact!.subtitle).toContain('45 dies sense comunicació');
  });

  it('ignora CHURNED per RECONTACT', () => {
    const actions = assembleNextBestActions(makeInput({
      customers: [makeCustomer({ lastContactedAt: daysAgo(45), lifecycleStage: 'CHURNED' })],
    }));

    const recontact = actions.find((a) => a.actionType === 'FOLLOW_UP' && a.domain === 'customer');
    expect(recontact).toBeUndefined();
  });
});

// ── Task Actions ──────────────────────────────────────────────────────────

describe('assembleNextBestActions — tasks', () => {
  it('genera acció per tasca vençuda', () => {
    const actions = assembleNextBestActions(makeInput({
      tasks: [makeTask({ dueDate: daysAgo(2) })],
    }));

    const t = actions.find((a) => a.domain === 'task');
    expect(t).toBeDefined();
    expect(t!.urgency).toBe('HIGH');
    expect(t!.subtitle).toContain('2 dies');
  });

  it('marca CRITICAL si vençuda >3d', () => {
    const actions = assembleNextBestActions(makeInput({
      tasks: [makeTask({ dueDate: daysAgo(5) })],
    }));

    expect(actions[0].urgency).toBe('CRITICAL');
  });

  it('ignora tasques DONE o CANCELLED', () => {
    const actions = assembleNextBestActions(makeInput({
      tasks: [
        makeTask({ id: 't1', status: 'DONE' }),
        makeTask({ id: 't2', status: 'CANCELLED' }),
      ],
    }));

    expect(actions.filter((a) => a.domain === 'task')).toHaveLength(0);
  });

  it('genera href a booking si la tasca te bookingId', () => {
    const actions = assembleNextBestActions(makeInput({
      tasks: [makeTask({ bookingId: 'b1', dueDate: daysAgo(1) })],
    }));

    expect(actions[0].href).toBe('/admin/bookings/b1');
  });
});

// ── Follow-up Actions ─────────────────────────────────────────────────────

describe('assembleNextBestActions — follow-ups', () => {
  it('genera URGENT_FOLLOWUP per items urgents', () => {
    const followUps: FollowUpSummary = {
      generatedAt: now.toISOString(),
      total: 2, urgent: 1, normal: 1, low: 0,
      items: [
        makeFollowUp({ leadId: 'l10', customerId: 'cust-10', urgency: 'URGENT' }),
        makeFollowUp({ leadId: 'l11', urgency: 'NORMAL', daysSinceOutbound: 3 }),
      ],
    };

    const actions = assembleNextBestActions(makeInput({ followUps }));

    const urgent = actions.find((a) => a.actionType === 'FOLLOW_UP' && a.urgency === 'CRITICAL');
    expect(urgent).toBeDefined();
    expect(urgent!.title).toContain('Follow-up Lead');
    expect(urgent!.href).toBe('/admin/clientes/cust-10?tab=comms');
    expect(urgent!.entity).toEqual({ type: 'customer', id: 'cust-10', name: 'Follow-up Lead' });
  });

  it('genera NORMAL_FOLLOWUP per items normals', () => {
    const followUps: FollowUpSummary = {
      generatedAt: now.toISOString(),
      total: 1, urgent: 0, normal: 1, low: 0,
      items: [
        makeFollowUp({ leadId: 'l12', urgency: 'NORMAL', daysSinceOutbound: 3, name: 'Pere' }),
      ],
    };

    const actions = assembleNextBestActions(makeInput({ followUps }));

    const normal = actions.find((a) => a.domain === 'communication' && a.urgency === 'MEDIUM');
    expect(normal).toBeDefined();
    expect(normal!.title).toContain('Pere');
    expect(normal!.href).toBe('/admin/leads/l12');
  });
});

// ── Capacity Actions ──────────────────────────────────────────────────────

describe('assembleNextBestActions — capacity', () => {
  it('genera RESOLVE_CONFLICT per conflictes d\'inventari', () => {
    const capacity: CapacityConflictReport = {
      generatedAt: now.toISOString(),
      windowDays: 14,
      verdict: '1 conflicte',
      conflicts: [{
        date: '2026-06-20',
        itemId: 'eq1',
        itemName: 'Equip so',
        itemCode: 'EQ-001',
        stockAvailable: 1,
        totalDemanded: 4,
        deficit: 3,
        bookings: [{ bookingId: 'b1', clientName: 'Client', quantity: 4 }],
      }],
    };

    const actions = assembleNextBestActions(makeInput({ capacity }));

    const conflict = actions.find((a) => a.actionType === 'RESOLVE_CONFLICT');
    expect(conflict).toBeDefined();
    expect(conflict!.urgency).toBe('CRITICAL'); // deficit > 2
    expect(conflict!.title).toContain('Equip so');
  });
});

// ── Pipeline Suggestions ──────────────────────────────────────────────────

describe('assembleNextBestActions — pipeline', () => {
  it('genera accions per suggeriments CRITICAL/HIGH', () => {
    const suggestions: PipelineSuggestion[] = [
      {
        type: 'HOT_UNCONTACTED', title: '3 leads calents', detail: 'Sense contactar',
        priority: 'CRITICAL', icon: '🔥', count: 3, leadIds: ['l1', 'l2', 'l3'],
        href: '/admin/leads',
      },
      {
        type: 'QUOTE_NO_REPLY', title: '2 pressupostos', detail: 'Sense resposta',
        priority: 'INFO', icon: '📋', count: 2, leadIds: ['l4', 'l5'],
        href: '/admin/leads',
      },
    ];

    const actions = assembleNextBestActions(makeInput({ pipelineSuggestions: suggestions }));

    // Only CRITICAL/HIGH pass
    const pipeline = actions.filter((a) => a.actionType === 'HOT_UNCONTACTED');
    expect(pipeline).toHaveLength(1);
    expect(pipeline[0].urgency).toBe('CRITICAL');

    const low = actions.filter((a) => a.actionType === 'QUOTE_NO_REPLY');
    expect(low).toHaveLength(0);
  });
});

// ── Scoring & Ranking ─────────────────────────────────────────────────────

describe('assembleNextBestActions — scoring', () => {
  it('ordena per score descendent i assigna ranks', () => {
    const actions = assembleNextBestActions(makeInput({
      leads: [
        // CRITICAL (new >4h) = urgency 100 + impact MEDIUM 20 + time "Ara" 20 = 140
        makeLead({ id: 'l-critical', status: 'NEW', contactedAt: null, createdAt: hoursAgo(6) }),
      ],
      customers: [
        // Payment MEDIUM = 50 + 20 + 5 = 75
        makeCustomer({ id: 'c-payment', pendingPayment: 200 }),
      ],
    }));

    expect(actions[0].rank).toBe(1);
    expect(actions[0].domain).toBe('lead'); // higher score
    expect(actions.every((a, i) => a.rank === i + 1)).toBe(true);
  });

  it('deduplicates per entity+domain', () => {
    // Same lead with overdue tasks AND is NEW — only one per entity+domain
    const actions = assembleNextBestActions(makeInput({
      leads: [
        makeLead({ id: 'l-dup', status: 'CONTACTED', contactedAt: daysAgo(3), overdueTasks: 1 }),
        makeLead({ id: 'l-dup', status: 'CONTACTED', contactedAt: daysAgo(3), overdueTasks: 2 }),
      ],
    }));

    const leadActions = actions.filter((a) => a.entity.id === 'l-dup' && a.domain === 'lead');
    expect(leadActions).toHaveLength(1);
  });
});

// ── buildNBAReport ────────────────────────────────────────────────────────

describe('buildNBAReport', () => {
  it('compta urgencies correctament', () => {
    const actions: NextBestAction[] = [
      { rank: 1, id: 'a1', domain: 'lead', actionType: 'X', urgency: 'CRITICAL', icon: '', title: '', subtitle: '', href: '', score: 100, entity: { type: 'lead', id: '1', name: '' }, reasoning: '', estimatedImpact: 'HIGH', timeWindow: 'Ara' },
      { rank: 2, id: 'a2', domain: 'lead', actionType: 'X', urgency: 'CRITICAL', icon: '', title: '', subtitle: '', href: '', score: 90, entity: { type: 'lead', id: '2', name: '' }, reasoning: '', estimatedImpact: 'HIGH', timeWindow: 'Ara' },
      { rank: 3, id: 'a3', domain: 'task', actionType: 'X', urgency: 'HIGH', icon: '', title: '', subtitle: '', href: '', score: 80, entity: { type: 'task', id: '3', name: '' }, reasoning: '', estimatedImpact: 'MEDIUM', timeWindow: 'Avui' },
      { rank: 4, id: 'a4', domain: 'customer', actionType: 'X', urgency: 'MEDIUM', icon: '', title: '', subtitle: '', href: '', score: 50, entity: { type: 'customer', id: '4', name: '' }, reasoning: '', estimatedImpact: 'LOW', timeWindow: '48h' },
    ];

    const report = buildNBAReport(actions, now);

    expect(report.totalActions).toBe(4);
    expect(report.byCritical).toBe(2);
    expect(report.byHigh).toBe(1);
    expect(report.byMedium).toBe(1);
    expect(report.byLow).toBe(0);
    expect(report.generatedAt).toBe(now.toISOString());
  });

  it('retorna report buit sense accions', () => {
    const report = buildNBAReport([], now);

    expect(report.totalActions).toBe(0);
    expect(report.actions).toHaveLength(0);
  });
});

// ── Empty input ───────────────────────────────────────────────────────────

describe('assembleNextBestActions — empty', () => {
  it('retorna llista buida si no hi ha dades', () => {
    const actions = assembleNextBestActions(makeInput());
    expect(actions).toHaveLength(0);
  });
});
