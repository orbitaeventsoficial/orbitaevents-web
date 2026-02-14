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
import { getDbPackByCode, getDbPacks } from '@/lib/packs-db';
import type { PackDefinition } from '@/config/packs-config';
import { getQuoteTemplateSettings } from '@/lib/services/quoteTemplateService';
import { SITE_CONFIG } from '@/app/config/site-config';

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

async function resolvePack(packKey: string, locale?: string): Promise<QuotePack> {
  const pack = await getDbPackByCode(packKey, locale || 'es');
  if (pack) return packToQuotePack(pack);

  const fallback = await getDbPacks({ service: 'fiestas', locale: locale || 'es' });
  return packToQuotePack(fallback[0]);
}

function mergeNotes(parts: Array<string | undefined | null>): string | undefined {
  const filtered = parts.map((part) => part?.trim()).filter(Boolean) as string[];
  return filtered.length ? filtered.join('\n\n') : undefined;
}

async function normalizeExtras(extras: unknown): Promise<QuoteExtra[] | undefined> {
  if (!Array.isArray(extras) || extras.length === 0) return undefined;

  const hasObjectExtras = extras.some(
    (extra) => typeof extra === 'object' && extra !== null
  );

  if (hasObjectExtras) {
    return extras
      .map((extra) => ({
        name: String((extra as any).name || ''),
        description: (extra as any).description ? String((extra as any).description) : undefined,
        price: Number((extra as any).price || 0),
        quantity: Number((extra as any).quantity || 1),
      }))
      .filter((extra) => extra.name.trim().length > 0);
  }

  const slugs = extras.map((extra) => String(extra)).filter(Boolean);
  const dbExtras = await prisma.extra.findMany({
    where: { slug: { in: slugs } },
    include: { translations: true },
  });

  if (dbExtras.length !== slugs.length) {
    const found = new Set(dbExtras.map((extra) => extra.slug));
    const missing = slugs.filter((slug) => !found.has(slug));
    throw new Error(`Missing extras: ${missing.join(', ')}`);
  }

  return dbExtras.map((extra) => ({
    name: extra.translations[0]?.name || extra.slug,
    description: extra.translations[0]?.description || undefined,
    price: extra.price,
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
      to, // Manual email when no lead
      packId,
      price,
      extras,
      notes,
      customMessage,
      locale,
    } = body || {};

    // Need either leadId or manual email
    if ((!leadId && !to) || !packId || typeof price !== 'number') {
      return NextResponse.json(
        { error: 'Falten camps obligatoris: (leadId o email), packId, price' },
        { status: 400 }
      );
    }

    const template = await getQuoteTemplateSettings();

    // Get lead if provided, otherwise create minimal data for quote
    let lead = leadId ? await prisma.lead.findUnique({ where: { id: leadId } }) : null;
    let recipientEmail = to;
    let recipientName = 'Client';

    if (leadId && !lead) {
      return NextResponse.json({ error: 'Lead no trobat' }, { status: 404 });
    }

    if (lead) {
      recipientEmail = lead.email;
      recipientName = lead.name;
    }

    const packDataBase = await resolvePack(String(packId).toLowerCase(), locale);
    const packData = {
      ...packDataBase,
      price,
    };

    const quoteExtras = await normalizeExtras(extras);

    // Create quote data - use lead if available, otherwise minimal data
    const quoteData = lead
      ? createQuoteFromLead(lead, packData, quoteExtras)
      : {
          clientName: recipientName,
          clientEmail: recipientEmail,
          eventType: 'Event',
          eventDate: new Date(),
          eventLocation: '',
          guestCount: 0,
          packName: packData.name,
          packDescription: packData.description,
          packPrice: packData.price,
          djHours: packData.djHours,
          extraHourPrice: packData.extraHourPrice,
          extras: quoteExtras || [],
          subtotal: price,
          iva: price * 0.21,
          total: price * 1.21,
          quoteNumber: '',
          notes: undefined as string | undefined,
          validUntil: new Date(Date.now() + template.validityDays * 24 * 60 * 60 * 1000),
        };

    quoteData.quoteNumber = generateQuoteNumber();
    quoteData.validUntil = new Date(Date.now() + template.validityDays * 24 * 60 * 60 * 1000);
    quoteData.notes = mergeNotes([customMessage, notes, lead?.message || undefined]);

    // Only update lead records if we have a lead
    if (lead && leadId) {
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
          source: 'MANUAL',
          title: documentTitle,
          fileUrl: `quote-email:${quoteData.quoteNumber}`,
          filePath: `lead/${leadId}/quote/${quoteData.quoteNumber}`,
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
          metadata: {
            quoteNumber: quoteData.quoteNumber,
            to: recipientEmail,
            total: quoteData.total,
            source: 'email_quote_route',
          },
          createdBy: 'Admin',
        },
      });

      if (lead.customerId) {
        await prisma.customerActivity.create({
          data: {
            customerId: lead.customerId,
            action: 'QUOTE_SENT',
            details: {
              leadId,
              quoteNumber: quoteData.quoteNumber,
              total: quoteData.total,
            },
          },
        });
      }
    }

    const html = generateQuoteHTML(quoteData, {
      introTitle: template.introTitle,
      introSubtitle: template.introSubtitle,
      ctaTitle: template.ctaTitle,
      ctaSubtitle: template.ctaSubtitle,
      conditions: template.conditions,
    });

    await sendEmail({
      to: recipientEmail,
      subject: `Pressupost ${quoteData.quoteNumber} - Òrbita Events`,
      html,
      replyTo: (process.env.CONTACT_TO || '').trim() || undefined,
    });

    let adminCopySent = false;
    if (template.sendAdminCopy) {
      const copyRecipient = template.adminCopyEmail || process.env.CONTACT_TO || SITE_CONFIG.business.email;
      if (copyRecipient && copyRecipient !== recipientEmail) {
        await sendEmail({
          to: copyRecipient,
          subject: `[Còpia] Pressupost ${quoteData.quoteNumber} · ${recipientName}`,
          html,
          replyTo: recipientEmail,
        });
        adminCopySent = true;
      }
    }

    return NextResponse.json({
      ok: true,
      quoteNumber: quoteData.quoteNumber,
      total: quoteData.total,
      adminCopySent,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Missing extras:')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    if (error instanceof Error && /timeout/i.test(error.message)) {
      return NextResponse.json(
        { error: 'Timeout SMTP enviant pressupost. Revisa configuració SMTP (host/port/firewall).' },
        { status: 504 }
      );
    }

    log.error('Error enviant pressupost:', error);
    return NextResponse.json(
      { error: error instanceof Error ? `Error enviant pressupost: ${error.message}` : 'Error enviant pressupost' },
      { status: 500 }
    );
  }
}
