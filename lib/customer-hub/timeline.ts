import type { BookingDTO, MessageDTO, ProposalDTO, TaskDTO, TimelineEventDTO } from './dto';
import { labelEstatReserva } from './labels';
import {
  canonicalEventsToTimeline,
  type CanonicalTimelineEvent,
  mapAdminLogToCanonicalEvent,
  mapCustomerActivityToCanonicalEvent,
  mapLeadActivityToCanonicalEvent,
} from '@/lib/services/timelineQueryService';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';

type BuildTimelineInput = {
  proposals: ProposalDTO[];
  bookings: BookingDTO[];
  tasks: TaskDTO[];
  messages: MessageDTO[];
  customerActivities: Array<{ id: string; action: string; createdAt: Date; details?: Record<string, unknown> | null }>;
  leadActivities: Array<{ id: string; type: string; title?: string | null; description?: string | null; createdAt: Date; createdBy?: string | null; leadId: string }>;
  adminLogs?: Array<{ id: string; action: string; entity: string; entityId?: string | null; details?: Record<string, unknown> | null; createdAt: Date; userId?: string | null }>;
  canonicalEvents?: CanonicalTimelineEvent[];
};

type BusinessTimelineInput = Pick<BuildTimelineInput, 'proposals' | 'bookings' | 'tasks' | 'messages'>;
type ActivityTimelineInput = Pick<BuildTimelineInput, 'customerActivities' | 'leadActivities' | 'adminLogs' | 'canonicalEvents'>;

export function buildCustomerBusinessTimelineEvents(input: BusinessTimelineInput): TimelineEventDTO[] {
  const events: TimelineEventDTO[] = [];
  const bookingStatusLabel = (status: string) => labelEstatReserva(status).toLowerCase();

  for (const p of input.proposals) {
    events.push({
      id: `proposal:${p.id}:created`,
      type: 'PROPOSAL_CREATED',
      at: p.createdAt,
      title: `Pressupost creat (${p.reference})`,
      link: { label: 'Obrir', href: `/admin/presupuestos?proposalId=${p.id}` },
    });
    if (p.sentAt) {
      events.push({
        id: `proposal:${p.id}:sent`,
        type: 'PROPOSAL_SENT',
        at: p.sentAt,
        title: `Pressupost enviat (${p.reference})`,
      });
    }
    if (p.acceptedAt) {
      events.push({
        id: `proposal:${p.id}:accepted`,
        type: 'PROPOSAL_ACCEPTED',
        at: p.acceptedAt,
        title: `Pressupost acceptat (${p.reference})`,
      });
    }
  }

  for (const b of input.bookings) {
    if (!b.date) continue;
    events.push({
      id: `booking:${b.id}:created`,
      type: b.status === 'CONFIRMED' || b.status === 'COMPLETED' ? 'BOOKING_CONFIRMED' : 'BOOKING_CREATED',
      at: b.date,
      title: `Reserva ${b.reference || b.id.slice(0, 8)} · ${bookingStatusLabel(b.status)}`,
      link: { label: 'Veure reserva', href: `/admin/bookings/${b.id}` },
    });
  }

  for (const t of input.tasks) {
    events.push({
      id: `task:${t.id}`,
      type: t.done ? 'TASK_DONE' : 'TASK_CREATED',
      at: t.dueDate || new Date().toISOString(),
      title: `${t.done ? 'Tasca completada' : 'Tasca creada'}: ${t.title}`,
      link: t.leadId ? { label: 'Veure entrada', href: buildLeadWorkspaceHref(t.leadId) } : undefined,
    });
  }

  for (const m of input.messages) {
    const channelType = m.channel === 'NOTE' ? 'NOTE_ADDED'
      : m.channel === 'WHATSAPP' ? 'WHATSAPP_SENT'
      : m.channel === 'CALL' ? 'PHONE_CALL'
      : m.direction === 'INBOUND' ? 'EMAIL_RECEIVED'
      : 'MESSAGE_SENT';
    const channelIcon = m.channel === 'WHATSAPP' ? 'WhatsApp: '
      : m.channel === 'CALL' ? 'Trucada: '
      : m.direction === 'INBOUND' ? 'Email rebut: '
      : '';
    events.push({
      id: `msg:${m.id}`,
      type: channelType,
      at: m.sentAt || m.createdAt,
      title: `${channelIcon}${m.subject || m.bodyPreview || 'Comunicació'}`,
      meta: {
        channel: m.channel,
        direction: m.direction || null,
        preview: m.bodyPreview || null,
      },
      link: m.leadId ? { label: 'Veure entrada', href: buildLeadWorkspaceHref(m.leadId) } : undefined,
    });
  }

  return events;
}

export function buildCustomerActivityTimelineEvents(input: ActivityTimelineInput): TimelineEventDTO[] {
  const useCanonicalActivityEvents = Array.isArray(input.canonicalEvents) && input.canonicalEvents.length > 0;

  return useCanonicalActivityEvents
    ? canonicalEventsToTimeline(input.canonicalEvents || [])
    : canonicalEventsToTimeline([
        ...input.customerActivities.map((activity) => mapCustomerActivityToCanonicalEvent({
          id: activity.id,
          action: activity.action,
          createdAt: activity.createdAt,
          details: activity.details ?? null,
        })),
        ...input.leadActivities.map((activity) => mapLeadActivityToCanonicalEvent(activity)),
        ...(input.adminLogs || []).map((log) => mapAdminLogToCanonicalEvent({
          id: log.id,
          action: log.action,
          entity: log.entity,
          entityId: log.entityId ?? null,
          details: log.details ?? null,
          createdAt: log.createdAt,
          userId: log.userId ?? null,
        })),
      ]);
}

export function buildTimeline(input: BuildTimelineInput): TimelineEventDTO[] {
  const events = [
    ...buildCustomerBusinessTimelineEvents(input),
    ...buildCustomerActivityTimelineEvents(input),
  ];
  events.sort((a, b) => (a.at < b.at ? 1 : -1));
  return events.slice(0, 250);
}
