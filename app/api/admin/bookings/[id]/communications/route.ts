import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requirePermission } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { log } from '@/lib/logger';
import { sendWhatsAppText } from '@/lib/services/whatsappService';

interface Params {
  params: { id: string };
}

type CommAction = 'send_email' | 'send_whatsapp' | 'log_sent' | 'mark_responded';
type CommChannel = 'email' | 'whatsapp';
type CommFlow = 'PAYMENT' | 'POST_EVENT' | 'GENERAL';

function parseBody(body: unknown): {
  action: CommAction;
  flow: CommFlow;
  channel?: CommChannel;
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
    action: action as CommAction,
    flow: flow as CommFlow,
    channel: channel as CommChannel | undefined,
  };
}

type CommLocale = 'ca' | 'es' | 'en';

const COMM_COPY: Record<CommLocale, Record<CommFlow, {
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

function normalizeCommLocale(value?: string | null): CommLocale {
  const raw = String(value || '').toLowerCase();
  if (raw.startsWith('en')) return 'en';
  if (raw.startsWith('ca')) return 'ca';
  return 'es';
}

function buildEmailContent(flow: CommFlow, booking: {
  reference: string;
  clientName: string;
  eventDate: Date;
  depositAmount: number;
  remainingAmount: number;
  preferredLocale?: string;
}) {
  const locale = normalizeCommLocale(booking.preferredLocale);
  const intlLocale = locale === 'ca' ? 'ca-ES' : locale === 'en' ? 'en-GB' : 'es-ES';
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

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  try {
    const body = await req.json().catch(() => ({}));
    const payload = parseBody(body);
    if (!payload) {
      return NextResponse.json({ ok: false, error: 'Payload invàlid' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
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
    if (!booking) {
      return NextResponse.json({ ok: false, error: 'Reserva no trobada' }, { status: 404 });
    }

    if (payload.action === 'send_email') {
      const content = buildEmailContent(payload.flow, booking);
      await sendEmail({
        to: booking.clientEmail,
        subject: content.subject,
        html: content.html,
      });
      await prisma.adminLog.create({
        data: {
          action: 'COMM_SENT',
          entity: 'booking',
          entityId: booking.id,
          details: {
            flow: payload.flow,
            channel: 'email',
            to: booking.clientEmail,
          },
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (payload.action === 'send_whatsapp') {
      const content = buildEmailContent(payload.flow, booking);
      const text = `${content.subject}\n\nHola ${booking.clientName.split(' ')[0]}, seguim en contacte pel ${booking.reference}.`;
      const waResult = await sendWhatsAppText({
        to: booking.clientPhone,
        text,
      });
      if (!waResult.ok) {
        return NextResponse.json(
          { ok: false, error: waResult.error || 'No s\'ha pogut enviar WhatsApp' },
          { status: 500 }
        );
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
      return NextResponse.json({ ok: true });
    }

    if (payload.action === 'log_sent') {
      if (!payload.channel) {
        return NextResponse.json({ ok: false, error: 'Canal obligatori' }, { status: 400 });
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
      return NextResponse.json({ ok: true });
    }

    await prisma.adminLog.create({
      data: {
        action: 'COMM_RESPONDED',
        entity: 'booking',
        entityId: booking.id,
        details: { flow: payload.flow },
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('Error in booking communications route', error);
    return NextResponse.json({ ok: false, error: 'No s’ha pogut processar la comunicació' }, { status: 500 });
  }
}
