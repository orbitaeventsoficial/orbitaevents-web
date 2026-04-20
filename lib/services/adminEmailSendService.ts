import { sendEmail, getEmailSignatureHtml } from '@/lib/email';
import { getManagedImageOverride } from '@/lib/services/imageManagerService';
import { prisma } from '@/lib/prisma';
import { SITE_CONFIG } from '@/app/config/site-config';
import { CUSTOMER_ACTIVITY_ACTIONS } from '@/lib/constants';
import {
  createQuoteFromLead,
  generateQuoteHTML,
  type QuoteData,
} from '@/lib/services/documentService';
import { resolveQuotePack } from '@/lib/services/quotes/quotePack';
import { getQuoteTemplateSettings } from '@/lib/services/quoteTemplateService';
import { translateTextForLocale } from '@/lib/services/translationService';
import { escapeHtml } from '@/lib/utils/sanitize';
import { absoluteUrl, getAppBaseUrl } from '@/lib/site';
import { recordEmailSend, wrapLinksForTracking } from '@/lib/services/emailTrackingService';

type QuoteAttachmentInput = {
  packId?: string;
  price?: number;
  clientName?: string;
  eventType?: string;
  eventLocation?: string;
};

type AdminEmailPayload = {
  to?: string;
  subject?: string;
  body?: string;
  leadId?: string;
  replyToId?: string;
  customerId?: string;
  quote?: QuoteAttachmentInput | null;
  locale?: string | null;
  templateKey?: string | null;
};

const APP_BASE_URL = getAppBaseUrl().replace(/\/+$/, '');
const EMAIL_LOGO_URL = `${APP_BASE_URL}/img/logosoloplaneta.png`;

async function getAdminEmailLogoUrl(): Promise<string> {
  const managedLogo = await getManagedImageOverride('layout.logo.admin');
  return absoluteUrl(managedLogo?.src || EMAIL_LOGO_URL, APP_BASE_URL);
}

async function bodyToHtml(body: string): Promise<string> {
  const escaped = escapeHtml(body.trim());
  const signatureHtml = await getEmailSignatureHtml();
  return `<p style="white-space:pre-line;font-family:'Segoe UI',Arial,sans-serif;">${escaped}</p>${signatureHtml}`;
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
  if (locale === 'ru') return { subtitle: 'Профессиональные DJ-услуги для вашего мероприятия', footer: 'Спасибо за доверие. Мы на связи.', legal: 'Это информационное сообщение от Òrbita Events.' };
  if (locale === 'en') return { subtitle: 'Professional DJ services for your event', footer: 'Thank you for your trust. We are here to help.', legal: 'This is an informational message from Òrbita Events.' };
  if (locale === 'es') return { subtitle: 'Servicios profesionales de DJ para tu evento', footer: 'Gracias por tu confianza. Estamos a tu disposición.', legal: 'Este es un mensaje informativo de Òrbita Events.' };
  return { subtitle: 'Serveis professionals de DJ per al teu esdeveniment', footer: 'Gràcies per la teva confiança. Estem a la teva disposició.', legal: "Aquest és un missatge informatiu d'Òrbita Events." };
}

