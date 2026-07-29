/**
 * Email Service - Servicio centralizado de envio de emails
 * Utilizado por todas las APIs que necesitan enviar emails
 */

import nodemailer from 'nodemailer';
import { SITE_CONFIG } from '@/app/config/site-config';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { escapeHtml } from '@/lib/utils/sanitize';
import { absoluteUrl, getAppBaseUrl } from '@/lib/site';
import { getManagedImageOverride } from '@/lib/services/imageManagerService';
import { log } from '@/lib/logger';
import {
  type OrbitaContext,
  appendToFolder,
  buildOrbitaHeaders,
  buildOrbitaMessageId,
  discoverSpecialFolders,
} from '@/lib/imap';
import { buildMime } from '@/lib/mailComposerLoader';

import { type EmailLocale, normalizeEmailLocale, toIntlLocaleEmail, PRIVACY_REQUEST_LABELS, PRIVACY_COPY, TESTIMONIAL_COPY } from '@/lib/email-i18n';
import { getEmailSignatureHtml, getEmailSignatureText } from '@/lib/services/signatureService';
import { EMAIL_CONTACT } from '@/lib/constants/email';
import {
  recordEmailSend,
  updateEmailSendResult,
  wrapLinksForTracking,
} from '@/lib/services/emailTrackingService';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  from?: string;
  text?: string;
  attachments?: nodemailer.SendMailOptions['attachments'];
  brandingStyle?: 'hero' | 'soft';
  /**
   * Context Òrbita per a vinculació conversa ↔ entitat sense BD intermèdia.
   * Si està definit:
   *   - Injecta `X-Orbita-Kind / Id / Origin` als headers MIME.
   *   - Genera un Message-ID estable `<orbita.{kind}.{id}.{ts}.{rand}@…>` que
   *     viatja al `In-Reply-To` de les respostes del client.
   *   - L'admin podrà extreure el vincle del header sense haver de consultar BD.
   */
  orbita?: OrbitaContext;
  /** En-Headers MIME addicionals (rar — preferir `orbita` per a vinculació). */
  headers?: Record<string, string>;
  /** Si true, NO fa append al Sent IMAP. Útil per a campanyes massives no monitoritzades. */
  skipImapAppend?: boolean;
}

export type TrackedStandaloneEmailInput = {
  templateKey: string;
  to: string;
  subject: string;
  html: string;
  locale?: string | null;
  leadId?: string | null;
  customerId?: string | null;
  replyTo?: string;
  from?: string;
  text?: string;
  attachments?: SendEmailOptions['attachments'];
  brandingStyle?: SendEmailOptions['brandingStyle'];
  headers?: SendEmailOptions['headers'];
  skipImapAppend?: boolean;
  orbita?: OrbitaContext;
};

export type TrackedStandaloneEmailResult = {
  emailSendId: string;
};

type BookingEmailTranslation = {
  locale: string;
  name: string;
};

type BookingEmailPack = {
  slug: string;
  price: number;
  extraHourPrice?: number | null;
  translations: BookingEmailTranslation[];
};

type BookingEmailExtra = {
  slug: string;
  translations: BookingEmailTranslation[];
};

type BookingEmailExtraLine = {
  price: number;
  extra: BookingEmailExtra;
};

type BookingEmailModel = {
  id: string;
  customerId?: string | null;
  reference: string;
  preferredLocale: string;
  eventDate: string | Date;
  eventStartTime?: string | null;
  eventEndTime?: string | null;
  eventLocation: string;
  eventVenue?: string | null;
  guestCount: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventType: string;
  total: number;
  extraHours: number;
  notes?: string | null;
  pack: BookingEmailPack;
  extras: BookingEmailExtraLine[];
};

const APP_BASE_URL = (getAppBaseUrl()).replace(/\/+$/, '');
const EMAIL_LOGO_URL = `${APP_BASE_URL}/img/logosoloplaneta.png`;

async function getManagedBrandLogoUrl(): Promise<string> {
  const managedLogo = await getManagedImageOverride('layout.logo.admin');
  return absoluteUrl(managedLogo?.src || EMAIL_LOGO_URL, APP_BASE_URL);
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}


function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

function hasOrbitaBrandingInHeader(html: string): boolean {
  const headChunk = html.slice(0, 1800).toLowerCase();
  return (
    headChunk.includes('logoplanetatextdreta') ||
    headChunk.includes('data-orbita-email-logo') ||
    headChunk.includes('òrbita events') ||
    headChunk.includes('orbita events')
  );
}

function hasOrbitaContactInFooter(html: string): boolean {
  const tailChunk = html.slice(-2400).toLowerCase();
  return (
    tailChunk.includes('data-orbita-email-contact') ||
    tailChunk.includes((EMAIL_CONTACT.email || '').toLowerCase()) ||
    tailChunk.includes((EMAIL_CONTACT.phone || '').toLowerCase()) ||
    tailChunk.includes((EMAIL_CONTACT.web || '').toLowerCase())
  );
}

function hasOrbitaEmailShell(html: string): boolean {
  return /data-orbita-email-shell\s*=\s*["']true["']/i.test(html);
}

function extractBodyHtml(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch?.[1]) return bodyMatch[1].trim();
  return html.trim();
}

