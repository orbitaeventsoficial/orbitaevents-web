import { SUPPORTED_LOCALES } from '@/lib/constants';
import { prisma } from '@/lib/prisma';

interface TemplateVariables {
  [key: string]: string | number | undefined;
}

interface ResolvedTemplate {
  subject: string;
  bodyHtml: string;
  source: 'db' | 'default';
}

const TEMPLATE_SLUGS = {
  BOOKING_CONFIRMATION: 'booking_confirmation',
  ADMIN_BOOKING_NOTIFICATION: 'admin_booking_notification',
  POST_EVENT: 'post_event',
  PAYMENT_REMINDER: 'payment_reminder',
  TESTIMONIAL_APPROVED: 'testimonial_approved',
  TESTIMONIAL_RECEIVED: 'testimonial_received',
  TESTIMONIAL_REMINDER: 'testimonial_reminder',
  WELCOME: 'welcome',
} as const;

type TemplateSlug = typeof TEMPLATE_SLUGS[keyof typeof TEMPLATE_SLUGS];

const TEMPLATE_VARIABLES: Record<TemplateSlug, string[]> = {
  booking_confirmation: ['clientName', 'reference', 'eventDate', 'eventType', 'packName', 'location', 'total', 'depositAmount', 'startTime', 'endTime'],
  admin_booking_notification: ['clientName', 'clientEmail', 'clientPhone', 'reference', 'eventDate', 'eventType', 'packName', 'location', 'total'],
  post_event: ['clientName', 'packName', 'eventDate', 'reviewUrl', 'googleReviewUrl'],
  payment_reminder: ['clientName', 'reference', 'pendingAmount', 'eventDate', 'daysUntilEvent'],
  testimonial_approved: ['clientName', 'discountCode', 'discountAmount'],
  testimonial_received: ['clientName'],
  testimonial_reminder: ['clientName', 'reviewUrl'],
  welcome: ['clientName'],
};

function interpolate(template: string, variables: TemplateVariables): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = variables[key];
    return val !== undefined ? String(val) : `{{${key}}}`;
  });
}

export async function getTemplate(
  slug: TemplateSlug,
  locale: string,
  variables: TemplateVariables = {}
): Promise<ResolvedTemplate> {
  try {
    const dbTemplate = await prisma.emailTemplate.findUnique({
      where: { slug_locale: { slug, locale } },
    });

    if (dbTemplate?.isActive) {
      return {
        subject: interpolate(dbTemplate.subject, variables),
        bodyHtml: interpolate(dbTemplate.bodyHtml, variables),
        source: 'db',
      };
    }
  } catch {
  }

  const defaults = getDefaultTemplate(slug, locale);
  return {
    subject: interpolate(defaults.subject, variables),
    bodyHtml: interpolate(defaults.bodyHtml, variables),
    source: 'default',
  };
}

export async function getAdminTemplateDetail(input: {
  slug: string;
  locale: string;
  variables?: TemplateVariables;
}) {
  if (!isTemplateSlug(input.slug)) {
    return {
      status: 400 as const,
      body: { ok: false, error: 'Template slug invàlid' },
    };
  }

  const dbTemplate = await prisma.emailTemplate.findUnique({
    where: { slug_locale: { slug: input.slug, locale: input.locale } },
  });
  const resolved = await getTemplate(input.slug, input.locale, input.variables ?? {});

  return {
    status: 200 as const,
    body: {
      ok: true,
      slug: input.slug,
      locale: input.locale,
      template: dbTemplate || null,
      resolved,
    },
  };
}

export async function listTemplates(): Promise<{
  slug: TemplateSlug;
  description: string;
  locales: { locale: string; source: 'db' | 'default'; updatedAt?: Date }[];
  variables: string[];
}[]> {
  const dbTemplates = await prisma.emailTemplate.findMany({
    orderBy: [{ slug: 'asc' }, { locale: 'asc' }],
  });

  const dbMap = new Map<string, typeof dbTemplates[number]>();
  for (const t of dbTemplates) {
    dbMap.set(`${t.slug}:${t.locale}`, t);
  }

  return Object.entries(TEMPLATE_SLUGS).map(([, slug]) => {
    const locales = SUPPORTED_LOCALES.map((locale) => {
      const db = dbMap.get(`${slug}:${locale}`);
      return {
        locale,
        source: (db ? 'db' : 'default') as 'db' | 'default',
        updatedAt: db?.updatedAt,
      };
    });

    return {
      slug: slug as TemplateSlug,
      description: getTemplateDescription(slug as TemplateSlug),
      locales,
      variables: TEMPLATE_VARIABLES[slug as TemplateSlug] || [],
    };
  });
}

