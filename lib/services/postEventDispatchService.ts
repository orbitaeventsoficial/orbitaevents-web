import crypto from 'crypto';
import { SITE_CONFIG } from '@/app/config/site-config';
import { sendEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { getAppBaseUrl } from '@/lib/site';
import { PLACEHOLDER_EMAIL_DOMAIN, CUSTOMER_ACTIVITY_ACTIONS } from '@/lib/constants';
import {
  generatePostEventEmail,
  getPostEventSubject,
  normalizeLocale,
  resolvePackName,
} from '@/lib/services/postEventEmailService';
import { recordBookingCommunicationLog } from '@/lib/services/bookingCommunicationLogService';
import { recordCustomerPostEventEmailSent } from '@/lib/services/customerActivityService';
import { recordEmailSend } from '@/lib/services/emailTrackingService';
import { getBookingQuestionnaire } from '@/lib/services/questionnaireService';
import { issueClientPortalAccess } from '@/lib/services/clientPortalAccess';

export type PostEventDispatchResult = {
  bookingId: string;
  clientName: string;
  email: string;
  status: 'sent' | 'skipped' | 'error';
  reason?: string;
  reference?: string;
};

export async function listPendingPostEventBookings(now = new Date()) {
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

  return prisma.booking.findMany({
    where: {
      status: 'COMPLETED',
      eventDate: { gte: twoDaysAgo, lte: oneDayAgo },
      postEventEmailSent: false,
    },
    select: { id: true, clientName: true, clientEmail: true },
    take: 50,
  });
}

function buildReviewToken(bookingId: string, randomize: boolean) {
  return randomize
    ? crypto.randomBytes(32).toString('base64url')
    : Buffer.from(`${bookingId}:${Date.now()}`).toString('base64url');
}

export function buildPostEventReviewUrl(params: {
  baseUrl: string;
  locale: string;
  reviewToken: string;
  bookingReference: string;
}) {
  const url = new URL(`/${params.locale}/valoracio`, params.baseUrl);
  url.searchParams.set('token', params.reviewToken);
  url.searchParams.set('ref', params.bookingReference);
  return url.toString();
}

export async function sendPostEventEmailForBooking(
  bookingId: string,
  options?: { randomizeToken?: boolean; skipIfAlreadySent?: boolean; createAdminLog?: boolean }
): Promise<PostEventDispatchResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      lead: true,
      pack: { include: { translations: true } },
    },
  });

  if (!booking) {
    return { bookingId, clientName: '', email: '', status: 'error', reason: 'Reserva no trobada' };
  }

  if (booking.status !== 'COMPLETED') {
    return {
      bookingId: booking.id,
      clientName: booking.clientName,
      email: booking.clientEmail || '',
      status: 'skipped',
      reason: `La reserva no està completada (estat: ${booking.status})`,
      reference: booking.reference,
    };
  }

  if (options?.skipIfAlreadySent !== false && booking.postEventEmailSent) {
    return {
      bookingId: booking.id,
      clientName: booking.clientName,
      email: booking.clientEmail || '',
      status: 'skipped',
      reason: 'Ja s\'ha enviat l\'email post-event per aquesta reserva',
      reference: booking.reference,
    };
  }

  const email = booking.clientEmail;
  const name = booking.clientName;
  const locale = normalizeLocale(booking.lead?.preferredLocale || booking.preferredLocale);

  if (!email || email.includes(PLACEHOLDER_EMAIL_DOMAIN)) {
    return {
      bookingId: booking.id,
      clientName: name,
      email: email || 'N/A',
      status: 'skipped',
      reason: 'La reserva no té un email vàlid',
      reference: booking.reference,
    };
  }

  const reviewToken = buildReviewToken(booking.id, options?.randomizeToken !== false);
  const baseUrl = getAppBaseUrl();
  const reviewUrl = buildPostEventReviewUrl({
    baseUrl,
    locale,
    reviewToken,
    bookingReference: booking.reference,
  });
  const packName = resolvePackName(booking.pack?.translations, locale);

  // Enquesta de satisfacció: si hi ha una plantilla activa i encara no s'ha
  // respost, generem l'accés al portal del client i incloem l'enllaç a l'email.
  let questionnaireUrl: string | undefined;
  try {
    const questionnaire = await getBookingQuestionnaire(booking.id);
    if (questionnaire && !questionnaire.response) {
      const portal = await issueClientPortalAccess({
        bookingId: booking.id,
        locale,
        createdBy: 'post-event-dispatch',
      });
      questionnaireUrl = portal.url;
    }
  } catch (error) {
    // No bloquejar l'enviament del post-event si l'enquesta falla.
    console.error('[postEventDispatch] No s\'ha pogut preparar l\'enquesta', error);
  }

  const emailHtml = generatePostEventEmail({
    name,
    packName,
    eventDate: booking.eventDate,
    reviewUrl,
    questionnaireUrl,
    googleReviewUrl: SITE_CONFIG.reviews.googleReviewUrl,
    locale,
  });

  const subject = getPostEventSubject(locale, name);
  await sendEmail({ to: email, subject, html: emailHtml });

  await recordEmailSend({
    to: email,
    subject,
    templateKey: 'post-event',
    leadId: booking.lead?.id ?? null,
    customerId: booking.lead?.customerId ?? null,
    locale,
  }).catch(() => { /* no bloquejar si falla el tracking */ });

  await prisma.booking.update({
    where: { id: booking.id },
    data: { postEventEmailSent: true, postEventEmailSentAt: new Date(), reviewToken },
  });

  if (booking.lead?.customerId) {
    await recordCustomerPostEventEmailSent({
      customerId: booking.lead.customerId,
      bookingId: booking.id,
      bookingRef: booking.reference,
    });
  }

  if (options?.createAdminLog) {
    await recordBookingCommunicationLog({
      action: CUSTOMER_ACTIVITY_ACTIONS.SEND_POST_EVENT_EMAIL,
      bookingId: booking.id,
      details: { email, reference: booking.reference },
    });
  }

  return {
    bookingId: booking.id,
    clientName: name,
    email,
    status: 'sent',
    reference: booking.reference,
  };
}
