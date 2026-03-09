// app/api/admin/emails/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, getEmailSignatureHtml } from '@/lib/email';
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
import { translateTextForLocale } from '@/lib/services/translationService';
import { escapeHtml } from '@/lib/utils/sanitize';

interface QuoteAttachmentInput {
  packId?: string;
  price?: number;
  clientName?: string;
  eventType?: string;
  eventLocation?: string;
}

const APP_BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://orbitaevents.com').replace(/\/+$/, '');
const EMAIL_LOGO_URL = `${APP_BASE_URL}/img/logosoloplaneta.png`;

function bodyToHtml(body: string): string {
  const escaped = escapeHtml(body.trim());
  return `<p style="white-space:pre-line;font-family:'Segoe UI',Arial,sans-serif;">${escaped}</p>${getEmailSignatureHtml()}`;
}

function normalizeLocale(locale?: string | null): string {
  const raw = String(locale || 'ca').trim().toLowerCase();
  if (!raw) return 'ca';
  if (raw.startsWith('ca')) return 'ca';
  if (raw.startsWith('es')) return 'es';
  if (raw.startsWith('en')) return 'en';
  if (raw.startsWith('ru')) return 'ru';
  if (raw.startsWith('fr')) return 'fr';
  if (raw.startsWith('de')) return 'de';
  if (raw.startsWith('it')) return 'it';
  return raw.slice(0, 2);
}

function getTemplateTexts(locale: string) {
  if (locale === 'ru') {
    return {
      subtitle: 'Профессиональные DJ-услуги для вашего мероприятия',
      footer: 'Спасибо за доверие. Мы на связи.',
      legal: 'Это информационное сообщение от Òrbita Events.',
    };
  }
  if (locale === 'en') {
    return {
      subtitle: 'Professional DJ services for your event',
      footer: 'Thank you for your trust. We are here to help.',
      legal: 'This is an informational message from Òrbita Events.',
    };
  }
  if (locale === 'es') {
    return {
      subtitle: 'Servicios profesionales de DJ para tu evento',
      footer: 'Gracias por tu confianza. Estamos a tu disposición.',
      legal: 'Este es un mensaje informativo de Òrbita Events.',
    };
  }
  return {
    subtitle: 'Serveis professionals de DJ per al teu esdeveniment',
    footer: 'Gràcies per la teva confiança. Estem a la teva disposició.',
    legal: "Aquest és un missatge informatiu d'Òrbita Events.",
  };
}

