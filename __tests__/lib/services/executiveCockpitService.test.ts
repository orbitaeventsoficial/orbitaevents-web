import { describe, it, expect } from 'vitest';
import {
  assemblePriorityActions,
  assembleHealthSignals,
  computeGlobalHealthScore,
  assembleCockpit,
  type CockpitAssemblyInput,
  type CockpitHealthSignal,
} from '@/lib/services/executiveCockpitService';
import type { DailyBrief } from '@/lib/services/dailyBriefService';
import type { OperationalPulse } from '@/lib/services/operationalPulseService';
import type { FollowUpSummary } from '@/lib/services/responseTrackingService';
import type { CapacityConflictReport } from '@/lib/services/capacityConflictService';
import type { AnomalyReport } from '@/lib/services/dailyAnomalyService';

// ── Fixtures ───────────────────────────────────────────────────────────────

const now = new Date('2026-06-15T10:00:00Z');

const emptyBrief: DailyBrief = {
  date: '2026-06-15', greeting: 'Bon dia', summary: 'Resum',
  kpis: { newLeadsToday: 2, openLeads: 10, overdueTasksCount: 1, upcomingBookings7d: 3, pendingPaymentsCount: 2, forecastWeighted: 5000 },
  alerts: [], actions: [], topCampaigns: [],
};

const briefWithAlerts: DailyBrief = {
  ...emptyBrief,
  alerts: [
    { level: 'CRITICAL', icon: '🔥', title: 'Leads sense contactar', detail: '3 leads nous >24h', href: '/admin/leads' },
    { level: 'WARNING', icon: '⏱️', title: 'SLA en risc', detail: '2 leads prop del límit', href: '/admin/sales-ops' },
  ],
};

const okPulse: OperationalPulse = {
  overallLevel: 'GOOD', overallScore: 72, generatedAt: now.toISOString(),
  pipelineDrivers: [],
  metrics: [
    { key: 'response', label: 'Temps resposta', value: 4, unit: 'h', level: 'GOOD', target: '<6h' },
    { key: 'followUp', label: 'Seguiment', value: 80, unit: '%', level: 'GOOD', target: '>70%' },
  ],
};

const criticalPulse: OperationalPulse = {
  overallLevel: 'CRITICAL', overallScore: 30, generatedAt: now.toISOString(),
  pipelineDrivers: [],
  metrics: [
    { key: 'response', label: 'Temps resposta', value: 20, unit: 'h', level: 'CRITICAL', target: '<6h' },
    { key: 'followUp', label: 'Seguiment', value: 30, unit: '%', level: 'WARNING', target: '>70%' },
  ],
};

const emptyFollowUps: FollowUpSummary = { generatedAt: now.toISOString(), total: 0, urgent: 0, normal: 0, low: 0, items: [] };

const urgentFollowUps: FollowUpSummary = {
  generatedAt: now.toISOString(), total: 5, urgent: 2, normal: 2, low: 1,
  items: [
    { leadId: 'l1', customerId: null, name: 'Anna', email: 'a@t.com', phone: '600', eventType: 'WEDDING', status: 'CONTACTED', preferredLocale: 'ca', contactedAt: new Date(), lastOutboundAt: new Date(), daysSinceOutbound: 7, outboundCount: 3, hasInboundAfterOutbound: false, urgency: 'URGENT', suggestedAction: 'Trucar' },
    { leadId: 'l2', customerId: null, name: 'Jordi', email: 'j@t.com', phone: '601', eventType: 'CORPORATE', status: 'QUOTE_SENT', preferredLocale: 'ca', contactedAt: new Date(), lastOutboundAt: new Date(), daysSinceOutbound: 6, outboundCount: 2, hasInboundAfterOutbound: false, urgency: 'URGENT', suggestedAction: 'WhatsApp' },
    { leadId: 'l3', customerId: null, name: 'Maria', email: 'm@t.com', phone: '602', eventType: 'OTHER', status: 'CONTACTED', preferredLocale: 'ca', contactedAt: new Date(), lastOutboundAt: new Date(), daysSinceOutbound: 3, outboundCount: 1, hasInboundAfterOutbound: false, urgency: 'NORMAL', suggestedAction: 'Email' },
    { leadId: 'l4', customerId: null, name: 'Pere', email: 'p@t.com', phone: '603', eventType: 'WEDDING', status: 'CONTACTED', preferredLocale: 'ca', contactedAt: new Date(), lastOutboundAt: new Date(), daysSinceOutbound: 2, outboundCount: 1, hasInboundAfterOutbound: false, urgency: 'NORMAL', suggestedAction: 'Esperar' },
    { leadId: 'l5', customerId: null, name: 'Laia', email: 'l@t.com', phone: '604', eventType: 'WEDDING', status: 'CONTACTED', preferredLocale: 'ca', contactedAt: new Date(), lastOutboundAt: new Date(), daysSinceOutbound: 1, outboundCount: 1, hasInboundAfterOutbound: false, urgency: 'LOW', suggestedAction: 'Esperar' },
  ],
};

