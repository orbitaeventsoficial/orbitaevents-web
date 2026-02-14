import { NextRequest, NextResponse } from 'next/server';
import type { EventType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { fetchEmailByUid } from '@/lib/imap';
import { extractLeadDataFromEmail } from '@/lib/services/emailLeadExtractionService';

interface RouteParams {
  params: Promise<{ uid: string }>;
}

type FallbackEmailPayload = {
  fromAddress?: string;
  fromName?: string;
  subject?: string;
  bodyText?: string;
};

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

function mergeImportedMessage(existing: string | null | undefined, imported: string | undefined, subject: string): string | null {
  if (!imported) return existing || null;
  const marker = `[importat des d'email: ${subject}]`;
  if (existing?.includes(marker)) return existing;
  const cleaned = imported.trim();
  return `${cleaned}\n\n${marker}`.slice(0, 4000);
}

function resolveEventType(existingType: EventType, extractedType: EventType): EventType {
  // Si el lead encara està en OTHER, permet millorar-lo amb el tipus inferit del correu.
  if (existingType === 'OTHER' && extractedType !== 'OTHER') return extractedType;
  return existingType || extractedType;
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
    const payload = await request.json().catch(() => ({}));
    const fallbackEmail = (payload?.fallbackEmail || {}) as FallbackEmailPayload;
    const email = await fetchEmailByUid(uidNum);

    const senderAddress = email?.from?.address || fallbackEmail.fromAddress || '';
    const senderName = email?.from?.name || fallbackEmail.fromName || '';
    const subject = email?.subject || fallbackEmail.subject || '';
    const bodyText = email?.bodyText || fallbackEmail.bodyText || '';

    if (!senderAddress || !senderAddress.includes('@')) {
      return NextResponse.json({ error: 'Email remitent invàlid' }, { status: 400 });
    }

    const extractedRaw = extractLeadDataFromEmail({
      fromName: senderName,
      fromAddress: senderAddress,
      subject,
      bodyText,
    });
    const extracted = {
      name: sanitizeString(extractedRaw.name, 120) || sanitizeString(senderName, 120) || 'Client',
      email: sanitizeString(extractedRaw.email, 190)?.toLowerCase() || senderAddress.toLowerCase(),
      phone: sanitizeString(extractedRaw.phone, 40),
      eventType: extractedRaw.eventType,
      eventDate: sanitizeOptionalDate(extractedRaw.eventDate),
      guestCount: sanitizeOptionalGuestCount(extractedRaw.guestCount),
      budget: sanitizeString(extractedRaw.budget, 120),
      eventLocation: sanitizeString(extractedRaw.eventLocation, 160),
      message: sanitizeString(extractedRaw.message, 4000),
      commercialSummary: sanitizeString(extractedRaw.commercialSummary, 1500),
      importantUnknowns: Array.isArray(extractedRaw.importantUnknowns)
        ? extractedRaw.importantUnknowns
            .map((item) => sanitizeString(item, 220))
            .filter((item): item is string => Boolean(item))
            .slice(0, 6)
        : [],
    };

    if (!isValidEmail(extracted.email)) {
      return NextResponse.json({ error: 'No s’ha pogut detectar un email vàlid del remitent' }, { status: 400 });
    }

    const existing = await prisma.lead.findFirst({
      where: { email: { equals: extracted.email, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      const uidMarker = `(UID ${uidNum})`;
      const alreadyImported = await prisma.leadNote.findFirst({
        where: {
          leadId: existing.id,
          content: { contains: uidMarker },
        },
        select: { id: true },
      });

      if (alreadyImported) {
        return NextResponse.json({
          ok: true,
          action: 'already_imported',
          lead: {
            id: existing.id,
            name: existing.name,
            email: existing.email,
            status: existing.status,
          },
        });
      }

      const updated = await prisma.lead.update({
        where: { id: existing.id },
        data: {
          name: existing.name || extracted.name,
          phone: existing.phone || extracted.phone || null,
          eventType: resolveEventType(existing.eventType, extracted.eventType),
          eventDate: existing.eventDate || extracted.eventDate || null,
          guestCount: existing.guestCount || extracted.guestCount || null,
          budget: existing.budget || extracted.budget || null,
          eventLocation: existing.eventLocation || extracted.eventLocation || null,
          source: existing.source === 'WEBSITE' ? 'OTHER' : existing.source,
          message: mergeImportedMessage(existing.message, extracted.message, subject),
          updatedAt: new Date(),
        },
      });

      await prisma.leadNote.create({
        data: {
          leadId: updated.id,
          content: [
            `📥 Email importat (UID ${uidNum})`,
            `Assumpte: ${subject || '(Sense assumpte)'}`,
            extracted.commercialSummary ? `\n🧠 Resum comercial automàtic\n${extracted.commercialSummary}` : '',
            extracted.importantUnknowns.length
              ? `\n⚠️ Revisar manualment\n${extracted.importantUnknowns.map((line) => `- ${line}`).join('\n')}`
              : '',
          ]
            .filter(Boolean)
            .join('\n'),
          createdBy: 'Admin Inbox',
        },
      });

      await prisma.leadActivity.create({
        data: {
          leadId: updated.id,
          type: 'SYSTEM',
          title: 'Lead actualitzat des d’Inbox',
          description: `Importació automàtica des d’email ${senderAddress}`,
          createdBy: 'Admin Inbox',
          metadata: {
            uid: uidNum,
            subject,
            usedFallback: !email,
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
          ? `${extracted.message}\n\n[importat des d'email: ${subject}]`
          : `Lead creat des d'email importat. Assumpte: ${subject || '(Sense assumpte)'}`,
        interestedExtras: [],
      },
    });

    await prisma.leadNote.create({
      data: {
        leadId: created.id,
        content: [
          `📥 Lead creat des d’email (UID ${uidNum})`,
          `Assumpte: ${subject || '(Sense assumpte)'}`,
          extracted.commercialSummary ? `\n🧠 Resum comercial automàtic\n${extracted.commercialSummary}` : '',
          extracted.importantUnknowns.length
            ? `\n⚠️ Revisar manualment\n${extracted.importantUnknowns.map((line) => `- ${line}`).join('\n')}`
            : '',
        ]
          .filter(Boolean)
          .join('\n'),
        createdBy: 'Admin Inbox',
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: created.id,
        type: 'SYSTEM',
        title: 'Lead creat des d’Inbox',
        description: `Importació automàtica des d’email ${senderAddress}`,
        createdBy: 'Admin Inbox',
        metadata: {
          uid: uidNum,
          subject,
          usedFallback: !email,
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
