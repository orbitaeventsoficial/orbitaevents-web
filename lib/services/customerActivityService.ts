import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { HubStatus, MessageDTO } from '@/lib/customer-hub/dto';
import { CUSTOMER_ACTIVITY_ACTIONS } from '@/lib/constants';

type CustomerActivityWriter = {
  customerActivity: {
    create: (args: any) => Promise<unknown>;
  };
};

function getWriter(writer?: CustomerActivityWriter) {
  return writer ?? prisma;
}

export const EMAIL_ACTIVITY_ACTIONS = [
  'POST_EVENT_EMAIL_SENT',
  'TESTIMONIAL_SUBMITTED',
  'DISCOUNT_CODE_GENERATED',
  'LEAD_EMAIL_SENT',
] as const;

export type RecentEmailActivity = Prisma.CustomerActivityGetPayload<{ include: { customer: true } }>;
export type CustomerActivityLogEntry = Prisma.CustomerActivityGetPayload<{}>;

export function deriveCustomerHubActivitySummary(activityLog: CustomerActivityLogEntry[]): {
  customerNotes: MessageDTO[];
  manualStatus: HubStatus | null;
} {
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

  let manualStatus: HubStatus | null = null;
  for (const activity of activityLog) {
    if (activity.action === 'HUB_STATUS_SET' && activity.details && typeof activity.details === 'object') {
      const nextStatus = (activity.details as { status?: HubStatus }).status;
      if (nextStatus) {
        manualStatus = nextStatus;
        break;
      }
    }
  }

  return { customerNotes, manualStatus };
}

export async function recordCustomerEmailSent(input: {
  customerId: string;
  to: string;
  subject: string;
  source: string;
}, writer?: CustomerActivityWriter) {
  return getWriter(writer).customerActivity.create({
    data: {
      customerId: input.customerId,
      action: CUSTOMER_ACTIVITY_ACTIONS.EMAIL_SENT,
      details: {
        to: input.to,
        subject: input.subject,
        source: input.source,
      },
    },
  });
}

export async function recordCustomerQuoteSent(input: {
  customerId: string;
  leadId?: string | null;
  quoteNumber: string;
  total: number;
  to?: string;
  source?: string;
}, writer?: CustomerActivityWriter) {
  return getWriter(writer).customerActivity.create({
    data: {
      customerId: input.customerId,
      action: CUSTOMER_ACTIVITY_ACTIONS.QUOTE_SENT,
      details: {
        ...(input.leadId ? { leadId: input.leadId } : {}),
        quoteNumber: input.quoteNumber,
        total: input.total,
        ...(input.to ? { to: input.to } : {}),
        ...(input.source ? { source: input.source } : {}),
      },
    },
  });
}

export async function recordCustomerProposalSent(input: {
  customerId: string;
  proposalId: string;
  reference: string;
  total: number;
}, writer?: CustomerActivityWriter) {
  return getWriter(writer).customerActivity.create({
    data: {
      customerId: input.customerId,
      action: CUSTOMER_ACTIVITY_ACTIONS.PROPOSAL_SENT,
      details: {
        proposalId: input.proposalId,
        reference: input.reference,
        total: input.total,
      },
    },
  });
}

export async function recordCustomerPostEventEmailSent(input: {
  customerId: string;
  bookingId: string;
  bookingRef: string;
}, writer?: CustomerActivityWriter) {
  return getWriter(writer).customerActivity.create({
    data: {
      customerId: input.customerId,
      action: CUSTOMER_ACTIVITY_ACTIONS.POST_EVENT_EMAIL_SENT,
      details: {
        bookingId: input.bookingId,
        bookingRef: input.bookingRef,
      },
    },
  });
}

