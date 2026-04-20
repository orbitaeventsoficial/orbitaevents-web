import type { CustomerDiscountCode, Proposal } from '@prisma/client';
import type { CustomerHubDTO, CustomerCommSummaryDTO, CustomerFollowUpSummaryDTO, DiscountCodeDTO, HubStatus, LeadDTO, MessageDTO, TaskDTO } from './dto';
import { resolveActiveDocument } from './proposalActive';
import { buildTimeline } from './timeline';
import { buildLeadCommercialBlocker } from './leadCommercialBlocker';
import { computeCustomerInsights } from '@/lib/services/customerInsightsService';
import { loadCommTimeline } from '@/lib/services/commTimelineService';
import { detectPendingFollowUps, deriveLeadResponseState } from '@/lib/services/responseTrackingService';
import { generateReactivationCandidates } from '@/lib/services/reactivationService';
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
  const primaryLeadId = leads[0]?.id ?? null;

  const { proposals, bookingsRows, customerTasks, activityLog, adminLogs, customerDiscountCodes } =
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
    : leads.flatMap((lead) => lead.universalTasks.map((task) => mapTask(task, lead.id))); 

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

  const commSummary: CustomerCommSummaryDTO = primaryLeadId
    ? await loadCommTimeline(primaryLeadId, resolvedCustomerId).then((summary) => ({
        total: summary.total,
        channels: summary.channels,
        lastContactAt: summary.lastContactAt,
        lastContactChannel: summary.lastContactChannel,
        lastContactDirection: summary.lastContactDirection,
        pendingResponseFrom: summary.pendingResponseFrom,
        daysSinceLastContact: summary.daysSinceLastContact,
        responseGap: summary.responseGap,
      }))
    : {
        total: 0,
        channels: {
          EMAIL: 0,
          WHATSAPP: 0,
          CALL: 0,
          NOTE: 0,
          SYSTEM: 0,
        },
        lastContactAt: null,
        lastContactChannel: null,
        lastContactDirection: null,
        pendingResponseFrom: 'NONE',
        daysSinceLastContact: null,
        responseGap: null,
      };

  const pendingFollowUps = detectPendingFollowUps({
    leads: leads.map((lead) => {
      const responseState = deriveLeadResponseState(
        lead.activities
          .filter((activity) => activity.type === 'EMAIL' || activity.type === 'WHATSAPP')
          .map((activity) => ({
            createdAt: activity.createdAt,
            metadata: activity.metadata,
          })),
        lead.contactedAt
      );

      return {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        eventType: lead.eventType,
        status: lead.status,
        preferredLocale: lead.preferredLocale || 'ca',
        contactedAt: lead.contactedAt,
        lastOutboundAt: responseState.lastOutboundAt,
        outboundCount: responseState.outboundCount,
        lastInboundAt: responseState.lastInboundAt,
      };
    }),
    now: new Date(),
  });

  const followUpSummary: CustomerFollowUpSummaryDTO = {
    total: pendingFollowUps.total,
    urgent: pendingFollowUps.urgent,
    normal: pendingFollowUps.normal,
    low: pendingFollowUps.low,
    topItem: pendingFollowUps.items[0]
      ? {
          leadId: pendingFollowUps.items[0].leadId,
          name: pendingFollowUps.items[0].name,
          phone: pendingFollowUps.items[0].phone,
          urgency: pendingFollowUps.items[0].urgency,
          daysSinceOutbound: pendingFollowUps.items[0].daysSinceOutbound,
          suggestedAction: pendingFollowUps.items[0].suggestedAction,
        }
      : null,
  };

  const pendingFollowUpByLeadId = new Map(
    pendingFollowUps.items.map((item) => [item.leadId, item])
  );

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
      details: activity.details && typeof activity.details === 'object'
        ? (activity.details as Record<string, unknown>)
        : null,
    })),
    leadActivities: leads.flatMap((lead) =>
      lead.activities.map((activity) => ({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        createdAt: activity.createdAt,
        createdBy: activity.createdBy,
        leadId: lead.id,
      }))
    ),
    adminLogs: adminLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      details: log.details && typeof log.details === 'object'
        ? (log.details as Record<string, unknown>)
        : null,
      createdAt: log.createdAt,
      userId: log.userId,
    })),
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
    phone: lead.phone,
    eventType: lead.eventType,
    eventDate: lead.eventDate?.toISOString(),
    status: lead.status,
    priority: lead.priority,
    createdAt: lead.createdAt.toISOString(),
    commercialBlocker: buildLeadCommercialBlocker({
      status: lead.status,
      booking: lead.booking ? { id: lead.booking.id } : null,
      followUp: pendingFollowUpByLeadId.get(lead.id) ?? null,
    }),
    booking: lead.booking
      ? {
          id: lead.booking.id,
          reference: lead.booking.reference,
          status: lead.booking.status,
          total: lead.booking.total,
          depositAmount: typeof lead.booking.depositAmount === 'number' ? lead.booking.depositAmount : undefined,
          remainingAmount: typeof lead.booking.remainingAmount === 'number' ? lead.booking.remainingAmount : undefined,
          discountCode: lead.booking.discountCode || undefined,
          eventType: lead.booking.eventType || undefined,
          date: lead.booking.eventDate?.toISOString(),
          startTime: lead.booking.eventStartTime || undefined,
          endTime: lead.booking.eventEndTime || undefined,
          location: lead.booking.eventLocation || undefined,
          venue: lead.booking.eventVenue || undefined,
          guestCount: typeof lead.booking.guestCount === 'number' ? lead.booking.guestCount : undefined,
          depositPaid: lead.booking.depositPaid ?? undefined,
          remainingPaid: lead.booking.remainingPaid ?? undefined,
        }
      : undefined,
  }));

  const hubBase = {
    customer: {
      id: customerBase.id,
      customerNumber: customerBase.customerNumber,
      name: customerBase.name,
      email: customerBase.email || undefined,
      phone: customerBase.phone || undefined,
      phoneNormalized: customerBase.phoneNormalized,
      instagram: customerBase.instagram,
      status,
      createdAt: customerBase.createdAt.toISOString(),
      tags: customerBase.tags,
      lifecycleStage: customerBase.lifecycleStage,
      healthScore: customerBase.healthScore,
      preferences: (customerBase.preferences as Record<string, unknown> | null) as CustomerHubDTO['customer']['preferences'],
      birthday: customerBase.birthday?.toISOString() || null,
      lastContactedAt: customerBase.lastContactedAt?.toISOString() || null,
      lastEventDate: customerBase.lastEventDate?.toISOString() || null,
      preferredLocale: customerBase.preferredLocale,
      marketingConsent: customerBase.marketingConsent,
      totalEvents: customerBase.totalEvents,
      totalSpent: customerBase.totalSpent,
      referredBy: customerBase.referredBy,
      referrals: customerBase.referrals,
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
    commSummary,
    followUpSummary,
    timeline,
    discountCodes,
    leads: leadsDTO,
  };

  const insights = computeCustomerInsights(hubBase as CustomerHubDTO);
  const hasActiveCommercialFlow = leads.some((lead) => !['WON', 'LOST'].includes(lead.status))
    || bookings.some((booking) => booking.date && new Date(booking.date) > new Date() && booking.status !== 'CANCELLED');
  const reactivation = hasActiveCommercialFlow
    ? null
    : generateReactivationCandidates({
        customers: [
          {
            id: customerBase.id,
            name: customerBase.name,
            email: customerBase.email || '',
            phone: customerBase.phone,
            phoneNormalized: customerBase.phoneNormalized,
            instagram: customerBase.instagram,
            lifecycleStage: customerBase.lifecycleStage || 'NEW',
            totalEvents: customerBase.totalEvents || 0,
            totalSpent: customerBase.totalSpent || 0,
            healthScore: customerBase.healthScore,
            lastEventDate: customerBase.lastEventDate,
            lastContactedAt: customerBase.lastContactedAt,
            preferredLocale: customerBase.preferredLocale || 'ca',
            marketingConsent: customerBase.marketingConsent ?? false,
          },
        ],
        now: new Date(),
      })[0] || null;

  return { ...hubBase, insights, reactivation };
}

function mapTask(task: CustomerHubTaskLite, leadId?: string): TaskDTO {
  return {
    id: task.id,
    title: task.title,
    dueDate: task.dueDate?.toISOString(),
    done: task.status === 'DONE',
    priority: task.priority === 'URGENT' ? 'HIGH' : (task.priority as TaskDTO['priority']) || 'MEDIUM',
    leadId: task.leadId || leadId,
  };
}

function resolveManualStatus(activities: CustomerHubActivityLite[]): HubStatus | null {
  for (const activity of activities) {
    if (activity.action === 'HUB_STATUS_SET' && activity.details && typeof activity.details === 'object') {
      const nextStatus = (activity.details as { status?: HubStatus }).status;
      if (nextStatus) return nextStatus;
    }
  }
  return null;
}