export function isTemplateSlug(value: string): value is TemplateSlug {
  return Object.values(TEMPLATE_SLUGS).includes(value as TemplateSlug);
}

export function getTemplateVariables(slug: string): string[] {
  return isTemplateSlug(slug) ? TEMPLATE_VARIABLES[slug] || [] : [];
}

function getTemplateDescription(slug: TemplateSlug): string {
  const descriptions: Record<TemplateSlug, string> = {
    booking_confirmation: 'Confirmació de reserva al client',
    admin_booking_notification: 'Notificació de nova reserva a l\'admin',
    post_event: 'Email post-event demanant ressenya',
    payment_reminder: 'Recordatori de pagament pendent',
    testimonial_approved: 'Testimoni aprovat + codi descompte',
    testimonial_received: 'Confirmació recepció testimoni',
    testimonial_reminder: 'Recordatori per deixar ressenya',
    welcome: 'Benvinguda al nou client',
  };
  return descriptions[slug] || slug;
}

function emailShell(content: string, preheader?: string): string {
  return `<!doctype html>
<html lang="ca">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
${preheader ? `<span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>` : ''}
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Roboto,Arial,sans-serif;color:#e5e5e5;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background:#141414;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0c1220 100%);padding:28px 32px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr>
<td style="width:52px;vertical-align:middle;"><div style="width:44px;height:44px;background:linear-gradient(135deg,#06b6d4,#3b82f6);border-radius:12px;text-align:center;line-height:44px;font-size:22px;font-weight:900;color:#fff;">Ò</div></td>
<td style="vertical-align:middle;"><div style="font-size:18px;font-weight:800;letter-spacing:0.3px;color:#ffffff;">Òrbita Events</div><div style="margin-top:3px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.45);">DJ · Esdeveniments · Festa</div></td>
</tr>
</table>
</td></tr>
<tr><td style="padding:32px;">${content}</td></tr>
<tr><td style="padding:24px 32px;border-top:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);"><div style="font-size:13px;color:rgba(255,255,255,0.5);">Gràcies per confiar en nosaltres.</div><div style="margin-top:8px;font-size:12px;color:rgba(255,255,255,0.3);">📞 623 15 28 60 · ✉ info@orbitaevents.com · 🌐 orbitaevents.com</div><div style="margin-top:12px;font-size:11px;color:rgba(255,255,255,0.2);">© ${new Date().getFullYear()} Òrbita Events · Granollers, Barcelona</div></td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function ctaButton(text: string, url: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0;"><tr><td style="background:linear-gradient(135deg,#06b6d4,#3b82f6);border-radius:12px;padding:14px 28px;"><a href="${url}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:0.3px;display:inline-block;">${text}</a></td></tr></table>`;
}

function infoRow(label: string, value: string): string {
  return `<tr><td style="padding:10px 14px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:rgba(255,255,255,0.4);border-bottom:1px solid rgba(255,255,255,0.04);width:140px;">${label}</td><td style="padding:10px 14px;font-size:14px;font-weight:600;color:#e5e5e5;border-bottom:1px solid rgba(255,255,255,0.04);">${value}</td></tr>`;
}

