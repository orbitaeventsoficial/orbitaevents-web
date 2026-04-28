// lib/services/executiveCockpitService.ts
// ═══════════════════════════════════════════════════════════════════════════
// EXECUTIVE COCKPIT SERVICE
// Centre de comandament unificat: agrega totes les fonts canòniques
// en una sola resposta per al dashboard executiu.
// Part pura (assemblatge + scoring global) + wrapper (fetch paral·lel).
// ═══════════════════════════════════════════════════════════════════════════

import { log } from '@/lib/logger';
import { loadDailyBrief, type DailyBrief } from '@/lib/services/dailyBriefService';
import { loadOperationalPulse, type OperationalPulse } from '@/lib/services/operationalPulseService';
import { loadPendingFollowUps, type FollowUpSummary } from '@/lib/services/responseTrackingService';
import { loadCapacityConflicts, type CapacityConflictReport } from '@/lib/services/capacityConflictService';
import { loadPipelineSuggestions, type PipelineSuggestion } from '@/lib/services/leadPipelineSuggestionsService';
import { loadAnomalyReport, type AnomalyReport } from '@/lib/services/dailyAnomalyService';
import { buildLeadCustomerHref } from '@/lib/admin/leadCustomerHref';

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type CockpitPriorityAction = {
  rank: number;
  icon: string;
  label: string;
  detail: string;
  href: string;
  source: string;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
};

export type CockpitHealthSignal = {
  area: string;
  level: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
  label: string;
  detail: string;
};

export type ExecutiveCockpit = {
  generatedAt: string;
  globalHealthScore: number;
  globalHealthLevel: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
  priorityActions: CockpitPriorityAction[];
  healthSignals: CockpitHealthSignal[];
  brief: DailyBrief;
  pulse: OperationalPulse;
  followUps: FollowUpSummary;
  capacity: CapacityConflictReport;
  pipelineSuggestions: PipelineSuggestion[];
  anomalies: AnomalyReport;
};

export type CockpitAssemblyInput = {
  brief: DailyBrief;
  pulse: OperationalPulse;
  followUps: FollowUpSummary;
  capacity: CapacityConflictReport;
  pipelineSuggestions: PipelineSuggestion[];
  anomalies: AnomalyReport;
  now: Date;
};

// ───────────────────────────────────────────────────────────────────────────
// PURE FUNCTIONS
// ───────────────────────────────────────────────────────────────────────────

const URGENCY_RANK: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

function healthLevel(score: number): 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL' {
  if (score >= 85) return 'EXCELLENT';
  if (score >= 65) return 'GOOD';
  if (score >= 40) return 'WARNING';
  return 'CRITICAL';
}

