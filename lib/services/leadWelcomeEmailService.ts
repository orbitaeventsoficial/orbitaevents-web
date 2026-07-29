// lib/services/leadWelcomeEmailService.ts
// Envia l'email de BENVINGUDA a un lead nou usant la plantilla editable de BD
// (getTemplate → welcome), en el `preferredLocale` del lead. Mateix patró que
// `bookingConfirmationEmailService`: editar la plantilla a /admin/email-templates
// canvia l'email real. Degradació segura: si falla, retorna { ok:false } i no trenca res.
import { getTemplate } from '@/lib/services/emailTemplateService';
import { sendEmail } from '@/lib/email';
import { log } from '@/lib/logger';
import { getAppBaseUrl } from '@/lib/site';
import {
  recordEmailSend,
  updateEmailSendResult,
  wrapLinksForTracking,
} from '@/lib/services/emailTrackingService';

type Locale = 'ca' | 'es' | 'en';

function normLocale(locale?: string | null): Locale {
  const l = (locale || 'es').slice(0, 2).toLowerCase();
  return l === 'ca' || l === 'en' ? l : 'es';
}

const LEAD_WELCOME_TEMPLATE_KEY = 'welcome';
const LEAD_WELCOME_ORBITA_ORIGIN = 'lead-welcome';

function buildTrackedLeadWelcomeHtml(html: string, trackingToken: string, baseUrl: string): string {
  const trackedHtml = wrapLinksForTracking(html, trackingToken, baseUrl);
  const pixel = `<img src="${baseUrl}/api/tracking/open/${trackingToken}" width="1" height="1" alt="" style="display:none" />`;
  if (/<\/body>/i.test(trackedHtml)) {
    return trackedHtml.replace(/<\/body>/i, `${pixel}</body>`);
  }
  return `${trackedHtml}${pixel}`;
}

export async function sendLeadWelcomeEmail(input: {
  to: string;
  clientName: string;
  locale?: string | null;
  leadId?: string | null;
  customerId?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  if (!input.to?.trim()) return { ok: false, error: 'Sense email de destí' };
  const locale = normLocale(input.locale);
  try {
    const tpl = await getTemplate(LEAD_WELCOME_TEMPLATE_KEY, locale, { clientName: input.clientName });
    const baseUrl = getAppBaseUrl().replace(/\/+$/, '');
    const orbita = input.leadId
      ? { kind: 'lead' as const, id: input.leadId, origin: LEAD_WELCOME_ORBITA_ORIGIN }
      : input.customerId
        ? { kind: 'customer' as const, id: input.customerId, origin: LEAD_WELCOME_ORBITA_ORIGIN }
        : { kind: 'admin' as const, id: undefined, origin: LEAD_WELCOME_ORBITA_ORIGIN };
    const trackingRecord = await recordEmailSend({
      templateKey: LEAD_WELCOME_TEMPLATE_KEY,
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
      html: buildTrackedLeadWelcomeHtml(tpl.bodyHtml, trackingRecord.trackingToken, baseUrl),
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
    log.error('Error enviant email de benvinguda', error, { context: { to: input.to } });
    return { ok: false, error: error instanceof Error ? error.message : 'Error desconegut' };
  }
}
