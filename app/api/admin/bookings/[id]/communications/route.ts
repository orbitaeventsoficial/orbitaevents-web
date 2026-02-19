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

function buildEmailContent(flow: CommFlow, booking: {
  reference: string;
  clientName: string;
  eventDate: Date;
  depositAmount: number;
  remainingAmount: number;
}) {
  const firstName = booking.clientName.split(' ')[0] || booking.clientName;

  if (flow === 'PAYMENT') {
    return {
      subject: `Recordatori de pagament · ${booking.reference}`,
      html: `
        <div style="font-family:Segoe UI,Arial,sans-serif;background:#0b1120;color:#e2e8f0;padding:24px">
          <h2 style="margin:0 0 12px 0;color:#f8fafc">Recordatori de pagament</h2>
          <p>Hola ${firstName}, t'escrivim per revisar els pagaments del teu esdeveniment (${booking.reference}).</p>
          <ul style="line-height:1.8">
            <li>Paga i senyal: <strong>${booking.depositAmount.toLocaleString('ca-ES')}€</strong></li>
            <li>Resta: <strong>${booking.remainingAmount.toLocaleString('ca-ES')}€</strong></li>
            <li>Esdeveniment: <strong>${new Date(booking.eventDate).toLocaleDateString('ca-ES')}</strong></li>
          </ul>
          <p>Si ja està fet, respon aquest correu i ho marquem.</p>
        </div>
      `,
    };
  }

  if (flow === 'POST_EVENT') {
    return {
      subject: `Seguiment post-esdeveniment · ${booking.reference}`,
      html: `
        <div style="font-family:Segoe UI,Arial,sans-serif;background:#0b1120;color:#e2e8f0;padding:24px">
          <h2 style="margin:0 0 12px 0;color:#f8fafc">Gràcies pel teu esdeveniment</h2>
          <p>Hola ${firstName}, esperem que l'esdeveniment hagi anat genial.</p>
          <p>Si no vas poder completar la valoració, te la reenviem en un moment.</p>
        </div>
      `,
    };
  }

  return {
    subject: `Seguiment d'esdeveniment · ${booking.reference}`,
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;background:#0b1120;color:#e2e8f0;padding:24px">
        <h2 style="margin:0 0 12px 0;color:#f8fafc">Seguiment</h2>
        <p>Hola ${firstName}, seguim en contacte per a qualsevol ajust de l'esdeveniment ${booking.reference}.</p>
      </div>
    `,
  };
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