const emptyCapacity: CapacityConflictReport = { generatedAt: now.toISOString(), windowDays: 14, conflicts: [], verdict: '' };

const conflictCapacity: CapacityConflictReport = {
  generatedAt: now.toISOString(), windowDays: 14, verdict: '2 conflictes detectats',
  conflicts: [
    { date: '2026-06-20', itemId: 'eq1', itemName: 'Equip so', itemCode: 'EQ-001', stockAvailable: 2, totalDemanded: 4, deficit: 2, bookings: [{ bookingId: 'b1', clientName: 'Client A', quantity: 4 }] },
  ],
};

const emptyAnomalies: AnomalyReport = { generatedAt: now.toISOString(), windowDays: 30, anomalies: [], verdict: 'Tot normal' };

const negativeAnomalies: AnomalyReport = {
  generatedAt: now.toISOString(), windowDays: 30, verdict: 'Desviacions detectades',
  anomalies: [
    { metric: 'leads', label: 'Leads nous', level: 'NEGATIVE', icon: '📉', current: 1, avg30d: 5, deviation: -80, message: 'Caiguda del 80% en leads nous' },
  ],
};

function makeInput(overrides: Partial<CockpitAssemblyInput> = {}): CockpitAssemblyInput {
  return {
    brief: emptyBrief,
    pulse: okPulse,
    followUps: emptyFollowUps,
    capacity: emptyCapacity,
    pipelineSuggestions: [],
    anomalies: emptyAnomalies,
    now,
    ...overrides,
  };
}

// ── assemblePriorityActions ────────────────────────────────────────────────