export function assemblePriorityActions(input: CockpitAssemblyInput): CockpitPriorityAction[] {
  const actions: CockpitPriorityAction[] = [];

  // From daily brief alerts
  for (const alert of input.brief.alerts) {
    const urgency = alert.level === 'CRITICAL' ? 'CRITICAL' : alert.level === 'WARNING' ? 'HIGH' : 'MEDIUM';
    actions.push({
      rank: 0,
      icon: alert.icon,
      label: alert.title,
      detail: alert.detail,
      href: alert.href,
      source: 'brief',
      urgency,
    });
  }

  // From urgent follow-ups
  for (const item of input.followUps.items.filter((f) => f.urgency === 'URGENT').slice(0, 5)) {
    actions.push({
      rank: 0,
      icon: '🚨',
      label: `Follow-up urgent: ${item.name}`,
      detail: `${item.daysSinceOutbound} dies sense resposta — ${item.suggestedAction}`,
      href: buildLeadCustomerHref({
        leadId: item.leadId,
        customerId: item.customerId,
        customerTab: 'comms',
      }),
      source: 'followUps',
      urgency: 'CRITICAL',
    });
  }

  // From capacity conflicts
  for (const conflict of input.capacity.conflicts.slice(0, 3)) {
    actions.push({
      rank: 0,
      icon: '⚠️',
      label: `Col·lisió inventari: ${conflict.itemName}`,
      detail: `${conflict.date} — falten ${conflict.deficit} unitats (${conflict.bookings.length} reserves)`,
      href: '/admin/inventory',
      source: 'capacity',
      urgency: 'HIGH',
    });
  }

  // From pipeline suggestions (CRITICAL/HIGH only)
  for (const suggestion of input.pipelineSuggestions.filter(
    (s) => s.priority === 'CRITICAL' || s.priority === 'HIGH'
  ).slice(0, 5)) {
    actions.push({
      rank: 0,
      icon: suggestion.icon,
      label: suggestion.title,
      detail: suggestion.detail,
      href: suggestion.href,
      source: 'pipeline',
      urgency: suggestion.priority === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
    });
  }

  // From anomalies (NEGATIVE only)
  for (const anomaly of input.anomalies.anomalies.filter((a) => a.level === 'NEGATIVE').slice(0, 3)) {
    actions.push({
      rank: 0,
      icon: anomaly.icon,
      label: anomaly.label,
      detail: anomaly.message,
      href: '/admin/analytics',
      source: 'anomalies',
      urgency: 'MEDIUM',
    });
  }

  // Sort by urgency then assign rank
  actions.sort((a, b) => (URGENCY_RANK[a.urgency] ?? 9) - (URGENCY_RANK[b.urgency] ?? 9));
  actions.forEach((action, index) => { action.rank = index + 1; });

  return actions;
}

export function assembleHealthSignals(input: CockpitAssemblyInput): CockpitHealthSignal[] {
  const signals: CockpitHealthSignal[] = [];

  // Operational pulse overall
  signals.push({
    area: 'Operativa',
    level: input.pulse.overallLevel,
    label: `Score operatiu: ${input.pulse.overallScore}/100`,
    detail: input.pulse.metrics.filter((m) => m.level === 'CRITICAL' || m.level === 'WARNING')
      .map((m) => m.label).join(', ') || 'Tots els indicadors en verd',
  });

  // Follow-ups
  const followUpLevel = input.followUps.urgent > 3 ? 'CRITICAL'
    : input.followUps.urgent > 0 ? 'WARNING'
    : input.followUps.total > 5 ? 'WARNING'
    : 'GOOD';
  signals.push({
    area: 'Seguiment comercial',
    level: followUpLevel as CockpitHealthSignal['level'],
    label: `${input.followUps.urgent} urgents de ${input.followUps.total} pendents`,
    detail: input.followUps.urgent > 0
      ? 'Hi ha leads sense resposta des de fa >5 dies'
      : 'Seguiment al dia',
  });

  // Capacity
  const capLevel = input.capacity.conflicts.length > 2 ? 'CRITICAL'
    : input.capacity.conflicts.length > 0 ? 'WARNING'
    : 'GOOD';
  signals.push({
    area: 'Capacitat operativa',
    level: capLevel as CockpitHealthSignal['level'],
    label: `${input.capacity.conflicts.length} col·lisions d'inventari`,
    detail: input.capacity.verdict || 'Sense conflictes de capacitat',
  });

  // Pipeline
  const criticalSuggestions = input.pipelineSuggestions.filter((s) => s.priority === 'CRITICAL');
  const pipLevel = criticalSuggestions.length > 2 ? 'CRITICAL'
    : criticalSuggestions.length > 0 ? 'WARNING'
    : 'GOOD';
  signals.push({
    area: 'Pipeline comercial',
    level: pipLevel as CockpitHealthSignal['level'],
    label: `${criticalSuggestions.length} alertes crítiques de pipeline`,
    detail: criticalSuggestions.map((s) => s.title).join(', ') || 'Pipeline saludable',
  });

  // Anomalies
  const negativeAnomalies = input.anomalies.anomalies.filter((a) => a.level === 'NEGATIVE');
  const anomalyLevel = negativeAnomalies.length > 2 ? 'CRITICAL'
    : negativeAnomalies.length > 0 ? 'WARNING'
    : 'GOOD';
  signals.push({
    area: 'Anomalies KPI',
    level: anomalyLevel as CockpitHealthSignal['level'],
    label: `${negativeAnomalies.length} desviacions negatives`,
    detail: input.anomalies.verdict,
  });

  return signals;
}

