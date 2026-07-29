import { sendEmail } from '@/lib/email';
import { getEmailSignatureHtml } from '@/lib/services/signatureService';
import { fetchAttachmentPart, type OrbitaContext, type OrbitaEntityKind } from '@/lib/imap';
import { getManagedImageOverride } from '@/lib/services/imageManagerService';
import { prisma } from '@/lib/prisma';
import { SITE_CONFIG } from '@/app/config/site-config';
import { translateTextForLocale } from '@/lib/services/translationService';
import { escapeHtml } from '@/lib/utils/sanitize';
import { absoluteUrl, getAppBaseUrl } from '@/lib/site';
import { recordEmailSend, updateEmailSendResult, wrapLinksForTracking } from '@/lib/services/emailTrackingService';
import { recordCustomerEmailSent } from '@/lib/services/customerActivityService';
import { recordLeadEmailSent } from '@/lib/services/leadActivityService';

type ImapAttachmentRef = {
  uid: number;
  folder: string;
  partKey: string;
  filename: string;
  contentType: string;
};

type AdminEmailPayload = {
  to?: string;
  subject?: string;
  body?: string;
  leadId?: string;
  replyToId?: string;
  customerId?: string;
  quote?: unknown;
  locale?: string | null;
  templateKey?: string | null;
  imapAttachments?: ImapAttachmentRef[];
  orbita?: Partial<OrbitaContext>;
};

const ORBITA_ENTITY_KINDS: OrbitaEntityKind[] = ['lead', 'customer', 'booking', 'dossier', 'proposal', 'admin'];

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

