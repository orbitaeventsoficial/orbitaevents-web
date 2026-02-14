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

function sanitizeString(value: unknown, max = 500): string | undefined {
  if (typeof value !== 'string') return undefined;
  const clean = value.trim();
  if (!clean) return undefined;
  return clean.slice(0, max);
}

function sanitizeOptionalDate(value: unknown): Date | undefined {
  if (!(value instanceof Date)) return undefined;
  return Number.isNaN(value.getTime()) ? undefined : value;
}

function sanitizeOptionalGuestCount(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  const rounded = Math.round(value);
  if (rounded <= 0) return undefined;
  return Math.min(rounded, 10000);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

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

    const extractedRaw = extractLeadDataFromEmail({
      fromName: email.from.name,
      fromAddress: email.from.address,
      subject: email.subject,
      bodyText: email.bodyText,
    });
    const extracted = {
      name: sanitizeString(extractedRaw.name, 120) || sanitizeString(email.from.name, 120) || 'Client',
      email: sanitizeString(extractedRaw.email, 190)?.toLowerCase() || email.from.address.toLowerCase(),
      phone: sanitizeString(extractedRaw.phone, 40),
      eventType: extractedRaw.eventType,
      eventDate: sanitizeOptionalDate(extractedRaw.eventDate),
      guestCount: sanitizeOptionalGuestCount(extractedRaw.guestCount),
      budget: sanitizeString(extractedRaw.budget, 120),
      eventLocation: sanitizeString(extractedRaw.eventLocation, 160),
      message: sanitizeString(extractedRaw.message, 4000),
    };

    if (!isValidEmail(extracted.email)) {
      return NextResponse.json({ error: 'No s’ha pogut detectar un email vàlid del remitent' }, { status: 400 });
    }

    const existing = await prisma.lead.findFirst({
      where: { email: { equals: extracted.email, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      const updated = await prisma.lead.update({
        where: { id: existing.id },
        data: {
          name: existing.name || extracted.name,
          phone: existing.phone || extracted.phone || null,
          eventType: existing.eventType || extracted.eventType,
          eventDate: existing.eventDate || extracted.eventDate || null,
          guestCount: existing.guestCount || extracted.guestCount || null,
          budget: existing.budget || extracted.budget || null,
          eventLocation: existing.eventLocation || extracted.eventLocation || null,
          source: existing.source === 'WEBSITE' ? 'OTHER' : existing.source,
          message: extracted.message
            ? `${extracted.message}\n\n[importat des d'email: ${email.subject}]`
            : existing.message || null,
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
        phone: extracted.phone || null,
        eventType: extracted.eventType,
        eventDate: extracted.eventDate || null,
        guestCount: extracted.guestCount || null,
        budget: extracted.budget || null,
        eventLocation: extracted.eventLocation || null,
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error creant lead des d’email' },
      { status: 500 }
    );
  }
}