function ensureOrbitaEmailShell(html: string, logoUrl: string, brandingStyle: 'hero' | 'soft' = 'soft'): string {
  if (!html || hasOrbitaEmailShell(html)) {
    return html;
  }

  const content = extractBodyHtml(html);
  const isHero = brandingStyle === 'hero';
  const headerStyle = isHero
    ? "background:linear-gradient(120deg,#111827 0%,#1f2937 50%,#0f172a 100%);padding:18px 24px;"
    : 'background:#111827;padding:12px 18px;';
  const logoSize = isHero ? 46 : 30;
  const logoCellWidth = isHero ? 58 : 42;
  const titleSize = isHero ? 20 : 16;
  const subtitle = isHero ? 'Comunicació oficial' : 'Missatge de seguiment';
  const contentPadding = isHero ? '24px' : '18px';
  return `<!doctype html>
<html lang="ca">
  <body style="margin:0;padding:0;background:#f5f5f4;font-family:'Segoe UI',Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table data-orbita-email-shell="true" role="presentation" width="680" cellspacing="0" cellpadding="0" style="max-width:680px;width:100%;background:#ffffff;border:1px solid #e7e5e4;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="${headerStyle}">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="width:${logoCellWidth}px;vertical-align:middle;">
                      <img src="${logoUrl}" alt="Òrbita Events" width="${logoSize}" height="${logoSize}" style="display:block;width:${logoSize}px;height:${logoSize}px;border-radius:${isHero ? '10px' : '8px'};background:#ffffff;padding:${isHero ? '4px' : '3px'};" />
                    </td>
                    <td style="vertical-align:middle;">
                      <div style="font-size:${titleSize}px;font-weight:800;letter-spacing:0.2px;color:#ffffff;">Òrbita Events</div>
                      <div style="margin-top:5px;font-size:12px;color:#cbd5e1;">${subtitle}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:${contentPadding};">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 24px;border-top:1px solid #e7e5e4;background:#fafaf9;">
                <div style="font-size:13px;color:#334155;">Gràcies per la teva confiança. Estem a la teva disposició.</div>
                <div style="margin-top:6px;font-size:12px;color:#64748b;">
                  ${EMAIL_CONTACT.phone} · ${EMAIL_CONTACT.email}
                </div>
                <div style="margin-top:6px;font-size:12px;">
                  <a href="${EMAIL_CONTACT.web}" style="color:#0f172a;text-decoration:none;">${EMAIL_CONTACT.web}</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function injectOrbitaLogo(html: string, logoUrl: string): string {
  if (!html || hasOrbitaBrandingInHeader(html)) {
    return html;
  }

  const logoBlock = `
    <div data-orbita-email-logo="true" style="text-align:center; padding: 18px 0 10px 0;">
      <img src="${logoUrl}" alt="Òrbita Events" style="width: 196px; max-width: 72%; height: auto; display:inline-block;" />
    </div>
  `;

  if (/<body[^>]*>/i.test(html)) {
    return html.replace(/<body([^>]*)>/i, `<body$1>${logoBlock}`);
  }

  return `${logoBlock}${html}`;
}

function injectOrbitaContactFooter(html: string): string {
  if (!html || hasOrbitaContactInFooter(html)) {
    return html;
  }

  const footerBlock = `
    <div data-orbita-email-contact="true" style="margin-top: 20px; padding: 16px 12px; border-top: 1px solid rgba(255,255,255,0.15); text-align:center; font-size: 12px; line-height:1.5; color: #9ca3af;">
      <div style="margin-bottom: 6px; color: #e5e7eb; font-weight: 700; letter-spacing: 0.2px;">Òrbita Events</div>
      <div>${EMAIL_CONTACT.phone} · ${EMAIL_CONTACT.email}</div>
      <div style="margin-top: 4px;"><a href="${EMAIL_CONTACT.web}" style="color:#DAA520; text-decoration:none;">${EMAIL_CONTACT.web}</a></div>
    </div>
  `;

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${footerBlock}</body>`);
  }

  return `${html}${footerBlock}`;
}

let cachedTransporter: nodemailer.Transporter | null = null;
let cachedTransporterKey = '';

function createTransporter() {
  const smtpHost = (process.env.SMTP_HOST || '').trim();
  const smtpPort = parseInt((process.env.SMTP_PORT || '').trim(), 10);
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();

  if (!smtpHost) {
    throw new Error('SMTP_HOST is required');
  }
  if (!smtpPort || Number.isNaN(smtpPort)) {
    throw new Error('SMTP_PORT is required');
  }
  if (!smtpUser || !smtpPass) {
    throw new Error('SMTP_USER and SMTP_PASS are required');
  }
  const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

  const cacheKey = `${smtpHost}|${smtpPort}|${smtpUser}|${smtpSecure}`;
  if (cachedTransporter && cachedTransporterKey === cacheKey) {
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });

  cachedTransporterKey = cacheKey;
  return cachedTransporter;
}

/**
 * Resultat estructurat de l'enviament. Captura l'estat REAL del canal SMTP +
 * IMAP perquè la safata d'admin pugui mostrar "Acceptat per SMTP + Arxivat a
 * Sent UID 5" en lloc d'un genèric "Email enviat" que no diu res.
 *
 * Els callers canònics creen primer `EmailSend.htmlBody` i només després fan
 * aquest enviament SMTP/IMAP per conservar el cos reconstruïble i l'estat real
 * del canal.
 */
