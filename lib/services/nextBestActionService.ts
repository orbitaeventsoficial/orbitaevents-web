// lib/services/nextBestActionService.ts
// ═══════════════════════════════════════════════════════════════════════════
// NEXT BEST ACTION ENGINE
// Motor unificat: agrega accions de tots els dominis (leads, customers,
// tasks, follow-ups, capacitat, pipeline) i retorna un rànking executiu
// de "què fer ara" amb CTA executable.
// Part pura (assemblatge + scoring) + wrapper (fetch paral·lel).
// ═══════════════════════════════════════════════════════════════════════════

import { log } from '@/lib/logger';
import { loadPendingFollowUps, type FollowUpSummary, type PendingFollowUp } from '@/lib/services/responseTrackingService';
import { loadCapacityConflicts, type CapacityConflictReport, type CapacityConflict } from '@/lib/services/capacityConflictService';
import { loadPipelineSuggestions, type PipelineSuggestion } from '@/lib/services/leadPipelineSuggestionsService';
import { prisma } from '@/lib/prisma';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { buildLeadCustomerHref } from '@/lib/admin/leadCustomerHref';
import type { LeadStatus } from '@prisma/client';

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type NBADomain = 'lead' | 'customer' | 'task' | 'booking' | 'inventory' | 'communication';

export type NBAUrgency = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type NextBestAction = {
  rank: number;
  id: string;
  domain: NBADomain;
  actionType: string;
  urgency: NBAUrgency;
  icon: string;
  title: string;
  subtitle: string;
  href: string;
  score: number;
  entity: { type: string; id: string; name: string };
  reasoning: string;
  estimatedImpact: 'HIGH' | 'MEDIUM' | 'LOW';
  timeWindow: string;
};

export type NBAReport = {
  generatedAt: string;
  totalActions: number;
  byCritical: number;
  byHigh: number;
  byMedium: number;
  byLow: number;
  actions: NextBestAction[];
};

// ── Input types for pure function ────────────────────────────────────────

export type NBALeadInput = {
  id: string;
  name: string;
  status: string;
  priority: string;
  createdAt: Date;
  contactedAt: Date | null;
  updatedAt: Date;
  eventDate: Date | null;
  eventType: string | null;
  budget: string | null;
  phone: string | null;
  hasBooking: boolean;
  lastActivityAt: Date | null;
  overdueTasks: number;
};

export type NBACustomerInput = {
  id: string;
  name: string;
  lifecycleStage: string | null;
  healthScore: number | null;
  lastContactedAt: Date | null;
  pendingPayment: number;
  openTasks: number;
  totalSpent: number;
};

export type NBATaskInput = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  leadId: string | null;
  customerId: string | null;
  bookingId: string | null;
  entityName: string | null;
};

export type NBAAssemblyInput = {
  leads: NBALeadInput[];
  customers: NBACustomerInput[];
  tasks: NBATaskInput[];
  followUps: FollowUpSummary;
  capacity: CapacityConflictReport;
  pipelineSuggestions: PipelineSuggestion[];
  now: Date;
};

// ───────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ───────────────────────────────────────────────────────────────────────────

const DAY_MS = 1000 * 60 * 60 * 24;

const URGENCY_SCORE: Record<string, number> = {
  CRITICAL: 100,
  HIGH: 75,
  MEDIUM: 50,
  LOW: 25,
};

const IMPACT_SCORE: Record<string, number> = {
  HIGH: 30,
  MEDIUM: 20,
  LOW: 10,
};

// ───────────────────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────────────────

function daysSince(ref: Date | null, now: Date): number | null {
  if (!ref) return null;
  return Math.floor((now.getTime() - ref.getTime()) / DAY_MS);
}

function daysUntil(ref: Date | null, now: Date): number | null {
  if (!ref) return null;
  return Math.ceil((ref.getTime() - now.getTime()) / DAY_MS);
}