export async function recordCustomerCreated(input: {
  customerId: string;
  source: string;
  preferredLocale: string;
  hasInitialNotes: boolean;
}, writer?: CustomerActivityWriter) {
  return getWriter(writer).customerActivity.create({
    data: {
      customerId: input.customerId,
      action: CUSTOMER_ACTIVITY_ACTIONS.CUSTOMER_CREATED,
      details: {
        source: input.source,
        preferredLocale: input.preferredLocale,
        hasInitialNotes: input.hasInitialNotes,
      },
    },
  });
}

export async function recordCustomerInitialNotes(customerId: string, notes: string, writer?: CustomerActivityWriter) {
  return getWriter(writer).customerActivity.create({
    data: {
      customerId,
      action: CUSTOMER_ACTIVITY_ACTIONS.INITIAL_NOTES,
      details: { notes },
    },
  });
}

export async function recordCustomerDuplicateWarning(input: {
  customerId: string;
  count: number;
  topScore: number;
  topCandidates: Array<{ id: string; name: string; score: number }>;
}, writer?: CustomerActivityWriter) {
  return getWriter(writer).customerActivity.create({
    data: {
      customerId: input.customerId,
      action: CUSTOMER_ACTIVITY_ACTIONS.DUPLICATE_WARNING,
      details: {
        count: input.count,
        topScore: input.topScore,
        topCandidates: input.topCandidates,
      },
    },
  });
}

export async function recordCustomerLeadCreated(input: {
  customerId: string;
  leadId: string;
  eventType: string;
  source: string;
  packId?: string | null;
}, writer?: CustomerActivityWriter) {
  return getWriter(writer).customerActivity.create({
    data: {
      customerId: input.customerId,
      action: CUSTOMER_ACTIVITY_ACTIONS.LEAD_CREATED,
      details: {
        leadId: input.leadId,
        eventType: input.eventType,
        source: input.source,
        packId: input.packId || null,
      },
    },
  });
}

export async function recordCustomerProfileUpdated(customerId: string, fields: string[], writer?: CustomerActivityWriter) {
  return getWriter(writer).customerActivity.create({
    data: {
      customerId,
      action: CUSTOMER_ACTIVITY_ACTIONS.PROFILE_UPDATED,
      details: { fields },
    },
  });
}

export async function recordCustomerStatusChanged(customerId: string, newStatus: string, writer?: CustomerActivityWriter) {
  return getWriter(writer).customerActivity.create({
    data: {
      customerId,
      action: CUSTOMER_ACTIVITY_ACTIONS.STATUS_CHANGED,
      details: { newStatus },
    },
  });
}

export async function recordCustomersMerged(input: {
  customerId: string;
  mergedIds: string[];
  fieldsUpdated: string[];
  totalEventsAfterMerge: number;
  totalSpentAfterMerge: number;
}, writer?: CustomerActivityWriter) {
  return getWriter(writer).customerActivity.create({
    data: {
      customerId: input.customerId,
      action: CUSTOMER_ACTIVITY_ACTIONS.CUSTOMERS_MERGED,
      details: {
        mergedIds: input.mergedIds,
        fieldsUpdated: input.fieldsUpdated,
        totalEventsAfterMerge: input.totalEventsAfterMerge,
        totalSpentAfterMerge: input.totalSpentAfterMerge,
      } as Prisma.InputJsonValue,
    },
  });
}

export async function recordLeadConverted(input: {
  customerId: string;
  leadId: string;
  fromStatus: string;
  toStatus: string;
  eventType: string | null;
  eventDate: Date | null;
  eventLocation: string | null;
  guestCount: number | null;
  budget: string | null;
  message: string | null;
  interestedPackId: string | null;
  interestedExtras: unknown;
  source: string | null;
  preferredLocale: string | null;
  attribution: Record<string, unknown>;
}, writer?: CustomerActivityWriter) {
  return getWriter(writer).customerActivity.create({
    data: {
      customerId: input.customerId,
      action: CUSTOMER_ACTIVITY_ACTIONS.LEAD_CONVERTED,
      details: {
        leadId: input.leadId,
        fromStatus: input.fromStatus,
        toStatus: input.toStatus,
        eventType: input.eventType,
        eventDate: input.eventDate,
        eventLocation: input.eventLocation,
        guestCount: input.guestCount,
        budget: input.budget,
        message: input.message,
        interestedPackId: input.interestedPackId,
        interestedExtras: input.interestedExtras,
        source: input.source,
        preferredLocale: input.preferredLocale,
        attribution: input.attribution,
      } as Prisma.InputJsonValue,
    },
  });
}

