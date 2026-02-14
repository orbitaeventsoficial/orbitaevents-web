import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { SITE_CONFIG } from '@/app/config/site-config';
import { buildLeadTechnicalSnapshot } from '@/lib/services/leadSnapshotService';

interface Params {
  params: { id: string };
}

const schema = z.object({
  action: z.enum(['save_document', 'send_email']),
  recipient: z.string().email().optional(),
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Datos inválidos' }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { notes: true, tasks: true, documents: true, activities: true } },
        booking: {
          select: {
            postEventEmailSent: true,
            postEventEmailSentAt: true,
            reviewToken: true,
            reviewSubmittedAt: true,
            postEventReport: { select: { id: true } },
            clientSurvey: { select: { id: true } },
            clientFeedback: { select: { id: true } },
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ ok: false, error: 'Lead no encontrado' }, { status: 404 });
    }

    const snapshot = buildLeadTechnicalSnapshot({
      lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        eventType: lead.eventType,
        eventDate: lead.eventDate,
        eventLocation: lead.eventLocation,
        guestCount: lead.guestCount,
        budget: lead.budget,
        status: lead.status,
        priority: lead.priority,
        source: lead.source,
        assignedTo: lead.assignedTo,
        preferredLocale: lead.preferredLocale,
        customerId: lead.customerId,
        interestedPackId: lead.interestedPackId,
        interestedExtras: lead.interestedExtras,
        utmSource: lead.utmSource,
        utmMedium: lead.utmMedium,
        utmCampaign: lead.utmCampaign,
        landingPage: lead.landingPage,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
        contactedAt: lead.contactedAt,
        convertedAt: lead.convertedAt,
      },
      stats: {
        notes: lead._count.notes,
        tasks: lead._count.tasks,
        documents: lead._count.documents,
        activities: lead._count.activities,
      },
      booking: lead.booking,
    });

    const snapshotJson = JSON.stringify(snapshot, null, 2);

    if (parsed.data.action === 'save_document') {
      const title = `Snapshot técnico ${new Date().toLocaleString('es-ES')}`;
      const fileUrl = `data:application/json;charset=utf-8,${encodeURIComponent(snapshotJson)}`;
      const doc = await prisma.leadDocument.create({
        data: {
          leadId: lead.id,
          type: 'OTHER',
          source: 'AUTO',
          title,
          fileUrl,
          mimeType: 'application/json',
          size: Buffer.byteLength(snapshotJson, 'utf8'),
          createdBy: 'Sistema',
        },
      });

      await prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          type: 'DOCUMENT',
          title: 'Snapshot técnico guardado',
          description: title,
          metadata: { documentId: doc.id },
          createdBy: 'Sistema',
        },
      });

      return NextResponse.json({ ok: true, documentId: doc.id });
    }

    const recipient =
      parsed.data.recipient || process.env.CONTACT_TO?.trim() || SITE_CONFIG.business.email;
    const subject = `Snapshot técnico lead ${lead.name} (${lead.id})`;

    await sendEmail({
      to: recipient,
      subject,
      html: `
        <div style="font-family:Segoe UI,Arial,sans-serif;">
          <h2 style="margin:0 0 10px 0;">Snapshot técnico de lead</h2>
          <p style="margin:0 0 16px 0;">Lead: <strong>${escapeHtml(lead.name)}</strong> (${escapeHtml(lead.email)})</p>
          <pre style="white-space:pre-wrap;background:#0f172a;color:#e2e8f0;padding:12px;border-radius:8px;overflow:auto;">${escapeHtml(snapshotJson)}</pre>
        </div>
      `,
    });

    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: 'EMAIL',
        title: 'Snapshot técnico enviado',
        description: `Enviado a ${recipient}`,
        metadata: { recipient, kind: 'technical_snapshot' },
        createdBy: 'Sistema',
      },
    });

    await prisma.leadNote.create({
      data: {
        leadId: lead.id,
        content: `📩 Snapshot técnico enviado a ${recipient}`,
      },
    });

    return NextResponse.json({ ok: true, recipient });
  } catch (error) {
    log.error('Error procesando snapshot técnico del lead', error, {
      context: { leadId: params.id },
    });
    return NextResponse.json(
      { ok: false, error: 'No se pudo procesar el snapshot técnico' },
      { status: 500 }
    );
  }
}
