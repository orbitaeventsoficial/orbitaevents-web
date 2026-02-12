import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { fetchEmailByUid } from '@/lib/imap';
import { extractLeadDataFromEmail } from '@/lib/services/emailLeadExtractionService';

interface RouteParams {
  params: Promise<{ uid: string }>;
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { uid } = await params;
  const uidNum = Number.parseInt(uid, 10);
  if (!Number.isFinite(uidNum)) {
    return NextResponse.json({ error: 'UID invàlid' }, { status: 400 });
  }

  try {
    const email = await fetchEmailByUid(uidNum);
    if (!email) {
      return NextResponse.json({ error: 'Email no trobat' }, { status: 404 });
    }

    if (!email.from?.address || !email.from.address.includes('@')) {
      return NextResponse.json({ error: 'Email remitent invàlid' }, { status: 400 });
    }

    const extracted = extractLeadDataFromEmail({
      fromName: email.from.name,
      fromAddress: email.from.address,
      subject: email.subject,
      bodyText: email.bodyText,
    });

    const existing = await prisma.lead.findFirst({
      where: { email: extracted.email },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      const updated = await prisma.lead.update({
        where: { id: existing.id },
        data: {
          name: existing.name || extracted.name,
          phone: existing.phone || extracted.phone,
          eventType: existing.eventType || extracted.eventType,
          eventDate: existing.eventDate || extracted.eventDate,
          guestCount: existing.guestCount || extracted.guestCount,
          budget: existing.budget || extracted.budget,
          eventLocation: existing.eventLocation || extracted.eventLocation,
          source: existing.source === 'WEBSITE' ? 'OTHER' : existing.source,
          message: extracted.message
            ? `${extracted.message}\n\n[importat des d'email: ${email.subject}]`
            : existing.message,
          updatedAt: new Date(),
        },
      });

      await prisma.leadNote.create({
        data: {
          leadId: updated.id,
          content: `📥 Email importat (UID ${uidNum})\nAssumpte: ${email.subject || '(Sense assumpte)'}`,
          createdBy: 'Admin Inbox',
        },
      });

      await prisma.leadActivity.create({
        data: {
          leadId: updated.id,
          type: 'SYSTEM',
          title: 'Lead actualitzat des d’Inbox',
          description: `Importació automàtica des d’email ${email.from.address}`,
          createdBy: 'Admin Inbox',
          metadata: {
            uid: uidNum,
            subject: email.subject,
          },
        },
      });

      return NextResponse.json({
        ok: true,
        action: 'updated',
        lead: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          status: updated.status,
        },
      });
    }

    const created = await prisma.lead.create({
      data: {
        name: extracted.name,
        email: extracted.email,
        phone: extracted.phone,
        eventType: extracted.eventType,
        eventDate: extracted.eventDate,
        guestCount: extracted.guestCount,
        budget: extracted.budget,
        eventLocation: extracted.eventLocation,
        source: 'OTHER',
        message: extracted.message
          ? `${extracted.message}\n\n[importat des d'email: ${email.subject}]`
          : `Lead creat des d'email importat. Assumpte: ${email.subject || '(Sense assumpte)'}`,
        interestedExtras: [],
      },
    });

    await prisma.leadNote.create({
      data: {
        leadId: created.id,
        content: `📥 Lead creat des d’email (UID ${uidNum})\nAssumpte: ${email.subject || '(Sense assumpte)'}`,
        createdBy: 'Admin Inbox',
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: created.id,
        type: 'SYSTEM',
        title: 'Lead creat des d’Inbox',
        description: `Importació automàtica des d’email ${email.from.address}`,
        createdBy: 'Admin Inbox',
        metadata: {
          uid: uidNum,
          subject: email.subject,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      action: 'created',
      lead: {
        id: created.id,
        name: created.name,
        email: created.email,
        status: created.status,
      },
    });
  } catch (error) {
    log.error('Error creant lead des d’email', error as Error);
    return NextResponse.json({ error: 'Error creant lead des d’email' }, { status: 500 });
  }
}
