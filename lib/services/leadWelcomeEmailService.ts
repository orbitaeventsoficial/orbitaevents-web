// lib/services/leadWelcomeEmailService.ts
// Envia l'email de BENVINGUDA a un lead nou usant la plantilla editable de BD
// (getTemplate → welcome), en el `preferredLocale` del lead. Mateix patró que
// `bookingConfirmationEmailService`: editar la plantilla a /admin/email-templates
// canvia l'email real. Degradació segura: si falla, retorna { ok:false } i no trenca res.
import { getTemplate } from '@/lib/services/emailTemplateService';
import { sendEmail } from '@/lib/email';
import { log } from '@/lib/logger';

type Locale = 'ca' | 'es' | 'en';

function normLocale(locale?: string | null): Locale {
  const l = (locale || 'es').slice(0, 2).toLowerCase();
  return l === 'ca' || l === 'en' ? l : 'es';
}

export async function sendLeadWelcomeEmail(input: {
  to: string;
  clientName: string;
  locale?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  if (!input.to?.trim()) return { ok: false, error: 'Sense email de destí' };
  const locale = normLocale(input.locale);
  try {
    const tpl = await getTemplate('welcome', locale, { clientName: input.clientName });
    await sendEmail({ to: input.to, subject: tpl.subject, html: tpl.bodyHtml });
    return { ok: true };
  } catch (error) {
    log.error('Error enviant email de benvinguda', error, { context: { to: input.to } });
    return { ok: false, error: error instanceof Error ? error.message : 'Error desconegut' };
  }
}
