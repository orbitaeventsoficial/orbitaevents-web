import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import {
  type SendEmailResult,
  buildTestimonialApprovedEmailPayload,
  sendEmail,
} from '@/lib/email';
import { SITE_CONFIG } from '@/app/config/site-config';
import { getAppBaseUrl } from '@/lib/site';
import { recordCustomerProcessStarted } from '@/lib/services/customerActivityService';
import {
  recordEmailSend,
  updateEmailSendResult,
  wrapLinksForTracking,
} from '@/lib/services/emailTrackingService';
import { escapeHtml } from '@/lib/utils/sanitize';

export type CustomerProcessType = 'review_request' | 'post_event' | 'welcome' | 'promo';

function isCustomerProcessType(value: unknown): value is CustomerProcessType {
  return ['review_request', 'post_event', 'welcome', 'promo'].includes(String(value));
}

type CustomerProcessCustomer = {
  id: string;
  name: string;
  email: string;
  preferredLocale?: string | null;
};

const CUSTOMER_PROCESS_TEMPLATE_KEYS: Record<CustomerProcessType, string> = {
  review_request: 'customer-review-request',
  post_event: 'customer-post-event',
  welcome: 'customer-welcome',
  promo: 'customer-promo',
};

function normalizeCustomerLocale(locale?: string | null): 'ca' | 'es' | 'en' {
  const normalized = (locale || 'ca').slice(0, 2).toLowerCase();
  return normalized === 'es' || normalized === 'en' ? normalized : 'ca';
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || name || 'client';
}

function buildTrackedCustomerProcessHtml(html: string, trackingToken: string, baseUrl: string): string {
  const trackedHtml = wrapLinksForTracking(html, trackingToken, baseUrl);
  const pixel = `<img src="${baseUrl}/api/tracking/open/${trackingToken}" width="1" height="1" alt="" style="display:none" />`;
  if (/<\/body>/i.test(trackedHtml)) {
    return trackedHtml.replace(/<\/body>/i, `${pixel}</body>`);
  }
  return `${trackedHtml}${pixel}`;
}

function emailResultToUpdate(sendResult: SendEmailResult) {
  return {
    smtpAccepted: sendResult.smtp.accepted,
    smtpRejected: sendResult.smtp.rejected,
    smtpResponse: sendResult.smtp.response,
    smtpMessageId: sendResult.smtp.messageId,
    imapAppendOk: sendResult.imapSent.attempted ? sendResult.imapSent.ok : null,
    imapSentFolder: sendResult.imapSent.folder,
    imapSentUid: sendResult.imapSent.uid ?? null,
    imapError: sendResult.imapSent.error ?? null,
  };
}

