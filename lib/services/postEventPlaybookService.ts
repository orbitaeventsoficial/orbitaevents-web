// lib/services/postEventPlaybookService.ts
// ═══════════════════════════════════════════════════════════════════════════
// POST-EVENT PLAYBOOK SERVICE
// Per cada booking completat recentment, calcula l'estat de 4 accions
// post-event (agraïment, testimoni, social, referral) i suggereix la
// següent acció. Part pura + wrapper que carrega des de Prisma.
// ═══════════════════════════════════════════════════════════════════════════

import {
  CUSTOMER_ACTIVITY_ACTIONS,
  SOCIAL_POST_ORIGIN_TYPES,
} from '@/lib/constants';
import {
  POST_EVENT_DAY_MS,
  POST_EVENT_WORKFLOW,
  getPostEventWorkflowDates,
} from '@/lib/constants/postEventWorkflow';
import { prisma } from '@/lib/prisma';

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type PlaybookActionKey = 'thank_you' | 'testimonial' | 'social_post' | 'referral_ask';

export type PlaybookActionStatus = 'DONE' | 'PENDING' | 'OVERDUE' | 'NOT_APPLICABLE';

export type PlaybookAction = {
  key: PlaybookActionKey;
  label: string;
  status: PlaybookActionStatus;
  daysSinceEvent: number;
  note: string | null;
  socialPostId?: string | null;
};

export type PlaybookPriority = 'ALTA' | 'MITJANA' | 'BAIXA' | 'DONE';

export type PlaybookBookingInput = {
  id: string;
  reference: string;
  clientName: string;
  customerId: string | null;
  eventDate: Date;
  eventType: string;
  eventLocation: string | null;
  postEventEmailSent: boolean;
  postEventEmailSentAt: Date | null;
  hasTestimonial: boolean;
  hasTestimonialAskDecision: boolean;
  hasPublishedSocialPost: boolean;
  hasSocialPostDecision: boolean;
  socialPostId?: string | null;
  hasReferralAskTask: boolean;
};

export type PlaybookInput = {
  bookings: PlaybookBookingInput[];
  now: Date;
};

export type PlaybookItem = {
  bookingId: string;
  reference: string;
  clientName: string;
  customerId: string | null;
  eventDate: Date;
  eventType: string;
  eventLocation: string | null;
  daysSinceEvent: number;
  actions: PlaybookAction[];
  progress: number; // 0-100
  completedCount: number;
  totalCount: number;
  priority: PlaybookPriority;
  nextAction: PlaybookAction | null;
};

export type PlaybookSummary = {
  items: PlaybookItem[];
  totalBookings: number;
  fullyCompleted: number;
  withOverdue: number;
  pendingActionsTotal: number;
  overallProgress: number; // 0-100
};

// ───────────────────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────────────────

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / POST_EVENT_DAY_MS);
}

const ACTION_LABELS: Record<PlaybookActionKey, string> = {
  thank_you: 'Email d\'agraïment',
  testimonial: 'Demanar testimoni',
  social_post: 'Publicar a xarxes',
  referral_ask: 'Demanar referral',
};

// Dies dins dels quals es considera que una acció està encara "a temps".
const ACTION_DUE_DAYS: Record<PlaybookActionKey, number> = POST_EVENT_WORKFLOW.actionDueDays;

// ───────────────────────────────────────────────────────────────────────────
// PURE FUNCTION
// ───────────────────────────────────────────────────────────────────────────

