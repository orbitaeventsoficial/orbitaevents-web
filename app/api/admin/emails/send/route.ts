// app/api/admin/emails/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { SITE_CONFIG } from '@/app/config/site-config';
import {
  createQuoteFromLead,
  generateQuoteHTML,
  type QuoteData,
} from '@/lib/services/documentService';
import { getDbPackByCode, getDbPacks } from '@/lib/packs-db';
import type { PackDefinition } from '@/config/packs-config';
import { getQuoteTemplateSettings } from '@/lib/services/quoteTemplateService';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function bodyToHtml(body: string): string {
  const escaped = escapeHtml(body.trim());
  return `<p style="white-space:pre-line;font-family:'Segoe UI',Arial,sans-serif;">${escaped}</p>`;
}

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

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { to, subject, body: messageBody, leadId, replyToId, quote } = body || {};

    if (!to || !subject || !messageBody) {
      return NextResponse.json(
        { error: 'Falten camps obligatoris: to, subject, body' },
        { status: 400 }
      );
    }

    const replyTo =
      process.env.SMTP_REPLY_TO?.trim() || SITE_CONFIG.business.email;

    const resolvedLeadId = leadId || replyToId;
    const quoteAttachment = quote && typeof quote === 'object' ? quote : null;
    let attachments: { filename: string; content: string; contentType: string }[] | undefined;

    if (quoteAttachment) {
      const packId = String((quoteAttachment as any).packId || '').trim().toLowerCase();
      const price = Number((quoteAttachment as any).price || 0);
      if (!packId || !Number.isFinite(price) || price <= 0) {
        return NextResponse.json(
          { error: 'Per adjuntar pressupost: pack i preu són obligatoris' },
          { status: 400 }
        );
      }

      const template = await getQuoteTemplateSettings();
      const dbLead = resolvedLeadId ? await prisma.lead.findUnique({ where: { id: resolvedLeadId } }) : null;
      const locale = (dbLead?.preferredLocale || 'es').toLowerCase();
      const pack = await resolvePack(packId, locale);

      const quoteData: QuoteData = dbLead
        ? createQuoteFromLead(dbLead, { ...pack, price })
        : {
            clientName: String((quoteAttachment as any).clientName || to).slice(0, 120),
            clientEmail: String(to),
            eventType: String((quoteAttachment as any).eventType || 'OTHER'),
            eventDate: new Date(),
            eventLocation: String((quoteAttachment as any).eventLocation || ''),
            guestCount: 0,
            packName: pack.name,
            packDescription: pack.description,
            packPrice: price,
            djHours: pack.djHours,
            extraHourPrice: pack.extraHourPrice,
            subtotal: price,
            iva: price * 0.21,
            total: price * 1.21,
            quoteNumber: `TMP-${Date.now().toString(36).toUpperCase()}`,
            validUntil: new Date(Date.now() + template.validityDays * 24 * 60 * 60 * 1000),
            notes: undefined,
          };
      const quoteHtml = generateQuoteHTML(quoteData, {
        introTitle: template.introTitle,
        introSubtitle: template.introSubtitle,
        ctaTitle: template.ctaTitle,
        ctaSubtitle: template.ctaSubtitle,
        conditions: template.conditions,
      });
      attachments = [
        {
          filename: `pressupost-${quoteData.quoteNumber}.html`,
          content: quoteHtml,
          contentType: 'text/html; charset=utf-8',
        },
      ];
    }

    await sendEmail({
      to,
      subject: String(subject),
      html: bodyToHtml(String(messageBody)),
      replyTo,
      attachments,
    });

    if (resolvedLeadId) {
      await prisma.leadNote.create({
        data: {
          leadId: resolvedLeadId,
          content: `📧 Email enviat: ${String(subject)}${attachments ? '\n📎 Amb pressupost adjunt' : ''}`,
        },
      });
      await prisma.leadActivity.create({
        data: {
          leadId: resolvedLeadId,
          type: 'EMAIL',
          title: 'Email enviat',
          description: `${String(subject)}${attachments ? ' (amb pressupost)' : ''}`,
          createdBy: 'Admin',
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('Error enviant email admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconegut';
    if (/timeout/i.test(errorMessage)) {
      return NextResponse.json(
        { error: 'Timeout SMTP. Revisa host/port, firewall i credencials SMTP.' },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: `Error enviant email: ${errorMessage}` },
      { status: 500 }
    );
  }
}
