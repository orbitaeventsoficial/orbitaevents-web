import crypto from 'crypto';
import { SITE_CONFIG } from '@/app/config/site-config';
import { sendEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { getAppBaseUrl } from '@/lib/site';
import {
  generatePostEventEmail,
  getPostEventSubject,
  normalizeLocale,
  resolvePackName,
} from '@/lib/services/postEventEmailService';

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

  if (!email || email.includes('@leads.orbitaevents.local')) {
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
  const reviewUrl = `${baseUrl}/${locale}/valoracio?token=${reviewToken}&ref=${booking.reference}`;
  const packName = resolvePackName(booking.pack?.translations, locale);

  const emailHtml = generatePostEventEmail({
    name,
    packName,
    eventDate: booking.eventDate,
    reviewUrl,
    googleReviewUrl: SITE_CONFIG.reviews.googleReviewUrl,
    locale,
  });

  await sendEmail({ to: email, subject: getPostEventSubject(locale, name), html: emailHtml });

  await prisma.booking.update({
    where: { id: booking.id },
    data: { postEventEmailSent: true, postEventEmailSentAt: new Date(), reviewToken },
  });

  if (booking.lead?.customerId) {
    await prisma.customerActivity.create({
      data: {
        customerId: booking.lead.customerId,
        action: 'POST_EVENT_EMAIL_SENT',
        details: { bookingId: booking.id, bookingRef: booking.reference },
      },
    });
  }

  if (options?.createAdminLog) {
    await prisma.adminLog.create({
      data: {
        action: 'SEND_POST_EVENT_EMAIL',
        entity: 'booking',
        entityId: booking.id,
        details: { email, reference: booking.reference },
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
