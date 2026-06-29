// lib/services/bookingConfirmationEmailService.ts
// Envia la confirmació de reserva al client USANT la plantilla editable de BD
// (getTemplate → booking_confirmation). Així, editar la plantilla a /admin/email-templates
// SÍ canvia l'email que rep el client. Degradació segura: si falla, no trenca res.
import { prisma } from '@/lib/prisma';
import { getTemplate } from '@/lib/services/emailTemplateService';
import { sendEmail } from '@/lib/email';
import { formatDate } from '@/lib/constants';
import { log } from '@/lib/logger';

type Locale = 'ca' | 'es' | 'en';

function normLocale(locale?: string | null): Locale {
  const l = (locale || 'es').slice(0, 2).toLowerCase();
  return l === 'ca' || l === 'en' ? l : 'es';
}

// Import comparteix la plantilla: {{total}} € → passem el número SENSE símbol.
function num(n: number): string {
  return Math.round(n).toLocaleString('es-ES');
}

export async function sendBookingConfirmationEmail(input: {
  to: string;
  locale?: string | null;
  reference: string;
  clientName: string;
  eventDate: Date;
  startTime?: string | null;
  endTime?: string | null;
  packId?: string | null;
  location?: string | null;
  total: number;
  depositAmount: number;
}): Promise<{ ok: boolean; error?: string }> {
  if (!input.to?.trim()) return { ok: false, error: 'Sense email de destí' };
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
    const tpl = await getTemplate('booking_confirmation', locale, {
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
    await sendEmail({ to: input.to, subject: tpl.subject, html: tpl.bodyHtml });
    return { ok: true };
  } catch (error) {
    log.error('Error enviant confirmació de reserva', error, {
      context: { reference: input.reference, to: input.to },
    });
    return { ok: false, error: error instanceof Error ? error.message : 'Error desconegut' };
  }
}