function buildBrandedEmailHtml(contentHtml: string, locale: string): string {
  const t = getTemplateTexts(locale);
  return `<!doctype html>
<html lang="${escapeHtml(locale)}">
  <body style="margin:0;padding:0;background:#f5f5f4;font-family:'Segoe UI',Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="680" cellspacing="0" cellpadding="0" style="max-width:680px;width:100%;background:#ffffff;border:1px solid #e7e5e4;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(120deg,#111827 0%,#1f2937 50%,#0f172a 100%);padding:18px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="width:58px;vertical-align:middle;">
                      <img src="${escapeHtml(EMAIL_LOGO_URL)}" alt="Òrbita Events" width="46" height="46" style="display:block;width:46px;height:46px;border-radius:10px;background:#ffffff;padding:4px;" />
                    </td>
                    <td style="vertical-align:middle;">
                      <div style="font-size:20px;font-weight:800;letter-spacing:0.2px;color:#ffffff;">Òrbita Events</div>
                      <div style="margin-top:5px;font-size:13px;color:#cbd5e1;">${escapeHtml(t.subtitle)}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                ${contentHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 24px;border-top:1px solid #e7e5e4;background:#fafaf9;">
                <div style="font-size:13px;color:#334155;">${escapeHtml(t.footer)}</div>
                <div style="margin-top:6px;font-size:12px;color:#64748b;">
                  ${escapeHtml(SITE_CONFIG.business.email)} · ${escapeHtml(SITE_CONFIG.business.phoneDisplay)}
                </div>
                <div style="margin-top:8px;font-size:11px;color:#94a3b8;">${escapeHtml(t.legal)}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
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

  return {
    name: pack.name,
    price: pack.priceValue ?? 500,
    djHours: pack.durationHours ?? 4,
    extraHourPrice: 80,
    description: pack.emotion || pack.tagline || pack.name,
  };
}

async function resolvePack(packKey: string, locale?: string): Promise<QuotePack> {
  const pack = await getDbPackByCode(packKey, locale || 'ca');
  if (pack) return packToQuotePack(pack);

  const fallback = await getDbPacks({ service: 'fiestas', locale: locale || 'ca' });
  return packToQuotePack(fallback[0]);
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { to, subject, body: messageBody, leadId, replyToId, customerId, quote, locale } = body || {};

    if (!to || !subject || !messageBody) {
      return NextResponse.json(
        { error: 'Falten camps obligatoris: to, subject, body' },
        { status: 400 }
      );
    }

    const replyTo =
      process.env.SMTP_REPLY_TO?.trim() || SITE_CONFIG.business.email;

    const resolvedLeadId = leadId || replyToId;
    const leadForLocale = resolvedLeadId
      ? await prisma.lead.findUnique({
          where: { id: resolvedLeadId },
          select: { id: true, preferredLocale: true },
        })
      : null;
    const customerForLocale = customerId
      ? await prisma.customer.findUnique({
          where: { id: String(customerId) },
          select: { id: true, preferredLocale: true },
        })
      : null;
    const resolvedLocale = normalizeLocale(
      leadForLocale?.preferredLocale || customerForLocale?.preferredLocale || locale || 'ca'
    );
    const translatedSubject = await translateTextForLocale(String(subject), resolvedLocale);
    const translatedBody = await translateTextForLocale(String(messageBody), resolvedLocale);
    const quoteAttachment = quote && typeof quote === 'object' ? quote : null;
    const emailCountBefore = resolvedLeadId
      ? await prisma.leadActivity.count({
          where: { leadId: resolvedLeadId, type: 'EMAIL' },
        })
      : 0;
    const leadForQuote =
      quoteAttachment && resolvedLeadId
        ? await prisma.lead.findUnique({ where: { id: resolvedLeadId } })
        : null;
    let attachments: { filename: string; content: string; contentType: string }[] | undefined;

    if (quoteAttachment) {
      const qa = quoteAttachment as QuoteAttachmentInput;
      const packId = String(qa.packId || '').trim().toLowerCase();
      const price = Number(qa.price || 0);
      if (!packId || !Number.isFinite(price) || price <= 0) {
        return NextResponse.json(
          { error: 'Per adjuntar pressupost: pack i preu són obligatoris' },
          { status: 400 }
        );
      }

      const template = await getQuoteTemplateSettings();
      const pack = await resolvePack(packId, resolvedLocale);

      const quoteData: QuoteData = leadForQuote
        ? createQuoteFromLead(leadForQuote, { ...pack, price })
        : {
            clientName: String(qa.clientName || to).slice(0, 120),
            clientEmail: String(to),
            eventType: String(qa.eventType || 'OTHER'),
            eventDate: new Date(),
            eventLocation: String(qa.eventLocation || ''),
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
      subject: translatedSubject,
      html: buildBrandedEmailHtml(bodyToHtml(translatedBody), resolvedLocale),
      replyTo,
      brandingStyle: emailCountBefore === 0 ? 'hero' : 'soft',
      attachments,
    });

    if (resolvedLeadId) {
      await prisma.leadNote.create({
        data: {
          leadId: resolvedLeadId,
          content: `📧 Email enviat: ${translatedSubject}${attachments ? '\n📎 Amb pressupost adjunt' : ''}`,
        },
      });
      await prisma.leadActivity.create({
        data: {
          leadId: resolvedLeadId,
          type: 'EMAIL',
          title: 'Email enviat',
          description: `${translatedSubject}${attachments ? ' (amb pressupost)' : ''}`,
          createdBy: 'Admin',
        },
      });
    }

    if (customerForLocale?.id) {
      await prisma.customerActivity.create({
        data: {
          customerId: customerForLocale.id,
          action: 'EMAIL_SENT',
          details: {
            to,
            subject: translatedSubject,
            source: 'admin_emails_send',
          },
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