describe('assemblePriorityActions', () => {
  it('retorna buit quan no hi ha alertes ni problemes', () => {
    const actions = assemblePriorityActions(makeInput());
    expect(actions).toHaveLength(0);
  });

  it('inclou alertes del brief amb urgència correcta', () => {
    const actions = assemblePriorityActions(makeInput({ brief: briefWithAlerts }));
    expect(actions.length).toBeGreaterThanOrEqual(2);
    expect(actions[0].urgency).toBe('CRITICAL');
    expect(actions[0].source).toBe('brief');
  });

  it('inclou follow-ups urgents', () => {
    const actions = assemblePriorityActions(makeInput({
      followUps: {
        ...urgentFollowUps,
        items: [
          { ...urgentFollowUps.items[0], customerId: 'cust-1' },
          ...urgentFollowUps.items.slice(1),
        ],
      },
    }));
    const fuActions = actions.filter((a) => a.source === 'followUps');
    expect(fuActions).toHaveLength(2);
    expect(fuActions[0].urgency).toBe('CRITICAL');
    expect(fuActions[0].label).toContain('Anna');
    expect(fuActions[0].href).toBe('/admin/clientes/cust-1?tab=comms');
  });

  it('inclou conflictes de capacitat', () => {
    const actions = assemblePriorityActions(makeInput({ capacity: conflictCapacity }));
    const capActions = actions.filter((a) => a.source === 'capacity');
    expect(capActions).toHaveLength(1);
    expect(capActions[0].urgency).toBe('HIGH');
  });

  it('inclou pipeline suggestions CRITICAL/HIGH', () => {
    const suggestions = [
      { type: 'HOT_UNCONTACTED' as const, priority: 'CRITICAL' as const, icon: '🔥', title: 'Hot leads', detail: '3 sense contactar', href: '/admin/leads', leadIds: ['l1'], count: 3 },
      { type: 'STALE_NEGOTIATION' as const, priority: 'MEDIUM' as const, icon: '💤', title: 'Negociació freda', detail: '2 leads', href: '/admin/leads', leadIds: ['l2'], count: 2 },
    ];
    const actions = assemblePriorityActions(makeInput({ pipelineSuggestions: suggestions }));
    const pipActions = actions.filter((a) => a.source === 'pipeline');
    expect(pipActions).toHaveLength(1); // Only CRITICAL, not MEDIUM
    expect(pipActions[0].label).toBe('Hot leads');
  });

  it('inclou anomalies negatives', () => {
    const actions = assemblePriorityActions(makeInput({ anomalies: negativeAnomalies }));
    const anomActions = actions.filter((a) => a.source === 'anomalies');
    expect(anomActions).toHaveLength(1);
    expect(anomActions[0].urgency).toBe('MEDIUM');
  });

  it('ordena per urgència (CRITICAL primer) i numera ranks', () => {
    const actions = assemblePriorityActions(makeInput({
      brief: briefWithAlerts,
      followUps: urgentFollowUps,
      capacity: conflictCapacity,
    }));
    expect(actions[0].urgency).toBe('CRITICAL');
    expect(actions[0].rank).toBe(1);
    for (let i = 1; i < actions.length; i++) {
      expect(actions[i].rank).toBe(i + 1);
      const prev = actions[i - 1].urgency;
      const curr = actions[i].urgency;
      expect(
        (URGENCY_RANK_MAP[prev] ?? 9) <= (URGENCY_RANK_MAP[curr] ?? 9)
      ).toBe(true);
    }
  });
});

const URGENCY_RANK_MAP: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

// ── assembleHealthSignals ──────────────────────────────────────────────────

describe('assembleHealthSignals', () => {
  it('genera 5 senyals de salut', () => {
    const signals = assembleHealthSignals(makeInput());
    expect(signals).toHaveLength(5);
    expect(signals.map((s) => s.area)).toEqual([
      'Operativa', 'Seguiment comercial', 'Capacitat operativa', 'Pipeline comercial', 'Anomalies KPI',
    ]);
  });

  it('seguiment warning amb follow-ups urgents', () => {
    const signals = assembleHealthSignals(makeInput({ followUps: urgentFollowUps }));
    const fu = signals.find((s) => s.area === 'Seguiment comercial');
    expect(fu!.level).toBe('WARNING');
  });

  it('capacitat warning amb conflictes', () => {
    const signals = assembleHealthSignals(makeInput({ capacity: conflictCapacity }));
    const cap = signals.find((s) => s.area === 'Capacitat operativa');
    expect(cap!.level).toBe('WARNING');
  });

  it('operativa reflecteix el pulse level', () => {
    const signals = assembleHealthSignals(makeInput({ pulse: criticalPulse }));
    const op = signals.find((s) => s.area === 'Operativa');
    expect(op!.level).toBe('CRITICAL');
    expect(op!.detail).toContain('Temps resposta');
  });

  it('anomalies GOOD quan no n\'hi ha de negatives', () => {
    const signals = assembleHealthSignals(makeInput());
    const an = signals.find((s) => s.area === 'Anomalies KPI');
    expect(an!.level).toBe('GOOD');
  });

  it('anomalies WARNING amb 1-2 negatives', () => {
    const signals = assembleHealthSignals(makeInput({ anomalies: negativeAnomalies }));
    const an = signals.find((s) => s.area === 'Anomalies KPI');
    expect(an!.level).toBe('WARNING');
  });

  it('anomalies CRITICAL amb 3+ negatives (escala alineada amb seguiment/capacitat/pipeline)', () => {
    const threeNegatives: AnomalyReport = {
      generatedAt: now.toISOString(), windowDays: 30, verdict: '3 desviacions',
      anomalies: [
        { metric: 'leads', label: 'Leads nous', level: 'NEGATIVE', icon: '📉', current: 1, avg30d: 5, deviation: -80, message: 'Caiguda' },
        { metric: 'bookings', label: 'Reserves', level: 'NEGATIVE', icon: '📉', current: 0, avg30d: 3, deviation: -100, message: 'Zero' },
        { metric: 'won', label: 'Guanyats', level: 'NEGATIVE', icon: '📉', current: 0, avg30d: 2, deviation: -100, message: 'Zero' },
      ],
    };
    const signals = assembleHealthSignals(makeInput({ anomalies: threeNegatives }));
    const an = signals.find((s) => s.area === 'Anomalies KPI');
    expect(an!.level).toBe('CRITICAL');
  });
});

