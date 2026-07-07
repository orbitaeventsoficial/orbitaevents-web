import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { ADMIN_ACTIVITY_ACTION_META, ADMIN_ACTIVITY_CATEGORY_MAP } from '@/lib/constants/admin';
import type { TimelineEventDTO } from '@/lib/customer-hub/dto';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';

export type CanonicalTimelineEvent = {
  id: string;
  source: 'customerActivity' | 'leadActivity' | 'adminLog';
  entityType: 'customer' | 'lead' | 'booking' | 'proposal' | 'task' | 'system' | 'other';
  entityId?: string | null;
  kind: 'note' | 'message' | 'task' | 'proposal' | 'booking' | 'system' | 'crud' | 'activity';
  title: string;
  body?: string;
  actor?: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
  link?: { label: string; href: string };
  timelineType: TimelineEventDTO['type'];
};

export type CanonicalCommunicationMetrics = {
  commSent: number;
  commResponded: number;
  responseRate: number;
};

export type CommercialSequenceMetrics = {
  sequenceExec: number;
};

export type CanonicalAdminActivityLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  category: string;
  createdAt: string;
  timeline: CanonicalTimelineEvent;
};

export type CanonicalAdminActivityCategoryStats = {
  total: number;
  actions: Record<string, number>;
};

export type CanonicalAdminActivityPageResult = {
  logs: CanonicalAdminActivityLog[];
  total: number;
  stats: Record<string, CanonicalAdminActivityCategoryStats>;
  page: number;
  pages: number;
};

type CustomerActivityLike = {
  id: string;
  action: string;
  createdAt: Date;
  details?: unknown;
};

type LeadActivityLike = {
  id: string;
  type: string;
  title?: string | null;
  description?: string | null;
  createdAt: Date;
  createdBy?: string | null;
  leadId: string;
  metadata?: unknown;
};

type AdminLogLike = {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: unknown;
  createdAt: Date;
  userId?: string | null;
};

type TimelineMetadata = Record<string, unknown> | undefined;

function mapCustomerActionToTimelineType(action: string): TimelineEventDTO['type'] {
  if (action === 'NOTE_ADDED') return 'NOTE_ADDED';
  if (action === 'MESSAGE_SENT') return 'MESSAGE_SENT';
  if (action === 'TASK_CREATED') return 'TASK_CREATED';
  if (action === 'TASK_DONE') return 'TASK_DONE';
  if (action === 'PROPOSAL_SENT') return 'PROPOSAL_SENT';
  if (action === 'BOOKING_CONFIRMED') return 'BOOKING_CONFIRMED';
  return 'ACTIVITY';
}

function labelPostEventDecision(metadata: TimelineMetadata): string {
  const actionKey = getMetadataValue(metadata, 'actionKey');
  if (actionKey === 'testimonial') return 'Testimoni sol.licitat';
  if (actionKey === 'referral_ask') return 'Referral sol.licitat';
  if (actionKey === 'social_post') return 'Social preparat';
  return 'Decisio post-event registrada';
}

function truncateTimelineText(value: string, maxLength = 160): string {
  const clean = value.trim().replace(/\s+/g, ' ');
  return clean.length > maxLength ? `${clean.slice(0, maxLength - 1)}…` : clean;
}

function labelCustomerAction(action: string, metadata?: TimelineMetadata): string {
  if (action === 'NOTE_ADDED') return 'Nota interna afegida';
  if (action === 'MESSAGE_SENT') return 'Missatge enviat';
  if (action === 'TASK_CREATED') return 'Tasca creada';
  if (action === 'TASK_DONE') return 'Tasca completada';
  if (action === 'PROPOSAL_SENT') return 'Pressupost enviat';
  if (action === 'BOOKING_CONFIRMED') return 'Reserva confirmada';
  if (action === 'POST_EVENT_RECURRENCE_DECIDED') return labelPostEventDecision(metadata);
  return action;
}

