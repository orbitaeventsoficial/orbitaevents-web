// app/api/cron/post-event/route.ts
// CRON JOB: Envia emails post-event automàtics
// Executar diàriament via Vercel Cron o similar
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { SITE_CONFIG } from '@/app/config/site-config';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Google Reviews URL - Òrbita Events
const GOOGLE_REVIEW_URL = 'https://g.page/r/CXcgbvANsXSzEBI/review';

// Verificar autorització (Vercel Cron envia CRON_SECRET)
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // SECURITY: Sempre requerir secret, fins i tot en dev
  if (!cronSecret) {
    log.error('CRON_SECRET no configurat - cron job no pot executar-se');
    return false;
  }

  if (!authHeader) {
    log.warn('Intent d\'accés a cron job sense authorization header');
    return false;
  }

  const isValid = authHeader === `Bearer ${cronSecret}`;
  if (!isValid) {
    log.warn('Intent d\'accés a cron job amb credencials invàlides', {
      context: { ip: request.headers.get('x-forwarded-for') }
    });
  }

  return isValid;
}

interface ProcessedResult {
  bookingId: string;
  clientName: string;
  email: string;
  status: 'sent' | 'skipped' | 'error';
  reason?: string;
}

export async function GET(request: NextRequest) {
  // Verificar autorització
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: ProcessedResult[] = [];
  const now = new Date();

  try {
    // ═══════════════════════════════════════════════════════════════════
    // 1. BUSCAR EVENTS QUE VAN PASSAR FA 1-2 DIES (finestra òptima)
    // ═══════════════════════════════════════════════════════════════════
    
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

    const completedBookings = await prisma.booking.findMany({
      where: {
        status: 'COMPLETED',
        eventDate: {
          gte: twoDaysAgo,
          lte: oneDayAgo,
        },
        // No enviar si ja s'ha enviat email post-event
        postEventEmailSent: false,
      },
      include: {
        lead: true,
        pack: {
          include: { translations: true },
        },
      },
      take: 50, // Processar en lots
    });

    // ═══════════════════════════════════════════════════════════════════
    // 2. ENVIAR EMAIL D'AGRAÏMENT + SOL·LICITUD DE VALORACIÓ
    // ═══════════════════════════════════════════════════════════════════

    for (const booking of completedBookings) {
      const email = booking.clientEmail;
      const name = booking.clientName;
      const locale = booking.lead?.preferredLocale || 'es';

      // Skip si no tenim email vàlid
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
        // Generar token únic per a la valoració
        const reviewToken = Buffer.from(`${booking.id}:${Date.now()}`).toString('base64url');

        // URL del formulari de valoració
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://orbitaevents.com';
        const reviewUrl = `${baseUrl}/${locale}/valoracio?token=${reviewToken}&ref=${booking.reference}`;

        // Nom del pack
        const packName = booking.pack?.translations?.find(t => t.locale === locale)?.name 
          || booking.pack?.translations?.[0]?.name 
          || 'El teu pack';

        // Email HTML
        const emailHtml = generatePostEventEmail({
          name,
          packName,
          eventDate: booking.eventDate,
          reviewUrl,
          googleReviewUrl: GOOGLE_REVIEW_URL,
          locale,
        });

        // Enviar email
        await sendEmail({
          to: email,
          subject: getSubjectLine(locale, name),
          html: emailHtml,
        });

        // Marcar com enviat
        await prisma.booking.update({
          where: { id: booking.id },
          data: { 
            postEventEmailSent: true,
            postEventEmailSentAt: now,
          },
        });

        // Log activitat si hi ha customer associat
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
        log.error('Error enviant email post-event', emailError, {
          context: { bookingId: booking.id, bookingRef: booking.reference }
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

    // ═══════════════════════════════════════════════════════════════════
    // 3. RESPOSTA AMB RESUM
    // ═══════════════════════════════════════════════════════════════════

    const summary = {
      processed: results.length,
      sent: results.filter(r => r.status === 'sent').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      errors: results.filter(r => r.status === 'error').length,
    };

    return NextResponse.json({
      ok: true,
      timestamp: now.toISOString(),
      summary,
      results,
    });

  } catch (error) {
    log.error('Error en cron post-event:', error);
    return NextResponse.json(
      { 
        error: 'Error processant events', 
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getSubjectLine(locale: string, name: string): string {
  const subjects: Record<string, string> = {
    es: `🎉 ${name}, ¡gracias por confiar en nosotros! ¿Qué tal fue tu evento?`,
    ca: `🎉 ${name}, gràcies per confiar en nosaltres! Com va anar el teu event?`,
    en: `🎉 ${name}, thank you for trusting us! How was your event?`,
  };
  return subjects[locale] || subjects.es;
}

function generatePostEventEmail(params: {
  name: string;
  packName: string;
  eventDate: Date;
  reviewUrl: string;
  googleReviewUrl: string;
  locale: string;
}): string {
  const { name, packName, eventDate, reviewUrl, googleReviewUrl, locale } = params;
  
  const firstName = name.split(' ')[0];
  const formattedDate = eventDate.toLocaleDateString(locale === 'ca' ? 'ca-ES' : 'es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // Textos segons idioma
  const texts = {
    es: {
      title: '¡Gracias por tu confianza!',
      greeting: `Hola ${firstName},`,
      intro: `Esperamos que tu evento del <strong>${formattedDate}</strong> con el <strong>${packName}</strong> haya sido increíble y que tú y tus invitados hayáis disfrutado al máximo.`,
      question: '¿Nos dejas tu opinión?',
      explanation: 'Tu feedback nos ayuda a mejorar y además... <strong>¡tenemos un regalo para ti!</strong>',
      reward: 'Al dejarnos tu valoración recibirás un <strong>código de descuento exclusivo</strong> para tu próximo evento o para compartir con amigos y familiares.',
      cta: 'Dejar mi valoración',
      bonus: '¡Cuanto más compartas, mayor descuento!',
      bonusDetails: '📸 +5% extra si compartes foto · 🎬 +10% extra si compartes vídeo',
      googleText: 'También puedes dejarnos una reseña en Google:',
      googleCta: 'Reseña en Google',
      footer: 'Gracias por formar parte de la familia Òrbita Events',
    },
    ca: {
      title: 'Gràcies per la teva confiança!',
      greeting: `Hola ${firstName},`,
      intro: `Esperem que el teu event del <strong>${formattedDate}</strong> amb el <strong>${packName}</strong> hagi estat increïble i que tu i els teus convidats hagueu gaudit al màxim.`,
      question: 'Ens deixes la teva opinió?',
      explanation: 'El teu feedback ens ajuda a millorar i a més... <strong>tenim un regal per a tu!</strong>',
      reward: 'En deixar-nos la teva valoració rebràs un <strong>codi de descompte exclusiu</strong> pel teu pròxim event o per compartir amb amics i familiars.',
      cta: 'Deixar la meva valoració',
      bonus: 'Com més comparteixis, més descompte!',
      bonusDetails: '📸 +5% extra si comparteixes foto · 🎬 +10% extra si comparteixes vídeo',
      googleText: 'També pots deixar-nos una ressenya a Google:',
      googleCta: 'Ressenya a Google',
      footer: 'Gràcies per formar part de la família Òrbita Events',
    },
    en: {
      title: 'Thank you for your trust!',
      greeting: `Hi ${firstName},`,
      intro: `We hope your event on <strong>${formattedDate}</strong> with the <strong>${packName}</strong> was amazing and that you and your guests had a great time.`,
      question: 'Would you leave us a review?',
      explanation: 'Your feedback helps us improve and... <strong>we have a gift for you!</strong>',
      reward: 'When you leave your review, you\'ll receive an <strong>exclusive discount code</strong> for your next event or to share with friends and family.',
      cta: 'Leave my review',
      bonus: 'The more you share, the bigger the discount!',
      bonusDetails: '📸 +5% extra for photo · 🎬 +10% extra for video',
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
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d1f00 50%, #3d2800 100%); padding: 50px 30px; text-align: center;">
      <h1 style="color: #FFB800; margin: 0; font-size: 32px; font-weight: 300;">
        ${t.title}
      </h1>
      <p style="color: rgba(255,255,255,0.5); margin: 16px 0 0 0; font-size: 14px; letter-spacing: 2px;">
        ÒRBITA EVENTS
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px; color: #e5e5e5;">
      <p style="font-size: 18px; line-height: 1.6; margin: 0 0 20px 0;">
        ${t.greeting}
      </p>

      <p style="font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;">
        ${t.intro}
      </p>

      <!-- Question Box -->
      <div style="background: rgba(255,184,0,0.1); border: 2px solid rgba(255,184,0,0.3); border-radius: 16px; padding: 30px; margin: 30px 0; text-align: center;">
        <h2 style="color: #FFB800; margin: 0 0 16px 0; font-size: 24px;">
          ${t.question}
        </h2>
        <p style="margin: 0 0 20px 0; font-size: 15px; color: rgba(255,255,255,0.8);">
          ${t.explanation}
        </p>
        <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.7);">
          ${t.reward}
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${reviewUrl}"
           style="background: linear-gradient(135deg, #FFB800, #CC9600);
                  color: #000;
                  padding: 20px 50px;
                  text-decoration: none;
                  border-radius: 50px;
                  font-weight: bold;
                  font-size: 18px;
                  display: inline-block;
                  box-shadow: 0 4px 20px rgba(255,184,0,0.3);">
          ⭐ ${t.cta}
        </a>
      </div>

      <!-- Bonus info -->
      <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 16px; color: #FFB800; font-weight: bold;">
          ${t.bonus}
        </p>
        <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.6);">
          ${t.bonusDetails}
        </p>
      </div>

      <!-- Google Review -->
      <div style="background: rgba(66,133,244,0.1); border-radius: 12px; padding: 20px; text-align: center; margin-top: 20px;">
        <p style="margin: 0 0 12px 0; font-size: 14px; color: rgba(255,255,255,0.7);">
          ${t.googleText}
        </p>
        <a href="${googleReviewUrl}"
           style="display: inline-block;
                  background: #4285f4;
                  color: #fff;
                  padding: 12px 24px;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: 500;
                  font-size: 14px;">
          ⭐ ${t.googleCta}
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding: 30px; background: #0a0a0a; text-align: center;">
      <p style="margin: 0 0 12px 0; font-size: 14px; color: rgba(255,255,255,0.6);">
        ${t.footer}
      </p>
      <p style="margin: 0; font-size: 12px; color: #666;">
        © ${new Date().getFullYear()} Òrbita Events · ${SITE_CONFIG.business.phone} · ${SITE_CONFIG.business.email}
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
