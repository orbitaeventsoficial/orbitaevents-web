import { prisma } from '@/lib/prisma';
import { issueClientPortalAccess, getActivePortalAccessForBooking } from '@/lib/services/clientPortalAccess';
import { sendEmail } from '@/lib/email';
import { log } from '@/lib/logger';
import { PLACEHOLDER_EMAIL_DOMAIN, CUSTOMER_ACTIVITY_ACTIONS } from '@/lib/constants';
import { isSmtpConfigured } from '@/lib/env';
import { getAppBaseUrl } from '@/lib/site';
import {
  recordEmailSend,
  updateEmailSendResult,
  wrapLinksForTracking,
} from '@/lib/services/emailTrackingService';

type PortalEmailStatus = 'sent' | 'failed' | 'no_recipient' | 'placeholder' | 'smtp_not_configured';
type PortalEmailLocale = 'ca' | 'es' | 'en';

const BOOKING_PORTAL_EMAIL_TEMPLATE_KEY = 'booking-portal-access';
const BOOKING_PORTAL_ORBITA_ORIGIN = 'booking-portal-completion';

function normalizePortalLocale(locale: string | null | undefined): PortalEmailLocale {
  const loc = (locale || 'ca').toLowerCase();
  if (loc.startsWith('en')) return 'en';
  if (loc.startsWith('es')) return 'es';
  return 'ca';
}

function getPortalCopy(locale: string | null | undefined, clientName: string) {
  const loc = (locale || 'ca').toLowerCase();
  if (loc.startsWith('en')) {
    return {
      subject: 'Your access portal — Òrbita Events',
      title: 'Your event is complete!',
      greeting: `Hi ${clientName},`,
      body: 'Thank you for trusting Òrbita Events. You now have access to your personalised portal.',
      cta: 'Access my portal',
      footer: 'This link is personal and will expire in 30 days.',
    };
  }
  if (loc.startsWith('es')) {
    return {
      subject: 'Tu portal de acceso — Òrbita Events',
      title: '¡Tu evento se ha completado!',
      greeting: `Hola ${clientName},`,
      body: 'Gracias por confiar en Òrbita Events. Ya tienes acceso a tu portal personalizado.',
      cta: 'Acceder a mi portal',
      footer: 'Este enlace es personal y caducará en 30 días.',
    };
  }
  return {
    subject: 'El teu portal d\'accés — Òrbita Events',
    title: 'El teu event s\'ha completat!',
    greeting: `Hola ${clientName},`,
    body: 'Gràcies per confiar en Òrbita Events. Ja tens accés al teu portal personalitzat.',
    cta: 'Accedir al meu portal',
    footer: 'Aquest enllaç és personal i caducarà en 30 dies.',
  };
}

function buildTrackedPortalHtml(html: string, trackingToken: string, baseUrl: string): string {
  const trackedHtml = wrapLinksForTracking(html, trackingToken, baseUrl);
  const pixel = `<img src="${baseUrl}/api/tracking/open/${trackingToken}" width="1" height="1" alt="" style="display:none" />`;
  if (/<\/body>/i.test(trackedHtml)) {
    return trackedHtml.replace(/<\/body>/i, `${pixel}</body>`);
  }
  return `${trackedHtml}${pixel}`;
}