function describeCustomerActivity(action: string, metadata?: TimelineMetadata): string | undefined {
  if (action !== 'POST_EVENT_RECURRENCE_DECIDED') return undefined;
  const bookingRef = getMetadataValue(metadata, 'bookingRef');
  const safety = getMetadataValue(metadata, 'safety');
  const draft = getMetadataValue(metadata, 'draft');
  const socialPostId = getMetadataValue(metadata, 'socialPostId');
  const safetyLabel = safety === 'DECIDED_NOT_SENT'
    ? 'Registrat, no enviat'
    : safety === 'DRAFT_NOT_PUBLISHED'
      ? 'Esborrany social, no publicat'
      : safety;
  return [
    bookingRef ? `Ref. ${bookingRef}` : null,
    safetyLabel,
    safety === 'DRAFT_NOT_PUBLISHED' && socialPostId ? `Esborrany social ${socialPostId}` : null,
    draft ? `Esborrany: ${truncateTimelineText(draft)}` : null,
  ].filter(Boolean).join(' · ') || undefined;
}

function mapAdminEntityToKind(entity: string): CanonicalTimelineEvent['kind'] {
  if (entity === 'booking') return 'booking';
  if (entity === 'proposal') return 'proposal';
  if (entity === 'task') return 'task';
  return 'system';
}

function mapAdminEntityToType(entity: string): CanonicalTimelineEvent['entityType'] {
  if (entity === 'booking') return 'booking';
  if (entity === 'proposal') return 'proposal';
  if (entity === 'task') return 'task';
  if (entity === 'lead') return 'lead';
  if (entity === 'customer') return 'customer';
  if (entity === 'system') return 'system';
  return 'other';
}