function getDefaultTemplate(slug: TemplateSlug, locale: string): { subject: string; bodyHtml: string } {
  const templates: Record<string, Record<string, { subject: string; bodyHtml: string }>> = {
    booking_confirmation: {
      ca: { subject: '✅ Reserva confirmada #{{reference}} — Òrbita Events', bodyHtml: emailShell(`<div style="font-size:26px;font-weight:800;color:#ffffff;line-height:1.3;">Hola {{clientName}}! 🎉</div><div style="margin-top:8px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.6;">La teva reserva ha estat confirmada. A continuació tens tots els detalls:</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;">${infoRow('Referència', '#{{reference}}')}${infoRow('Data', '{{eventDate}}')}${infoRow('Horari', '{{startTime}} — {{endTime}}')}${infoRow('Servei', '{{packName}}')}${infoRow('Ubicació', '{{location}}')}${infoRow('Import total', '{{total}} €')}</table><div style="margin:24px 0;padding:16px;background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.15);border-radius:12px;"><div style="font-size:13px;font-weight:700;color:#06b6d4;">💰 Paga i senyal</div><div style="margin-top:4px;font-size:14px;color:rgba(255,255,255,0.7);">{{depositAmount}} € — per confirmar definitivament la reserva.</div></div><div style="font-size:14px;color:rgba(255,255,255,0.6);line-height:1.7;">Si tens cap dubte, respon directament a aquest email o truca'ns.<br>Estem encantats de fer la teva festa única!</div>`, 'Reserva confirmada #{{reference}}') },
      es: { subject: '✅ Reserva confirmada #{{reference}} — Òrbita Events', bodyHtml: emailShell(`<div style="font-size:26px;font-weight:800;color:#ffffff;line-height:1.3;">¡Hola {{clientName}}! 🎉</div><div style="margin-top:8px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.6;">Tu reserva ha sido confirmada. Aquí tienes todos los detalles:</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;">${infoRow('Referencia', '#{{reference}}')}${infoRow('Fecha', '{{eventDate}}')}${infoRow('Horario', '{{startTime}} — {{endTime}}')}${infoRow('Servicio', '{{packName}}')}${infoRow('Ubicación', '{{location}}')}${infoRow('Importe total', '{{total}} €')}</table><div style="margin:24px 0;padding:16px;background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.15);border-radius:12px;"><div style="font-size:13px;font-weight:700;color:#06b6d4;">💰 Señal</div><div style="margin-top:4px;font-size:14px;color:rgba(255,255,255,0.7);">{{depositAmount}} € — para confirmar definitivamente la reserva.</div></div><div style="font-size:14px;color:rgba(255,255,255,0.6);line-height:1.7;">Si tienes alguna duda, responde directamente a este email o llámanos.<br>¡Estamos encantados de hacer tu fiesta única!</div>`, 'Reserva confirmada #{{reference}}') },
      en: { subject: '✅ Booking confirmed #{{reference}} — Òrbita Events', bodyHtml: emailShell(`<div style="font-size:26px;font-weight:800;color:#ffffff;line-height:1.3;">Hi {{clientName}}! 🎉</div><div style="margin-top:8px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.6;">Your booking has been confirmed. Here are all the details:</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;">${infoRow('Reference', '#{{reference}}')}${infoRow('Date', '{{eventDate}}')}${infoRow('Time', '{{startTime}} — {{endTime}}')}${infoRow('Service', '{{packName}}')}${infoRow('Location', '{{location}}')}${infoRow('Total', '{{total}} €')}</table><div style="margin:24px 0;padding:16px;background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.15);border-radius:12px;"><div style="font-size:13px;font-weight:700;color:#06b6d4;">💰 Deposit</div><div style="margin-top:4px;font-size:14px;color:rgba(255,255,255,0.7);">{{depositAmount}} € — to definitively confirm your booking.</div></div><div style="font-size:14px;color:rgba(255,255,255,0.6);line-height:1.7;">If you have any questions, reply directly to this email or call us.<br>We're thrilled to make your party unforgettable!</div>`, 'Booking confirmed #{{reference}}') },
    },
    post_event: {
      ca: { subject: '{{clientName}}, gràcies per confiar en nosaltres! 🎵', bodyHtml: emailShell(`<div style="font-size:26px;font-weight:800;color:#ffffff;line-height:1.3;">Hola {{clientName}}! 🙌</div><div style="margin-top:12px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">Esperem que gaudissis de la festa amb <strong style="color:#e5e5e5;">{{packName}}</strong>!<br><br>La teva opinió ens és molt important. Ens encantaria saber com va anar tot:</div>${ctaButton('Deixar ressenya ⭐', '{{reviewUrl}}')}<div style="font-size:13px;color:rgba(255,255,255,0.4);line-height:1.6;">També pots deixar una ressenya a <a href="{{googleReviewUrl}}" style="color:#06b6d4;text-decoration:none;">Google</a> — ens ajuda moltíssim!</div>`, 'Gràcies per la festa! Deixa la teva opinió') },
      es: { subject: '{{clientName}}, ¡gracias por confiar en nosotros! 🎵', bodyHtml: emailShell(`<div style="font-size:26px;font-weight:800;color:#ffffff;line-height:1.3;">¡Hola {{clientName}}! 🙌</div><div style="margin-top:12px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">Esperamos que disfrutaras de la fiesta con <strong style="color:#e5e5e5;">{{packName}}</strong>!<br><br>Tu opinión es muy importante para nosotros. Nos encantaría saber cómo fue todo:</div>${ctaButton('Dejar reseña ⭐', '{{reviewUrl}}')}<div style="font-size:13px;color:rgba(255,255,255,0.4);line-height:1.6;">También puedes dejar una reseña en <a href="{{googleReviewUrl}}" style="color:#06b6d4;text-decoration:none;">Google</a> — ¡nos ayuda muchísimo!</div>`, 'Gracias por la fiesta! Deja tu opinión') },
      en: { subject: '{{clientName}}, thank you for trusting us! 🎵', bodyHtml: emailShell(`<div style="font-size:26px;font-weight:800;color:#ffffff;line-height:1.3;">Hi {{clientName}}! 🙌</div><div style="margin-top:12px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">We hope you enjoyed the party with <strong style="color:#e5e5e5;">{{packName}}</strong>!<br><br>Your feedback is very important to us. We'd love to hear how it went:</div>${ctaButton('Leave a review ⭐', '{{reviewUrl}}')}<div style="font-size:13px;color:rgba(255,255,255,0.4);line-height:1.6;">You can also leave a review on <a href="{{googleReviewUrl}}" style="color:#06b6d4;text-decoration:none;">Google</a> — it really helps us!</div>`, 'Thanks for the party! Leave your feedback') },
    },
    payment_reminder: {
      ca: { subject: '💳 Recordatori de pagament — Reserva #{{reference}}', bodyHtml: emailShell(`<div style="font-size:26px;font-weight:800;color:#ffffff;line-height:1.3;">Hola {{clientName}}</div><div style="margin-top:12px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">Et recordem que tens un pagament pendent per a la teva reserva:</div><div style="margin:24px 0;padding:20px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.15);border-radius:12px;text-align:center;"><div style="font-size:32px;font-weight:900;color:#fbbf24;">{{pendingAmount}} €</div><div style="margin-top:4px;font-size:13px;color:rgba(255,255,255,0.5);">Import pendent · Reserva #{{reference}}</div></div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;">${infoRow('Data event', '{{eventDate}}')}${infoRow('Dies restants', '{{daysUntilEvent}} dies')}</table><div style="font-size:14px;color:rgba(255,255,255,0.6);line-height:1.7;">Si ja has fet el pagament, ignora aquest missatge. Si tens dubtes sobre les opcions de pagament, respon a aquest email.</div>`, 'Recordatori: pagament pendent de {{pendingAmount}} €') },
      es: { subject: '💳 Recordatorio de pago — Reserva #{{reference}}', bodyHtml: emailShell(`<div style="font-size:26px;font-weight:800;color:#ffffff;line-height:1.3;">Hola {{clientName}}</div><div style="margin-top:12px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">Te recordamos que tienes un pago pendiente para tu reserva:</div><div style="margin:24px 0;padding:20px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.15);border-radius:12px;text-align:center;"><div style="font-size:32px;font-weight:900;color:#fbbf24;">{{pendingAmount}} €</div><div style="margin-top:4px;font-size:13px;color:rgba(255,255,255,0.5);">Importe pendiente · Reserva #{{reference}}</div></div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;">${infoRow('Fecha evento', '{{eventDate}}')}${infoRow('Días restantes', '{{daysUntilEvent}} días')}</table><div style="font-size:14px;color:rgba(255,255,255,0.6);line-height:1.7;">Si ya realizaste el pago, ignora este mensaje. Si tienes dudas sobre las opciones de pago, responde a este email.</div>`, 'Recordatorio: pago pendiente de {{pendingAmount}} €') },
      en: { subject: '💳 Payment reminder — Booking #{{reference}}', bodyHtml: emailShell(`<div style="font-size:26px;font-weight:800;color:#ffffff;line-height:1.3;">Hi {{clientName}}</div><div style="margin-top:12px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">This is a reminder that you have a pending payment for your booking:</div><div style="margin:24px 0;padding:20px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.15);border-radius:12px;text-align:center;"><div style="font-size:32px;font-weight:900;color:#fbbf24;">{{pendingAmount}} €</div><div style="margin-top:4px;font-size:13px;color:rgba(255,255,255,0.5);">Pending amount · Booking #{{reference}}</div></div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;">${infoRow('Event date', '{{eventDate}}')}${infoRow('Days remaining', '{{daysUntilEvent}} days')}</table><div style="font-size:14px;color:rgba(255,255,255,0.6);line-height:1.7;">If you've already made the payment, please disregard this message. If you have questions about payment options, reply to this email.</div>`, 'Reminder: pending payment of {{pendingAmount}} €') },
    },
    admin_booking_notification: {
      ca: { subject: '📥 Nova reserva #{{reference}} — {{clientName}}', bodyHtml: emailShell(`<div style="font-size:22px;font-weight:800;color:#ffffff;">Nova reserva rebuda</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;">${infoRow('Client', '{{clientName}}')}${infoRow('Email', '{{clientEmail}}')}${infoRow('Telèfon', '{{clientPhone}}')}${infoRow('Referència', '#{{reference}}')}${infoRow('Data', '{{eventDate}}')}${infoRow('Tipus', '{{eventType}}')}${infoRow('Pack', '{{packName}}')}${infoRow('Ubicació', '{{location}}')}${infoRow('Total', '{{total}} €')}</table>`) },
      es: { subject: '📥 Nueva reserva #{{reference}} — {{clientName}}', bodyHtml: '' },
      en: { subject: '📥 New booking #{{reference}} — {{clientName}}', bodyHtml: '' },
    },
    testimonial_approved: {
      ca: { subject: 'El teu testimoni ha estat publicat! 🎉 + Codi descompte', bodyHtml: emailShell(`<div style="font-size:26px;font-weight:800;color:#ffffff;line-height:1.3;">Gràcies {{clientName}}! 🌟</div><div style="margin-top:12px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">El teu testimoni ha estat aprovat i publicat al nostre web. Moltes gràcies per compartir la teva experiència!</div><div style="margin:24px 0;padding:20px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.15);border-radius:12px;text-align:center;"><div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.4);">Codi descompte exclusiu</div><div style="margin-top:8px;font-size:28px;font-weight:900;color:#10b981;letter-spacing:2px;">{{discountCode}}</div><div style="margin-top:8px;font-size:14px;color:rgba(255,255,255,0.5);">{{discountAmount}}% de descompte en la teva propera reserva</div></div>`) },
      es: { subject: '¡Tu testimonio ha sido publicado! 🎉 + Código descuento', bodyHtml: emailShell(`<div style="font-size:26px;font-weight:800;color:#ffffff;line-height:1.3;">¡Gracias {{clientName}}! 🌟</div><div style="margin-top:12px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">Tu testimonio ha sido aprobado y publicado en nuestra web. ¡Muchas gracias por compartir tu experiencia!</div><div style="margin:24px 0;padding:20px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.15);border-radius:12px;text-align:center;"><div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.4);">Código descuento exclusivo</div><div style="margin-top:8px;font-size:28px;font-weight:900;color:#10b981;letter-spacing:2px;">{{discountCode}}</div><div style="margin-top:8px;font-size:14px;color:rgba(255,255,255,0.5);">{{discountAmount}}% de descuento en tu próxima reserva</div></div>`) },
      en: { subject: 'Your testimonial has been published! 🎉 + Discount code', bodyHtml: emailShell(`<div style="font-size:26px;font-weight:800;color:#ffffff;line-height:1.3;">Thank you {{clientName}}! 🌟</div><div style="margin-top:12px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">Your testimonial has been approved and published on our website. Thanks for sharing your experience!</div><div style="margin:24px 0;padding:20px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.15);border-radius:12px;text-align:center;"><div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.4);">Exclusive discount code</div><div style="margin-top:8px;font-size:28px;font-weight:900;color:#10b981;letter-spacing:2px;">{{discountCode}}</div><div style="margin-top:8px;font-size:14px;color:rgba(255,255,255,0.5);">{{discountAmount}}% off your next booking</div></div>`) },
    },
    testimonial_received: {
      ca: { subject: 'Hem rebut el teu testimoni — Gràcies {{clientName}}!', bodyHtml: emailShell(`<div style="font-size:26px;font-weight:800;color:#ffffff;">Gràcies {{clientName}}! 💌</div><div style="margin-top:12px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">Hem rebut el teu testimoni correctament. El revisarem aviat i, un cop aprovat, el publicarem al web i t'enviarem un codi descompte com a agraïment.</div>`) },
      es: { subject: 'Hemos recibido tu testimonio — ¡Gracias {{clientName}}!', bodyHtml: emailShell(`<div style="font-size:26px;font-weight:800;color:#ffffff;">¡Gracias {{clientName}}! 💌</div><div style="margin-top:12px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">Hemos recibido tu testimonio correctamente. Lo revisaremos pronto y, una vez aprobado, lo publicaremos en la web y te enviaremos un código de descuento como agradecimiento.</div>`) },
      en: { subject: 'We received your testimonial — Thank you {{clientName}}!', bodyHtml: emailShell(`<div style="font-size:26px;font-weight:800;color:#ffffff;">Thank you {{clientName}}! 💌</div><div style="margin-top:12px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">We've received your testimonial. We'll review it shortly and, once approved, publish it on our website and send you a discount code as a thank you.</div>`) },
    },
    testimonial_reminder: {
      ca: { subject: '{{clientName}}, ens encantaria saber la teva opinió! ⭐', bodyHtml: emailShell(`<div style="font-size:26px;font-weight:800;color:#ffffff;">Hola {{clientName}}!</div><div style="margin-top:12px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">Fa uns dies vam compartir una festa junts i la teva opinió ens ajudaria molt a millorar. Trigaràs menys d'un minut!</div>${ctaButton('Deixar ressenya ⭐', '{{reviewUrl}}')}`) },
      es: { subject: '{{clientName}}, ¡nos encantaría saber tu opinión! ⭐', bodyHtml: emailShell(`<div style="font-size:26px;font-weight:800;color:#ffffff;">¡Hola {{clientName}}!</div><div style="margin-top:12px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">Hace unos días compartimos una fiesta juntos y tu opinión nos ayudaría mucho a mejorar. ¡Te llevará menos de un minuto!</div>${ctaButton('Dejar reseña ⭐', '{{reviewUrl}}')}`) },
      en: { subject: '{{clientName}}, we\'d love your feedback! ⭐', bodyHtml: emailShell(`<div style="font-size:26px;font-weight:800;color:#ffffff;">Hi {{clientName}}!</div><div style="margin-top:12px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">A few days ago we shared a party together and your feedback would really help us improve. It takes less than a minute!</div>${ctaButton('Leave a review ⭐', '{{reviewUrl}}')}`) },
    },
    welcome: {
      ca: { subject: 'Benvingut/da a Òrbita Events! 🎵', bodyHtml: emailShell(`<div style="font-size:26px;font-weight:800;color:#ffffff;">Benvingut/da {{clientName}}! 🚀</div><div style="margin-top:12px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">Gràcies per confiar en Òrbita Events. Estem encantats de tenir-te com a client. Quan necessitis qualsevol cosa, aquí estem!</div>`) },
      es: { subject: '¡Bienvenido/a a Òrbita Events! 🎵', bodyHtml: emailShell(`<div style="font-size:26px;font-weight:800;color:#ffffff;">¡Bienvenido/a {{clientName}}! 🚀</div><div style="margin-top:12px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">Gracias por confiar en Òrbita Events. Estamos encantados de tenerte como cliente. Cuando necesites cualquier cosa, ¡aquí estamos!</div>`) },
      en: { subject: 'Welcome to Òrbita Events! 🎵', bodyHtml: emailShell(`<div style="font-size:26px;font-weight:800;color:#ffffff;">Welcome {{clientName}}! 🚀</div><div style="margin-top:12px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">Thanks for choosing Òrbita Events. We're thrilled to have you as a client. Whenever you need anything, we're here!</div>`) },
    },
  };

  const localeTemplates = templates[slug];
  if (!localeTemplates) {
    return { subject: slug, bodyHtml: emailShell(`<p>Template "${slug}" no disponible.</p>`) };
  }

  return localeTemplates[locale] || localeTemplates.ca || localeTemplates.es || { subject: slug, bodyHtml: '' };
}

export async function upsertTemplate(input: {
  slug: string;
  locale: string;
  subject: string;
  bodyHtml?: string;
}) {
  const variables = isTemplateSlug(input.slug) ? getTemplateVariables(input.slug) : [];

  return prisma.emailTemplate.upsert({
    where: { slug_locale: { slug: input.slug, locale: input.locale } },
    update: {
      subject: input.subject,
      bodyHtml: input.bodyHtml || '',
      variables: JSON.stringify(variables),
      isActive: true,
    },
    create: {
      slug: input.slug,
      locale: input.locale,
      subject: input.subject,
      bodyHtml: input.bodyHtml || '',
      variables: JSON.stringify(variables),
      description: null,
      isActive: true,
    },
  });
}