async function sendTrackedCustomerProcessEmail(input: {
  customerId: string;
  bookingId?: string | null;
  to: string;
  subject: string;
  html: string;
  locale: string;
  processType: CustomerProcessType;
}) {
  const baseUrl = getAppBaseUrl().replace(/\/+$/, '');
  const orbita = input.bookingId
    ? { kind: 'booking' as const, id: input.bookingId, origin: `customer-process-${input.processType}` }
    : { kind: 'customer' as const, id: input.customerId, origin: `customer-process-${input.processType}` };
  const trackingRecord = await recordEmailSend({
    templateKey: CUSTOMER_PROCESS_TEMPLATE_KEYS[input.processType],
    to: input.to,
    subject: input.subject,
    customerId: input.customerId,
    locale: input.locale,
    htmlBody: input.html,
    orbitaKind: orbita.kind,
    orbitaId: orbita.id,
    orbitaOrigin: orbita.origin,
  });

  try {
    const sendResult = await sendEmail({
      to: input.to,
      subject: input.subject,
      html: buildTrackedCustomerProcessHtml(input.html, trackingRecord.trackingToken, baseUrl),
      orbita,
    });
    await updateEmailSendResult(trackingRecord.id, emailResultToUpdate(sendResult)).catch(() => undefined);
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

  return {
    emailSendId: trackingRecord.id,
    emailSnapshot: 'EmailSend.htmlBody' as const,
    orbitaKind: orbita.kind,
    orbitaId: orbita.id,
    orbitaOrigin: orbita.origin,
  };
}

async function sendReviewRequestEmail(customer: CustomerProcessCustomer, bookingId?: string | null) {
  const locale = normalizeCustomerLocale(customer.preferredLocale);
  const baseUrl = getAppBaseUrl();
  const reviewUrl = `${baseUrl}/${locale}/opiniones/nueva`;
  const firstName = getFirstName(customer.name);
  const subject = `${customer.name}, ens agradaria saber la teva opinió! ⭐`;
  const html = `
    <!DOCTYPE html>
    <html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #FFB800, #CC9600); padding: 40px; text-align: center;"><h1 style="color: #000; margin: 0; font-size: 28px;">ÒRBITA EVENTS</h1></div>
        <div style="padding: 30px; color: #e5e5e5;">
          <h2 style="color: #FFB800; margin-top: 0;">Hola ${escapeHtml(firstName)}!</h2>
          <p style="font-size: 16px; line-height: 1.6;">Esperem que el teu esdeveniment hagi anat genial! 🎉</p>
          <p style="font-size: 16px; line-height: 1.6;">Ens encantaria conèixer la teva experiència. La teva opinió ens ajuda a millorar i a arribar a més persones.</p>
          <p style="font-size: 16px; line-height: 1.6;">Com a agraïment, rebràs un <strong style="color: #FFB800;">descompte de fins al 25%</strong> per al teu pròxim esdeveniment!</p>
          <div style="text-align: center; margin: 30px 0;"><a href="${reviewUrl}" style="background: linear-gradient(135deg, #FFB800, #CC9600); color: #000; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;">⭐ Deixar la meva opinió</a></div>
          <p style="color: #666; font-size: 14px; text-align: center;">Només et portarà 2 minuts!</p>
        </div>
        <div style="padding: 20px; background: #0a0a0a; text-align: center;"><p style="margin: 0; font-size: 12px; color: #666;">© ${new Date().getFullYear()} Òrbita Events</p></div>
      </div>
    </body></html>
  `;

  const tracked = await sendTrackedCustomerProcessEmail({
    customerId: customer.id,
    bookingId,
    to: customer.email,
    subject,
    html,
    locale,
    processType: 'review_request',
  });

  return { emailSent: true, type: 'review_request', ...tracked };
}

async function sendPostEventSequence(customer: CustomerProcessCustomer, bookingId?: string | null) {
  const cleanName = (customer.name || 'CLIENT').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z]/g, '').substring(0, 6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const discountCode = `${cleanName}10${random}`;

  try {
    await prisma.discountCode.create({
      data: {
        code: discountCode,
        type: 'PERCENTAGE',
        value: 10,
        maxUses: 1,
        isActive: true,
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        sourceType: 'POST_EVENT',
      },
    });
  } catch (err) { log.error('[customerProcess] discount code creation failed:', err); }

  const payload = buildTestimonialApprovedEmailPayload({
    to: customer.email,
    name: customer.name,
    rating: 5,
    discountCode,
    discountPercent: 10,
    locale: customer.preferredLocale || undefined,
  });
  const tracked = await sendTrackedCustomerProcessEmail({
    customerId: customer.id,
    bookingId,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    locale: payload.locale,
    processType: 'post_event',
  });

  return { emailSent: true, type: 'post_event', discountCode, ...tracked };
}

async function sendWelcomeEmail(customer: CustomerProcessCustomer, bookingId?: string | null) {
  const locale = normalizeCustomerLocale(customer.preferredLocale);
  const baseUrl = getAppBaseUrl();
  const websiteUrl = `${baseUrl}/${locale}`;
  const firstName = getFirstName(customer.name);
  const subject = `Benvingut/da a Òrbita Events, ${firstName}! 🪐`;
  const html = `
    <!DOCTYPE html>
    <html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #FFB800, #CC9600); padding: 40px; text-align: center;"><h1 style="color: #000; margin: 0; font-size: 28px;">BENVINGUT/DA! 🎉</h1></div>
        <div style="padding: 30px; color: #e5e5e5;">
          <h2 style="color: #FFB800; margin-top: 0;">Hola ${escapeHtml(firstName)}!</h2>
          <p style="font-size: 16px; line-height: 1.6;">Gràcies per confiar en Òrbita Events per als teus esdeveniments especials.</p>
          <p style="font-size: 16px; line-height: 1.6;">Som especialistes en crear experiències úniques amb DJ professional, il·luminació espectacular i efectes especials.</p>
          <div style="background: rgba(255,184,0,0.1); border: 1px solid rgba(255,184,0,0.3); border-radius: 12px; padding: 20px; margin: 24px 0;">
            <h3 style="color: #FFB800; margin: 0 0 12px 0;">Els nostres serveis:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #ccc;"><li>🎵 DJ Professional</li><li>💡 Il·luminació i efectes</li><li>🎤 So d'alta qualitat</li><li>🎪 Producció tècnica</li></ul>
          </div>
          <div style="text-align: center; margin: 30px 0;"><a href="${websiteUrl}" style="background: linear-gradient(135deg, #FFB800, #CC9600); color: #000; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;">Veure els nostres serveis</a></div>
          <p style="font-size: 14px; color: #888; text-align: center;">Qualsevol dubte, contacta'ns a ${escapeHtml(SITE_CONFIG.business.phone)}</p>
        </div>
        <div style="padding: 20px; background: #0a0a0a; text-align: center;"><p style="margin: 0; font-size: 12px; color: #666;">© ${new Date().getFullYear()} Òrbita Events</p></div>
      </div>
    </body></html>
  `;

  const tracked = await sendTrackedCustomerProcessEmail({
    customerId: customer.id,
    bookingId,
    to: customer.email,
    subject,
    html,
    locale,
    processType: 'welcome',
  });

  return { emailSent: true, type: 'welcome', ...tracked };
}

