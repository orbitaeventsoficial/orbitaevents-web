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
import {
  recordEmailSend,
  updateEmailSendResult,
  wrapLinksForTracking,
} from '@/lib/services/emailTrackingService';
import { getBookingQuestionnaire } from '@/lib/services/questionnaireService';
import { issueClientPortalAccess } from '@/lib/services/clientPortalAccess';
import { POST_EVENT_WORKFLOW } from '@/lib/constants/postEventWorkflow';
import { buildPendingPostEventEmailBookingWhere } from '@/lib/services/postEventPendingService';

export type PostEventDispatchResult = {
  bookingId: string;
  clientName: string;
  email: string;
  status: 'sent' | 'skipped' | 'error';
  reason?: string;
  reference?: string;
};

export async function listPendingPostEventBookings(now = new Date()) {
  return prisma.booking.findMany({
    where: buildPendingPostEventEmailBookingWhere(now),
    select: {
      id: true,
      reference: true,
      clientName: true,
      clientEmail: true,
      eventDate: true,
      pack: { select: { translations: true } },
    },
    orderBy: { eventDate: 'desc' },
    take: POST_EVENT_WORKFLOW.pendingTake,
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

const POST_EVENT_EMAIL_TEMPLATE_KEY = 'post-event';
const POST_EVENT_ORBITA_ORIGIN = 'post-event-dispatch';

function buildTrackedPostEventEmailHtml(html: string, trackingToken: string, baseUrl: string): string {
  const trackedHtml = wrapLinksForTracking(html, trackingToken, baseUrl);
  const pixel = `<img src="${baseUrl}/api/tracking/open/${trackingToken}" width="1" height="1" alt="" style="display:none" />`;
  if (/<\/body>/i.test(trackedHtml)) {
    return trackedHtml.replace(/<\/body>/i, `${pixel}</body>`);
  }
  return `${trackedHtml}${pixel}`;
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
  const baseUrl = getAppBaseUrl().replace(/\/+$/, '');
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
  const orbita = booking.lead?.id
    ? { kind: 'lead' as const, id: booking.lead.id, origin: POST_EVENT_ORBITA_ORIGIN }
    : { kind: 'booking' as const, id: booking.id, origin: POST_EVENT_ORBITA_ORIGIN };
  const trackingRecord = await recordEmailSend({
    to: email,
    subject,
    templateKey: POST_EVENT_EMAIL_TEMPLATE_KEY,
    leadId: booking.lead?.id ?? null,
    customerId: booking.lead?.customerId ?? null,
    locale,
    htmlBody: emailHtml,
    orbitaKind: orbita.kind,
    orbitaId: orbita.id,
    orbitaOrigin: orbita.origin,
  });
  const sendResult = await sendEmail({
    to: email,
    subject,
    html: buildTrackedPostEventEmailHtml(emailHtml, trackingRecord.trackingToken, baseUrl),
    orbita,
  });

  await updateEmailSendResult(trackingRecord.id, {
    smtpAccepted: sendResult.smtp.accepted,
    smtpRejected: sendResult.smtp.rejected,
    smtpResponse: sendResult.smtp.response,
    smtpMessageId: sendResult.smtp.messageId,
    imapAppendOk: sendResult.imapSent.attempted ? sendResult.imapSent.ok : null,
    imapSentFolder: sendResult.imapSent.folder,
    imapSentUid: sendResult.imapSent.uid ?? null,
    imapError: sendResult.imapSent.error ?? null,
  }).catch(() => undefined);

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
      details: {
        email,
        reference: booking.reference,
        emailSendId: trackingRecord.id,
        emailSnapshot: 'EmailSend.htmlBody',
        orbitaKind: orbita.kind,
        orbitaId: orbita.id,
        orbitaOrigin: orbita.origin,
      },
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