export function buildPostEventPlaybook(input: PlaybookInput): PlaybookSummary {
  const items: PlaybookItem[] = [];
  let fullyCompleted = 0;
  let withOverdue = 0;
  let pendingActionsTotal = 0;
  let totalProgressSum = 0;

  for (const booking of input.bookings) {
    const daysSinceEvent = Math.max(0, daysBetween(input.now, booking.eventDate));

    const actions: PlaybookAction[] = [];

    // 1. Thank you email
    actions.push({
      key: 'thank_you',
      label: ACTION_LABELS.thank_you,
      status: computeStatus(booking.postEventEmailSent, daysSinceEvent, ACTION_DUE_DAYS.thank_you),
      daysSinceEvent,
      note: booking.postEventEmailSent
        ? booking.postEventEmailSentAt
          ? `Enviat fa ${daysBetween(input.now, booking.postEventEmailSentAt)} dies`
          : 'Enviat'
        : null,
    });

    // 2. Testimonial
    const testimonialDone = booking.hasTestimonial || booking.hasTestimonialAskDecision;
    actions.push({
      key: 'testimonial',
      label: ACTION_LABELS.testimonial,
      status: computeStatus(testimonialDone, daysSinceEvent, ACTION_DUE_DAYS.testimonial),
      daysSinceEvent,
      note: booking.hasTestimonial ? 'Rebut' : booking.hasTestimonialAskDecision ? 'Sol.licitat' : null,
    });

    // 3. Social post
    actions.push({
      key: 'social_post',
      label: ACTION_LABELS.social_post,
      status: computeStatus(
        booking.hasPublishedSocialPost,
        daysSinceEvent,
        ACTION_DUE_DAYS.social_post
      ),
      daysSinceEvent,
      note: booking.hasPublishedSocialPost ? 'Publicat' : booking.hasSocialPostDecision ? 'Preparat, no publicat' : null,
      socialPostId: booking.socialPostId ?? null,
    });

    // 4. Referral ask — només si hi ha customerId
    if (booking.customerId) {
      actions.push({
        key: 'referral_ask',
        label: ACTION_LABELS.referral_ask,
        status: computeStatus(
          booking.hasReferralAskTask,
          daysSinceEvent,
          ACTION_DUE_DAYS.referral_ask
        ),
        daysSinceEvent,
        note: booking.hasReferralAskTask ? 'Programat' : null,
      });
    } else {
      actions.push({
        key: 'referral_ask',
        label: ACTION_LABELS.referral_ask,
        status: 'NOT_APPLICABLE',
        daysSinceEvent,
        note: 'Sense client associat',
      });
    }

    const applicable = actions.filter((a) => a.status !== 'NOT_APPLICABLE');
    const completed = applicable.filter((a) => a.status === 'DONE').length;
    const overdue = applicable.filter((a) => a.status === 'OVERDUE').length;
    const pending = applicable.filter((a) => a.status === 'PENDING').length;
    const progress = applicable.length > 0 ? Math.round((completed / applicable.length) * 100) : 100;

    let priority: PlaybookPriority;
    if (completed === applicable.length) {
      priority = 'DONE';
      fullyCompleted++;
    } else if (overdue >= 2) {
      priority = 'ALTA';
    } else if (overdue === 1) {
      priority = 'MITJANA';
    } else {
      priority = 'BAIXA';
    }

    if (overdue > 0) withOverdue++;
    pendingActionsTotal += pending + overdue;
    totalProgressSum += progress;

    // Next action = primer no-DONE, no-NOT_APPLICABLE
    const nextAction = actions.find(
      (a) => a.status !== 'DONE' && a.status !== 'NOT_APPLICABLE'
    ) ?? null;

    items.push({
      bookingId: booking.id,
      reference: booking.reference,
      clientName: booking.clientName,
      customerId: booking.customerId,
      eventDate: booking.eventDate,
      eventType: booking.eventType,
      eventLocation: booking.eventLocation,
      daysSinceEvent,
      actions,
      progress,
      completedCount: completed,
      totalCount: applicable.length,
      priority,
      nextAction,
    });
  }

  // Order: by priority (ALTA > MITJANA > BAIXA > DONE), then by daysSinceEvent desc (oldest first)
  const PRIORITY_ORDER: Record<PlaybookPriority, number> = {
    ALTA: 0,
    MITJANA: 1,
    BAIXA: 2,
    DONE: 3,
  };
  items.sort((a, b) => {
    if (PRIORITY_ORDER[a.priority] !== PRIORITY_ORDER[b.priority]) {
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    }
    return b.daysSinceEvent - a.daysSinceEvent;
  });

  const overallProgress = items.length > 0 ? Math.round(totalProgressSum / items.length) : 100;

  return {
    items,
    totalBookings: items.length,
    fullyCompleted,
    withOverdue,
    pendingActionsTotal,
    overallProgress,
  };
}

function computeStatus(
  done: boolean,
  daysSinceEvent: number,
  dueDays: number
): PlaybookActionStatus {
  if (done) return 'DONE';
  if (daysSinceEvent > dueDays) return 'OVERDUE';
  return 'PENDING';
}

// ───────────────────────────────────────────────────────────────────────────
// WRAPPER
// ───────────────────────────────────────────────────────────────────────────

