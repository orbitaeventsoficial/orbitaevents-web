// app/api/admin/emails/run-cron/route.ts
// Wrapper endpoint to run cron from admin panel without exposing CRON_SECRET
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { SITE_CONFIG } from '@/app/config/site-config';
import { requireAuth } from '@/lib/auth';
import { toIntlLocale } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const GOOGLE_REVIEW_URL = 'https://g.page/r/CXcgbvANsXSzEBI/review';

interface ProcessedResult {
  bookingId: string;
  clientName: string;
  email: string;
  status: 'sent' | 'skipped' | 'error';
  reason?: string;
}

function normalizeLocale(locale?: string | null): 'ca' | 'es' | 'en' {
  const raw = String(locale || 'ca').trim().toLowerCase();
  if (raw.startsWith('es')) return 'es';
  if (raw.startsWith('en')) return 'en';
  return 'ca';
}

function resolvePackName(
  translations: Array<{ locale: string; name: string }> | undefined,
  locale: 'ca' | 'es' | 'en'
): string {
  if (!translations || translations.length === 0) return locale === 'en' ? 'Your pack' : locale === 'es' ? 'Tu pack' : 'El teu pack';
  return (
    translations.find((t) => t.locale.toLowerCase() === locale)?.name ||
    translations.find((t) => t.locale.toLowerCase().startsWith(locale))?.name ||
    translations.find((t) => t.locale === 'ca')?.name ||
    translations.find((t) => t.locale === 'es')?.name ||
    translations.find((t) => t.locale === 'en')?.name ||
    translations[0]?.name ||
    (locale === 'en' ? 'Your pack' : locale === 'es' ? 'Tu pack' : 'El teu pack')
  );
}