export interface SendEmailResult {
  /** True si SMTP ha acceptat almenys un destinatari. */
  ok: boolean;
  smtp: {
    accepted: string[];
    rejected: string[];
    response: string;
    messageId: string;
    envelope?: { from: string; to: string[] };
  };
  imapSent: {
    /** True només si s'ha intentat l'APPEND (IMAP configurat + no skip). */
    attempted: boolean;
    /** True quan APPEND completat OK (false si fallit, omès si attempted=false). */
    ok: boolean;
    folder: string | null;
    uid?: number;
    error?: string;
  };
  /** Message-ID Òrbita assignat (només si options.orbita). */
  orbitaMessageId: string | null;
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const transporter = createTransporter();

  const smtpFrom = (process.env.SMTP_FROM || '').trim();
  if (!smtpFrom) {
    throw new Error('SMTP_FROM is required');
  }
  const fromAddress = options.from?.trim() || `"Orbita Events" <${smtpFrom}>`;
  const toAddress = options.to.trim();

  const emailLogoUrl = await getManagedBrandLogoUrl();
  const brandedHtml = ensureOrbitaEmailShell(
    injectOrbitaContactFooter(injectOrbitaLogo(options.html, emailLogoUrl)),
    emailLogoUrl,
    options.brandingStyle || 'soft'
  );

  // Headers + Message-ID per a vinculació conversa ↔ entitat (sense BD)
  const orbitaHeaders = options.orbita ? buildOrbitaHeaders(options.orbita) : {};
  const orbitaMessageId = options.orbita ? buildOrbitaMessageId(options.orbita) : undefined;
  const mergedHeaders: Record<string, string> = { ...orbitaHeaders, ...(options.headers || {}) };

  const mailOpts: nodemailer.SendMailOptions = {
    from: fromAddress,
    to: toAddress,
    subject: sanitizeHeader(options.subject),
    html: brandedHtml,
    text: options.text?.trim() || htmlToText(brandedHtml),
    replyTo: options.replyTo?.trim(),
    attachments: options.attachments,
    headers: Object.keys(mergedHeaders).length > 0 ? mergedHeaders : undefined,
    messageId: orbitaMessageId,
  };

  const info = await transporter.sendMail(mailOpts);

  const result: SendEmailResult = {
    ok: Array.isArray(info.accepted) && info.accepted.length > 0,
    smtp: {
      accepted: Array.isArray(info.accepted) ? info.accepted.map(String) : [],
      rejected: Array.isArray(info.rejected) ? info.rejected.map(String) : [],
      response: typeof info.response === 'string' ? info.response : '',
      messageId: typeof info.messageId === 'string' ? info.messageId : '',
      envelope: info.envelope ? {
        from: String((info.envelope as { from?: unknown }).from || ''),
        to: Array.isArray((info.envelope as { to?: unknown }).to)
          ? ((info.envelope as { to: unknown[] }).to).map(String)
          : [],
      } : undefined,
    },
    imapSent: { attempted: false, ok: false, folder: null },
    orbitaMessageId: orbitaMessageId || null,
  };

  // APPEND best-effort al folder Sent IMAP. Així tota comunicació (dossiers,
  // pressupostos, recordatoris, follow-up…) queda al servidor de correu i no
  // depèn de la BD per a reflectir-se a la safata d'admin ni a l'app del
  // client. Fallida no bloqueja l'enviament.
  if (!options.skipImapAppend && process.env.IMAP_HOST && process.env.IMAP_USER && process.env.IMAP_PASS) {
    result.imapSent.attempted = true;
    try {
      const appendRes = await appendBuiltMimeToSent(mailOpts);
      result.imapSent.ok = appendRes.ok;
      result.imapSent.folder = appendRes.folder;
      result.imapSent.uid = appendRes.uid;
      if (!appendRes.ok && appendRes.error) {
        result.imapSent.error = appendRes.error;
      }
    } catch (appendError) {
      const msg = appendError instanceof Error ? appendError.message : String(appendError);
      result.imapSent.error = msg;
      log.error('[email] APPEND a Sent IMAP fallit (no bloqueja enviament)',
        appendError instanceof Error ? appendError : undefined);
    }
  }

  return result;
}

/**
 * Construeix el MIME complet via nodemailer/MailComposer i l'append al folder
 * Sent. Carregat amb `import()` dinàmic per evitar cost si IMAP no està
 * configurat. Retorna metadades de l'APPEND (folder real + UID) per al
 * tracking observable.
 */
async function appendBuiltMimeToSent(mailOpts: nodemailer.SendMailOptions): Promise<{
  ok: boolean;
  folder: string | null;
  uid?: number;
  error?: string;
}> {
  const built = await buildMime(mailOpts);
  const special = await discoverSpecialFolders();
  if (!special.sent) {
    return { ok: false, folder: null, error: 'Servidor IMAP sense carpeta Sent reconeguda' };
  }
  const res = await appendToFolder(special.sent, built, ['\\Seen']);
  return { ok: res.ok, folder: res.folder, uid: res.uid, error: res.error };
}

