import { prisma } from '@/lib/prisma';
import { issueClientPortalAccess, getActivePortalAccessForBooking } from '@/lib/services/clientPortalAccess';
import { sendEmail } from '@/lib/email';
import { log } from '@/lib/logger';
import { PLACEHOLDER_EMAIL_DOMAIN, CUSTOMER_ACTIVITY_ACTIONS } from '@/lib/constants';

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

  if (options.clientEmail && !options.clientEmail.includes(PLACEHOLDER_EMAIL_DOMAIN)) {
    const portalCopy = getPortalCopy(options.preferredLocale, options.clientName);
    await sendEmail({
      to: options.clientEmail,
      subject: portalCopy.subject,
      html: `
        <div style="font-family:Segoe UI,Arial,sans-serif;background:#0b1120;color:#e2e8f0;padding:24px;border-radius:12px">
          <h2 style="margin:0 0 12px 0;color:#f8fafc">${portalCopy.title}</h2>
          <p>${portalCopy.greeting}</p>
          <p>${portalCopy.body}</p>
          <p style="margin:20px 0"><a href="${portalResult.url}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">${portalCopy.cta}</a></p>
          <p style="font-size:12px;color:#94a3b8">${portalCopy.footer}</p>
        </div>
      `,
    });
  }

  await prisma.adminLog.create({
    data: {
      action: CUSTOMER_ACTIVITY_ACTIONS.PORTAL_AUTO_CREATED,
      entity: 'booking',
      entityId: options.bookingId,
      details: { trigger: options.trigger, clientEmail: options.clientEmail || null },
    },
  });

  return { created: true as const, url: portalResult.url };
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