// ── computeGlobalHealthScore ───────────────────────────────────────────────

describe('computeGlobalHealthScore', () => {
  it('retorna 50 sense senyals', () => {
    expect(computeGlobalHealthScore([])).toBe(50);
  });

  it('retorna 75 quan tots GOOD', () => {
    const signals: CockpitHealthSignal[] = [
      { area: 'A', level: 'GOOD', label: '', detail: '' },
      { area: 'B', level: 'GOOD', label: '', detail: '' },
    ];
    expect(computeGlobalHealthScore(signals)).toBe(75);
  });

  it('baixa amb CRITICALs', () => {
    const signals: CockpitHealthSignal[] = [
      { area: 'A', level: 'CRITICAL', label: '', detail: '' },
      { area: 'B', level: 'GOOD', label: '', detail: '' },
      { area: 'C', level: 'GOOD', label: '', detail: '' },
    ];
    const score = computeGlobalHealthScore(signals);
    expect(score).toBeLessThan(65);
  });

  it('100 quan tots EXCELLENT', () => {
    const signals: CockpitHealthSignal[] = [
      { area: 'A', level: 'EXCELLENT', label: '', detail: '' },
      { area: 'B', level: 'EXCELLENT', label: '', detail: '' },
    ];
    expect(computeGlobalHealthScore(signals)).toBe(100);
  });
});

// ── assembleCockpit ────────────────────────────────────────────────────────

describe('assembleCockpit', () => {
  it('retorna estructura completa', () => {
    const cockpit = assembleCockpit(makeInput());

    expect(cockpit.generatedAt).toBeDefined();
    expect(cockpit.globalHealthScore).toBeGreaterThanOrEqual(0);
    expect(cockpit.globalHealthLevel).toBeDefined();
    expect(cockpit.priorityActions).toBeDefined();
    expect(cockpit.healthSignals).toHaveLength(5);
    expect(cockpit.brief).toBe(emptyBrief);
    expect(cockpit.pulse).toBe(okPulse);
  });

  it('health level GOOD quan tot va bé', () => {
    const cockpit = assembleCockpit(makeInput());
    expect(cockpit.globalHealthLevel).toBe('GOOD');
  });

  it('health level baixa amb problemes', () => {
    const cockpit = assembleCockpit(makeInput({
      pulse: criticalPulse,
      followUps: urgentFollowUps,
      capacity: conflictCapacity,
    }));
    expect(cockpit.globalHealthScore).toBeLessThan(65);
    expect(['WARNING', 'CRITICAL']).toContain(cockpit.globalHealthLevel);
  });

  it('priorityActions populades amb alertes i follow-ups', () => {
    const cockpit = assembleCockpit(makeInput({
      brief: briefWithAlerts,
      followUps: urgentFollowUps,
    }));
    expect(cockpit.priorityActions.length).toBeGreaterThanOrEqual(4);
  });
});
