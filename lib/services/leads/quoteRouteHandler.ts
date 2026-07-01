import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { formatCurrencyExact } from '@/lib/constants';
import { generateQuoteHTML, createQuoteFromLead, generateQuoteNumber } from '@/lib/services/documentService';
import { resolveQuotePack } from '@/lib/services/quotes/quotePack';
import { requireAuth } from '@/lib/auth';
import { getQuoteTemplateSettings } from '@/lib/services/quoteTemplateService';
import { getAppBaseUrl } from '@/lib/site';
import { recordLeadQuoteGenerated } from '@/lib/services/leadActivityService';

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

function parsePositiveNumber(value: unknown): number | null {
  if (!value) return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num;
}

function parsePackKey(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : null;
}

export async function handleLeadQuoteGet(req: NextRequest, leadId: string) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const template = await getQuoteTemplateSettings();
    const lead = await fetchLeadForQuote(leadId);

    if (!lead) {
      return NextResponse.json({ error: 'Lead no trobat' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const packKey = parsePackKey(searchParams.get('packId')) || parsePackKey(lead.interestedPackId) || 'default';
    const basePack = await resolveQuotePack(packKey, lead.preferredLocale || 'ca');
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

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    log.error('Error generant pressupost:', error);
    return NextResponse.json({ error: 'Error generant pressupost' }, { status: 500 });
  }
}

export async function handleLeadQuotePost(req: NextRequest, leadId: string) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const template = await getQuoteTemplateSettings();
    const body = await req.json().catch(() => ({}));
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || getAppBaseUrl();

    const lead = await fetchLeadForQuote(leadId);
    if (!lead) {
      return NextResponse.json({ error: 'Lead no trobat' }, { status: 404 });
    }

    const packKey = parsePackKey(body.packId) || parsePackKey(lead.interestedPackId) || 'default';
    const basePack = await resolveQuotePack(packKey, lead.preferredLocale || 'ca');
    const customPrice = parsePositiveNumber(body.customPrice);
    const customHours = parsePositiveNumber(body.customHours);

    const packData = {
      ...basePack,
      price: customPrice ?? basePack.price,
      djHours: customHours ?? basePack.djHours,
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
        content: `📄 Pressupost generat: ${quoteNumber}\n💰 Total: ${formatCurrencyExact(quoteData.total)}\n📦 Pack: ${packData.name}`,
      },
    });

    const query = new URLSearchParams();
    query.set('packId', packKey);
    if (customPrice !== null) {
      query.set('customPrice', String(customPrice));
    }
    if (customHours !== null) {
      query.set('customHours', String(customHours));
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

    await recordLeadQuoteGenerated({
      leadId,
      quoteNumber,
      total: quoteData.total,
    });

    const html = generateQuoteHTML(quoteData, {
      introTitle: template.introTitle,
      introSubtitle: template.introSubtitle,
      ctaTitle: template.ctaTitle,
      ctaSubtitle: template.ctaSubtitle,
      conditions: template.conditions,
    });

    return NextResponse.json({
      success: true,
      quoteNumber,
      total: quoteData.total,
      html,
      message: 'Pressupost generat correctament',
    });
  } catch (error) {
    log.error('Error generant pressupost:', error);
    return NextResponse.json({ error: 'Error generant pressupost' }, { status: 500 });
  }
}