function estimateBudget(budget: string | null): number {
  if (!budget) return 0;
  const num = Number(budget.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(num) ? num : 0;
}

function makeId(domain: string, type: string, entityId: string): string {
  return `${domain}:${type}:${entityId}`;
}

// ───────────────────────────────────────────────────────────────────────────
// PURE: EXTRACT ACTIONS FROM EACH DOMAIN
// ───────────────────────────────────────────────────────────────────────────

function extractLeadActions(leads: NBALeadInput[], now: Date): NextBestAction[] {
  const actions: NextBestAction[] = [];

  for (const lead of leads) {
    if (['WON', 'LOST', 'DISQUALIFIED'].includes(lead.status)) continue;

    const hoursOld = (now.getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60);
    const dSinceActivity = daysSince(lead.lastActivityAt, now);
    const dUntilEvent = daysUntil(lead.eventDate, now);
    const budget = estimateBudget(lead.budget);
    const isHighValue = budget > 500 || lead.priority === 'HIGH' || lead.priority === 'URGENT';

    // 1. New lead not contacted — most critical
    if (lead.status === 'NEW' && !lead.contactedAt) {
      const urgent = hoursOld > 4;
      actions.push({
        rank: 0,
        id: makeId('lead', 'CONTACT_NOW', lead.id),
        domain: 'lead',
        actionType: 'CONTACT_NOW',
        urgency: urgent ? 'CRITICAL' : 'HIGH',
        icon: urgent ? '🔥' : '📞',
        title: `Contactar ${lead.name}`,
        subtitle: `Lead nou fa ${Math.round(hoursOld)}h — ${lead.eventType || 'event'}`,
        href: buildLeadWorkspaceHref(lead.id),
        score: 0,
        entity: { type: 'lead', id: lead.id, name: lead.name },
        reasoning: urgent
          ? `Lead sense contactar des de fa ${Math.round(hoursOld)}h — SLA en risc`
          : 'Lead nou pendent de primer contacte',
        estimatedImpact: isHighValue ? 'HIGH' : 'MEDIUM',
        timeWindow: urgent ? 'Ara' : 'Avui',
      });
      continue;
    }

    // 2. Overdue tasks on lead
    if (lead.overdueTasks > 0) {
      actions.push({
        rank: 0,
        id: makeId('lead', 'OVERDUE_TASK', lead.id),
        domain: 'lead',
        actionType: 'COMPLETE_TASK',
        urgency: 'HIGH',
        icon: '⏰',
        title: `${lead.overdueTasks} ${lead.overdueTasks > 1 ? 'tasques vençudes' : 'tasca vençuda'} — ${lead.name}`,
        subtitle: `Estat: ${lead.status}`,
        href: buildLeadWorkspaceHref(lead.id),
        score: 0,
        entity: { type: 'lead', id: lead.id, name: lead.name },
        reasoning: `${lead.overdueTasks} tasques pendents amb data vençuda`,
        estimatedImpact: 'MEDIUM',
        timeWindow: 'Avui',
      });
    }

    // 3. Quote sent, no reply — stale
    if (lead.status === 'QUOTE_SENT' && dSinceActivity !== null && dSinceActivity > 3) {
      actions.push({
        rank: 0,
        id: makeId('lead', 'FOLLOW_QUOTE', lead.id),
        domain: 'lead',
        actionType: 'FOLLOW_UP',
        urgency: dSinceActivity > 7 ? 'HIGH' : 'MEDIUM',
        icon: '📋',
        title: `Seguiment pressupost — ${lead.name}`,
        subtitle: `${dSinceActivity} dies sense resposta`,
        href: buildLeadWorkspaceHref(lead.id),
        score: 0,
        entity: { type: 'lead', id: lead.id, name: lead.name },
        reasoning: `Pressupost enviat fa ${dSinceActivity} dies sense resposta del client`,
        estimatedImpact: isHighValue ? 'HIGH' : 'MEDIUM',
        timeWindow: dSinceActivity > 7 ? 'Avui' : '48h',
      });
      continue;
    }

    // 4. Event approaching without booking
    if (dUntilEvent !== null && dUntilEvent >= 0 && dUntilEvent <= 14 && !lead.hasBooking) {
      actions.push({
        rank: 0,
        id: makeId('lead', 'EVENT_SOON', lead.id),
        domain: 'lead',
        actionType: 'CLOSE_DEAL',
        urgency: dUntilEvent <= 7 ? 'CRITICAL' : 'HIGH',
        icon: '📅',
        title: `Tancar reserva — ${lead.name}`,
        subtitle: `Event en ${dUntilEvent} dies sense reserva`,
        href: buildLeadWorkspaceHref(lead.id),
        score: 0,
        entity: { type: 'lead', id: lead.id, name: lead.name },
        reasoning: `L'esdeveniment és en ${dUntilEvent} dies i encara no hi ha reserva confirmada`,
        estimatedImpact: 'HIGH',
        timeWindow: dUntilEvent <= 3 ? 'Ara' : 'Aquesta setmana',
      });
      continue;
    }

    // 5. Stale negotiation
    if (lead.status === 'NEGOTIATING' && dSinceActivity !== null && dSinceActivity > 5) {
      actions.push({
        rank: 0,
        id: makeId('lead', 'STALE_NEGOTIATION', lead.id),
        domain: 'lead',
        actionType: 'FOLLOW_UP',
        urgency: dSinceActivity > 10 ? 'HIGH' : 'MEDIUM',
        icon: '💤',
        title: `Negociació freda — ${lead.name}`,
        subtitle: `${dSinceActivity} dies sense moviment`,
        href: buildLeadWorkspaceHref(lead.id),
        score: 0,
        entity: { type: 'lead', id: lead.id, name: lead.name },
        reasoning: `Negociació parada fa ${dSinceActivity} dies — risc de pèrdua`,
        estimatedImpact: isHighValue ? 'HIGH' : 'MEDIUM',
        timeWindow: '48h',
      });
    }
  }

  return actions;
}

function extractCustomerActions(customers: NBACustomerInput[], now: Date): NextBestAction[] {
  const actions: NextBestAction[] = [];

  for (const cust of customers) {
    const dSinceContact = daysSince(cust.lastContactedAt, now);
    const isHighValue = cust.totalSpent > 1000;

    // 1. Payment pending
    if (cust.pendingPayment > 0) {
      const urgent = cust.pendingPayment > 500;
      actions.push({
        rank: 0,
        id: makeId('customer', 'COLLECT_PAYMENT', cust.id),
        domain: 'customer',
        actionType: 'COLLECT_PAYMENT',
        urgency: urgent ? 'HIGH' : 'MEDIUM',
        icon: '💰',
        title: `Cobrament pendent — ${cust.name}`,
        subtitle: `${cust.pendingPayment.toLocaleString('ca-ES')}€ pendents`,
        href: `/admin/clientes/${cust.id}`,
        score: 0,
        entity: { type: 'customer', id: cust.id, name: cust.name },
        reasoning: `El client té ${cust.pendingPayment.toLocaleString('ca-ES')}€ pendents de cobrar`,
        estimatedImpact: urgent ? 'HIGH' : 'MEDIUM',
        timeWindow: 'Aquesta setmana',
      });
    }

    // 2. Low health score — at risk
    if (cust.healthScore !== null && cust.healthScore < 30) {
      actions.push({
        rank: 0,
        id: makeId('customer', 'AT_RISK', cust.id),
        domain: 'customer',
        actionType: 'REACTIVATE',
        urgency: 'HIGH',
        icon: '⚠️',
        title: `Client en risc — ${cust.name}`,
        subtitle: `Salut: ${cust.healthScore}/100`,
        href: `/admin/clientes/${cust.id}`,
        score: 0,
        entity: { type: 'customer', id: cust.id, name: cust.name },
        reasoning: `Score de salut molt baix (${cust.healthScore}/100) — risc de pèrdua`,
        estimatedImpact: isHighValue ? 'HIGH' : 'MEDIUM',
        timeWindow: 'Aquesta setmana',
      });
    }

    // 3. No contact in long time with active relationship
    if (dSinceContact !== null && dSinceContact > 30 && cust.lifecycleStage !== 'CHURNED') {
      actions.push({
        rank: 0,
        id: makeId('customer', 'RECONTACT', cust.id),
        domain: 'customer',
        actionType: 'FOLLOW_UP',
        urgency: dSinceContact > 60 ? 'HIGH' : 'MEDIUM',
        icon: '📭',
        title: `Sense contacte — ${cust.name}`,
        subtitle: `${dSinceContact} dies sense comunicació`,
        href: `/admin/clientes/${cust.id}`,
        score: 0,
        entity: { type: 'customer', id: cust.id, name: cust.name },
        reasoning: `Fa ${dSinceContact} dies sense cap comunicació — relació es refreda`,
        estimatedImpact: isHighValue ? 'HIGH' : 'LOW',
        timeWindow: dSinceContact > 60 ? '48h' : 'Aquesta setmana',
      });
    }
  }

  return actions;
}

function extractTaskActions(tasks: NBATaskInput[], now: Date): NextBestAction[] {
  const actions: NextBestAction[] = [];

  for (const task of tasks) {
    if (task.status === 'DONE' || task.status === 'CANCELLED') continue;

    const isOverdue = task.dueDate && task.dueDate < now;
    const daysOver = isOverdue ? Math.floor((now.getTime() - task.dueDate!.getTime()) / DAY_MS) : 0;
    const isDueToday = task.dueDate && !isOverdue &&
      task.dueDate.toDateString() === now.toDateString();
    const isUrgent = task.priority === 'URGENT' || task.priority === 'HIGH';

    if (!isOverdue && !isDueToday && !isUrgent) continue;

    const entityType = task.bookingId ? 'booking' : task.customerId ? 'customer' : task.leadId ? 'lead' : 'task';
    const entityId = task.bookingId || task.customerId || task.leadId || task.id;
    const href = task.bookingId ? `/admin/bookings/${task.bookingId}`
      : task.customerId ? `/admin/clientes/${task.customerId}`
      : task.leadId ? buildLeadWorkspaceHref(task.leadId)
      : '/admin/tasks';

    actions.push({
      rank: 0,
      id: makeId('task', isOverdue ? 'OVERDUE' : 'DUE', task.id),
      domain: 'task',
      actionType: 'COMPLETE_TASK',
      urgency: isOverdue ? (daysOver > 3 ? 'CRITICAL' : 'HIGH') : isDueToday ? 'HIGH' : 'MEDIUM',
      icon: isOverdue ? '🚨' : isDueToday ? '📝' : '✅',
      title: task.title,
      subtitle: isOverdue
        ? `Vençuda fa ${daysOver} dies${task.entityName ? ` — ${task.entityName}` : ''}`
        : isDueToday
        ? `Venç avui${task.entityName ? ` — ${task.entityName}` : ''}`
        : `Prioritat ${task.priority}${task.entityName ? ` — ${task.entityName}` : ''}`,
      href,
      score: 0,
      entity: { type: entityType, id: entityId, name: task.entityName || task.title },
      reasoning: isOverdue
        ? `Tasca vençuda fa ${daysOver} dies — cal completar-la`
        : isDueToday
        ? 'Tasca que venç avui — completar abans de tancar la jornada'
        : `Tasca de prioritat ${task.priority} pendent`,
      estimatedImpact: isOverdue && daysOver > 3 ? 'HIGH' : 'MEDIUM',
      timeWindow: isOverdue ? 'Ara' : isDueToday ? 'Avui' : '48h',
    });
  }

  return actions;
}

function extractFollowUpActions(followUps: FollowUpSummary): NextBestAction[] {
  const actions: NextBestAction[] = [];

  for (const fu of followUps.items.filter((f: PendingFollowUp) => f.urgency === 'URGENT').slice(0, 5)) {
    actions.push({
      rank: 0,
      id: makeId('communication', 'URGENT_FOLLOWUP', fu.leadId),
      domain: 'communication',
      actionType: 'FOLLOW_UP',
      urgency: 'CRITICAL',
      icon: '🚨',
      title: `Seguiment urgent — ${fu.name}`,
      subtitle: `${fu.daysSinceOutbound} dies sense resposta — ${fu.suggestedAction}`,
      href: buildLeadCustomerHref({
        leadId: fu.leadId,
        customerId: fu.customerId,
        customerTab: 'comms',
      }),
      score: 0,
      entity: { type: fu.customerId ? 'customer' : 'lead', id: fu.customerId || fu.leadId, name: fu.name },
      reasoning: `Lead contactat ${fu.outboundCount} vegades, ${fu.daysSinceOutbound} dies sense resposta — ${fu.suggestedAction}`,
      estimatedImpact: 'HIGH',
      timeWindow: 'Ara',
    });
  }

  for (const fu of followUps.items.filter((f: PendingFollowUp) => f.urgency === 'NORMAL').slice(0, 3)) {
    actions.push({
      rank: 0,
      id: makeId('communication', 'NORMAL_FOLLOWUP', fu.leadId),
      domain: 'communication',
      actionType: 'FOLLOW_UP',
      urgency: 'MEDIUM',
      icon: '📩',
      title: `Seguiment — ${fu.name}`,
      subtitle: `${fu.daysSinceOutbound} dies sense resposta`,
      href: buildLeadCustomerHref({
        leadId: fu.leadId,
        customerId: fu.customerId,
        customerTab: 'comms',
      }),
      score: 0,
      entity: { type: fu.customerId ? 'customer' : 'lead', id: fu.customerId || fu.leadId, name: fu.name },
      reasoning: `Lead sense resposta des de fa ${fu.daysSinceOutbound} dies`,
      estimatedImpact: 'MEDIUM',
      timeWindow: '48h',
    });
  }

  return actions;
}

function extractCapacityActions(capacity: CapacityConflictReport): NextBestAction[] {
  return capacity.conflicts.slice(0, 3).map((c: CapacityConflict) => ({
    rank: 0,
    id: makeId('inventory', 'CAPACITY_CONFLICT', c.itemId),
    domain: 'inventory' as const,
    actionType: 'RESOLVE_CONFLICT',
    urgency: (c.deficit > 2 ? 'CRITICAL' : 'HIGH') as NBAUrgency,
    icon: '⚠️',
    title: `Col·lisió inventari: ${c.itemName}`,
    subtitle: `${c.date} — falten ${c.deficit} unitats (${c.bookings.length} reserves)`,
    href: '/admin/inventory',
    score: 0,
    entity: { type: 'inventory', id: c.itemId, name: c.itemName },
    reasoning: `Inventari insuficient: ${c.totalDemanded} necessàries vs ${c.stockAvailable} disponibles`,
    estimatedImpact: 'HIGH' as const,
    timeWindow: 'Aquesta setmana',
  }));
}

function extractPipelineActions(suggestions: PipelineSuggestion[]): NextBestAction[] {
  return suggestions
    .filter((s) => s.priority === 'CRITICAL' || s.priority === 'HIGH')
    .slice(0, 3)
    .map((s) => ({
      rank: 0,
      id: makeId('lead', `PIPELINE_${s.type}`, s.leadIds[0] || s.type),
      domain: 'lead' as const,
      actionType: s.type,
      urgency: (s.priority === 'CRITICAL' ? 'CRITICAL' : 'HIGH') as NBAUrgency,
      icon: s.icon,
      title: s.title,
      subtitle: s.detail,
      href: s.href,
      score: 0,
      entity: { type: 'lead', id: s.leadIds[0] || '', name: `${s.count} leads` },
      reasoning: s.detail,
      estimatedImpact: s.priority === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
      timeWindow: s.priority === 'CRITICAL' ? 'Avui' : 'Aquesta setmana',
    }));
}

// ───────────────────────────────────────────────────────────────────────────
// PURE: SCORING
// ───────────────────────────────────────────────────────────────────────────

const TIME_WINDOW_BONUS: Record<string, number> = {
  'Ara': 20,
  'Avui': 15,
  '48h': 10,
  'Aquesta setmana': 5,
};

function computeActionScore(action: NextBestAction): number {
  const urgency = URGENCY_SCORE[action.urgency] ?? 50;
  const impact = IMPACT_SCORE[action.estimatedImpact] ?? 10;
  const timeBonus = TIME_WINDOW_BONUS[action.timeWindow] ?? 0;
  return urgency + impact + timeBonus;
}

// ───────────────────────────────────────────────────────────────────────────
// PURE: DEDUPLICATE
// ───────────────────────────────────────────────────────────────────────────

function deduplicateActions(actions: NextBestAction[]): NextBestAction[] {
  const seen = new Set<string>();
  const deduped: NextBestAction[] = [];
  for (const action of actions) {
    // Deduplicate by entity + domain combination
    const entityKey = `${action.entity.type}:${action.entity.id}:${action.domain}`;
    if (seen.has(entityKey)) continue;
    seen.add(entityKey);
    deduped.push(action);
  }
  return deduped;
}

// ───────────────────────────────────────────────────────────────────────────
// PURE: ASSEMBLE
// ───────────────────────────────────────────────────────────────────────────

export function assembleNextBestActions(input: NBAAssemblyInput): NextBestAction[] {
  const all: NextBestAction[] = [
    ...extractLeadActions(input.leads, input.now),
    ...extractCustomerActions(input.customers, input.now),
    ...extractTaskActions(input.tasks, input.now),
    ...extractFollowUpActions(input.followUps),
    ...extractCapacityActions(input.capacity),
    ...extractPipelineActions(input.pipelineSuggestions),
  ];

  // Score each action
  for (const action of all) {
    action.score = computeActionScore(action);
  }

  // Deduplicate by entity+domain
  const deduped = deduplicateActions(all);

  // Sort by score descending
  deduped.sort((a, b) => b.score - a.score);

  // Assign ranks
  deduped.forEach((action, i) => { action.rank = i + 1; });

  return deduped;
}

export function buildNBAReport(actions: NextBestAction[], now: Date): NBAReport {
  return {
    generatedAt: now.toISOString(),
    totalActions: actions.length,
    byCritical: actions.filter((a) => a.urgency === 'CRITICAL').length,
    byHigh: actions.filter((a) => a.urgency === 'HIGH').length,
    byMedium: actions.filter((a) => a.urgency === 'MEDIUM').length,
    byLow: actions.filter((a) => a.urgency === 'LOW').length,
    actions,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// WRAPPER — fetch paral·lel de totes les fonts
// ───────────────────────────────────────────────────────────────────────────

const ACTIVE_LEAD_STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'];
const EMPTY_FOLLOWUPS: FollowUpSummary = { generatedAt: '', total: 0, urgent: 0, normal: 0, low: 0, items: [] };
const EMPTY_CAPACITY: CapacityConflictReport = { generatedAt: '', windowDays: 14, conflicts: [], verdict: '' };

export async function loadNextBestActions(now: Date = new Date()): Promise<NBAReport> {
  const [leadsRaw, customersRaw, tasksRaw, followUps, capacity, pipelineSuggestions] = await Promise.all([
    // Active leads with overdue task count
    prisma.lead.findMany({
      where: { status: { in: ACTIVE_LEAD_STATUSES } },
      select: {
        id: true, name: true, status: true, priority: true,
        createdAt: true, contactedAt: true, updatedAt: true,
        eventDate: true, eventType: true, budget: true, phone: true,
        booking: { select: { id: true } },
        universalTasks: {
          where: { status: { notIn: ['DONE', 'CANCELLED'] }, dueDate: { lt: now } },
          select: { id: true },
        },
        activities: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }).catch((err) => { log.error('NBA: leads failed', err); return []; }),

    // Customers with health score, payment, tasks
    prisma.customer.findMany({
      where: {
        OR: [
          { healthScore: { lt: 50 } },
          { lifecycleStage: { not: 'CHURNED' } },
        ],
      },
      select: {
        id: true, name: true, lifecycleStage: true, healthScore: true,
        lastContactedAt: true, totalSpent: true,
        bookings: {
          where: { status: { in: ['CONFIRMED', 'PREPARING'] } },
          select: { total: true, depositAmount: true, depositPaid: true, remainingPaid: true },
        },
        tasks: { where: { status: { notIn: ['DONE', 'CANCELLED'] } }, select: { id: true } },
      },
      orderBy: { healthScore: 'asc' },
      take: 30,
    }).catch((err) => { log.error('NBA: customers failed', err); return []; }),

    // Open tasks that are overdue or due today or high priority
    prisma.task.findMany({
      where: {
        status: { notIn: ['DONE', 'CANCELLED'] },
        OR: [
          { dueDate: { lte: now } },
          { priority: { in: ['URGENT', 'HIGH'] } },
        ],
      },
      select: {
        id: true, title: true, status: true, priority: true, dueDate: true,
        leadId: true, customerId: true, bookingId: true,
        lead: { select: { name: true } },
        customer: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 20,
    }).catch((err) => { log.error('NBA: tasks failed', err); return []; }),

    loadPendingFollowUps(now).catch((err) => { log.error('NBA: followUps failed', err); return EMPTY_FOLLOWUPS; }),
    loadCapacityConflicts(now).catch((err) => { log.error('NBA: capacity failed', err); return EMPTY_CAPACITY; }),
    loadPipelineSuggestions(now).catch((err) => { log.error('NBA: pipeline failed', err); return [] as PipelineSuggestion[]; }),
  ]);

  // Transform raw data to input types
  const leads: NBALeadInput[] = (leadsRaw as Array<{
    id: string; name: string; status: string; priority: string;
    createdAt: Date; contactedAt: Date | null; updatedAt: Date;
    eventDate: Date | null; eventType: string | null; budget: string | null;
    phone: string | null;
    booking: { id: string } | null;
    universalTasks: { id: string }[];
    activities: { createdAt: Date }[];
  }>).map((l) => ({
    id: l.id,
    name: l.name,
    status: l.status,
    priority: l.priority,
    createdAt: l.createdAt,
    contactedAt: l.contactedAt,
    updatedAt: l.updatedAt,
    eventDate: l.eventDate,
    eventType: l.eventType,
    budget: l.budget,
    phone: l.phone,
    hasBooking: !!l.booking,
    lastActivityAt: l.activities[0]?.createdAt ?? null,
    overdueTasks: l.universalTasks.length,
  }));

  const customers: NBACustomerInput[] = (customersRaw as Array<{
    id: string; name: string; lifecycleStage: string | null; healthScore: number | null;
    lastContactedAt: Date | null; totalSpent: number;
    bookings: Array<{ total: number | null; depositAmount: number | null; depositPaid: boolean | null; remainingPaid: boolean | null }>;
    tasks: { id: string }[];
  }>).map((c) => {
    let pendingPayment = 0;
    for (const b of c.bookings) {
      const total = b.total || 0;
      const deposit = b.depositAmount || 0;
      let paid = 0;
      if (b.depositPaid) paid += deposit;
      if (b.remainingPaid) paid += total - deposit;
      pendingPayment += Math.max(0, total - paid);
    }
    return {
      id: c.id,
      name: c.name,
      lifecycleStage: c.lifecycleStage,
      healthScore: c.healthScore,
      lastContactedAt: c.lastContactedAt,
      pendingPayment,
      openTasks: c.tasks.length,
      totalSpent: c.totalSpent ?? 0,
    };
  });

  const tasks: NBATaskInput[] = (tasksRaw as Array<{
    id: string; title: string; status: string; priority: string; dueDate: Date | null;
    leadId: string | null; customerId: string | null; bookingId: string | null;
    lead: { name: string } | null; customer: { name: string } | null;
  }>).map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate,
    leadId: t.leadId,
    customerId: t.customerId,
    bookingId: t.bookingId,
    entityName: t.lead?.name ?? t.customer?.name ?? null,
  }));

  const actions = assembleNextBestActions({
    leads, customers, tasks, followUps, capacity, pipelineSuggestions, now,
  });

  return buildNBAReport(actions, now);
}
