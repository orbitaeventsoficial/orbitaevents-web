// app/api/admin/emails/quote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { requireAuth } from '@/lib/auth';
import {
  createQuoteFromLead,
  generateQuoteHTML,
  generateQuoteNumber,
  type QuoteExtra,
} from '@/lib/services/documentService';
import { getPackById, getPacksByService, type PackDefinition } from '@/config/packs-config';

type QuotePack = {
  name: string;
  price: number;
  djHours: number;
  extraHourPrice: number;
  description: string;
};

function packToQuotePack(pack: PackDefinition | undefined): QuotePack {
  if (!pack) {
    return {
      name: 'Servei DJ Professional',
      price: 500,
      djHours: 4,
      extraHourPrice: 80,
      description: 'Servei DJ complet amb so i il·luminació',
    };
  }

  const djHours =
    typeof (pack as any).durationHours === 'number' ? (pack as any).durationHours : 4;
  return {
    name: pack.name,
    price: pack.priceValue ?? 500,
    djHours,
    extraHourPrice: 80,
    description: (pack as any).emotion || pack.tagline || pack.name,
  };
}

function resolvePack(packKey: string): QuotePack {
  const pack =
    getPackById(packKey) ||
    getPacksByService('fiestas').find((p) => p.slug === packKey) ||
    getPacksByService('fiestas')[0];
  return packToQuotePack(pack);
}

function mergeNotes(parts: Array<string | undefined | null>): string | undefined {
  const filtered = parts.map((part) => part?.trim()).filter(Boolean) as string[];
  return filtered.length ? filtered.join('\n\n') : undefined;
}

function normalizeExtras(extras: unknown): QuoteExtra[] | undefined {
  if (!Array.isArray(extras) || extras.length === 0) return undefined;
  return extras.map((extra) => ({
    name: String(extra),
    description: undefined,
    price: 0,
    quantity: 1,
  }));
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const {
      leadId,
      packId,
      price,
      extras,
      notes,
      customMessage,
      locale,
    } = body || {};

    if (!leadId || !packId || typeof price !== 'number') {
      return NextResponse.json(
        { error: 'Falten camps obligatoris: leadId, packId, price' },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead no trobat' }, { status: 404 });
    }

    const packDataBase = resolvePack(String(packId).toLowerCase());
    const packData = {
      ...packDataBase,
      price,
    };

    const quoteExtras = normalizeExtras(extras);

    const quoteData = createQuoteFromLead(
      {
        ...lead,
        preferredLocale: locale || lead.preferredLocale,
      },
      packData,
      quoteExtras
    );

    quoteData.quoteNumber = generateQuoteNumber();
    quoteData.notes = mergeNotes([customMessage, notes, lead.message || undefined]);

    await prisma.lead.update({
      where: { id: leadId },
      data: { status: 'QUOTE_SENT', updatedAt: new Date() },
    });

    await prisma.leadNote.create({
      data: {
        leadId,
        content: `📄 Pressupost enviat: ${quoteData.quoteNumber}\n💰 Total: ${quoteData.total.toFixed(2)}€\n📦 Pack: ${packData.name}`,
      },
    });

    const documentTitle = `Pressupost ${quoteData.quoteNumber}`;
    await prisma.leadDocument.create({
      data: {
        leadId,
        type: 'QUOTE',
        source: 'ADMIN',
        title: documentTitle,
        fileUrl: 'email',
        mimeType: 'text/html',
        createdBy: 'Admin',
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId,
        type: 'EMAIL',
        title: 'Pressupost enviat',
        description: documentTitle,
        metadata: { quoteNumber: quoteData.quoteNumber },
        createdBy: 'Admin',
      },
    });

    const html = generateQuoteHTML(quoteData);

    await sendEmail({
      to: lead.email,
      subject: `Pressupost ${quoteData.quoteNumber} - Òrbita Events`,
      html,
      replyTo: (process.env.CONTACT_TO || '').trim() || undefined,
    });

    return NextResponse.json({
      ok: true,
      quoteNumber: quoteData.quoteNumber,
      total: quoteData.total,
    });
  } catch (error) {
    log.error('Error enviant pressupost:', error);
    return NextResponse.json(
      { error: 'Error enviant pressupost' },
      { status: 500 }
    );
  }
}