async function saveCronStatus(payload: {
  status: 'ok' | 'error';
  summary?: Record<string, number>;
  message?: string;
  timestamp: string;
}) {
  const { status, summary, message, timestamp } = payload;
  await prisma.setting.upsert({
    where: { key: 'emails.cron.lastRun' },
    update: { value: timestamp, type: 'STRING', category: 'config' },
    create: { key: 'emails.cron.lastRun', value: timestamp, type: 'STRING', category: 'config' },
  });
  await prisma.setting.upsert({
    where: { key: 'emails.cron.lastStatus' },
    update: { value: status, type: 'STRING', category: 'config' },
    create: { key: 'emails.cron.lastStatus', value: status, type: 'STRING', category: 'config' },
  });
  if (summary) {
    await prisma.setting.upsert({
      where: { key: 'emails.cron.lastSummary' },
      update: { value: JSON.stringify(summary), type: 'JSON', category: 'config' },
      create: { key: 'emails.cron.lastSummary', value: JSON.stringify(summary), type: 'JSON', category: 'config' },
    });
  }
  if (message) {
    await prisma.setting.upsert({
      where: { key: 'emails.cron.lastMessage' },
      update: { value: message, type: 'STRING', category: 'config' },
      create: { key: 'emails.cron.lastMessage', value: message, type: 'STRING', category: 'config' },
    });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  // This endpoint is protected by admin auth middleware
  const results: ProcessedResult[] = [];
  const now = new Date();

  try {
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

    const completedBookings = await prisma.booking.findMany({
      where: {
        status: 'COMPLETED',
        eventDate: {
          gte: twoDaysAgo,
          lte: oneDayAgo,
        },
        postEventEmailSent: false,
      },
      include: {
        lead: true,
        pack: {
          include: { translations: true },
        },
      },
      take: 50,
    });

    for (const booking of completedBookings) {
      const email = booking.clientEmail;
      const name = booking.clientName;
      const locale = normalizeLocale(booking.lead?.preferredLocale || 'ca');

      if (!email || email.includes('@leads.orbitaevents.local')) {
        results.push({
          bookingId: booking.id,
          clientName: name,
          email: email || 'N/A',
          status: 'skipped',
          reason: 'No valid email',
        });
        continue;
      }

      try {
        const reviewToken = Buffer.from(`${booking.id}:${Date.now()}`).toString('base64url');
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://orbitaevents.com';
        const reviewUrl = `${baseUrl}/${locale}/valoracio?token=${reviewToken}&ref=${booking.reference}`;

        const packName = resolvePackName(booking.pack?.translations, locale);

        const emailHtml = generatePostEventEmail({
          name,
          packName,
          eventDate: booking.eventDate,
          reviewUrl,
          googleReviewUrl: GOOGLE_REVIEW_URL,
          locale,
        });

        await sendEmail({
          to: email,
          subject: getSubjectLine(locale, name),
          html: emailHtml,
        });

        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            postEventEmailSent: true,
            postEventEmailSentAt: now,
            reviewToken,
          },
        });

        if (booking.lead?.customerId) {
          await prisma.customerActivity.create({
            data: {
              customerId: booking.lead.customerId,
              action: 'POST_EVENT_EMAIL_SENT',
              details: {
                bookingId: booking.id,
                bookingRef: booking.reference,
              },
            },
          });
        }

        results.push({
          bookingId: booking.id,
          clientName: name,
          email,
          status: 'sent',
        });

      } catch (emailError) {
        // SECURITY: No registrar email del client per complir GDPR
        log.error('Error enviant email programat', emailError, {
          context: { bookingId: booking.id }
        });
        results.push({
          bookingId: booking.id,
          clientName: name,
          email,
          status: 'error',
          reason: emailError instanceof Error ? emailError.message : 'Unknown error',
        });
      }
    }

    const summary = {
      processed: results.length,
      sent: results.filter(r => r.status === 'sent').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      errors: results.filter(r => r.status === 'error').length,
    };

    await saveCronStatus({
      status: 'ok',
      summary,
      timestamp: now.toISOString(),
    });

    return NextResponse.json({
      ok: true,
      timestamp: now.toISOString(),
      summary,
      results,
    });

  } catch (error) {
    log.error('Error en cron post-event:', error);
    await saveCronStatus({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: now.toISOString(),
    });
    return NextResponse.json(
      {
        error: 'Error processant esdeveniments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function getSubjectLine(locale: 'ca' | 'es' | 'en', name: string): string {
  const firstName = name.split(' ')[0];
  const subjects: Record<'ca' | 'es' | 'en', string> = {
    es: `🎉 ${firstName}, ¡gracias por confiar en nosotros!`,
    ca: `🎉 ${firstName}, gràcies per confiar en nosaltres!`,
    en: `🎉 ${firstName}, thank you for trusting us!`,
  };
  return subjects[locale];
}

function generatePostEventEmail(params: {
  name: string;
  packName: string;
  eventDate: Date;
  reviewUrl: string;
  googleReviewUrl: string;
  locale: 'ca' | 'es' | 'en';
}): string {
  const { name, packName, eventDate, reviewUrl, googleReviewUrl, locale } = params;

  const firstName = name.split(' ')[0];
  const formattedDate = eventDate.toLocaleDateString(
    toIntlLocale(locale),
    {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    }
  );

  const texts = {
    es: {
      title: '¡Gracias por tu confianza!',
      greeting: `Hola ${firstName},`,
      intro: `Esperamos que tu evento del <strong>${formattedDate}</strong> con el <strong>${packName}</strong> haya sido increíble.`,
      question: '¿Nos dejas tu opinión?',
      explanation: 'Tu opinión nos ayuda a mejorar y, además, <strong>tenemos un regalo para ti</strong>.',
      reward: 'Al dejarnos tu valoración, recibirás un <strong>código de descuento exclusivo</strong>.',
      cta: 'Dejar mi valoración',
      googleText: 'También puedes dejarnos una reseña en Google:',
      googleCta: 'Reseña en Google',
      footer: 'Gracias por formar parte de la familia Òrbita Events',
    },
    ca: {
      title: 'Gràcies per la teva confiança!',
      greeting: `Hola ${firstName},`,
      intro: `Esperem que el teu esdeveniment del <strong>${formattedDate}</strong> amb el <strong>${packName}</strong> hagi estat increïble.`,
      question: 'Ens deixes la teva opinió?',
      explanation: 'La teva opinió ens ajuda a millorar i, a més, <strong>tenim un regal per a tu</strong>.',
      reward: 'En deixar-nos la teva valoració rebràs un <strong>codi de descompte exclusiu</strong>.',
      cta: 'Deixar valoració',
      googleText: 'També pots deixar-nos una ressenya a Google:',
      googleCta: 'Ressenya a Google',
      footer: 'Gràcies per formar part de la família Òrbita Events',
    },
    en: {
      title: 'Thank you for your trust!',
      greeting: `Hi ${firstName},`,
      intro: `We hope your event on <strong>${formattedDate}</strong> with the <strong>${packName}</strong> was amazing.`,
      question: 'Would you leave us a review?',
      explanation: 'Your feedback helps us improve and <strong>we have a gift for you</strong>.',
      reward: "When you leave your review, you'll receive an <strong>exclusive discount code</strong>.",
      cta: 'Leave review',
      googleText: 'You can also leave us a Google review:',
      googleCta: 'Google Review',
      footer: 'Thank you for being part of the Òrbita Events family',
    },
  };

  const t = texts[locale as keyof typeof texts] || texts.es;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d1f00 50%, #3d2800 100%); padding: 50px 30px; text-align: center;">
      <h1 style="color: #FFB800; margin: 0; font-size: 32px; font-weight: 300;">${t.title}</h1>
      <p style="color: rgba(255,255,255,0.5); margin: 16px 0 0 0; font-size: 14px; letter-spacing: 2px;">ÒRBITA EVENTS</p>
    </div>
    <div style="padding: 40px 30px; color: #e5e5e5;">
      <p style="font-size: 18px; line-height: 1.6; margin: 0 0 20px 0;">${t.greeting}</p>
      <p style="font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;">${t.intro}</p>
      <div style="background: rgba(255,184,0,0.1); border: 2px solid rgba(255,184,0,0.3); border-radius: 16px; padding: 30px; margin: 30px 0; text-align: center;">
        <h2 style="color: #FFB800; margin: 0 0 16px 0; font-size: 24px;">${t.question}</h2>
        <p style="margin: 0 0 20px 0; font-size: 15px; color: rgba(255,255,255,0.8);">${t.explanation}</p>
        <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.7);">${t.reward}</p>
      </div>
      <div style="text-align: center; margin: 40px 0;">
        <a href="${reviewUrl}" style="background: linear-gradient(135deg, #FFB800, #CC9600); color: #000; padding: 20px 50px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; display: inline-block; box-shadow: 0 4px 20px rgba(255,184,0,0.3);">⭐ ${t.cta}</a>
      </div>
      <div style="background: rgba(66,133,244,0.1); border-radius: 12px; padding: 20px; text-align: center; margin-top: 20px;">
        <p style="margin: 0 0 12px 0; font-size: 14px; color: rgba(255,255,255,0.7);">${t.googleText}</p>
        <a href="${googleReviewUrl}" style="display: inline-block; background: #4285f4; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">⭐ ${t.googleCta}</a>
      </div>
    </div>
    <div style="padding: 30px; background: #0a0a0a; text-align: center;">
      <p style="margin: 0 0 12px 0; font-size: 14px; color: rgba(255,255,255,0.6);">${t.footer}</p>
      <p style="margin: 0; font-size: 12px; color: #666;">© ${new Date().getFullYear()} Òrbita Events · ${SITE_CONFIG.business.phone} · ${SITE_CONFIG.business.email}</p>
    </div>
  </div>
</body>
</html>
  `;
}