async function ensureCompletedBookingPortalAccess(options: {
  bookingId: string;
  preferredLocale?: string | null;
  clientEmail?: string | null;
  clientName: string;
  trigger: string;
}) {
  const existingAccess = await getActivePortalAccessForBooking(options.bookingId);
  if (existingAccess) return { created: false as const, skipped: 'already_exists' as const };

  const portalResult = await issueClientPortalAccess({
    bookingId: options.bookingId,
    locale: options.preferredLocale || 'ca',
    createdBy: 'system:auto-completed',
  });

  let emailStatus: PortalEmailStatus = 'no_recipient';
  let emailSendId: string | null = null;
  if (options.clientEmail?.includes(PLACEHOLDER_EMAIL_DOMAIN)) {
    emailStatus = 'placeholder';
  } else if (options.clientEmail && !isSmtpConfigured()) {
    emailStatus = 'smtp_not_configured';
  } else if (options.clientEmail) {
    const locale = normalizePortalLocale(options.preferredLocale);
    const portalCopy = getPortalCopy(locale, options.clientName);
    const html = `
      <div style="font-family:Segoe UI,Arial,sans-serif;background:#0b1120;color:#e2e8f0;padding:24px;border-radius:12px">
        <h2 style="margin:0 0 12px 0;color:#f8fafc">${portalCopy.title}</h2>
        <p>${portalCopy.greeting}</p>
        <p>${portalCopy.body}</p>
        <p style="margin:20px 0"><a href="${portalResult.url}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">${portalCopy.cta}</a></p>
        <p style="font-size:12px;color:#94a3b8">${portalCopy.footer}</p>
      </div>
    `;
    try {
      const baseUrl = getAppBaseUrl().replace(/\/+$/, '');
      const orbita = { kind: 'booking' as const, id: options.bookingId, origin: BOOKING_PORTAL_ORBITA_ORIGIN };
      const trackingRecord = await recordEmailSend({
        templateKey: BOOKING_PORTAL_EMAIL_TEMPLATE_KEY,
        to: options.clientEmail,
        subject: portalCopy.subject,
        leadId: null,
        customerId: null,
        locale,
        htmlBody: html,
        orbitaKind: orbita.kind,
        orbitaId: orbita.id,
        orbitaOrigin: orbita.origin,
      });
      emailSendId = trackingRecord.id;
      const sendResult = await sendEmail({
        to: options.clientEmail,
        subject: portalCopy.subject,
        html: buildTrackedPortalHtml(html, trackingRecord.trackingToken, baseUrl),
        orbita,
      });
      await updateEmailSendResult(trackingRecord.id, {
        smtpAccepted: sendResult.smtp.accepted,
        smtpRejected: sendResult.smtp.rejected,
        smtpResponse: sendResult.smtp.response,
        smtpMessageId: sendResult.smtp.messageId,
        imapAppendOk: sendResult.imapSent.attempted ? sendResult.imapSent.ok : null,
        imapSentFolder: sendResult.imapSent.folder,
        imapSentUid: sendResult.imapSent.uid ?? null,
        imapError: sendResult.imapSent.error ?? null,
      }).catch(() => undefined);
      emailStatus = 'sent';
    } catch (error) {
      emailStatus = 'failed';
      log.error('Auto portal email failed', error, {
        context: { bookingId: options.bookingId, trigger: options.trigger, clientEmail: options.clientEmail },
      });
    }
  }

  await prisma.adminLog.create({
    data: {
      action: CUSTOMER_ACTIVITY_ACTIONS.PORTAL_AUTO_CREATED,
      entity: 'booking',
      entityId: options.bookingId,
      details: {
        trigger: options.trigger,
        clientEmail: options.clientEmail || null,
        emailStatus,
        ...(emailSendId ? {
          emailSendId,
          emailSnapshot: 'EmailSend.htmlBody',
          orbitaKind: 'booking',
          orbitaId: options.bookingId,
          orbitaOrigin: BOOKING_PORTAL_ORBITA_ORIGIN,
        } : {}),
      },
    },
  });

  return { created: true as const, url: portalResult.url, emailStatus };
}

export async function tryEnsureCompletedBookingPortalAccess(options: {
  bookingId: string;
  preferredLocale?: string | null;
  clientEmail?: string | null;
  clientName: string;
  trigger: string;
}) {
  try {
    return await ensureCompletedBookingPortalAccess(options);
  } catch (error) {
    log.error('Auto portal creation failed', error, { context: { bookingId: options.bookingId, trigger: options.trigger } });
    return { created: false as const, skipped: 'error' as const };
  }
}