export async function recordCustomerBookingCreated(input: {
  customerId: string;
  bookingId: string;
  reference: string;
  eventDate: Date;
  eventType: string;
  status: string;
}, writer?: CustomerActivityWriter) {
  return getWriter(writer).customerActivity.create({
    data: {
      customerId: input.customerId,
      action: CUSTOMER_ACTIVITY_ACTIONS.BOOKING_CREATED,
      details: {
        bookingId: input.bookingId,
        reference: input.reference,
        eventDate: input.eventDate,
        eventType: input.eventType,
        status: input.status,
      },
    },
  });
}

export async function recordCustomerProcessStarted(input: {
  customerId: string;
  processType: string;
}, writer?: CustomerActivityWriter) {
  return getWriter(writer).customerActivity.create({
    data: {
      customerId: input.customerId,
      action: input.processType,
      details: { description: `Procés "${input.processType}" iniciat` },
    },
  });
}

export async function recordCustomerTestimonialSubmitted(input: {
  customerId: string;
  testimonialId: string;
  rating: number;
  discountCode: string;
  discountPercent: number;
}, writer?: CustomerActivityWriter) {
  return getWriter(writer).customerActivity.create({
    data: {
      customerId: input.customerId,
      action: CUSTOMER_ACTIVITY_ACTIONS.TESTIMONIAL_SUBMITTED,
      details: {
        testimonialId: input.testimonialId,
        rating: input.rating,
        discountCode: input.discountCode,
        discountPercent: input.discountPercent,
      } as Prisma.InputJsonValue,
    },
  });
}

export async function readRecentEmailActivitySummary(options: {
  recentSince: Date;
  recentLimit?: number;
  emailsSince: Date;
  testimonialsSince: Date;
}) {
  const { recentSince, recentLimit = 20, emailsSince, testimonialsSince } = options;

  const [recentActivity, recentEmailActions, recentTestimonials] = await Promise.all([
    prisma.customerActivity.findMany({
      where: {
        action: { in: [...EMAIL_ACTIVITY_ACTIONS] },
        createdAt: { gte: recentSince },
      },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      take: recentLimit,
    }),
    prisma.customerActivity.count({
      where: {
        action: { in: ['POST_EVENT_EMAIL_SENT', 'LEAD_EMAIL_SENT'] },
        createdAt: { gte: emailsSince },
      },
    }),
    prisma.customerActivity.count({
      where: {
        action: { in: ['TESTIMONIAL_SUBMITTED'] },
        createdAt: { gte: testimonialsSince },
      },
    }),
  ]);

  return {
    recentActivity,
    recentEmailActions,
    recentTestimonials,
  };
}

export async function readCustomerActivityLog(customerId: string, limit: number = 120) {
  return prisma.customerActivity.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function listCustomerActivities(customerId: string) {
  const activities = await readCustomerActivityLog(customerId);

  return { ok: true, activities };
}

export async function createCustomerActivityNote(customerId: string, input: { action?: string; note: string }) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true },
  });

  if (!customer) {
    return { status: 404, body: { ok: false, error: 'Client no trobat' } };
  }

  const activity = await prisma.customerActivity.create({
    data: {
      customerId,
      action: input.action?.trim() || 'NOTE_ADDED',
      details: { note: input.note.trim() },
    },
  });

  return { status: 201, body: { ok: true, activity } };
}