export async function sendPrivacyVerificationEmail(params: {
  to: string;
  name: string;
  requestType: string;
  requestId: string;
  verificationToken: string;
  legalDeadline: Date;
  locale?: string;
}): Promise<void> {
  const { to, name, requestType, requestId, verificationToken, legalDeadline } = params;
  const locale = normalizeEmailLocale(params.locale);
  const t = PRIVACY_COPY[locale];
  const labels = PRIVACY_REQUEST_LABELS[locale];
  const intlLocale = toIntlLocaleEmail(locale);

  const verificationUrl = `${getAppBaseUrl()}/api/privacy/verify?token=${verificationToken}`;
  const requestLabel = labels[requestType] || requestType;
  const subject = sanitizeHeader(`${t.verifyTitle} — ${requestLabel} — Òrbita Events`);
  const html = `
    <!DOCTYPE html>
    <html lang="${locale}">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #DAA520, #B8860B); padding: 30px; text-align: center;">
          <h1 style="color: #000; margin: 0; font-size: 24px;">Òrbita Events</h1>
          <p style="color: rgba(0,0,0,0.7); margin: 8px 0 0 0; font-size: 14px;">${escapeHtml(t.portalTitle)}</p>
        </div>

        <div style="padding: 30px; color: #e5e5e5;">
          <h2 style="color: #DAA520; margin-top: 0;">${escapeHtml(t.verifyTitle)}</h2>

          <p style="font-size: 16px; line-height: 1.6;">${t.greeting(name)}</p>

          <p style="font-size: 16px; line-height: 1.6;">${t.received(requestLabel)}</p>

          <p style="font-size: 16px; line-height: 1.6;">${escapeHtml(t.verifyInstructions)}</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}"
               style="background: linear-gradient(135deg, #DAA520, #B8860B);
                      color: #000;
                      padding: 16px 32px;
                      text-decoration: none;
                      border-radius: 12px;
                      font-weight: bold;
                      font-size: 16px;
                      display: inline-block;">
              ${escapeHtml(t.verifyCta)}
            </a>
          </div>

          <p style="color: #a3a3a3; font-size: 14px; line-height: 1.6;">
            ${t.linkValid}
            ${escapeHtml(t.linkIgnore)}
          </p>

          <div style="background: rgba(218,165,32,0.1); border: 1px solid rgba(218,165,32,0.3); border-radius: 12px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #a3a3a3;">
              <strong style="color: #DAA520;">${escapeHtml(t.reference)}</strong> ${escapeHtml(requestId)}
            </p>
            <p style="margin: 0; font-size: 12px; color: #a3a3a3;">
              <strong style="color: #DAA520;">${escapeHtml(t.legalDeadline)}</strong> ${legalDeadline.toLocaleDateString(intlLocale, { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <p style="color: #666; font-size: 12px; word-break: break-all;">
            ${escapeHtml(t.linkFallback)}<br>
            <a href="${verificationUrl}" style="color: #DAA520;">${verificationUrl}</a>
          </p>
        </div>

        <div style="padding: 20px; background: #0a0a0a; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #666;">
            ${new Date().getFullYear()} ${escapeHtml(t.allRights)}
          </p>
          <p style="margin: 8px 0 0 0; font-size: 11px; color: #444;">
            ${escapeHtml(t.gdprNote)}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendTrackedStandaloneEmail({
    templateKey: 'privacy-verification',
    to,
    subject,
    html,
    locale,
    orbita: { kind: 'admin', id: `privacy-${requestId}`, origin: 'privacy-verification' },
  });
}

export async function sendPrivacyRequestCompletedEmail(params: {
  to: string;
  name: string;
  requestType: string;
  requestId: string;
  result: 'approved' | 'rejected';
  notes?: string;
  downloadUrl?: string;
  locale?: string;
}): Promise<void> {
  const { to, name, requestType, requestId, result, notes, downloadUrl } = params;
  const locale = normalizeEmailLocale(params.locale);
  const t = PRIVACY_COPY[locale];
  const labels = PRIVACY_REQUEST_LABELS[locale];

  const requestLabel = labels[requestType] || requestType;
  const isApproved = result === 'approved';
  const headerTitle = isApproved ? t.processed : t.rejected;
  const bodyText = isApproved ? t.processedBody(requestLabel) : t.rejectedBody(requestLabel);
  const subject = sanitizeHeader(`${headerTitle} — ${requestLabel} — Òrbita Events`);
  const html = `
    <!DOCTYPE html>
    <html lang="${locale}">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden;">
        <div style="background: ${isApproved ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #ef4444, #dc2626)'}; padding: 30px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">
            ${escapeHtml(headerTitle)}
          </h1>
        </div>

        <div style="padding: 30px; color: #e5e5e5;">
          <p style="font-size: 16px; line-height: 1.6;">${t.greeting(name)}</p>

          <p style="font-size: 16px; line-height: 1.6;">${bodyText}</p>

          ${notes ? `
          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; font-size: 14px; color: #a3a3a3;">
              <strong style="color: #fff;">${escapeHtml(t.notes)}</strong><br>
              ${escapeHtml(notes)}
            </p>
          </div>
          ` : ''}

          ${downloadUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${escapeHtml(downloadUrl)}"
               style="background: linear-gradient(135deg, #DAA520, #B8860B);
                      color: #000;
                      padding: 16px 32px;
                      text-decoration: none;
                      border-radius: 12px;
                      font-weight: bold;
                      font-size: 16px;
                      display: inline-block;">
              ${escapeHtml(t.downloadCta)}
            </a>
          </div>
          ` : ''}

          <p style="font-size: 14px; line-height: 1.6; color: #a3a3a3;">
            ${escapeHtml(t.contactNote)}
            <a href="mailto:${SITE_CONFIG.business.email}" style="color: #DAA520;">${SITE_CONFIG.business.email}</a>
          </p>
        </div>

        <div style="padding: 20px; background: #0a0a0a; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #666;">
            ${new Date().getFullYear()} ${escapeHtml(t.allRights)}
          </p>
          <p style="margin: 8px 0 0 0; font-size: 11px; color: #444;">
            ${escapeHtml(t.gdprNote)}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendTrackedStandaloneEmail({
    templateKey: 'privacy-request-completed',
    to,
    subject,
    html,
    locale,
    orbita: { kind: 'admin', id: `privacy-${requestId}`, origin: 'privacy-request-completed' },
  });
}

export type TestimonialApprovedEmailParams = {
  to: string;
  name: string;
  rating: number;
  discountCode: string;
  discountPercent?: number;
  eventType?: string;
  locale?: string;
};

export type TestimonialApprovedEmailPayload = {
  to: string;
  subject: string;
  html: string;
  locale: EmailLocale;
};

export function buildTestimonialApprovedEmailPayload(
  params: TestimonialApprovedEmailParams
): TestimonialApprovedEmailPayload {
  const { to, name, rating, discountCode, discountPercent = 10, eventType } = params;
  const locale = normalizeEmailLocale(params.locale);
  const t = TESTIMONIAL_COPY[locale];

  const baseUrl = getAppBaseUrl();
  const canvasParams = new URLSearchParams({
    name,
    rating: String(rating * 2),
    code: discountCode,
    discount: String(discountPercent),
    preset: 'email',
  });
  if (eventType) canvasParams.append('eventType', eventType);
  const canvasUrl = `${baseUrl}/api/canvas/rating?${canvasParams.toString()}`;
  const firstName = name.split(' ')[0] || name;

  return {
    to,
    subject: t.subject(discountPercent),
    html: `
      <!DOCTYPE html>
      <html lang="${locale}">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d1f00 50%, #3d2800 100%); padding: 40px; text-align: center;">
            <h1 style="color: #FFB800; margin: 0; font-size: 28px; font-weight: 300;">
              <span style="font-weight: 800;">ÒRBITA</span> EVENTS
            </h1>
            <p style="color: rgba(255,255,255,0.6); margin: 12px 0 0 0; font-size: 14px; letter-spacing: 2px;">
              ${escapeHtml(t.trustHeader)}
            </p>
          </div>

          <div style="text-align: center; padding: 0;">
            <img src="${canvasUrl}" alt="${escapeHtml(t.giftAlt(discountPercent))}" style="width: 100%; max-width: 600px; display: block; border: 0; outline: none; text-decoration: none;" />
          </div>
          <div style="padding: 12px 24px; background: #121212; text-align: center; font-size: 12px; color: #9ca3af;">
            <a href="${canvasUrl}" style="color: #FFB800; text-decoration: none;">${escapeHtml(t.imgFallback)}</a>
          </div>

          <div style="padding: 30px; color: #e5e5e5;">
            <h2 style="color: #FFB800; margin-top: 0; text-align: center;">${escapeHtml(t.greeting(firstName))}</h2>

            <p style="font-size: 16px; line-height: 1.6; text-align: center;">
              ${escapeHtml(t.approved)}
            </p>

            <div style="background: rgba(255,184,0,0.1); border: 2px solid rgba(255,184,0,0.3); border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 2px;">
                ${escapeHtml(t.exclusiveCode)}
              </p>
              <p style="margin: 0; font-size: 36px; font-weight: 800; color: #FFB800; letter-spacing: 4px;">
                ${escapeHtml(discountCode)}
              </p>
              <p style="margin: 12px 0 0 0; font-size: 24px; font-weight: 700; color: #fff;">
                ${escapeHtml(t.discount(discountPercent))}
              </p>
              <p style="margin: 12px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.5);">
                ${escapeHtml(t.validity)}
              </p>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #a3a3a3; text-align: center;">
              ${escapeHtml(t.share)}
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}"
                 style="background: linear-gradient(135deg, #FFB800, #CC9600);
                        color: #000;
                        padding: 16px 32px;
                        text-decoration: none;
                        border-radius: 12px;
                        font-weight: bold;
                        font-size: 16px;
                        display: inline-block;">
                ${escapeHtml(t.viewServices)}
              </a>
            </div>
          </div>

          <div style="padding: 20px; background: #0a0a0a; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              ${new Date().getFullYear()} Òrbita Events
            </p>
            <p style="margin: 8px 0 0 0; font-size: 11px; color: #444;">
              ${SITE_CONFIG.business.phone} · ${SITE_CONFIG.business.email}
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    locale,
  };
}

