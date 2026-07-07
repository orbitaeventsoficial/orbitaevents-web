import type { BriefAction } from '@/lib/services/dailyBriefService';
import type { NBADomain, NBAUrgency, NextBestAction } from '@/lib/services/nextBestActionService';
import { formatCurrency } from '@/lib/constants';
import { DASHBOARD_ECONOMIC_RISK_WINDOW_DAYS } from './next-event-economics';

export type AdminTodayAction = {
  id: string;
  href: string;
  label: string;
  detail: string;
  badge: string | null;
  badgeClass: string;
  source: 'nba' | 'brief' | 'postEvent' | 'economic';
  sourceId: string;
  queuePriority: number;
};

const NBA_URGENCY_BADGE: Record<NBAUrgency, string> = {
  CRITICAL: 'ap-badge ap-badge--danger',
  HIGH: 'ap-badge ap-badge--warning',
  MEDIUM: 'ap-badge ap-badge--info',
  LOW: 'ap-badge',
};

const NBA_DOMAIN_LABEL: Record<NBADomain, string> = {
  lead: 'Lead',
  customer: 'Client',
  task: 'Tasca',
  booking: 'Reserva',
  inventory: 'Inventari',
  communication: 'Comunicació',
};

const NBA_QUEUE_PRIORITY: Record<NBAUrgency, number> = {
  CRITICAL: 150,
  HIGH: 95,
  MEDIUM: 65,
  LOW: 35,
};

function projectNbaAction(action: NextBestAction): AdminTodayAction {
  return {
    id: action.id,
    href: action.href || '/admin/control',
    label: action.title,
    detail: action.reasoning || action.subtitle,
    badge: `${NBA_DOMAIN_LABEL[action.domain]} · ${action.timeWindow}`,
    badgeClass: NBA_URGENCY_BADGE[action.urgency],
    source: 'nba',
    sourceId: action.id,
    queuePriority: Math.max(action.score || 0, NBA_QUEUE_PRIORITY[action.urgency]),
  };
}

function projectBriefAction(action: BriefAction, index: number): AdminTodayAction {
  return {
    id: `brief-${action.href}-${index}`,
    href: action.href,
    label: action.label,
    detail: action.detail,
    badge: null,
    badgeClass: 'ap-badge',
    source: 'brief',
    sourceId: action.href,
    queuePriority: 10 - index,
  };
}

function keepFirstActionPerHref(actions: Array<{ action: AdminTodayAction; index: number }>): Array<{ action: AdminTodayAction; index: number }> {
  const seenHrefs = new Set<string>();
  return actions.filter(({ action }) => {
    if (!action.href) return true;
    if (action.source !== 'brief') {
      seenHrefs.add(action.href);
      return true;
    }
    if (seenHrefs.has(action.href)) return false;
    seenHrefs.add(action.href);
    return true;
  });
}

const POST_EVENT_BADGE: Record<'ALTA' | 'MITJANA' | 'BAIXA' | 'DONE', string> = {
  ALTA: 'ap-badge ap-badge--danger',
  MITJANA: 'ap-badge ap-badge--warning',
  BAIXA: 'ap-badge ap-badge--info',
  DONE: 'ap-badge',
};

const POST_EVENT_QUEUE_PRIORITY: Record<'ALTA' | 'MITJANA' | 'BAIXA' | 'DONE', number> = {
  ALTA: 85,
  MITJANA: 55,
  BAIXA: 35,
  DONE: 0,
};

export function projectPostEventTodayAction(input: {
  bookingId: string;
  href: string;
  clientName: string;
  nextActionLabel: string;
  daysSinceEvent: number;
  priority: 'ALTA' | 'MITJANA' | 'BAIXA' | 'DONE';
}): AdminTodayAction {
  return {
    id: `post-event-${input.bookingId}`,
    href: input.href,
    label: `Tancar post-event: ${input.clientName}`,
    detail: `Ara toca: ${input.nextActionLabel} · fa ${input.daysSinceEvent} ${input.daysSinceEvent === 1 ? 'dia' : 'dies'}`,
    badge: `Post-event · ${input.priority}`,
    badgeClass: POST_EVENT_BADGE[input.priority],
    source: 'postEvent',
    sourceId: input.bookingId,
    queuePriority: POST_EVENT_QUEUE_PRIORITY[input.priority],
  };
}

export function projectNextEventEconomicTodayAction(input: {
  bookingId: string;
  href: string;
  clientName: string;
  daysUntil: number;
  marginPct: number;
  netMargin: number;
  outstandingAmount: number;
}): AdminTodayAction | null {
  const marginCritical = input.marginPct < 25;
  const marginWeak = input.marginPct < 45;
  const cashImminent = input.outstandingAmount > 0
    && input.daysUntil <= DASHBOARD_ECONOMIC_RISK_WINDOW_DAYS;

  if (!marginCritical && !cashImminent) return null;

  const dayLabel = input.daysUntil === 0
    ? 'avui'
    : input.daysUntil === 1
      ? 'demà'
      : `en ${input.daysUntil} dies`;
  const signals = [
    marginWeak ? `marge ${input.marginPct}% (${formatCurrency(input.netMargin)})` : null,
    cashImminent ? `pendent ${formatCurrency(input.outstandingAmount)}` : null,
    `bolo ${dayLabel}`,
  ].filter((signal): signal is string => Boolean(signal));
  const isCritical = marginCritical || (cashImminent && input.daysUntil <= 1);

  return {
    id: `economic-next-event-${input.bookingId}`,
    href: input.href,
    label: marginCritical && cashImminent
      ? `Revisar marge i caixa: ${input.clientName}`
      : cashImminent
        ? `Cobrar pendent: ${input.clientName}`
        : `Revisar marge: ${input.clientName}`,
    detail: signals.join(' · '),
    badge: isCritical ? 'Economia · CRÍTIC' : 'Economia · risc',
    badgeClass: isCritical ? 'ap-badge ap-badge--danger' : 'ap-badge ap-badge--warning',
    source: 'economic',
    sourceId: input.bookingId,
    queuePriority: isCritical ? 140 : 90,
  };
}

export function projectAdminTodayActions(
  nbaActions: NextBestAction[],
  briefActions: BriefAction[],
  limit = 3,
  supplementalActions: AdminTodayAction[] = [],
): AdminTodayAction[] {
  const candidates = [
    ...nbaActions.map(projectNbaAction),
    ...supplementalActions,
  ];
  const queue = [
    ...candidates,
    ...briefActions.map(projectBriefAction),
  ];
  return keepFirstActionPerHref(
    queue
      .map((action, index) => ({ action, index }))
      .sort((a, b) => b.action.queuePriority - a.action.queuePriority || a.index - b.index)
  )
    .slice(0, limit)
    .map(({ action }) => action);
}
