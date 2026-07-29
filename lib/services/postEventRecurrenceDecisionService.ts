import { Prisma } from '@prisma/client';
import {
  CUSTOMER_ACTIVITY_ACTIONS,
  SOCIAL_CATEGORIES,
  SOCIAL_CONTENT_TYPES,
  SOCIAL_PLATFORMS,
  SOCIAL_POST_ORIGIN_TYPES,
  SOCIAL_POST_STATUSES,
} from '@/lib/constants';
import { buildSocialWorkspaceHref } from '@/lib/admin/socialWorkspaceHref';
import { POST_EVENT_RECURRENCE_DECISION_ACTION_KEYS } from '@/lib/constants/postEventRecurrence';
import { prisma } from '@/lib/prisma';
import type { PlaybookActionKey } from '@/lib/services/postEventPlaybookService';

export const POST_EVENT_RECURRENCE_DECISION_SOURCE = 'post_event_playbook';

type PostEventRecurrenceDecisionInput = {
  customerId: string;
  bookingId: string;
  actionKey: PlaybookActionKey;
  draft: string;
  href: string;
  source?: string;
};

const recurrenceDecisionActionKeys =
  POST_EVENT_RECURRENCE_DECISION_ACTION_KEYS satisfies ReadonlyArray<PlaybookActionKey>;

export type PostEventRecurrenceDecisionKey = (typeof recurrenceDecisionActionKeys)[number];

function cleanText(value: string | undefined, maxLength: number): string {
  return (value ?? '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function isAllowedActionKey(actionKey: PlaybookActionKey): actionKey is PostEventRecurrenceDecisionKey {
  return recurrenceDecisionActionKeys.includes(actionKey as PostEventRecurrenceDecisionKey);
}

function buildSocialDraftTitle(booking: { reference: string; clientName: string }): string {
  return `Post-event ${booking.reference} · ${booking.clientName}`.slice(0, 200);
}

function buildSocialOriginLabel(booking: { reference: string; clientName: string }): string {
  return `${booking.reference} · ${booking.clientName}`.slice(0, 200);
}

export async function recordPostEventRecurrenceDecision(input: PostEventRecurrenceDecisionInput) {
  const customerId = cleanText(input.customerId, 120);
  const bookingId = cleanText(input.bookingId, 120);
  const draft = cleanText(input.draft, 4000);
  const href = cleanText(input.href, 500);
  const source = cleanText(input.source, 120) || POST_EVENT_RECURRENCE_DECISION_SOURCE;

  if (!customerId || !bookingId || !draft || !href) {
    return { status: 400, body: { ok: false, error: 'Dades incompletes' } };
  }

  if (!isAllowedActionKey(input.actionKey)) {
    return { status: 400, body: { ok: false, error: 'Accio post-event no registrable' } };
  }

  const [customer, booking] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    }),
    prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        reference: true,
        customerId: true,
        clientName: true,
        eventDate: true,
        eventType: true,
      },
    }),
  ]);

  if (!customer) {
    return { status: 404, body: { ok: false, error: 'Client no trobat' } };
  }

  if (!booking) {
    return { status: 404, body: { ok: false, error: 'Reserva no trobada' } };
  }

  if (booking.customerId !== customerId) {
    return { status: 409, body: { ok: false, error: 'La reserva no correspon a aquest client' } };
  }

  const socialDraft = input.actionKey === 'social_post'
    ? await prisma.socialPost.findFirst({
        where: {
          status: { not: SOCIAL_POST_STATUSES.PUBLISHED },
          OR: [
            { bookingId: booking.id },
            { originType: SOCIAL_POST_ORIGIN_TYPES.BOOKING, originId: booking.id },
          ],
        },
        select: { id: true, status: true },
      })
    : null;

  const socialPost = input.actionKey === 'social_post'
    ? socialDraft ?? await prisma.socialPost.create({
        data: {
          title: buildSocialDraftTitle(booking),
          caption: draft,
          hashtags: [],
          platforms: [SOCIAL_PLATFORMS.INSTAGRAM],
          status: SOCIAL_POST_STATUSES.DRAFT,
          contentType: SOCIAL_CONTENT_TYPES.TEXT,
          category: SOCIAL_CATEGORIES.EVENT_SHOWCASE,
          scheduledAt: null,
          publishedAt: null,
          mediaUrls: [],
          booking: { connect: { id: booking.id } },
          originType: SOCIAL_POST_ORIGIN_TYPES.BOOKING,
          originId: booking.id,
          originLabel: buildSocialOriginLabel(booking),
          notes: 'Creat des del playbook post-event. Revisar consentiment, imatges i dades personals abans de publicar. No publicat automaticament.',
        },
        select: { id: true, status: true },
      })
    : null;
  const decisionHref = socialPost ? buildSocialWorkspaceHref(socialPost.id) : href;

  const details = {
    actionKey: input.actionKey,
    bookingId: booking.id,
    bookingRef: booking.reference,
    clientName: booking.clientName,
    eventDate: booking.eventDate.toISOString(),
    eventType: String(booking.eventType),
    draft,
    href: decisionHref,
    source,
    safety: input.actionKey === 'social_post' ? 'DRAFT_NOT_PUBLISHED' : 'DECIDED_NOT_SENT',
    ...(socialPost ? {
      socialPostId: socialPost.id,
      socialPostStatus: String(socialPost.status),
    } : {}),
    decidedAt: new Date().toISOString(),
  } satisfies Prisma.InputJsonObject;

  const activity = await prisma.customerActivity.create({
    data: {
      customerId,
      action: CUSTOMER_ACTIVITY_ACTIONS.POST_EVENT_RECURRENCE_DECIDED,
      details,
    },
  });

  return {
    status: 201,
    body: {
      ok: true,
      activity,
      decision: {
        actionKey: input.actionKey,
        bookingId: booking.id,
        customerId,
        safety: details.safety,
        href: decisionHref,
        ...(socialPost ? {
          socialPostId: socialPost.id,
          socialPostHref: decisionHref,
        } : {}),
      },
    },
  };
}
