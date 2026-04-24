import type { CanonicalTimelineEvent } from '@/lib/services/timelineQueryService';

type AdminLogLike = {
  action: string;
  createdAt: Date;
  details?: unknown;
};

export interface FlowStatus {
  state: 'FALTA_ENVIAR' | 'ENVIADO' | 'RESPONDIDO';
  sentAt: Date | null;
  respondedAt: Date | null;
  lastChannel: string | null;
}

export type CommHistoryRow = {
  id: string;
  createdAt: Date;
  action: 'COMM_SENT' | 'COMM_RESPONDED';
  flow: string;
  channel: string;
};

function parseDetails(details: unknown): Record<string, unknown> {
  if (!details || typeof details !== 'object') return {};
  return details as Record<string, unknown>;
}

function parseEventDate(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function deriveFlowStatus(logs: AdminLogLike[], flow: string): FlowStatus {
  const sentLogs = logs
    .filter((log) => {
      const details = parseDetails(log.details);
      return log.action === 'COMM_SENT' && details.flow === flow;
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const respondedLogs = logs
    .filter((log) => {
      const details = parseDetails(log.details);
      return log.action === 'COMM_RESPONDED' && details.flow === flow;
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const sentAt = sentLogs[0]?.createdAt || null;
  const respondedAt = respondedLogs[0]?.createdAt || null;
  const lastChannel = sentLogs[0]
    ? (parseDetails(sentLogs[0].details).channel as string | undefined) || null
    : null;

  if (respondedAt) {
    return { state: 'RESPONDIDO', sentAt, respondedAt, lastChannel };
  }
  if (sentAt) {
    return { state: 'ENVIADO', sentAt, respondedAt: null, lastChannel };
  }
  return { state: 'FALTA_ENVIAR', sentAt: null, respondedAt: null, lastChannel: null };
}

export function deriveFlowStatusFromTimeline(events: CanonicalTimelineEvent[], flow: string): FlowStatus {
  const sentEvents = events
    .filter((event) =>
      event.source === 'adminLog'
      && event.metadata?.flow === flow
      && typeof event.metadata?.channel === 'string'
      && event.title === 'Comunicació enviada'
    )
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));

  const respondedEvents = events
    .filter((event) =>
      event.source === 'adminLog'
      && event.metadata?.flow === flow
      && event.title === 'Resposta del client'
    )
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));

  const sentAt = sentEvents[0] ? parseEventDate(sentEvents[0].occurredAt) : null;
  const respondedAt = respondedEvents[0] ? parseEventDate(respondedEvents[0].occurredAt) : null;
  const lastChannel = sentEvents[0] && typeof sentEvents[0].metadata?.channel === 'string'
    ? sentEvents[0].metadata.channel
    : null;

  if (respondedAt) return { state: 'RESPONDIDO', sentAt, respondedAt, lastChannel };
  if (sentAt) return { state: 'ENVIADO', sentAt, respondedAt: null, lastChannel };
  return { state: 'FALTA_ENVIAR', sentAt: null, respondedAt: null, lastChannel: null };
}

export function buildRecentCommRowsFromTimeline(
  events: CanonicalTimelineEvent[],
  limit: number = 12,
): CommHistoryRow[] {
  return events
    .filter((event) =>
      event.source === 'adminLog'
      && (event.title === 'Comunicació enviada' || event.title === 'Resposta del client')
      && typeof event.metadata?.flow === 'string'
    )
    .slice(0, limit)
    .map((event) => ({
      id: event.id,
      createdAt: parseEventDate(event.occurredAt) ?? new Date(event.occurredAt),
      action: event.title === 'Resposta del client' ? 'COMM_RESPONDED' : 'COMM_SENT',
      flow: typeof event.metadata?.flow === 'string' ? event.metadata.flow : '-',
      channel: typeof event.metadata?.channel === 'string' ? event.metadata.channel : '-',
    }));
}
