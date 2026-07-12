import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { sendWhatsAppText } from '@/lib/services/whatsappService';
import { BOOKING_COMMUNICATION_COPY, toIntlLocale, formatCurrencyExact } from '@/lib/constants';
import { recordBookingCommunicationLog } from '@/lib/services/bookingCommunicationLogService';
import { getAppBaseUrl } from '@/lib/site';
import {
  recordEmailSend,
  updateEmailSendResult,
  wrapLinksForTracking,
} from '@/lib/services/emailTrackingService';

export type BookingCommAction = 'send_email' | 'send_whatsapp' | 'log_sent' | 'mark_responded';
export type BookingCommChannel = 'email' | 'whatsapp';
export type BookingCommFlow = 'PAYMENT' | 'POST_EVENT' | 'GENERAL';
type BookingCommLocale = 'ca' | 'es' | 'en';

export function parseBookingCommunicationBody(body: unknown): {
  action: BookingCommAction;
  flow: BookingCommFlow;
  channel?: BookingCommChannel;
} | null {
  if (!body || typeof body !== 'object') return null;
  const raw = body as Record<string, unknown>;
  const action = raw.action;
  const flow = raw.flow;
  const channel = raw.channel;
  if (!['send_email', 'send_whatsapp', 'log_sent', 'mark_responded'].includes(String(action))) return null;
  if (!['PAYMENT', 'POST_EVENT', 'GENERAL'].includes(String(flow))) return null;
  if (channel && !['email', 'whatsapp'].includes(String(channel))) return null;
  return {
    action: action as BookingCommAction,
    flow: flow as BookingCommFlow,
    channel: channel as BookingCommChannel | undefined,
  };
}

function normalizeCommLocale(value?: string | null): BookingCommLocale {
  const raw = String(value || '').toLowerCase();
  if (raw.startsWith('en')) return 'en';
  if (raw.startsWith('ca')) return 'ca';
  return 'es';
}

function buildEmailContent(flow: BookingCommFlow, booking: {
  reference: string;
  clientName: string;
  eventDate: Date;
  depositAmount: number;
  remainingAmount: number;
  preferredLocale?: string;
}) {
  const locale = normalizeCommLocale(booking.preferredLocale);
  const intlLocale = toIntlLocale(locale);
  const firstName = booking.clientName.split(' ')[0] || booking.clientName;
  const t = BOOKING_COMMUNICATION_COPY[locale][flow];

  let html = `<div style="font-family:Segoe UI,Arial,sans-serif;background:#0b1120;color:#e2e8f0;padding:24px"><h2 style="margin:0 0 12px 0;color:#f8fafc">${t.title}</h2><p>${t.body(firstName, booking.reference)}</p>`;

  if (flow === 'PAYMENT' && t.extra) {
    html += `<ul style="line-height:1.8">${t.extra(
      formatCurrencyExact(booking.depositAmount),
      formatCurrencyExact(booking.remainingAmount),
      new Date(booking.eventDate).toLocaleDateString(intlLocale),
    )}</ul>`;
    if (t.cta) html += `<p>${t.cta}</p>`;
  }

  html += '</div>';
  return { subject: t.subject(booking.reference), html };
}

const BOOKING_COMM_TEMPLATE_KEY = 'booking-communication';
const BOOKING_COMM_ORBITA_ORIGIN = 'booking-communication';

function buildTrackedBookingCommHtml(html: string, trackingToken: string, baseUrl: string): string {
  const trackedHtml = wrapLinksForTracking(html, trackingToken, baseUrl);
  const pixel = `<img src="${baseUrl}/api/tracking/open/${trackingToken}" width="1" height="1" alt="" style="display:none" />`;
  if (/<\/body>/i.test(trackedHtml)) {
    return trackedHtml.replace(/<\/body>/i, `${pixel}</body>`);
  }
  return `${trackedHtml}${pixel}`;
}

