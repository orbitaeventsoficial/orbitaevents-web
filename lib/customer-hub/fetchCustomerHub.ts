import type { CustomerDiscountCode, Proposal } from '@prisma/client';
import type { CustomerHubDTO, DiscountCodeDTO, HubStatus, LeadDTO, MessageDTO, TaskDTO } from './dto';
import { resolveActiveDocument } from './proposalActive';
import { buildTimeline } from './timeline';
import {
  type CustomerHubActivityLite,
  type CustomerHubTaskLite,
  fetchCustomerHubCollections,
  fetchCustomerHubCustomerBase,
  fetchCustomerHubLeads,
  resolveCustomerHubCustomerId,
} from './data';

function deriveHubStatus(input: {
  leadStatuses: string[];
  bookingStatuses: string[];
  manualStatus?: HubStatus | null;
}): HubStatus {
  if (input.manualStatus) return input.manualStatus;
  if (input.bookingStatuses.some((status) => status === 'COMPLETED')) return 'POSTEVENT';
  if (input.bookingStatuses.some((status) => status === 'CONFIRMED' || status === 'PREPARING')) return 'CONFIRMED';
  if (input.leadStatuses.some((status) => status === 'WON')) return 'CONFIRMED';
  if (input.leadStatuses.some((status) => status === 'NEGOTIATING' || status === 'QUOTE_SENT' || status === 'CONTACTED')) {
    return 'NEGOTIATION';
  }
  if (input.leadStatuses.some((status) => status === 'LOST')) return 'LOST';
  return 'LEAD';
}