function buildBrandedEmailHtml(contentHtml: string, locale: string, logoUrl: string): string {
  const t = getTemplateTexts(locale);
  return `<!doctype html>
<html lang="${escapeHtml(locale)}">
  <body style="margin:0;padding:0;background:#f5f5f4;font-family:'Segoe UI',Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="680" cellspacing="0" cellpadding="0" style="max-width:680px;width:100%;background:#ffffff;border:1px solid #e7e5e4;border-radius:14px;overflow:hidden;">
          <tr><td style="background:linear-gradient(120deg,#111827 0%,#1f2937 50%,#0f172a 100%);padding:18px 24px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
              <td style="width:58px;vertical-align:middle;"><img src="${escapeHtml(logoUrl)}" alt="Òrbita Events" width="46" height="46" style="display:block;width:46px;height:46px;border-radius:10px;background:#ffffff;padding:4px;" /></td>
              <td style="vertical-align:middle;"><div style="font-size:20px;font-weight:800;letter-spacing:0.2px;color:#ffffff;">Òrbita Events</div><div style="margin-top:5px;font-size:13px;color:#cbd5e1;">${escapeHtml(t.subtitle)}</div></td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:24px;">${contentHtml}</td></tr>
          <tr><td style="padding:18px 24px;border-top:1px solid #e7e5e4;background:#fafaf9;">
            <div style="font-size:13px;color:#334155;">${escapeHtml(t.footer)}</div>
            <div style="margin-top:6px;font-size:12px;color:#64748b;">${escapeHtml(SITE_CONFIG.business.email)} · ${escapeHtml(SITE_CONFIG.business.phoneDisplay)}</div>
            <div style="margin-top:8px;font-size:11px;color:#94a3b8;">${escapeHtml(t.legal)}</div>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export async function sendAdminEmail(body: AdminEmailPayload | undefined) {
  const { to, subject, body: messageBody, leadId, replyToId, customerId, quote, locale, templateKey } = body || {};
  if (!to || !subject || !messageBody) {
    return { ok: false as const, status: 400, body: { error: 'Falten camps obligatoris: to, subject, body' } };
  }

  const replyTo = process.env.SMTP_REPLY_TO?.trim() || SITE_CONFIG.business.email;
  const resolvedLeadId = leadId || replyToId;
  const leadForLocale = resolvedLeadId ? await prisma.lead.findUnique({ where: { id: resolvedLeadId }, select: { id: true, preferredLocale: true } }) : null;
  const customerForLocale = customerId ? await prisma.customer.findUnique({ where: { id: String(customerId) }, select: { id: true, preferredLocale: true } }) : null;
  const resolvedLocale = normalizeLocale(leadForLocale?.preferredLocale || customerForLocale?.preferredLocale || locale || 'ca');
  const translatedSubject = await translateTextForLocale(String(subject), resolvedLocale);
  const translatedBody = await translateTextForLocale(String(messageBody), resolvedLocale);
  const quoteAttachment = quote && typeof quote === 'object' ? quote : null;
  const emailCountBefore = resolvedLeadId ? await prisma.leadActivity.count({ where: { leadId: resolvedLeadId, type: 'EMAIL' } }) : 0;
  const leadForQuote = quoteAttachment && resolvedLeadId ? await prisma.lead.findUnique({ where: { id: resolvedLeadId } }) : null;
  let attachments;

  if (quoteAttachment) {
    const qa = quoteAttachment;
    const packId = String(qa.packId || '').trim().toLowerCase();
    const price = Number(qa.price || 0);
    if (!packId || !Number.isFinite(price) || price <= 0) {
      return { ok: false as const, status: 400, body: { error: 'Per adjuntar pressupost: pack i preu són obligatoris' } };
    }

    const template = await getQuoteTemplateSettings();
    const pack = await resolveQuotePack(packId, resolvedLocale);
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
    attachments = [{ filename: `pressupost-${quoteData.quoteNumber}.html`, content: quoteHtml, contentType: 'text/html; charset=utf-8' }];
  }

  const emailLogoUrl = await getAdminEmailLogoUrl();
  const contentHtml = await bodyToHtml(translatedBody);
  let finalHtml = buildBrandedEmailHtml(contentHtml, resolvedLocale, emailLogoUrl);

  // Tracking: crear registre i injectar pixel d'obertura
  let trackingRecord: { id: string; trackingToken: string } | null = null;
  try {
    trackingRecord = await recordEmailSend({
      templateKey: templateKey || null,
      to,
      subject: translatedSubject,
      leadId: resolvedLeadId || null,
      customerId: customerForLocale?.id || null,
      locale: resolvedLocale,
    });
    const pixelUrl = `${APP_BASE_URL}/api/tracking/open/${trackingRecord.trackingToken}`;
    finalHtml = wrapLinksForTracking(finalHtml, trackingRecord.trackingToken, APP_BASE_URL);
    finalHtml = finalHtml.replace('</body>', `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none" /></body>`);
  } catch (trackingError) {
    // Tracking no ha de bloquejar l'enviament
    console.error('[adminEmailSend] Tracking record failed:', trackingError);
  }

  await sendEmail({
    to,
    subject: translatedSubject,
    html: finalHtml,
    replyTo,
    brandingStyle: emailCountBefore === 0 ? 'hero' : 'soft',
    attachments,
  });

  if (resolvedLeadId) {
    await prisma.leadNote.create({ data: { leadId: resolvedLeadId, content: `📧 Email enviat: ${translatedSubject}${attachments ? '\n📎 Amb pressupost adjunt' : ''}` } });
    await prisma.leadActivity.create({ data: { leadId: resolvedLeadId, type: 'EMAIL', title: 'Email enviat', description: `${translatedSubject}${attachments ? ' (amb pressupost)' : ''}`, createdBy: 'Admin' } });
  }

  if (customerForLocale?.id) {
    await prisma.customerActivity.create({
      data: {
        customerId: customerForLocale.id,
        action: CUSTOMER_ACTIVITY_ACTIONS.EMAIL_SENT,
        details: { to, subject: translatedSubject, source: 'admin_emails_send' },
      },
    });
  }

  return { ok: true as const, status: 200, body: { ok: true } };
}