export async function sendTestimonialApprovedEmail(
  params: TestimonialApprovedEmailParams
): Promise<void> {
  const payload = buildTestimonialApprovedEmailPayload(params);
  await sendTrackedStandaloneEmail({
    templateKey: 'testimonial-approved',
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    locale: payload.locale,
    orbita: { kind: 'customer', origin: 'testimonial-approved' },
  });
}

type PublicBookingRequestEmailCopy = {
  subject: (reference: string) => string;
  title: string;
  referenceLabel: string;
  greeting: string;
  intro: string;
  eventDetailsTitle: string;
  dateLabel: string;
  timeLabel: string;
  locationLabel: string;
  venueLabel: string;
  guestsLabel: string;
  guestsUnit: string;
  servicesTitle: string;
  extraHoursLabel: string;
  totalLabel: string;
  nextStepsTitle: string;
  nextSteps: string[];
  contactPrompt: string;
  footer: string;
};

const PUBLIC_BOOKING_REQUEST_EMAIL_COPY: Record<EmailLocale, PublicBookingRequestEmailCopy> = {
  ca: {
    subject: (reference) => `Sol·licitud de reserva rebuda #${reference} - Òrbita Events`,
    title: 'Sol·licitud de reserva rebuda',
    referenceLabel: 'Referència',
    greeting: 'Hola',
    intro: 'Hem rebut la teva sol·licitud de reserva. La data queda bloquejada provisionalment mentre revisem disponibilitat, encaix tècnic i detalls.',
    eventDetailsTitle: "Detalls de l'esdeveniment",
    dateLabel: 'Data',
    timeLabel: 'Horari',
    locationLabel: 'Ubicació',
    venueLabel: 'Local',
    guestsLabel: 'Convidats',
    guestsUnit: 'persones',
    servicesTitle: 'Serveis sol·licitats',
    extraHoursLabel: 'Hores extra',
    totalLabel: 'Total estimat',
    nextStepsTitle: 'Propers passos',
    nextSteps: [
      'Revisarem la disponibilitat i els detalls tècnics durant les properes 24 h.',
      'T\'enviarem la proposta o contracte amb les condicions del servei.',
      'Quan tot estigui validat, podràs deixar la reserva confirmada amb la paga i senyal.',
    ],
    contactPrompt: 'Si tens qualsevol pregunta, respon aquest email o contacta amb nosaltres:',
    footer: 'Òrbita Events - Barcelona i Girona',
  },
  es: {
    subject: (reference) => `Solicitud de reserva recibida #${reference} - Òrbita Events`,
    title: 'Solicitud de reserva recibida',
    referenceLabel: 'Referencia',
    greeting: 'Hola',
    intro: 'Hemos recibido tu solicitud de reserva. La fecha queda bloqueada provisionalmente mientras revisamos disponibilidad, encaje técnico y detalles.',
    eventDetailsTitle: 'Detalles del evento',
    dateLabel: 'Fecha',
    timeLabel: 'Horario',
    locationLabel: 'Ubicación',
    venueLabel: 'Local',
    guestsLabel: 'Invitados',
    guestsUnit: 'personas',
    servicesTitle: 'Servicios solicitados',
    extraHoursLabel: 'Horas extra',
    totalLabel: 'Total estimado',
    nextStepsTitle: 'Próximos pasos',
    nextSteps: [
      'Revisaremos la disponibilidad y los detalles técnicos durante las próximas 24 h.',
      'Te enviaremos la propuesta o contrato con las condiciones del servicio.',
      'Cuando todo esté validado, podrás dejar la reserva confirmada con la señal.',
    ],
    contactPrompt: 'Si tienes cualquier pregunta, responde a este email o contacta con nosotros:',
    footer: 'Òrbita Events - Barcelona y Girona',
  },
  en: {
    subject: (reference) => `Booking request received #${reference} - Orbita Events`,
    title: 'Booking request received',
    referenceLabel: 'Reference',
    greeting: 'Hi',
    intro: 'We have received your booking request. The date is provisionally blocked while we review availability, technical fit and details.',
    eventDetailsTitle: 'Event details',
    dateLabel: 'Date',
    timeLabel: 'Time',
    locationLabel: 'Location',
    venueLabel: 'Venue',
    guestsLabel: 'Guests',
    guestsUnit: 'people',
    servicesTitle: 'Requested services',
    extraHoursLabel: 'Extra hours',
    totalLabel: 'Estimated total',
    nextStepsTitle: 'Next steps',
    nextSteps: [
      'We will review availability and technical details within the next 24 h.',
      'We will send you the proposal or contract with the service terms.',
      'Once everything is validated, you can confirm the booking with the deposit.',
    ],
    contactPrompt: 'If you have any questions, reply to this email or contact us:',
    footer: 'Orbita Events - Barcelona and Girona',
  },
};

