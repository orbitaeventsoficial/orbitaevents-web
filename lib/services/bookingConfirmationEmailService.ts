// lib/services/bookingConfirmationEmailService.ts
// Envia la confirmació de reserva al client USANT la plantilla editable de BD
// (getTemplate → booking_confirmation). Així, editar la plantilla a /admin/email-templates
// SÍ canvia l'email que rep el client. Degradació segura: si falla, no trenca res.
import { prisma } from '@/lib/prisma';
import { getTemplate } from '@/lib/services/emailTemplateService';
import { sendEmail } from '@/lib/email';
import { formatDate } from '@/lib/constants';
import { log } from '@/lib/logger';
import { isSmtpConfigured } from '@/lib/env';
import { getAppBaseUrl } from '@/lib/site';
import {
  recordEmailSend,
  updateEmailSendResult,
  wrapLinksForTracking,
} from '@/lib/services/emailTrackingService';

type Locale = 'ca' | 'es' | 'en';
type BookingConfirmationEmailSkip = 'smtp_not_configured';

function normLocale(locale?: string | null): Locale {
  const l = (locale || 'es').slice(0, 2).toLowerCase();
  return l === 'ca' || l === 'en' ? l : 'es';
}

// Import comparteix la plantilla: {{total}} € → passem el número SENSE símbol.
function num(n: number): string {
  return Math.round(n).toLocaleString('es-ES');
}

const BOOKING_CONFIRMATION_TEMPLATE_KEY = 'booking_confirmation';
const BOOKING_CONFIRMATION_ORBITA_ORIGIN = 'booking-confirmation';

function buildTrackedBookingConfirmationHtml(html: string, trackingToken: string, baseUrl: string): string {
  const trackedHtml = wrapLinksForTracking(html, trackingToken, baseUrl);
  const pixel = `<img src="${baseUrl}/api/tracking/open/${trackingToken}" width="1" height="1" alt="" style="display:none" />`;
  if (/<\/body>/i.test(trackedHtml)) {
    return trackedHtml.replace(/<\/body>/i, `${pixel}</body>`);
  }
  return `${trackedHtml}${pixel}`;
}

export async function sendBookingConfirmationEmail(input: {
  to: string;
  locale?: string | null;
  bookingId?: string | null;
  leadId?: string | null;
  customerId?: string | null;
  reference: string;
  clientName: string;
  eventDate: Date;
  startTime?: string | null;
  endTime?: string | null;
  packId?: string | null;
  location?: string | null;
  total: number;
  depositAmount: number;
}): Promise<{ ok: boolean; error?: string; skipped?: BookingConfirmationEmailSkip }> {
  if (!input.to?.trim()) return { ok: false, error: 'Sense email de destí' };
  if (!isSmtpConfigured()) {
    return { ok: false, skipped: 'smtp_not_configured', error: 'SMTP no configurat' };
  }
  const locale = normLocale(input.locale);

  // Nom del pack en el locale del client (cau a '—' si no es resol).
  let packName = '—';
  if (input.packId) {
    try {
      const tr = await prisma.packTranslation.findUnique({
        where: { packId_locale: { packId: input.packId, locale } },
        select: { name: true },
      });
      packName = tr?.name || packName;
    } catch { /* fallback a '—' */ }
  }

  try {
    const tpl = await getTemplate(BOOKING_CONFIRMATION_TEMPLATE_KEY, locale, {
      reference: input.reference,
      clientName: input.clientName,
      eventDate: formatDate(input.eventDate, locale),
      startTime: input.startTime || '—',
      endTime: input.endTime || '—',
      packName,
      location: input.location || '—',
      total: num(input.total),
      depositAmount: num(input.depositAmount),
    });
    const baseUrl = getAppBaseUrl().replace(/\/+$/, '');
    const orbita = input.leadId
      ? { kind: 'lead' as const, id: input.leadId, origin: BOOKING_CONFIRMATION_ORBITA_ORIGIN }
      : input.customerId
        ? { kind: 'customer' as const, id: input.customerId, origin: BOOKING_CONFIRMATION_ORBITA_ORIGIN }
        : input.bookingId
          ? { kind: 'booking' as const, id: input.bookingId, origin: BOOKING_CONFIRMATION_ORBITA_ORIGIN }
          : { kind: 'admin' as const, id: undefined, origin: BOOKING_CONFIRMATION_ORBITA_ORIGIN };
    const trackingRecord = await recordEmailSend({
      templateKey: BOOKING_CONFIRMATION_TEMPLATE_KEY,
      to: input.to,
      subject: tpl.subject,
      leadId: input.leadId ?? null,
      customerId: input.customerId ?? null,
      locale,
      htmlBody: tpl.bodyHtml,
      orbitaKind: orbita.kind,
      orbitaId: orbita.id ?? null,
      orbitaOrigin: orbita.origin,
    });
    const sendResult = await sendEmail({
      to: input.to,
      subject: tpl.subject,
      html: buildTrackedBookingConfirmationHtml(tpl.bodyHtml, trackingRecord.trackingToken, baseUrl),
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
    return { ok: true };
  } catch (error) {
    log.error('Error enviant confirmació de reserva', error, {
      context: { reference: input.reference, to: input.to },
    });
    return { ok: false, error: error instanceof Error ? error.message : 'Error desconegut' };
  }
}