function getMetadataValue(metadata: TimelineMetadata, key: string): string | undefined {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function getMetadataNumber(metadata: TimelineMetadata, key: string): number | undefined {
  const value = Number(metadata?.[key]);
  return Number.isFinite(value) ? value : undefined;
}

function getMetadataArray(metadata: TimelineMetadata, key: string): string[] {
  const value = metadata?.[key];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function getEntityLabel(entity: string): string {
  if (entity === 'automation') return 'automatització';
  if (entity === 'pricing') return 'preus';
  if (entity === 'booking') return 'reserva';
  if (entity === 'proposal') return 'pressupost';
  if (entity === 'dossier') return 'dossier';
  if (entity === 'task') return 'tasca';
  if (entity === 'lead') return 'entrada';
  if (entity === 'customer') return 'client';
  if (entity === 'system') return 'sistema';
  return entity;
}

function labelAdminAction(log: AdminLogLike, metadata: TimelineMetadata): string {
  const adminActionMeta = ADMIN_ACTIVITY_ACTION_META[log.action];
  if (adminActionMeta?.label) {
    return adminActionMeta.label;
  }

  if (log.action === 'LEAD_CONVERTED') {
    return 'Lead convertit a client';
  }

  if (log.entity === 'booking') {
    if (log.action === 'STATUS_CHANGE') return "Canvi d'estat de la reserva";
    if (log.action === 'CREATE') return 'Reserva creada';
    if (log.action === 'UPDATE') return 'Reserva actualitzada';
    if (log.action === 'DELETE') return 'Reserva eliminada';
    if (log.action === 'COMM_SENT') return 'Comunicació enviada';
    if (log.action === 'COMM_RESPONDED') return 'Resposta del client';
  }

  if (log.entity === 'proposal') {
    if (log.action === 'CREATE') return 'Pressupost creat';
    if (log.action === 'SEND' || log.action === 'COMM_SENT') return 'Pressupost enviat';
    if (log.action === 'SIGN') return 'Pressupost signat';
  }

  if (log.entity === 'task') {
    if (log.action === 'CREATE') return 'Tasca creada';
    if (log.action === 'UPDATE') return 'Tasca actualitzada';
    if (log.action === 'DELETE') return 'Tasca tancada';
  }

  const reference = getMetadataValue(metadata, 'reference');
  if (reference) return `${getEntityLabel(log.entity)} ${reference}`;
  return `${log.action} · ${getEntityLabel(log.entity)}`;
}

function describeAdminLog(log: AdminLogLike, metadata: TimelineMetadata): string | undefined {
  const from = getMetadataValue(metadata, 'from');
  const to = getMetadataValue(metadata, 'to');
  if (log.action === 'STATUS_CHANGE' && from && to) return `${from} -> ${to}`;

  const documentDescription = describeDocumentAdminLog(log, metadata);
  if (documentDescription) return documentDescription;

  const fields = getMetadataArray(metadata, 'fields');
  if (log.action === 'UPDATE' && fields.length > 0) return `Camps: ${fields.join(', ')}`;

  const flow = getMetadataValue(metadata, 'flow');
  const channel = getMetadataValue(metadata, 'channel');
  if (flow || channel) return [flow, channel].filter(Boolean).join(' · ');

  const message = getMetadataValue(metadata, 'message');
  if (message) return message;

  const leadName = getMetadataValue(metadata, 'leadName') || getMetadataValue(metadata, 'name');
  if (log.action === 'LEAD_CONVERTED' && leadName) return leadName;

  const category = getMetadataValue(metadata, 'category');
  if (category === 'finance') return 'Finances';
  if (category === 'config') return 'Configuració';

  const reference = getMetadataValue(metadata, 'reference');
  if (reference && log.entity !== 'proposal') return `Ref. ${reference}`;

  return getEntityLabel(log.entity);
}

function describeDocumentAdminLog(log: AdminLogLike, metadata: TimelineMetadata): string | undefined {
  if (!log.action.startsWith('DOCUMENT_')) return undefined;
  const reference = getMetadataValue(metadata, 'proposalReference')
    || getMetadataValue(metadata, 'contractReference')
    || getMetadataValue(metadata, 'reference');
  const to = getMetadataValue(metadata, 'to');
  const source = getMetadataValue(metadata, 'source');
  const total = getMetadataNumber(metadata, 'total');
  return [
    reference ? `Ref. ${reference}` : null,
    to ? `a ${to}` : null,
    total !== undefined ? `${total.toFixed(2)} EUR` : null,
    source,
  ].filter(Boolean).join(' · ') || undefined;
}

function mapAdminLogToTimelineType(log: AdminLogLike): TimelineEventDTO['type'] {
  if (log.entity === 'booking') {
    return log.action === 'STATUS_CHANGE' || log.action === 'CREATE' ? 'BOOKING_CONFIRMED' : 'BOOKING_CREATED';
  }
  if (log.entity === 'proposal' && log.action === 'CREATE') return 'PROPOSAL_CREATED';
  if (log.entity === 'proposal' && (log.action === 'SEND' || log.action === 'COMM_SENT')) return 'PROPOSAL_SENT';
  if (log.entity === 'proposal' && log.action === 'DOCUMENT_PROPOSAL_SENT') return 'PROPOSAL_SENT';
  if (log.entity === 'task' && log.action === 'DELETE') return 'TASK_DONE';
  return 'ACTIVITY';
}

function isContractDocumentLog(log: AdminLogLike, metadata: TimelineMetadata): boolean {
  const documentType = getMetadataValue(metadata, 'documentType')?.toUpperCase();
  return log.action.startsWith('DOCUMENT_CONTRACT_')
    || documentType === 'CONTRACT'
    || Boolean(getMetadataValue(metadata, 'contractReference'));
}

function isProposalDocumentLog(log: AdminLogLike, metadata: TimelineMetadata): boolean {
  const documentType = getMetadataValue(metadata, 'documentType')?.toUpperCase();
  return log.action === 'DOCUMENT_PROPOSAL_SENT'
    || documentType === 'PROPOSAL'
    || Boolean(getMetadataValue(metadata, 'proposalReference'));
}

function buildAdminLogLink(log: AdminLogLike, metadata: TimelineMetadata): CanonicalTimelineEvent['link'] {
  if (!log.entityId) return undefined;
  if (log.entity === 'booking') return { label: 'Veure reserva', href: buildBookingHref(log.entityId) };
  if (log.entity === 'lead') return { label: 'Veure entrada', href: buildLeadWorkspaceHref(log.entityId) };
  if (log.entity === 'customer') return { label: 'Veure client', href: buildCustomerHubHref(log.entityId) };
  if (log.entity === 'proposal') {
    if (isContractDocumentLog(log, metadata)) {
      return { label: 'Obrir contracte', href: `/admin/presupuestos?proposalId=${log.entityId}` };
    }
    if (isProposalDocumentLog(log, metadata)) {
      return { label: 'Obrir pressupost', href: `/admin/presupuestos?proposalId=${log.entityId}` };
    }
    return { label: 'Obrir', href: `/admin/presupuestos?proposalId=${log.entityId}` };
  }
  if (log.entity === 'dossier') return { label: 'Obrir dossiers', href: '/admin/dossiers' };
  return undefined;
}

export function mapCustomerActivityToCanonicalEvent(activity: CustomerActivityLike): CanonicalTimelineEvent {
  const metadata = activity.details && typeof activity.details === 'object'
    ? (activity.details as Record<string, unknown>)
    : undefined;

  return {
    id: `ca:${activity.id}`,
    source: 'customerActivity',
    entityType: 'customer',
    kind: 'activity',
    title: labelCustomerAction(activity.action, metadata),
    body: describeCustomerActivity(activity.action, metadata),
    occurredAt: activity.createdAt.toISOString(),
    metadata,
    timelineType: mapCustomerActionToTimelineType(activity.action),
  };
}

export function mapLeadActivityToCanonicalEvent(activity: LeadActivityLike): CanonicalTimelineEvent {
  const timelineType = activity.type === 'EMAIL'
    ? 'MESSAGE_SENT'
    : activity.type === 'WHATSAPP'
      ? 'WHATSAPP_SENT'
      : activity.type === 'CALL'
        ? 'PHONE_CALL'
        : activity.type === 'NOTE'
          ? 'NOTE_ADDED'
          : activity.type === 'TASK'
            ? 'TASK_CREATED'
            : 'ACTIVITY';

  return {
    id: `la:${activity.id}`,
    source: 'leadActivity',
    entityType: 'lead',
    entityId: activity.leadId,
    kind: timelineType === 'MESSAGE_SENT' || timelineType === 'WHATSAPP_SENT' || timelineType === 'PHONE_CALL' ? 'message' : timelineType === 'TASK_CREATED' ? 'task' : 'activity',
    title: activity.title || (activity.type === 'LEAD_CONVERTED' ? 'Lead convertit a client' : activity.type),
    body: activity.description || undefined,
    actor: activity.createdBy || undefined,
    occurredAt: activity.createdAt.toISOString(),
    metadata: activity.metadata && typeof activity.metadata === 'object'
      ? (activity.metadata as Record<string, unknown>)
      : undefined,
    timelineType,
    link: { label: 'Veure entrada', href: buildLeadWorkspaceHref(activity.leadId) },
  };
}

export function mapAdminLogToCanonicalEvent(log: AdminLogLike): CanonicalTimelineEvent {
  const details = log.details && typeof log.details === 'object'
    ? (log.details as Record<string, unknown>)
    : undefined;

  return {
    id: `al:${log.id}`,
    source: 'adminLog',
    entityType: mapAdminEntityToType(log.entity),
    entityId: log.entityId,
    kind: mapAdminEntityToKind(log.entity),
    title: labelAdminAction(log, details),
    body: describeAdminLog(log, details),
    actor: log.userId || undefined,
    occurredAt: log.createdAt.toISOString(),
    metadata: details,
    timelineType: mapAdminLogToTimelineType(log),
    link: buildAdminLogLink(log, details),
  };
}

export function canonicalEventsToTimeline(events: CanonicalTimelineEvent[]): TimelineEventDTO[] {
  return events
    .map((event) => ({
      id: event.id,
      type: event.timelineType,
      at: event.occurredAt,
      title: event.title,
      meta: {
        source: event.source,
        entityType: event.entityType,
        entityId: event.entityId,
        kind: event.kind,
        actor: event.actor,
        ...(event.body ? { preview: event.body } : {}),
        ...(event.metadata || {}),
      },
      link: event.link,
    }))
    .sort((a, b) => (a.at < b.at ? 1 : -1));
}

export function summarizeCanonicalCommunicationMetrics(
  events: CanonicalTimelineEvent[]
): CanonicalCommunicationMetrics {
  const commResponded = events.filter(
    (event) => event.title === 'Resposta rebuda' || event.title === 'Resposta del client'
  ).length;
  const commSent = Math.max(events.length - commResponded, 0);

  return {
    commSent,
    commResponded,
    responseRate: commSent > 0 ? commResponded / commSent : 0,
  };
}

export async function fetchRecentCanonicalEvents(
  limit: number = DEFAULT_FETCH_LIMIT
): Promise<CanonicalTimelineEvent[]> {
  const [customerActivities, leadActivities, adminLogs] = await Promise.all([
    safeFetch(
      () =>
        prisma.customerActivity.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
      [],
      'fetchRecentCanonicalEvents:customerActivity'
    ),
    safeFetch(
      () =>
        prisma.leadActivity.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
      [],
      'fetchRecentCanonicalEvents:leadActivity'
    ),
    safeFetch(
      () =>
        prisma.adminLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
      [],
      'fetchRecentCanonicalEvents:adminLog'
    ),
  ]);

  const events: CanonicalTimelineEvent[] = [
    ...customerActivities.map((activity) =>
      mapCustomerActivityToCanonicalEvent({
        id: activity.id,
        action: activity.action,
        createdAt: activity.createdAt,
        details: activity.details ?? undefined,
      })
    ),
    ...leadActivities.map((activity) =>
      mapLeadActivityToCanonicalEvent({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        createdAt: activity.createdAt,
        createdBy: activity.createdBy,
        leadId: activity.leadId,
        metadata: activity.metadata ?? undefined,
      })
    ),
    ...adminLogs.map((logRow) =>
      mapAdminLogToCanonicalEvent({
        id: logRow.id,
        action: logRow.action,
        entity: logRow.entity,
        entityId: logRow.entityId ?? null,
        details: logRow.details ?? undefined,
        createdAt: logRow.createdAt,
        userId: logRow.userId ?? null,
      })
    ),
  ];

  return sortCanonicalDesc(events).slice(0, limit);
}

export async function fetchRecentCanonicalCommunicationMetrics(
  since: Date
): Promise<CanonicalCommunicationMetrics> {
  const adminLogs = await safeFetch(
    () =>
      prisma.adminLog.findMany({
        where: {
          action: { in: ['COMM_SENT', 'COMM_RESPONDED'] },
          createdAt: { gte: since },
        },
        orderBy: { createdAt: 'desc' },
      }),
    [],
    'fetchRecentCanonicalCommunicationMetrics:adminLog'
  );

  const events = adminLogs.map((logRow) =>
    mapAdminLogToCanonicalEvent({
      id: logRow.id,
      action: logRow.action,
      entity: logRow.entity,
      entityId: logRow.entityId ?? null,
      details: logRow.details ?? undefined,
      createdAt: logRow.createdAt,
      userId: logRow.userId ?? null,
    })
  );

  return summarizeCanonicalCommunicationMetrics(events);
}

export async function fetchRecentCommercialSequenceMetrics(
  since: Date
): Promise<CommercialSequenceMetrics> {
  const sequenceExec = await safeFetch(
    () =>
      prisma.adminLog.count({
        where: {
          action: 'COMM_SEQUENCE_EXEC',
          createdAt: { gte: since },
        },
      }),
    0,
    'fetchRecentCommercialSequenceMetrics:adminLogCount'
  );

  return { sequenceExec };
}

export async function fetchCanonicalCommunicationEventsForBookings(
  bookingIds: string[],
  limit: number = 2000
): Promise<Record<string, CanonicalTimelineEvent[]>> {
  if (bookingIds.length === 0) return {};

  const adminLogs = await safeFetch(
    () =>
      prisma.adminLog.findMany({
        where: {
          entity: 'booking',
          entityId: { in: bookingIds },
          action: { in: ['COMM_SENT', 'COMM_RESPONDED'] },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    [],
    'fetchCanonicalCommunicationEventsForBookings:adminLog'
  );

  return adminLogs.reduce<Record<string, CanonicalTimelineEvent[]>>((acc, logRow) => {
    const bookingId = logRow.entityId;
    if (!bookingId) return acc;
    if (!acc[bookingId]) acc[bookingId] = [];
    acc[bookingId].push(
      mapAdminLogToCanonicalEvent({
        id: logRow.id,
        action: logRow.action,
        entity: logRow.entity,
        entityId: bookingId,
        details: logRow.details ?? undefined,
        createdAt: logRow.createdAt,
        userId: logRow.userId ?? null,
      })
    );
    return acc;
  }, {});
}

export async function fetchCanonicalAdminActivityPage(options: {
  since: Date;
  category?: string | null;
  page?: number;
  limit?: number;
}): Promise<CanonicalAdminActivityPageResult> {
  const { since, category = 'all', page = 1, limit = 50 } = options;

  let actionFilter: string[] | undefined;
  if (category && category !== 'all') {
    actionFilter = Object.entries(ADMIN_ACTIVITY_CATEGORY_MAP)
      .filter(([, currentCategory]) => currentCategory === category)
      .map(([action]) => action);

    if (actionFilter.length === 0) {
      return { logs: [], total: 0, stats: {}, page, pages: 0 };
    }
  }

  const where = {
    createdAt: { gte: since },
    ...(actionFilter ? { action: { in: actionFilter } } : {}),
  };

  const [logs, total, statsByAction] = await Promise.all([
    safeFetch(
      () =>
        prisma.adminLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
      [],
      'fetchCanonicalAdminActivityPage:adminLog'
    ),
    safeFetch(
      () => prisma.adminLog.count({ where }),
      0,
      'fetchCanonicalAdminActivityPage:adminLogCount'
    ),
    safeFetch(
      () =>
        prisma.adminLog.groupBy({
          by: ['action'],
          where: { createdAt: { gte: since } },
          _count: true,
          orderBy: { _count: { action: 'desc' } },
        }),
      [] as Array<{ action: string; _count: number }>,
      'fetchCanonicalAdminActivityPage:adminLogStats'
    ),
  ]);

  const stats: Record<string, CanonicalAdminActivityCategoryStats> = {};
  for (const row of statsByAction) {
    const currentCategory = ADMIN_ACTIVITY_CATEGORY_MAP[row.action] || 'other';
    if (!stats[currentCategory]) stats[currentCategory] = { total: 0, actions: {} };
    stats[currentCategory].total += row._count;
    stats[currentCategory].actions[row.action] = row._count;
  }

  return {
    logs: logs.map((logRow) => {
      const details = logRow.details && typeof logRow.details === 'object'
        ? (logRow.details as Record<string, unknown>)
        : null;
      return {
        id: logRow.id,
        action: logRow.action,
        entity: logRow.entity,
        entityId: logRow.entityId ?? null,
        details,
        category: ADMIN_ACTIVITY_CATEGORY_MAP[logRow.action] || 'other',
        createdAt: logRow.createdAt.toISOString(),
        timeline: mapAdminLogToCanonicalEvent({
          id: logRow.id,
          action: logRow.action,
          entity: logRow.entity,
          entityId: logRow.entityId ?? null,
          details: logRow.details ?? undefined,
          createdAt: logRow.createdAt,
          userId: logRow.userId ?? null,
        }),
      };
    }),
    total,
    stats,
    page,
    pages: total > 0 ? Math.ceil(total / limit) : 0,
  };
}

const DEFAULT_FETCH_LIMIT = 120;

function sortCanonicalDesc(events: CanonicalTimelineEvent[]): CanonicalTimelineEvent[] {
  return events.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
}

async function safeFetch<T>(query: () => Promise<T>, fallback: T, context: string): Promise<T> {
  try {
    return await query();
  } catch (error) {
    log.error(`[timelineQueryService] ${context}`, error);
    return fallback;
  }
}

export async function fetchCanonicalEventsForCustomer(
  customerId: string,
  limit: number = DEFAULT_FETCH_LIMIT
): Promise<CanonicalTimelineEvent[]> {
  const [leads, bookings] = await Promise.all([
    safeFetch(
      () => prisma.lead.findMany({ where: { customerId }, select: { id: true } }),
      [] as Array<{ id: string }>,
      'fetchCanonicalEventsForCustomer:leads'
    ),
    safeFetch(
      () => prisma.booking.findMany({ where: { customerId }, select: { id: true } }),
      [] as Array<{ id: string }>,
      'fetchCanonicalEventsForCustomer:bookings'
    ),
  ]);

  const leadIds = leads.map((l) => l.id);
  const bookingIds = bookings.map((b) => b.id);

  const [customerActivities, leadActivities, adminLogs] = await Promise.all([
    safeFetch(
      () =>
        prisma.customerActivity.findMany({
          where: { customerId },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
      [],
      'fetchCanonicalEventsForCustomer:customerActivity'
    ),
    leadIds.length > 0
      ? safeFetch(
          () =>
            prisma.leadActivity.findMany({
              where: { leadId: { in: leadIds } },
              orderBy: { createdAt: 'desc' },
              take: limit,
            }),
          [],
          'fetchCanonicalEventsForCustomer:leadActivity'
        )
      : Promise.resolve([] as Awaited<ReturnType<typeof prisma.leadActivity.findMany>>),
    safeFetch(
      () =>
        prisma.adminLog.findMany({
          where: {
            OR: [
              { entity: 'customer', entityId: customerId },
              { entity: 'dossier', details: { path: ['customerId'], equals: customerId } },
              ...(leadIds.length > 0 ? [{ entity: 'lead', entityId: { in: leadIds } }] : []),
              ...leadIds.map((leadId) => ({ entity: 'dossier', details: { path: ['leadId'], equals: leadId } })),
              ...(bookingIds.length > 0 ? [{ entity: 'booking', entityId: { in: bookingIds } }] : []),
            ],
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
      [],
      'fetchCanonicalEventsForCustomer:adminLog'
    ),
  ]);

  const events: CanonicalTimelineEvent[] = [
    ...customerActivities.map((a) =>
      mapCustomerActivityToCanonicalEvent({
        id: a.id,
        action: a.action,
        createdAt: a.createdAt,
        details: a.details ?? undefined,
      })
    ),
    ...leadActivities.map((a) =>
      mapLeadActivityToCanonicalEvent({
        id: a.id,
        type: a.type,
        title: a.title,
        description: a.description,
        createdAt: a.createdAt,
        createdBy: a.createdBy,
        leadId: a.leadId,
        metadata: a.metadata ?? undefined,
      })
    ),
    ...adminLogs.map((logRow) =>
      mapAdminLogToCanonicalEvent({
        id: logRow.id,
        action: logRow.action,
        entity: logRow.entity,
        entityId: logRow.entityId ?? null,
        details: logRow.details ?? undefined,
        createdAt: logRow.createdAt,
        userId: logRow.userId ?? null,
      })
    ),
  ];

  return sortCanonicalDesc(events).slice(0, limit);
}

export async function fetchCanonicalEventsForLead(
  leadId: string,
  limit: number = DEFAULT_FETCH_LIMIT
): Promise<CanonicalTimelineEvent[]> {
  const [leadActivities, adminLogs] = await Promise.all([
    safeFetch(
      () =>
        prisma.leadActivity.findMany({
          where: { leadId },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
      [],
      'fetchCanonicalEventsForLead:leadActivity'
    ),
    safeFetch(
      () =>
        prisma.adminLog.findMany({
          where: {
            OR: [
              { entity: 'lead', entityId: leadId },
              { entity: 'dossier', details: { path: ['leadId'], equals: leadId } },
            ],
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
      [],
      'fetchCanonicalEventsForLead:adminLog'
    ),
  ]);

  const events: CanonicalTimelineEvent[] = [
    ...leadActivities.map((a) =>
      mapLeadActivityToCanonicalEvent({
        id: a.id,
        type: a.type,
        title: a.title,
        description: a.description,
        createdAt: a.createdAt,
        createdBy: a.createdBy,
        leadId: a.leadId,
        metadata: a.metadata ?? undefined,
      })
    ),
    ...adminLogs.map((logRow) =>
      mapAdminLogToCanonicalEvent({
        id: logRow.id,
        action: logRow.action,
        entity: logRow.entity,
        entityId: logRow.entityId ?? null,
        details: logRow.details ?? undefined,
        createdAt: logRow.createdAt,
        userId: logRow.userId ?? null,
      })
    ),
  ];

  return sortCanonicalDesc(events).slice(0, limit);
}

export async function fetchCanonicalEventsForBooking(
  bookingId: string,
  limit: number = DEFAULT_FETCH_LIMIT
): Promise<CanonicalTimelineEvent[]> {
  // Resolve the associated leadId (lightweight query)
  const booking = await safeFetch(
    () => prisma.booking.findUnique({
      where: { id: bookingId },
      select: { leadId: true },
    }),
    null,
    'fetchCanonicalEventsForBooking:bookingLookup'
  );

  const leadId = booking?.leadId ?? null;

  // Parallel: booking adminLogs + inventory adminLogs + lead activities (if lead exists)
  const [bookingLogs, inventoryLogs, leadActivities] = await Promise.all([
    safeFetch(
      () =>
        prisma.adminLog.findMany({
          where: { entity: 'booking', entityId: bookingId },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
      [],
      'fetchCanonicalEventsForBooking:adminLog'
    ),
    safeFetch(
      () =>
        prisma.adminLog.findMany({
          where: {
            entity: 'booking_inventory',
            details: { path: ['bookingId'], equals: bookingId },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
      [],
      'fetchCanonicalEventsForBooking:inventoryLog'
    ),
    leadId
      ? safeFetch(
          () =>
            prisma.leadActivity.findMany({
              where: { leadId },
              orderBy: { createdAt: 'desc' },
              take: limit,
            }),
          [],
          'fetchCanonicalEventsForBooking:leadActivity'
        )
      : Promise.resolve([]),
  ]);

  const events: CanonicalTimelineEvent[] = [
    ...bookingLogs.map((logRow) =>
      mapAdminLogToCanonicalEvent({
        id: logRow.id,
        action: logRow.action,
        entity: logRow.entity,
        entityId: logRow.entityId ?? null,
        details: logRow.details ?? undefined,
        createdAt: logRow.createdAt,
        userId: logRow.userId ?? null,
      })
    ),
    ...inventoryLogs.map((logRow) =>
      mapAdminLogToCanonicalEvent({
        id: logRow.id,
        action: logRow.action,
        entity: logRow.entity,
        entityId: logRow.entityId ?? null,
        details: logRow.details ?? undefined,
        createdAt: logRow.createdAt,
        userId: logRow.userId ?? null,
      })
    ),
    ...leadActivities.map((activity) =>
      mapLeadActivityToCanonicalEvent({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        createdAt: activity.createdAt,
        createdBy: activity.createdBy,
        leadId: leadId as string,
        metadata: activity.metadata ?? undefined,
      })
    ),
  ];

  return sortCanonicalDesc(events).slice(0, limit);
}