export function buildPublicBookingRequestEmail(booking: BookingEmailModel): { subject: string; html: string } {
  const locale = normalizeEmailLocale(booking.preferredLocale);
  const copy = PUBLIC_BOOKING_REQUEST_EMAIL_COPY[locale];
  const eventDate = new Date(booking.eventDate);
  const formattedDate = eventDate.toLocaleDateString(toIntlLocaleEmail(locale), {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const packName =
    booking.pack.translations.find((t: BookingEmailTranslation) => t.locale === locale)?.name ||
    booking.pack.slug;

  let extrasHtml = '';
  if (booking.extras && booking.extras.length > 0) {
    extrasHtml = booking.extras
      .map((extra: BookingEmailExtraLine) => {
        const extraName =
          extra.extra.translations.find((t: BookingEmailTranslation) => t.locale === locale)?.name ||
          extra.extra.slug;
        return `<li>${escapeHtml(extraName)} - ${extra.price}€</li>`;
      })
      .join('');
  }

  const nextStepsHtml = copy.nextSteps
    .map((step) => `<li>${escapeHtml(step)}</li>`)
    .join('');

  return {
    subject: copy.subject(booking.reference),
    html: `
      <!DOCTYPE html>
      <html lang="${locale}">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fff;">
        <div style="max-width: 600px; margin: 0 auto; background: #111;">
          <!-- Header -->
          <div style="padding: 32px 20px; background: linear-gradient(135deg, #7C3AED 0%, #EC4899 100%); text-align: center;">
            <h1 style="margin: 0; font-size: 28px; color: #fff; font-weight: bold;">
              ${escapeHtml(copy.title)}
            </h1>
            <p style="margin: 12px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">
              ${escapeHtml(copy.referenceLabel)}: <strong>${escapeHtml(booking.reference)}</strong>
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 32px 20px;">
            <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #ccc;">
              ${escapeHtml(copy.greeting)} <strong>${escapeHtml(booking.clientName)}</strong>,
            </p>

            <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #ccc;">
              ${escapeHtml(copy.intro)}
            </p>

            <!-- Event Details -->
            <div style="background: #1a1a1a; border-left: 4px solid #7C3AED; padding: 20px; margin-bottom: 24px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #fff;">${escapeHtml(copy.eventDetailsTitle)}</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #999; font-size: 14px;">${escapeHtml(copy.dateLabel)}:</td>
                  <td style="padding: 8px 0; color: #fff; font-size: 14px; font-weight: bold; text-align: right;">
                    ${escapeHtml(formattedDate)}
                  </td>
                </tr>
                ${booking.eventStartTime ? `
                <tr>
                  <td style="padding: 8px 0; color: #999; font-size: 14px;">${escapeHtml(copy.timeLabel)}:</td>
                  <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">
                    ${escapeHtml(booking.eventStartTime)}${booking.eventEndTime ? ` - ${escapeHtml(booking.eventEndTime)}` : ''}
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #999; font-size: 14px;">${escapeHtml(copy.locationLabel)}:</td>
                  <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">
                    ${escapeHtml(booking.eventLocation)}
                  </td>
                </tr>
                ${booking.eventVenue ? `
                <tr>
                  <td style="padding: 8px 0; color: #999; font-size: 14px;">${escapeHtml(copy.venueLabel)}:</td>
                  <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">
                    ${escapeHtml(booking.eventVenue)}
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #999; font-size: 14px;">${escapeHtml(copy.guestsLabel)}:</td>
                  <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">
                    ${booking.guestCount} ${escapeHtml(copy.guestsUnit)}
                  </td>
                </tr>
              </table>
            </div>

            <!-- Services -->
            <div style="background: #1a1a1a; border-left: 4px solid #EC4899; padding: 20px; margin-bottom: 24px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #fff;">${escapeHtml(copy.servicesTitle)}</h2>
              <ul style="margin: 0; padding-left: 20px; color: #ccc; line-height: 1.8;">
                <li><strong>${escapeHtml(packName)}</strong> - ${booking.pack.price}€</li>
                ${extrasHtml}
                ${booking.extraHours > 0 && booking.pack.extraHourPrice
                  ? `<li>${escapeHtml(copy.extraHoursLabel)} (${booking.extraHours}h) - ${booking.pack.extraHourPrice * booking.extraHours}€</li>`
                  : ''}
              </ul>

              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #333;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 18px; color: #999;">${escapeHtml(copy.totalLabel)}:</span>
                  <span style="font-size: 24px; font-weight: bold; color: #7C3AED;">
                    ${booking.total}€
                  </span>
                </div>
              </div>
            </div>

            <!-- Next Steps -->
            <div style="background: #1a1a1a; padding: 20px; margin-bottom: 24px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #fff;">${escapeHtml(copy.nextStepsTitle)}</h2>
              <ol style="margin: 0; padding-left: 20px; color: #ccc; line-height: 1.8;">
                ${nextStepsHtml}
              </ol>
            </div>

            <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #999;">
              ${escapeHtml(copy.contactPrompt)}
            </p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #ccc;">
              📧 ${SITE_CONFIG.business.email}<br>
              📱 ${SITE_CONFIG.business.phone}
            </p>
          </div>

          <!-- Footer -->
          <div style="padding: 20px; background: #0a0a0a; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              ${new Date().getFullYear()} ${escapeHtml(copy.footer)}
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

const PUBLIC_BOOKING_REQUEST_TEMPLATE_KEY = 'public-booking-request';
const PUBLIC_BOOKING_REQUEST_ORBITA_ORIGIN = 'public-booking-request';

function buildTrackedStandaloneEmailHtml(html: string, trackingToken: string, baseUrl: string): string {
  const trackedHtml = wrapLinksForTracking(html, trackingToken, baseUrl);
  const pixel = `<img src="${baseUrl}/api/tracking/open/${trackingToken}" width="1" height="1" alt="" style="display:none" />`;
  if (/<\/body>/i.test(trackedHtml)) {
    return trackedHtml.replace(/<\/body>/i, `${pixel}</body>`);
  }
  return `${trackedHtml}${pixel}`;
}

function emailSendUpdateFromResult(result: SendEmailResult) {
  return {
    smtpAccepted: result.smtp.accepted,
    smtpRejected: result.smtp.rejected,
    smtpResponse: result.smtp.response,
    smtpMessageId: result.smtp.messageId,
    imapAppendOk: result.imapSent.attempted ? result.imapSent.ok : null,
    imapSentFolder: result.imapSent.folder,
    imapSentUid: result.imapSent.uid ?? null,
    imapError: result.imapSent.error ?? null,
  };
}

export async function sendTrackedStandaloneEmail(input: TrackedStandaloneEmailInput): Promise<TrackedStandaloneEmailResult> {
  const baseUrl = getAppBaseUrl().replace(/\/+$/, '');
  const trackingRecord = await recordEmailSend({
    templateKey: input.templateKey,
    to: input.to,
    subject: input.subject,
    leadId: input.leadId ?? null,
    customerId: input.customerId ?? null,
    locale: input.locale ?? null,
    htmlBody: input.html,
    orbitaKind: input.orbita?.kind ?? null,
    orbitaId: input.orbita?.id ?? null,
    orbitaOrigin: input.orbita?.origin ?? null,
  });
  try {
    const result = await sendEmail({
      to: input.to,
      subject: input.subject,
      html: buildTrackedStandaloneEmailHtml(input.html, trackingRecord.trackingToken, baseUrl),
      replyTo: input.replyTo,
      from: input.from,
      text: input.text,
      attachments: input.attachments,
      brandingStyle: input.brandingStyle,
      headers: input.headers,
      skipImapAppend: input.skipImapAppend,
      orbita: input.orbita,
    });
    await updateEmailSendResult(trackingRecord.id, emailSendUpdateFromResult(result)).catch(() => undefined);
    return { emailSendId: trackingRecord.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateEmailSendResult(trackingRecord.id, {
      smtpAccepted: [],
      smtpRejected: [input.to],
      smtpResponse: message,
      smtpMessageId: '',
      imapAppendOk: null,
      imapSentFolder: null,
      imapSentUid: null,
      imapError: null,
    }).catch(() => undefined);
    throw error;
  }
}

export async function sendTrackedStandaloneEmailWithTimeout(
  input: TrackedStandaloneEmailInput,
  timeoutMs = 8000
): Promise<void> {
  let timeoutId: NodeJS.Timeout | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Email send timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    await Promise.race([sendTrackedStandaloneEmail(input), timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Send public booking request email to client.
 */
export async function sendBookingConfirmation(booking: BookingEmailModel): Promise<void> {
  const email = buildPublicBookingRequestEmail(booking);
  const locale = normalizeEmailLocale(booking.preferredLocale);
  await sendTrackedStandaloneEmail({
    templateKey: PUBLIC_BOOKING_REQUEST_TEMPLATE_KEY,
    to: booking.clientEmail,
    subject: email.subject,
    customerId: booking.customerId ?? null,
    locale,
    html: email.html,
    orbita: { kind: 'booking', id: booking.id, origin: PUBLIC_BOOKING_REQUEST_ORBITA_ORIGIN },
  });
}

/**
 * Send booking notification to admin
 */
export async function sendBookingNotificationToAdmin(booking: BookingEmailModel): Promise<void> {
  const eventDate = new Date(booking.eventDate);
  const formattedDate = eventDate.toLocaleDateString('ca-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const adminEmail = process.env.EMAIL_TO || SITE_CONFIG.business.email;

  await sendTrackedStandaloneEmail({
    templateKey: 'booking-admin-notification',
    to: adminEmail,
    subject: `Nueva solicitud de reserva #${booking.reference} - ${booking.clientName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #7C3AED;">Nueva solicitud de reserva recibida</h1>

          <p><strong>Referencia:</strong> ${escapeHtml(booking.reference)}</p>
          <p><strong>Estado:</strong> PENDING · revisión necesaria antes de confirmación final</p>

          <h2>Cliente</h2>
          <ul>
            <li><strong>Nombre:</strong> ${escapeHtml(booking.clientName)}</li>
            <li><strong>Email:</strong> ${escapeHtml(booking.clientEmail)}</li>
            <li><strong>Teléfono:</strong> ${escapeHtml(booking.clientPhone)}</li>
          </ul>

          <h2>Evento</h2>
          <ul>
            <li><strong>Tipo:</strong> ${escapeHtml(booking.eventType)}</li>
            <li><strong>Fecha:</strong> ${formattedDate}</li>
            ${booking.eventStartTime ? `<li><strong>Hora inicio:</strong> ${escapeHtml(booking.eventStartTime)}</li>` : ''}
            <li><strong>Ubicación:</strong> ${escapeHtml(booking.eventLocation)}</li>
            ${booking.eventVenue ? `<li><strong>Local:</strong> ${escapeHtml(booking.eventVenue)}</li>` : ''}
            <li><strong>Invitados:</strong> ${booking.guestCount}</li>
          </ul>

          <h2>Servicios</h2>
          <p><strong>Pack:</strong> ${booking.pack.slug} - ${booking.pack.price}€</p>
          ${booking.extras.length > 0 ? `<p><strong>Extras:</strong> ${booking.extras.length}</p>` : ''}
          ${booking.extraHours > 0 ? `<p><strong>Horas extra:</strong> ${booking.extraHours}h</p>` : ''}

          <p style="font-size: 20px; color: #7C3AED;"><strong>Total: ${booking.total}€</strong></p>

          ${booking.notes ? `
          <h2>Notas</h2>
          <p>${escapeHtml(booking.notes)}</p>
          ` : ''}

          <hr>
          <p style="color: #666; font-size: 12px;">
            Ver en admin: ${SITE_CONFIG.web.url}${buildBookingHref(booking.id)}
          </p>
        </div>
      </body>
      </html>
    `,
    customerId: booking.customerId ?? null,
    orbita: { kind: 'booking', id: booking.id, origin: 'booking-admin-notification' },
  });
}