export async function fetchCustomerHub(customerId: string): Promise<CustomerHubDTO> {
  const resolvedCustomerId = await resolveCustomerHubCustomerId(customerId);
  if (!resolvedCustomerId) throw new Error('Customer not found');

  const customerBase = await fetchCustomerHubCustomerBase(resolvedCustomerId);
  if (!customerBase) throw new Error('Customer not found');

  const leads = await fetchCustomerHubLeads(resolvedCustomerId);
  const leadIds = leads.map((lead) => lead.id);

  const { proposals, bookingsRows, customerTasks, activityLog, customerDiscountCodes } =
    await fetchCustomerHubCollections(resolvedCustomerId, leadIds);

  const proposalsMapped = proposals.map((proposal: Proposal) => ({
    id: proposal.id,
    reference: proposal.reference,
    status: proposal.status as 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED',
    total: Number(proposal.total || 0),
    createdAt: proposal.createdAt.toISOString(),
    sentAt: proposal.sentAt?.toISOString(),
    acceptedAt: proposal.acceptedAt?.toISOString(),
    snapshot: (proposal.snapshot as Record<string, unknown> | null) || undefined,
    contractReference: proposal.contractReference || null,
    contractStatus: proposal.contractStatus || null,
    contractSentAt: proposal.contractSentAt?.toISOString() || null,
    contractSignedAt: proposal.contractSignedAt?.toISOString() || null,
  }));

  const bookings = bookingsRows.map((bookingRow) => {
    let packName = bookingRow.pack?.slug || undefined;
    if (bookingRow.pack?.translations?.length) {
      const caTranslation = bookingRow.pack.translations.find((translation) => translation.locale === 'ca');
      const esTranslation = bookingRow.pack.translations.find((translation) => translation.locale === 'es');
      packName = caTranslation?.name || esTranslation?.name || packName;
    }

    return {
      id: bookingRow.id,
      reference: bookingRow.reference,
      date: bookingRow.eventDate?.toISOString(),
      startTime: bookingRow.eventStartTime || undefined,
      endTime: bookingRow.eventEndTime || undefined,
      status: bookingRow.status,
      location: bookingRow.eventLocation || undefined,
      venue: bookingRow.eventVenue || undefined,
      depositAmount: typeof bookingRow.depositAmount === 'number' ? bookingRow.depositAmount : undefined,
      totalAmount: typeof bookingRow.total === 'number' ? bookingRow.total : undefined,
      eventType: bookingRow.eventType || undefined,
      packName,
      guestCount: typeof bookingRow.guestCount === 'number' ? bookingRow.guestCount : undefined,
      depositPaid: bookingRow.depositPaid ?? undefined,
      remainingPaid: bookingRow.remainingPaid ?? undefined,
      discountCode: bookingRow.discountCode || undefined,
    };
  });

  const tasks: TaskDTO[] = customerTasks.length > 0
    ? customerTasks.map((task) => mapTask(task))
    : leads.flatMap((lead) => lead.tasks.map((task) => mapTask(task, lead.id)));

  const leadMessages: MessageDTO[] = leads.flatMap((lead) =>
    lead.activities
      .filter((activity) => ['EMAIL', 'NOTE', 'CALL', 'WHATSAPP'].includes(activity.type))
      .map((activity) => ({
        id: activity.id,
        channel:
          activity.type === 'EMAIL'
            ? 'EMAIL'
            : activity.type === 'WHATSAPP'
              ? 'WHATSAPP'
              : activity.type === 'CALL'
                ? 'CALL'
                : 'NOTE',
        subject: activity.title || undefined,
        bodyPreview: activity.description || undefined,
        createdAt: activity.createdAt.toISOString(),
        sentAt: activity.createdAt.toISOString(),
        leadId: lead.id,
      }))
  );

  const customerNotes: MessageDTO[] = activityLog.map((activity) => ({
    id: `ca-${activity.id}`,
    channel: 'NOTE',
    subject: activity.action,
    bodyPreview:
      activity.details && typeof activity.details === 'object'
        ? JSON.stringify(activity.details).slice(0, 160)
        : undefined,
    createdAt: activity.createdAt.toISOString(),
  }));

  const messages = [...leadMessages, ...customerNotes]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 120);

  const active = resolveActiveDocument(proposalsMapped);
  const activeProposal = active.proposalId
    ? proposalsMapped.find((proposal) => proposal.id === active.proposalId)
    : undefined;

  const totalQuoted = proposalsMapped.reduce((sum, proposal) => sum + (proposal.total || 0), 0);
  const totalPaid = bookingsRows.reduce((sum, bookingRow) => {
    let paid = 0;
    if (bookingRow.depositPaid && typeof bookingRow.depositAmount === 'number') paid += bookingRow.depositAmount;
    if (
      bookingRow.remainingPaid &&
      typeof bookingRow.total === 'number' &&
      typeof bookingRow.depositAmount === 'number'
    ) {
      paid += bookingRow.total - bookingRow.depositAmount;
    }
    return sum + paid;
  }, 0);

  const marginEstimated =
    activeProposal &&
    typeof activeProposal.snapshot?.costTotal === 'number' &&
    typeof activeProposal.snapshot?.total === 'number'
      ? Number(activeProposal.snapshot.total) - Number(activeProposal.snapshot.costTotal)
      : activeProposal &&
          typeof activeProposal.snapshot?.subtotal === 'number' &&
          typeof activeProposal.snapshot?.total === 'number'
        ? Number(activeProposal.snapshot.total) * 0.35
        : undefined;

  const nextEventDate = bookings
    .filter((booking) => booking.date && booking.status !== 'CANCELLED')
    .sort((a, b) => ((a.date || '') > (b.date || '') ? 1 : -1))[0]?.date;

  const status = deriveHubStatus({
    leadStatuses: leads.map((lead) => lead.status),
    bookingStatuses: bookingsRows.map((bookingRow) => bookingRow.status),
    manualStatus: resolveManualStatus(activityLog),
  });

  const timeline = buildTimeline({
    proposals: proposalsMapped,
    bookings,
    tasks,
    messages,
    customerActivities: activityLog.map((activity) => ({
      id: activity.id,
      action: activity.action,
      createdAt: activity.createdAt,
    })),
    leadActivities: leads.flatMap((lead) =>
      lead.activities.map((activity) => ({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        createdAt: activity.createdAt,
        leadId: lead.id,
      }))
    ),
  });

  const discountCodes: DiscountCodeDTO[] = customerDiscountCodes.map((discountCode: CustomerDiscountCode) => ({
    id: discountCode.id,
    code: discountCode.code,
    discountPercent: discountCode.discountPercent,
    validFrom: discountCode.validFrom?.toISOString() || '',
    validUntil: discountCode.validUntil?.toISOString() || '',
    maxUses: discountCode.maxUses,
    currentUses: discountCode.currentUses,
    sourceType: discountCode.sourceType,
    isActive: discountCode.isActive,
    usedAt: discountCode.usedAt?.toISOString(),
  }));

  const leadsDTO: LeadDTO[] = leads.map((lead) => ({
    id: lead.id,
    name: lead.name,
    email: lead.email,
    eventType: lead.eventType,
    eventDate: lead.eventDate?.toISOString(),
    status: lead.status,
    priority: lead.priority,
    createdAt: lead.createdAt.toISOString(),
    booking: lead.booking
      ? {
          id: lead.booking.id,
          reference: lead.booking.reference,
          status: lead.booking.status,
          total: lead.booking.total,
        }
      : undefined,
  }));

  return {
    customer: {
      id: customerBase.id,
      customerNumber: customerBase.customerNumber ?? null,
      name: customerBase.name,
      email: customerBase.email || undefined,
      phone: customerBase.phone || undefined,
      status,
      createdAt: customerBase.createdAt.toISOString(),
    },
    kpis: {
      nextEventDate,
      lastContactAt: messages[0]?.createdAt,
      totalQuoted,
      totalPaid,
      marginEstimated,
    },
    active,
    proposals: proposalsMapped,
    bookings,
    tasks,
    messages,
    timeline,
    discountCodes,
    leads: leadsDTO,
  };
}

function mapTask(task: CustomerHubTaskLite, leadIdOverride?: string): TaskDTO {
  return {
    id: task.id,
    title: task.title,
    dueDate: task.dueDate?.toISOString(),
    done: task.status === 'DONE',
    priority:
      task.priority === 'HIGH' || task.priority === 'MEDIUM' || task.priority === 'LOW'
        ? task.priority
        : undefined,
    leadId: leadIdOverride || task.leadId || undefined,
  };
}

function resolveManualStatus(activities: CustomerHubActivityLite[]): HubStatus | null {
  const lastStatusChange = activities.find((activity) => activity.action === 'STATUS_CHANGED');
  const details = lastStatusChange?.details;
  const raw =
    details && typeof details === 'object' && 'newStatus' in details
      ? (details as { newStatus?: string }).newStatus
      : undefined;
  if (!raw) return null;
  const allowed: HubStatus[] = ['LEAD', 'NEGOTIATION', 'CONFIRMED', 'POSTEVENT', 'LOST'];
  return allowed.includes(raw as HubStatus) ? (raw as HubStatus) : null;
}
