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
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';

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

function buildProposalOriginLinks(proposal: ProposalDTO): Array<{ label: string; href: string }> {
  return [
    proposal.customerId ? { label: 'Client origen', href: buildCustomerHubHref(proposal.customerId) } : null,
    proposal.leadId ? { label: 'Entrada origen', href: buildLeadWorkspaceHref(proposal.leadId) } : null,
    proposal.bookingId ? { label: 'Reserva origen', href: buildBookingHref(proposal.bookingId) } : null,
  ].filter((link): link is { label: string; href: string } => Boolean(link));
}

export function buildCustomerBusinessTimelineEvents(input: BusinessTimelineInput): TimelineEventDTO[] {
  const events: TimelineEventDTO[] = [];
  const bookingStatusLabel = (status: string) => labelEstatReserva(status).toLowerCase();

  for (const p of input.proposals) {
    const originLinks = buildProposalOriginLinks(p);
    events.push({
      id: `proposal:${p.id}:created`,
      type: 'PROPOSAL_CREATED',
      at: p.createdAt,
      title: `Pressupost creat (${p.reference})`,
      link: { label: 'Obrir', href: `/admin/presupuestos?proposalId=${p.id}` },
      ...(originLinks.length > 0 ? { originLinks } : {}),
    });
    if (p.sentAt) {
      events.push({
        id: `proposal:${p.id}:sent`,
        type: 'PROPOSAL_SENT',
        at: p.sentAt,
        title: `Pressupost enviat (${p.reference})`,
        link: { label: 'Obrir pressupost', href: `/admin/presupuestos?proposalId=${p.id}` },
        ...(originLinks.length > 0 ? { originLinks } : {}),
      });
    }
    if (p.acceptedAt) {
      events.push({
        id: `proposal:${p.id}:accepted`,
        type: 'PROPOSAL_ACCEPTED',
        at: p.acceptedAt,
        title: `Pressupost acceptat (${p.reference})`,
        link: { label: 'Obrir pressupost', href: `/admin/presupuestos?proposalId=${p.id}` },
        ...(originLinks.length > 0 ? { originLinks } : {}),
      });
    }
    if (p.contractSentAt && p.contractPdfUrl && p.contractStatus !== 'CANCELLED' && !p.contractSignedAt) {
      events.push({
        id: `proposal:${p.id}:contract-sent`,
        type: 'ACTIVITY',
        at: p.contractSentAt,
        title: `Contracte enviat (${p.contractReference || p.reference})`,
        meta: {
          documentType: 'CONTRACT',
          contractReference: p.contractReference || null,
          contractStatus: p.contractStatus || null,
          contractPdfUrl: p.contractPdfUrl,
        },
        link: { label: 'Obrir PDF contracte', href: p.contractPdfUrl },
        ...(originLinks.length > 0 ? { originLinks } : {}),
      });
    }
    if (p.contractSignedAt) {
      events.push({
        id: `proposal:${p.id}:contract-signed`,
        type: 'ACTIVITY',
        at: p.contractSignedAt,
        title: `Contracte signat (${p.contractReference || p.reference})`,
        meta: {
          documentType: 'CONTRACT',
          contractReference: p.contractReference || null,
          contractStatus: p.contractStatus || null,
          ...(p.contractPdfUrl ? { contractPdfUrl: p.contractPdfUrl } : {}),
        },
        link: p.contractPdfUrl
          ? { label: 'Obrir PDF signat', href: p.contractPdfUrl }
          : { label: 'Obrir contracte', href: `/admin/presupuestos?proposalId=${p.id}` },
        ...(originLinks.length > 0 ? { originLinks } : {}),
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
      link: { label: 'Veure reserva', href: buildBookingHref(b.id) },
    });

    if (b.postEventReport) {
      const isCompleted = b.postEventReport.status === 'COMPLETED';
      events.push({
        id: `booking:${b.id}:post-event-report`,
        type: 'ACTIVITY',
        at: b.postEventReport.completedAt || b.postEventReport.createdAt,
        title: `${isCompleted ? 'Informe post-event completat' : 'Informe post-event creat'} (${b.reference || b.id.slice(0, 8)})`,
        meta: {
          documentType: 'POST_EVENT_REPORT',
          reportId: b.postEventReport.id,
          status: b.postEventReport.status,
          soundQuality: b.postEventReport.soundQuality ?? null,
          maxDancefloor: b.postEventReport.maxDancefloor ?? null,
          hadIncidents: b.postEventReport.hadIncidents ?? false,
        },
        link: { label: 'Veure post-event', href: buildBookingHref(b.id, 'sec-post-event') },
      });
    }

    for (const invoice of b.invoices ?? []) {
      const documentHref = invoice.pdfUrl || invoice.holdedInvoiceUrl;
      if (invoice.status === 'CANCELLED' || !documentHref) continue;
      events.push({
        id: `booking:${b.id}:invoice:${invoice.id}:document`,
        type: 'ACTIVITY',
        at: invoice.createdAt,
        title: `Factura disponible (${invoice.reference})`,
        meta: {
          documentType: 'INVOICE',
          invoiceId: invoice.id,
          reference: invoice.reference,
          status: invoice.status,
          bookingId: b.id,
          bookingReference: b.reference ?? null,
          total: invoice.total,
          ...(invoice.pdfUrl ? { pdfUrl: invoice.pdfUrl } : {}),
          ...(invoice.holdedInvoiceUrl ? { holdedInvoiceUrl: invoice.holdedInvoiceUrl } : {}),
        },
        link: {
          label: invoice.pdfUrl ? 'Obrir PDF factura' : 'Obrir factura Holded',
          href: documentHref,
        },
      });
    }

    for (const deliveryNote of b.deliveryNotes ?? []) {
      if (deliveryNote.status !== 'SIGNED' || !deliveryNote.pdfUrl) continue;
      events.push({
        id: `booking:${b.id}:delivery-note:${deliveryNote.id}:signed`,
        type: 'ACTIVITY',
        at: deliveryNote.signedAt || deliveryNote.createdAt,
        title: `Albarà signat (${deliveryNote.reference})`,
        meta: {
          documentType: 'DELIVERY_NOTE',
          deliveryNoteId: deliveryNote.id,
          reference: deliveryNote.reference,
          bookingId: b.id,
          bookingReference: b.reference ?? null,
          signedAt: deliveryNote.signedAt ?? null,
          pdfUrl: deliveryNote.pdfUrl,
        },
        link: { label: 'Obrir PDF albarà', href: deliveryNote.pdfUrl },
      });
    }

    if (b.clientSurvey) {
      events.push({
        id: `booking:${b.id}:client-survey`,
        type: 'ACTIVITY',
        at: b.clientSurvey.submittedAt,
        title: `Enquesta post-event rebuda (${b.reference || b.id.slice(0, 8)})`,
        meta: {
          documentType: 'CLIENT_SURVEY',
          surveyId: b.clientSurvey.id,
          overallRating: b.clientSurvey.overallRating,
          npsScore: b.clientSurvey.npsScore,
          testimonialPermission: b.clientSurvey.testimonialPermission,
          createdTestimonialId: b.clientSurvey.createdTestimonialId ?? null,
        },
        link: { label: 'Veure post-event', href: buildBookingHref(b.id, 'sec-post-event') },
      });
    }
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