async function sendPromoEmail(customer: CustomerProcessCustomer, bookingId?: string | null) {
  const locale = normalizeCustomerLocale(customer.preferredLocale);
  const promoCode = `PROMO${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  try {
    await prisma.discountCode.create({
      data: {
        code: promoCode,
        type: 'PERCENTAGE',
        value: 15,
        maxUses: 1,
        isActive: true,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        sourceType: 'PROMOTION',
      },
    });
  } catch (err) { log.error('[customerProcess] promo code creation failed:', err); }

  const firstName = getFirstName(customer.name);
  const subject = `🎁 Oferta exclusiva per tu, ${firstName}!`;
  const html = `
    <!DOCTYPE html>
    <html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #FF6B00, #FFB800); padding: 40px; text-align: center;"><h1 style="color: #000; margin: 0; font-size: 28px;">OFERTA EXCLUSIVA 🎁</h1></div>
        <div style="padding: 30px; color: #e5e5e5; text-align: center;">
          <h2 style="color: #FFB800; margin-top: 0;">Hola ${escapeHtml(firstName)}!</h2>
          <p style="font-size: 16px; line-height: 1.6;">Tenim una oferta especial per tu!</p>
          <div style="background: rgba(255,184,0,0.1); border: 2px solid #FFB800; border-radius: 16px; padding: 30px; margin: 24px 0;">
            <p style="color: #FFB800; margin: 0 0 12px 0; font-size: 14px;">EL TEU CODI:</p>
            <p style="font-size: 36px; font-weight: bold; color: #FFB800; margin: 0; letter-spacing: 4px;">${escapeHtml(promoCode)}</p>
            <p style="font-size: 24px; font-weight: bold; color: #fff; margin: 16px 0 0 0;">15% DESCOMPTE</p>
            <p style="color: #888; font-size: 12px; margin: 12px 0 0 0;">Vàlid durant 30 dies</p>
          </div>
          <p style="font-size: 14px; color: #888;">Contacta'ns per reservar el teu pròxim esdeveniment!</p>
        </div>
        <div style="padding: 20px; background: #0a0a0a; text-align: center;"><p style="margin: 0; font-size: 12px; color: #666;">© ${new Date().getFullYear()} Òrbita Events</p></div>
      </div>
    </body></html>
  `;

  const tracked = await sendTrackedCustomerProcessEmail({
    customerId: customer.id,
    bookingId,
    to: customer.email,
    subject,
    html,
    locale,
    processType: 'promo',
  });

  return { emailSent: true, type: 'promo', promoCode, ...tracked };
}

export async function startCustomerProcess(input: { customerId: string; bookingId?: string; processType: unknown }) {
  const { customerId, bookingId, processType } = input;
  if (!customerId || !isCustomerProcessType(processType)) {
    return { ok: false as const, status: 400, body: { error: 'customerId i processType són obligatoris o invàlids' } };
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true, email: true, name: true, preferredLocale: true },
  });

  if (!customer) {
    return { ok: false as const, status: 404, body: { error: 'Client no trobat' } };
  }

  if (!customer.email?.trim()) {
    return { ok: false as const, status: 400, body: { error: 'El client no té email' } };
  }
  const customerWithEmail: CustomerProcessCustomer = {
    ...customer,
    email: customer.email.trim(),
  };

  let result;
  try {
    switch (processType) {
      case 'review_request':
        result = await sendReviewRequestEmail(customerWithEmail, bookingId);
        break;
      case 'post_event':
        result = await sendPostEventSequence(customerWithEmail, bookingId);
        break;
      case 'welcome':
        result = await sendWelcomeEmail(customerWithEmail, bookingId);
        break;
      case 'promo':
        result = await sendPromoEmail(customerWithEmail, bookingId);
        break;
    }
  } catch (error) {
    log.error('[customerProcess] email send failed:', error, {
      context: { customerId, bookingId: bookingId || null, processType },
    });
    return {
      ok: false as const,
      status: 502,
      body: {
        success: false,
        processType,
        error: 'No s\'ha pogut enviar el procés al client',
      },
    };
  }

  await recordCustomerProcessStarted({
    customerId,
    processType,
    emailSendId: result.emailSendId,
    emailSnapshot: result.emailSnapshot,
  }).catch((err) => log.error('[customerProcess] activity log failed:', err));

  return {
    ok: true as const,
    status: 200,
    body: {
      success: true,
      processType,
      result,
    },
  };
}
