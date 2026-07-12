import type { CustomerDiscountCode, Proposal } from '@prisma/client';
import type { CustomerContactDTO, CustomerHubDTO, CustomerCommSummaryDTO, CustomerFollowUpSummaryDTO, DiscountCodeDTO, HubStatus, LeadDTO, MessageDTO, TaskDTO } from './dto';
import { prisma } from '@/lib/prisma';
import { resolveActiveDocument } from './proposalActive';
import { buildCustomerActivityTimelineEvents, buildCustomerBusinessTimelineEvents } from './timeline';
import { buildLeadCommercialBlocker } from './leadCommercialBlocker';
import { computeCustomerInsights } from '@/lib/services/customerInsightsService';
import { deriveCustomerHubActivitySummary } from '@/lib/services/customerActivityService';
import { loadCommTimeline } from '@/lib/services/commTimelineService';
import { detectPendingFollowUps, deriveLeadResponseState } from '@/lib/services/responseTrackingService';
import { generateReactivationCandidates } from '@/lib/services/reactivationService';
import { fetchCanonicalEventsForCustomer } from '@/lib/services/timelineQueryService';
import { bookingOutstandingAmount } from '@/lib/payment-status';
import {
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

  const { proposals, bookingsRows, customerTasks, activityLog, customerDiscountCodes } =
    await fetchCustomerHubCollections(resolvedCustomerId, leadIds);

  const proposalsMapped = proposals.map((proposal: Proposal) => ({
    id: proposal.id,
    reference: proposal.reference,
    customerId: proposal.customerId || null,
    leadId: proposal.leadId || null,
    bookingId: proposal.bookingId || null,
    status: proposal.status as 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED',
    total: Number(proposal.total || 0),
    createdAt: proposal.createdAt.toISOString(),
    sentAt: proposal.sentAt?.toISOString(),
    acceptedAt: proposal.acceptedAt?.toISOString(),
    pdfUrl: proposal.pdfUrl || null,
    pdfKey: proposal.pdfKey || null,
    snapshot: (proposal.snapshot as Record<string, unknown> | null) || undefined,
    contractReference: proposal.contractReference || null,
    contractStatus: proposal.contractStatus || null,
    contractPdfUrl: proposal.contractPdfUrl || null,
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
      distanceKm: typeof bookingRow.distanceKm === 'number' ? bookingRow.distanceKm : undefined,
      depositAmount: typeof bookingRow.depositAmount === 'number' ? bookingRow.depositAmount : undefined,
      remainingAmount: typeof bookingRow.remainingAmount === 'number' ? bookingRow.remainingAmount : undefined,
      totalAmount: typeof bookingRow.total === 'number' ? bookingRow.total : undefined,
      cashAmount: typeof bookingRow.cashAmount === 'number' ? bookingRow.cashAmount : undefined,
      eventType: bookingRow.eventType || undefined,
      packName,
      guestCount: typeof bookingRow.guestCount === 'number' ? bookingRow.guestCount : undefined,
      depositPaid: bookingRow.depositPaid ?? undefined,
      remainingPaid: bookingRow.remainingPaid ?? undefined,
      discountCode: bookingRow.discountCode || undefined,
      invoices: bookingRow.invoices?.map((invoice) => ({
        id: invoice.id,
        reference: invoice.reference,
        status: invoice.status,
        total: Number(invoice.total || 0),
        pdfUrl: invoice.pdfUrl || null,
        holdedInvoiceUrl: invoice.holdedInvoiceUrl || null,
        createdAt: invoice.createdAt.toISOString(),
      })) ?? [],
      deliveryNotes: bookingRow.deliveryNotes?.map((deliveryNote) => ({
        id: deliveryNote.id,
        reference: deliveryNote.reference,
        status: deliveryNote.status,
        pdfUrl: deliveryNote.pdfUrl || null,
        deliveredAt: deliveryNote.deliveredAt?.toISOString() || null,
        signedAt: deliveryNote.signedAt?.toISOString() || null,
        createdAt: deliveryNote.createdAt.toISOString(),
      })) ?? [],
      postEventReport: bookingRow.postEventReport
        ? {
            id: bookingRow.postEventReport.id,
            status: bookingRow.postEventReport.status,
            completedAt: bookingRow.postEventReport.completedAt?.toISOString() || null,
            createdAt: bookingRow.postEventReport.createdAt.toISOString(),
            soundQuality: bookingRow.postEventReport.soundQuality,
            maxDancefloor: bookingRow.postEventReport.maxDancefloor,
            hadIncidents: bookingRow.postEventReport.hadIncidents,
          }
        : null,
      clientSurvey: bookingRow.clientSurvey
        ? {
            id: bookingRow.clientSurvey.id,
            submittedAt: bookingRow.clientSurvey.submittedAt.toISOString(),
            overallRating: bookingRow.clientSurvey.overallRating,
            npsScore: bookingRow.clientSurvey.npsScore,
            testimonialPermission: bookingRow.clientSurvey.testimonialPermission,
            createdTestimonialId: bookingRow.clientSurvey.createdTestimonialId,
          }
        : null,
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

  const { customerNotes, manualStatus } = deriveCustomerHubActivitySummary(activityLog);

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
          INSTAGRAM: 0,
          FORM: 0,
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
        customerId: resolvedCustomerId,
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

  const canonicalEvents = await fetchCanonicalEventsForCustomer(resolvedCustomerId, 250);

  const totalQuoted = proposalsMapped.reduce((sum, proposal) => sum + (proposal.total || 0), 0);
  const totalPaid = bookingsRows.reduce((sum, bookingRow) => {
    const total = typeof bookingRow.total === 'number' ? bookingRow.total : 0;
    const depositAmount = typeof bookingRow.depositAmount === 'number' ? bookingRow.depositAmount : 0;
    const outstanding = bookingOutstandingAmount({
      total,
      depositAmount,
      remainingAmount: typeof bookingRow.remainingAmount === 'number' ? bookingRow.remainingAmount : undefined,
      depositPaid: Boolean(bookingRow.depositPaid),
      remainingPaid: Boolean(bookingRow.remainingPaid),
      cashAmount: bookingRow.cashAmount,
    });
    return sum + Math.max(0, total - outstanding);
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
    manualStatus,
  });

  const timeline = [
    ...buildCustomerBusinessTimelineEvents({
      proposals: proposalsMapped,
      bookings,
      tasks,
      messages,
    }),
    ...buildCustomerActivityTimelineEvents({
      customerActivities: [],
      leadActivities: [],
      adminLogs: [],
      canonicalEvents,
    }),
  ]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 250);

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
    customerId: resolvedCustomerId,
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
          cashAmount: typeof lead.booking.cashAmount === 'number' ? lead.booking.cashAmount : undefined,
          discountCode: lead.booking.discountCode || undefined,
          eventType: lead.booking.eventType || undefined,
          date: lead.booking.eventDate?.toISOString(),
          startTime: lead.booking.eventStartTime || undefined,
          endTime: lead.booking.eventEndTime || undefined,
          location: lead.booking.eventLocation || undefined,
          venue: lead.booking.eventVenue || undefined,
          distanceKm: typeof lead.booking.distanceKm === 'number' ? lead.booking.distanceKm : undefined,
          guestCount: typeof lead.booking.guestCount === 'number' ? lead.booking.guestCount : undefined,
          depositPaid: lead.booking.depositPaid ?? undefined,
          remainingPaid: lead.booking.remainingPaid ?? undefined,
        }
      : undefined,
  }));

  const contactsRaw = await prisma.customerContact.findMany({
    where: { customerId: resolvedCustomerId },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  });
  const contacts: CustomerContactDTO[] = contactsRaw.map(c => ({
    id: c.id,
    name: c.name,
    role: c.role,
    email: c.email,
    phone: c.phone,
    notes: c.notes,
    isPrimary: c.isPrimary,
    createdAt: c.createdAt.toISOString(),
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
    contacts,
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