async function getBookingCommunicationTarget(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      leadId: true,
      customerId: true,
      reference: true,
      clientName: true,
      clientEmail: true,
      clientPhone: true,
      eventDate: true,
      depositAmount: true,
      remainingAmount: true,
      preferredLocale: true,
    },
  });
}

export async function executeBookingCommunication(bookingId: string, payload: { action: BookingCommAction; flow: BookingCommFlow; channel?: BookingCommChannel; }) {
  const booking = await getBookingCommunicationTarget(bookingId);
  if (!booking) return { ok: false as const, status: 404, body: { ok: false, error: 'Reserva no trobada' } };

  if (payload.action === 'send_email') {
    const content = buildEmailContent(payload.flow, booking);
    const baseUrl = getAppBaseUrl().replace(/\/+$/, '');
    const orbita = booking.leadId
      ? { kind: 'lead' as const, id: booking.leadId, origin: BOOKING_COMM_ORBITA_ORIGIN }
      : booking.customerId
        ? { kind: 'customer' as const, id: booking.customerId, origin: BOOKING_COMM_ORBITA_ORIGIN }
        : { kind: 'booking' as const, id: booking.id, origin: BOOKING_COMM_ORBITA_ORIGIN };
    const trackingRecord = await recordEmailSend({
      templateKey: BOOKING_COMM_TEMPLATE_KEY,
      to: booking.clientEmail,
      subject: content.subject,
      leadId: booking.leadId ?? null,
      customerId: booking.customerId ?? null,
      locale: normalizeCommLocale(booking.preferredLocale),
      htmlBody: content.html,
      orbitaKind: orbita.kind,
      orbitaId: orbita.id,
      orbitaOrigin: orbita.origin,
    });
    const sendResult = await sendEmail({
      to: booking.clientEmail,
      subject: content.subject,
      html: buildTrackedBookingCommHtml(content.html, trackingRecord.trackingToken, baseUrl),
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
    await recordBookingCommunicationLog({
      action: 'COMM_SENT',
      bookingId: booking.id,
      details: {
        flow: payload.flow,
        channel: 'email',
        to: booking.clientEmail,
        emailSendId: trackingRecord.id,
        emailSnapshot: 'EmailSend.htmlBody',
        orbitaKind: orbita.kind,
        orbitaId: orbita.id,
        orbitaOrigin: orbita.origin,
      },
    });
    return { ok: true as const, status: 200, body: { ok: true } };
  }

  if (payload.action === 'send_whatsapp') {
    const content = buildEmailContent(payload.flow, booking);
    const text = `${content.subject}\n\nHola ${booking.clientName.split(' ')[0]}, seguim en contacte pel ${booking.reference}.`;
    const waResult = await sendWhatsAppText({ to: booking.clientPhone, text });
    if (!waResult.ok) {
      return { ok: false as const, status: 500, body: { ok: false, error: waResult.error || 'No s\'ha pogut enviar WhatsApp' } };
    }
    await recordBookingCommunicationLog({
      action: 'COMM_SENT',
      bookingId: booking.id,
      details: {
        flow: payload.flow,
        channel: 'whatsapp',
        to: booking.clientPhone,
        providerMessageId: waResult.providerMessageId || null,
      },
    });
    return { ok: true as const, status: 200, body: { ok: true } };
  }

  if (payload.action === 'log_sent') {
    if (!payload.channel) {
      return { ok: false as const, status: 400, body: { ok: false, error: 'Canal obligatori' } };
    }
    await recordBookingCommunicationLog({
      action: 'COMM_SENT',
      bookingId: booking.id,
      details: {
        flow: payload.flow,
        channel: payload.channel,
        to: payload.channel === 'whatsapp' ? booking.clientPhone : booking.clientEmail,
      },
    });
    return { ok: true as const, status: 200, body: { ok: true } };
  }

  await recordBookingCommunicationLog({
    action: 'COMM_RESPONDED',
    bookingId: booking.id,
    details: { flow: payload.flow },
  });
  return { ok: true as const, status: 200, body: { ok: true } };
}
