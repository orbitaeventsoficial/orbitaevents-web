/**
 * Lead quote handlers (shared by legacy and leads routes)
 */
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { generateQuoteHTML, createQuoteFromLead, generateQuoteNumber } from '@/lib/services/documentService';
import { getDbPackByCode, getDbPacks } from '@/lib/packs-db';
import type { PackDefinition } from '@/config/packs-config';
import { requireAuth } from '@/lib/auth';
import { getQuoteTemplateSettings } from '@/lib/services/quoteTemplateService';

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

  const djHours = typeof (pack as any).durationHours === 'number' ? (pack as any).durationHours : 4;
  return {
    name: pack.name,
    price: pack.priceValue ?? 500,
    djHours,
    extraHourPrice: 80,
    description: (pack as any).emotion || pack.tagline || pack.name,
  };
}

async function resolvePack(packKey: string, locale?: string): Promise<QuotePack> {
  const pack = await getDbPackByCode(packKey, locale || 'ca');
  if (pack) return packToQuotePack(pack);

  const fallback = await getDbPacks({ service: 'fiestas', locale: locale || 'ca' });
  return packToQuotePack(fallback[0]);
}

type LeadQuoteRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  eventType: string;
  eventDate: Date | null;
  eventLocation: string | null;
  guestCount: number | null;
  budget: string | null;
  message: string | null;
  interestedPackId: string | null;
  interestedExtras: string[] | null;
  source: string;
  preferredLocale: string;
};

async function fetchLeadForQuote(leadId: string): Promise<LeadQuoteRow | null> {
  const rows = await prisma.$queryRaw<LeadQuoteRow[]>`
    SELECT
      id,
      name,
      email,
      phone,
      "eventType",
      "eventDate",
      "eventLocation",
      "guestCount",
      budget,
      message,
      "interestedPackId",
      "interestedExtras",
      source,
      "preferredLocale"
    FROM "leads"
    WHERE id = ${leadId}
    LIMIT 1
  `;
  return rows[0] || null;
}

function parsePositiveNumber(value: string | null): number | null {
  if (!value) return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num;
}

export async function handleLeadQuoteGet(req: NextRequest, leadId: string, deprecated = false) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const template = await getQuoteTemplateSettings();
    const lead = await fetchLeadForQuote(leadId);

    if (!lead) {
      return NextResponse.json({ error: 'Lead no trobat' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const packKey = searchParams.get('packId')?.toLowerCase() || lead.interestedPackId?.toLowerCase() || 'default';
    const basePack = await resolvePack(packKey, lead.preferredLocale || 'ca');
    const customPrice = parsePositiveNumber(searchParams.get('customPrice'));
    const customHours = parsePositiveNumber(searchParams.get('customHours'));
    const packData = {
      ...basePack,
      price: customPrice ?? basePack.price,
      djHours: customHours ?? basePack.djHours,
    };

    const quoteData = createQuoteFromLead(lead, packData);
    quoteData.validUntil = new Date(Date.now() + template.validityDays * 24 * 60 * 60 * 1000);

    const html = generateQuoteHTML(quoteData, {
      introTitle: template.introTitle,
      introSubtitle: template.introSubtitle,
      ctaTitle: template.ctaTitle,
      ctaSubtitle: template.ctaSubtitle,
      conditions: template.conditions,
    });

    const response = new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });

    if (deprecated) {
      response.headers.set('x-api-deprecated', 'true');
      response.headers.set('x-api-replacement', `/api/admin/leads/${leadId}/quote`);
    }

    return response;
  } catch (error) {
    log.error('Error generant pressupost:', error);
    return NextResponse.json({ error: 'Error generant pressupost' }, { status: 500 });
  }
}

export async function handleLeadQuotePost(req: NextRequest, leadId: string, deprecated = false) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const template = await getQuoteTemplateSettings();
    const body = await req.json().catch(() => ({}));
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://orbitaevents.com';

    const lead = await fetchLeadForQuote(leadId);
    if (!lead) {
      return NextResponse.json({ error: 'Lead no trobat' }, { status: 404 });
    }

    const packKey = body.packId?.toLowerCase() || lead.interestedPackId?.toLowerCase() || 'default';
    const basePack = await resolvePack(packKey, lead.preferredLocale || 'ca');

    const packData = {
      ...basePack,
      price: body.customPrice ?? basePack.price,
      djHours: body.customHours ?? basePack.djHours,
    };

    const quoteData = createQuoteFromLead(
      {
        ...lead,
        eventLocation: body.eventLocation || lead.eventLocation,
      },
      packData,
      body.extras
    );
    quoteData.validUntil = new Date(Date.now() + template.validityDays * 24 * 60 * 60 * 1000);

    const quoteNumber = generateQuoteNumber();
    quoteData.quoteNumber = quoteNumber;

    await prisma.lead.updateMany({
      where: { id: leadId },
      data: { status: 'QUOTE_SENT' },
    });

    await prisma.leadNote.create({
      data: {
        leadId,
        content: `📄 Pressupost generat: ${quoteNumber}\n💰 Total: ${quoteData.total.toFixed(2)}€\n📦 Pack: ${packData.name}`,
      },
    });

    const query = new URLSearchParams();
    query.set('packId', packKey);
    if (typeof body.customPrice === 'number' && Number.isFinite(body.customPrice) && body.customPrice > 0) {
      query.set('customPrice', String(body.customPrice));
    }
    if (typeof body.customHours === 'number' && Number.isFinite(body.customHours) && body.customHours > 0) {
      query.set('customHours', String(body.customHours));
    }

    const quoteUrl = `${baseUrl}/api/admin/leads/${leadId}/quote?${query.toString()}`;
    const documentTitle = `Pressupost ${quoteNumber}`;

    await prisma.leadDocument.create({
      data: {
        leadId,
        type: 'QUOTE',
        source: 'AUTO',
        title: documentTitle,
        fileUrl: quoteUrl,
        mimeType: 'text/html',
        createdBy: 'Sistema',
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId,
        type: 'DOCUMENT',
        title: 'Pressupost generat',
        description: documentTitle,
        metadata: {
          quoteNumber,
          total: quoteData.total,
          source: 'lead_quote_route',
        },
        createdBy: 'Sistema',
      },
    });

    const html = generateQuoteHTML(quoteData, {
      introTitle: template.introTitle,
      introSubtitle: template.introSubtitle,
      ctaTitle: template.ctaTitle,
      ctaSubtitle: template.ctaSubtitle,
      conditions: template.conditions,
    });

    const response = NextResponse.json({
      success: true,
      quoteNumber,
      total: quoteData.total,
      html,
      message: 'Pressupost generat correctament',
    });

    if (deprecated) {
      response.headers.set('x-api-deprecated', 'true');
      response.headers.set('x-api-replacement', `/api/admin/leads/${leadId}/quote`);
    }

    return response;
  } catch (error) {
    log.error('Error generant pressupost:', error);
    return NextResponse.json({ error: 'Error generant pressupost' }, { status: 500 });
  }
}
