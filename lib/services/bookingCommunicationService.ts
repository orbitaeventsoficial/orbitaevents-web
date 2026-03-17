import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { sendWhatsAppText } from '@/lib/services/whatsappService';
import { toIntlLocale } from '@/lib/constants';

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

const COMM_COPY: Record<BookingCommLocale, Record<BookingCommFlow, {
  subject: (ref: string) => string;
  title: string;
  body: (name: string, ref: string) => string;
  extra?: (dep: string, rem: string, date: string) => string;
  cta?: string;
}>> = {
  ca: {
    PAYMENT: { subject: (r) => `Recordatori de pagament · ${r}`, title: 'Recordatori de pagament', body: (n, r) => `Hola ${n}, t'escrivim per revisar els pagaments del teu esdeveniment (${r}).`, extra: (d, rem, dt) => `<li>Paga i senyal: <strong>${d}</strong></li><li>Resta: <strong>${rem}</strong></li><li>Esdeveniment: <strong>${dt}</strong></li>`, cta: 'Si ja està fet, respon aquest correu i ho marquem.' },
    POST_EVENT: { subject: (r) => `Seguiment post-esdeveniment · ${r}`, title: 'Gràcies pel teu esdeveniment', body: (n) => `Hola ${n}, esperem que l'esdeveniment hagi anat genial. Si no vas poder completar la valoració, te la reenviem en un moment.` },
    GENERAL: { subject: (r) => `Seguiment d'esdeveniment · ${r}`, title: 'Seguiment', body: (n, r) => `Hola ${n}, seguim en contacte per a qualsevol ajust de l'esdeveniment ${r}.` },
  },
  es: {
    PAYMENT: { subject: (r) => `Recordatorio de pago · ${r}`, title: 'Recordatorio de pago', body: (n, r) => `Hola ${n}, te escribimos para revisar los pagos de tu evento (${r}).`, extra: (d, rem, dt) => `<li>Señal: <strong>${d}</strong></li><li>Resto: <strong>${rem}</strong></li><li>Evento: <strong>${dt}</strong></li>`, cta: 'Si ya está hecho, responde a este correo y lo marcamos.' },
    POST_EVENT: { subject: (r) => `Seguimiento post-evento · ${r}`, title: 'Gracias por tu evento', body: (n) => `Hola ${n}, esperamos que el evento haya ido genial. Si no pudiste completar la valoración, te la reenviamos en un momento.` },
    GENERAL: { subject: (r) => `Seguimiento de evento · ${r}`, title: 'Seguimiento', body: (n, r) => `Hola ${n}, seguimos en contacto para cualquier ajuste del evento ${r}.` },
  },
  en: {
    PAYMENT: { subject: (r) => `Payment reminder · ${r}`, title: 'Payment reminder', body: (n, r) => `Hi ${n}, we're writing to review the payments for your event (${r}).`, extra: (d, rem, dt) => `<li>Deposit: <strong>${d}</strong></li><li>Remaining: <strong>${rem}</strong></li><li>Event: <strong>${dt}</strong></li>`, cta: 'If already paid, please reply and we\'ll update it.' },
    POST_EVENT: { subject: (r) => `Post-event follow-up · ${r}`, title: 'Thank you for your event', body: (n) => `Hi ${n}, we hope your event went great. If you haven't completed your review, we'll resend it shortly.` },
    GENERAL: { subject: (r) => `Event follow-up · ${r}`, title: 'Follow-up', body: (n, r) => `Hi ${n}, we remain in touch for any adjustments to your event ${r}.` },
  },
};

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
  const t = COMM_COPY[locale][flow];

  let html = `<div style="font-family:Segoe UI,Arial,sans-serif;background:#0b1120;color:#e2e8f0;padding:24px"><h2 style="margin:0 0 12px 0;color:#f8fafc">${t.title}</h2><p>${t.body(firstName, booking.reference)}</p>`;

  if (flow === 'PAYMENT' && t.extra) {
    html += `<ul style="line-height:1.8">${t.extra(
      booking.depositAmount.toLocaleString(intlLocale) + '€',
      booking.remainingAmount.toLocaleString(intlLocale) + '€',
      new Date(booking.eventDate).toLocaleDateString(intlLocale),
    )}</ul>`;
    if (t.cta) html += `<p>${t.cta}</p>`;
  }

  html += '</div>';
  return { subject: t.subject(booking.reference), html };
}

async function getBookingCommunicationTarget(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
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
    await sendEmail({ to: booking.clientEmail, subject: content.subject, html: content.html });
    await prisma.adminLog.create({
      data: {
        action: 'COMM_SENT',
        entity: 'booking',
        entityId: booking.id,
        details: { flow: payload.flow, channel: 'email', to: booking.clientEmail },
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
    await prisma.adminLog.create({
      data: {
        action: 'COMM_SENT',
        entity: 'booking',
        entityId: booking.id,
        details: {
          flow: payload.flow,
          channel: 'whatsapp',
          to: booking.clientPhone,
          providerMessageId: waResult.providerMessageId || null,
        },
      },
    });
    return { ok: true as const, status: 200, body: { ok: true } };
  }

  if (payload.action === 'log_sent') {
    if (!payload.channel) {
      return { ok: false as const, status: 400, body: { ok: false, error: 'Canal obligatori' } };
    }
    await prisma.adminLog.create({
      data: {
        action: 'COMM_SENT',
        entity: 'booking',
        entityId: booking.id,
        details: {
          flow: payload.flow,
          channel: payload.channel,
          to: payload.channel === 'whatsapp' ? booking.clientPhone : booking.clientEmail,
        },
      },
    });
    return { ok: true as const, status: 200, body: { ok: true } };
  }

  await prisma.adminLog.create({
    data: {
      action: 'COMM_RESPONDED',
      entity: 'booking',
      entityId: booking.id,
      details: { flow: payload.flow },
    },
  });
  return { ok: true as const, status: 200, body: { ok: true } };
}