function normalizeOrbitaContext(value: AdminEmailPayload['orbita']): OrbitaContext | null {
  const rawKind = String(value?.kind || '').trim();
  if (!ORBITA_ENTITY_KINDS.includes(rawKind as OrbitaEntityKind)) return null;
  const id = typeof value?.id === 'string' && value.id.trim() ? value.id.trim() : undefined;
  const origin = typeof value?.origin === 'string' && value.origin.trim() ? value.origin.trim() : 'admin-compose';
  return { kind: rawKind as OrbitaEntityKind, id, origin };
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
  const { to, subject, body: messageBody, leadId, replyToId, customerId, quote, locale, templateKey, imapAttachments } = body || {};
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
  if (quoteAttachment) {
    return {
      ok: false as const,
      status: 410,
      body: {
        error: 'Adjuntar pressupostos des del redactor antic està desactivat. Envia el pressupost des de Proposal.',
        canonicalRoute: '/admin/presupuestos',
      },
    };
  }
  const emailCountBefore = resolvedLeadId ? await prisma.leadActivity.count({ where: { leadId: resolvedLeadId, type: 'EMAIL' } }) : 0;
  let attachments: { filename: string; content: Buffer | string; contentType: string }[] | undefined;

  /* Adjunts reenviats des d'IMAP: baixar cada part i adjuntar-la */
  if (imapAttachments && imapAttachments.length > 0) {
    const fetched = await Promise.all(
      imapAttachments.map(async (ref) => {
        const buf = await fetchAttachmentPart(ref.uid, ref.partKey, ref.folder);
        if (!buf) return null;
        return { filename: ref.filename, content: buf, contentType: ref.contentType };
      })
    );
    const valid = fetched.filter((a): a is { filename: string; content: Buffer; contentType: string } => a !== null);
    if (valid.length > 0) attachments = valid;
  }

  const emailLogoUrl = await getAdminEmailLogoUrl();
  const contentHtml = await bodyToHtml(translatedBody);
  let finalHtml = buildBrandedEmailHtml(contentHtml, resolvedLocale, emailLogoUrl);

  // Vinculació conversa ↔ entitat (sense BD): X-Orbita-* + Message-ID estable.
  // Quan el client respongui, el seu `In-Reply-To` permetrà matchejar
  // l'entitat sense haver de fer cap consulta a la BD.
  const requestOrbitaCtx = normalizeOrbitaContext(body?.orbita);
  const orbitaCtx = resolvedLeadId
    ? { kind: 'lead' as const, id: resolvedLeadId, origin: 'admin-compose' }
    : (customerForLocale?.id
      ? { kind: 'customer' as const, id: customerForLocale.id, origin: 'admin-compose' }
      : requestOrbitaCtx || { kind: 'admin' as const, origin: 'admin-compose' });

  // Tracking: crear registre amb context Òrbita i injectar pixel d'obertura
  let trackingRecord: { id: string; trackingToken: string } | null = null;
  try {
    trackingRecord = await recordEmailSend({
      templateKey: templateKey || null,
      to,
      subject: translatedSubject,
      leadId: resolvedLeadId || null,
      customerId: customerForLocale?.id || null,
      locale: resolvedLocale,
      htmlBody: finalHtml,
      orbitaKind: orbitaCtx.kind,
      orbitaId: orbitaCtx.id ?? null,
      orbitaOrigin: orbitaCtx.origin ?? null,
    });
    const pixelUrl = `${APP_BASE_URL}/api/tracking/open/${trackingRecord.trackingToken}`;
    finalHtml = wrapLinksForTracking(finalHtml, trackingRecord.trackingToken, APP_BASE_URL);
    finalHtml = finalHtml.replace('</body>', `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none" /></body>`);
  } catch (trackingError) {
    // Tracking no ha de bloquejar l'enviament
    console.error('[adminEmailSend] Tracking record failed:', trackingError);
  }

  // Enviament real: captura SMTP info + estat APPEND a Sent
  const sendResult = await sendEmail({
    to,
    subject: translatedSubject,
    html: finalHtml,
    replyTo,
    brandingStyle: emailCountBefore === 0 ? 'hero' : 'soft',
    attachments,
    orbita: orbitaCtx,
  });

  // Persistim l'estat observable del canal (no bloqueja si falla)
  if (trackingRecord?.id) {
    await updateEmailSendResult(trackingRecord.id, {
      smtpAccepted: sendResult.smtp.accepted,
      smtpRejected: sendResult.smtp.rejected,
      smtpResponse: sendResult.smtp.response,
      smtpMessageId: sendResult.smtp.messageId,
      imapAppendOk: sendResult.imapSent.attempted ? sendResult.imapSent.ok : null,
      imapSentFolder: sendResult.imapSent.folder,
      imapSentUid: sendResult.imapSent.uid ?? null,
      imapError: sendResult.imapSent.error ?? null,
    });
  }

  if (resolvedLeadId) {
    await prisma.leadNote.create({ data: { leadId: resolvedLeadId, content: `📧 Email enviat: ${translatedSubject}${attachments ? '\n📎 Amb pressupost adjunt' : ''}` } });
    await recordLeadEmailSent({
      leadId: resolvedLeadId,
      subject: translatedSubject,
      hasAttachments: Boolean(attachments),
      emailSendId: trackingRecord?.id || null,
    });
  }

  if (customerForLocale?.id) {
    await recordCustomerEmailSent({
      customerId: customerForLocale.id,
      to,
      subject: translatedSubject,
      source: 'admin_emails_send',
    });
  }

  // Log unificat a adminLog perquè /admin/activity (Comunicacions) detecti l'enviament.
  // Sense això, l'email s'envia OK però queda invisible a la vista global d'activitat.
  await prisma.adminLog.create({
    data: {
      action: 'COMM_SENT',
      entity: resolvedLeadId ? 'lead' : (customerForLocale?.id ? 'customer' : 'admin_email'),
      entityId: resolvedLeadId || customerForLocale?.id || null,
      details: {
        to,
        subject: translatedSubject,
        channel: 'email',
        flow: 'admin_compose',
        hasAttachments: Boolean(attachments),
        locale: resolvedLocale,
        templateKey: templateKey || null,
        trackingId: trackingRecord?.id || null,
      },
    },
  });

  return { ok: true as const, status: 200, body: { ok: true } };
}