export function computeGlobalHealthScore(signals: CockpitHealthSignal[]): number {
  if (signals.length === 0) return 50;

  const levelScore: Record<string, number> = {
    EXCELLENT: 100,
    GOOD: 75,
    WARNING: 40,
    CRITICAL: 15,
  };

  const total = signals.reduce((sum, s) => sum + (levelScore[s.level] ?? 50), 0);
  return Math.round(total / signals.length);
}

export function assembleCockpit(input: CockpitAssemblyInput): ExecutiveCockpit {
  const priorityActions = assemblePriorityActions(input);
  const healthSignals = assembleHealthSignals(input);
  const globalHealthScore = computeGlobalHealthScore(healthSignals);

  return {
    generatedAt: input.now.toISOString(),
    globalHealthScore,
    globalHealthLevel: healthLevel(globalHealthScore),
    priorityActions,
    healthSignals,
    brief: input.brief,
    pulse: input.pulse,
    followUps: input.followUps,
    capacity: input.capacity,
    pipelineSuggestions: input.pipelineSuggestions,
    anomalies: input.anomalies,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// WRAPPER — fetch paral·lel de totes les fonts
// ───────────────────────────────────────────────────────────────────────────

const EMPTY_BRIEF: DailyBrief = {
  date: '', greeting: '', summary: '',
  kpis: { newLeadsToday: 0, openLeads: 0, overdueTasksCount: 0, upcomingBookings7d: 0, pendingPaymentsCount: 0, forecastWeighted: 0 },
  alerts: [], actions: [], topCampaigns: [],
};
const EMPTY_PULSE: OperationalPulse = { overallLevel: 'GOOD', overallScore: 50, metrics: [], pipelineDrivers: [], generatedAt: '' };
const EMPTY_FOLLOWUPS: FollowUpSummary = { generatedAt: '', total: 0, urgent: 0, normal: 0, low: 0, items: [] };
const EMPTY_CAPACITY: CapacityConflictReport = { generatedAt: '', windowDays: 14, conflicts: [], verdict: '' };
const EMPTY_ANOMALIES: AnomalyReport = { generatedAt: '', windowDays: 30, anomalies: [], verdict: '' };

export async function loadExecutiveCockpit(now: Date = new Date()): Promise<ExecutiveCockpit> {
  const [brief, pulse, followUps, capacity, pipelineSuggestions, anomalies] = await Promise.all([
    loadDailyBrief(now).catch((err) => { log.error('Cockpit: brief failed', err); return EMPTY_BRIEF; }),
    loadOperationalPulse(now).catch((err) => { log.error('Cockpit: pulse failed', err); return EMPTY_PULSE; }),
    loadPendingFollowUps(now).catch((err) => { log.error('Cockpit: followUps failed', err); return EMPTY_FOLLOWUPS; }),
    loadCapacityConflicts(now).catch((err) => { log.error('Cockpit: capacity failed', err); return EMPTY_CAPACITY; }),
    loadPipelineSuggestions(now).catch((err) => { log.error('Cockpit: pipeline failed', err); return [] as PipelineSuggestion[]; }),
    loadAnomalyReport(now).catch((err) => { log.error('Cockpit: anomalies failed', err); return EMPTY_ANOMALIES; }),
  ]);

  return assembleCockpit({ brief, pulse, followUps, capacity, pipelineSuggestions, anomalies, now });
}