export async function loadPostEventPlaybook(
  now: Date = new Date()
): Promise<PlaybookSummary> {
  const { catchupFrom } = getPostEventWorkflowDates(now);

  const rows = await prisma.booking.findMany({
    where: {
      status: 'COMPLETED',
      eventDate: { gte: catchupFrom, lte: now },
    },
    select: {
      id: true,
      reference: true,
      clientName: true,
      customerId: true,
      eventDate: true,
      eventType: true,
      eventLocation: true,
      postEventEmailSent: true,
      postEventEmailSentAt: true,
    },
    orderBy: { eventDate: 'desc' },
    take: POST_EVENT_WORKFLOW.playbookTake,
  });

  if (rows.length === 0) {
    return buildPostEventPlaybook({ bookings: [], now });
  }

  const customerIds = Array.from(
    new Set(rows.map((r) => r.customerId).filter((id): id is string => !!id))
  );
  const bookingIds = rows.map((r) => r.id);
  const bookingIdSet = new Set(bookingIds);

  // Testimonis per customer (comparem eventDate)
  const testimonials = customerIds.length > 0
    ? await prisma.customerTestimonial.findMany({
        where: { customerId: { in: customerIds }, isApproved: true },
        select: { customerId: true, eventDate: true },
      })
    : [];

  // Social posts per booking
  const socialPosts = await prisma.socialPost.findMany({
    where: {
      status: 'PUBLISHED',
      OR: [
        { bookingId: { in: bookingIds } },
        { originType: SOCIAL_POST_ORIGIN_TYPES.BOOKING, originId: { in: bookingIds } },
      ],
    },
    select: { bookingId: true, originId: true },
  });

  // Tasks de tipus referral_ask — sempre vinculades a booking per no tapar altres bolos del mateix client.
  const referralTasks = customerIds.length > 0
    ? await prisma.task.findMany({
        where: {
          customerId: { in: customerIds },
          status: { not: 'CANCELLED' },
          OR: [
            { title: { contains: 'referral', mode: 'insensitive' } },
            { description: { contains: 'referral', mode: 'insensitive' } },
          ],
        },
        select: { customerId: true, bookingId: true },
      })
    : [];

  const recurrenceDecisions = customerIds.length > 0
    ? await prisma.customerActivity.findMany({
        where: {
          customerId: { in: customerIds },
          action: CUSTOMER_ACTIVITY_ACTIONS.POST_EVENT_RECURRENCE_DECIDED,
        },
        select: { customerId: true, details: true },
      })
    : [];

  const publishedSocialByBooking = new Set(
    socialPosts.flatMap((post) => [post.bookingId, post.originId])
      .filter((id): id is string => !!id && bookingIdSet.has(id))
  );
  const referralTaskByCustomerBooking = new Set(
    referralTasks
      .map((task) => {
        if (!task.customerId || !task.bookingId) return null;
        return `${task.customerId}:${task.bookingId}`;
      })
      .filter((key): key is string => !!key)
  );
  const referralDecisionByCustomerBooking = new Set(
    recurrenceDecisions
      .filter((activity) => isReferralAskDecision(activity.details))
      .map((activity) => {
        const details = activity.details as Record<string, unknown>;
        return `${activity.customerId}:${String(details.bookingId ?? '')}`;
      })
      .filter((key) => !key.endsWith(':'))
  );
  const testimonialAskByCustomerBooking = new Set(
    recurrenceDecisions
      .filter((activity) => isTestimonialAskDecision(activity.details))
      .map((activity) => {
        const details = activity.details as Record<string, unknown>;
        return `${activity.customerId}:${String(details.bookingId ?? '')}`;
      })
      .filter((key) => !key.endsWith(':'))
  );
  const socialPostByCustomerBooking = new Map<string, string | null>();
  for (const activity of recurrenceDecisions) {
    if (!isSocialPostDecision(activity.details)) continue;
    const details = activity.details as Record<string, unknown>;
    const bookingId = typeof details.bookingId === 'string' ? details.bookingId.trim() : '';
    if (!bookingId) continue;
    const socialPostId = typeof details.socialPostId === 'string' && details.socialPostId.trim()
      ? details.socialPostId
      : null;
    socialPostByCustomerBooking.set(`${activity.customerId}:${bookingId}`, socialPostId);
  }

  const bookings: PlaybookBookingInput[] = rows.map((r) => {
    // Ha rebut testimoni? Mirem testimonis del customer amb eventDate propera (±7 dies)
    const hasTestimonial = !!r.customerId && testimonials.some((t) => {
      if (t.customerId !== r.customerId) return false;
      if (!t.eventDate) return false;
      const delta = Math.abs(t.eventDate.getTime() - r.eventDate.getTime());
      return delta <= 7 * POST_EVENT_DAY_MS;
    });

    const customerBookingKey = r.customerId ? `${r.customerId}:${r.id}` : null;

    return {
      id: r.id,
      reference: r.reference,
      clientName: r.clientName,
      customerId: r.customerId,
      eventDate: r.eventDate,
      eventType: r.eventType as string,
      eventLocation: r.eventLocation,
      postEventEmailSent: r.postEventEmailSent,
      postEventEmailSentAt: r.postEventEmailSentAt,
      hasTestimonial,
      hasTestimonialAskDecision: !!r.customerId && testimonialAskByCustomerBooking.has(`${r.customerId}:${r.id}`),
      hasPublishedSocialPost: publishedSocialByBooking.has(r.id),
      hasSocialPostDecision: !!customerBookingKey && socialPostByCustomerBooking.has(customerBookingKey),
      socialPostId: customerBookingKey ? socialPostByCustomerBooking.get(customerBookingKey) ?? null : null,
      hasReferralAskTask: !!r.customerId && (
        referralTaskByCustomerBooking.has(`${r.customerId}:${r.id}`) ||
        referralDecisionByCustomerBooking.has(`${r.customerId}:${r.id}`)
      ),
    };
  });

  return buildPostEventPlaybook({ bookings, now });
}

function isReferralAskDecision(details: unknown): boolean {
  if (!details || typeof details !== 'object' || Array.isArray(details)) return false;
  return (details as Record<string, unknown>).actionKey === 'referral_ask';
}

function isTestimonialAskDecision(details: unknown): boolean {
  if (!details || typeof details !== 'object' || Array.isArray(details)) return false;
  return (details as Record<string, unknown>).actionKey === 'testimonial';
}

function isSocialPostDecision(details: unknown): boolean {
  if (!details || typeof details !== 'object' || Array.isArray(details)) return false;
  return (details as Record<string, unknown>).actionKey === 'social_post';
}
