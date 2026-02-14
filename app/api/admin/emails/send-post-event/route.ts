// app/api/admin/emails/send-post-event/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { SITE_CONFIG } from '@/app/config/site-config';
import { requireAuth } from '@/lib/auth';

// Google Reviews URL
const GOOGLE_REVIEW_URL = 'https://g.page/r/CXcgbvANsXSzEBI/review';

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const formData = await req.formData();
    const bookingId = formData.get('bookingId') as string;

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId requerit' }, { status: 400 });
    }

    // Obtenir booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        lead: true,
        pack: { include: { translations: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Reserva no trobada' }, { status: 404 });
    }

    // Validate booking is completed
    if (booking.status !== 'COMPLETED') {
      return NextResponse.redirect(
        new URL(`/admin/emails?error=booking_not_completed&status=${booking.status}`, req.url),
        303
      );
    }

    if (booking.postEventEmailSent) {
      // Redirect back amb missatge
      return NextResponse.redirect(
        new URL('/admin/emails?message=already_sent', req.url),
        303
      );
    }

    const email = booking.clientEmail;
    const name = booking.clientName;
    const locale = booking.lead?.preferredLocale || booking.preferredLocale || 'ca';

    // Skip si no hi ha email vàlid
    if (!email || email.includes('@leads.orbitaevents.local')) {
      return NextResponse.redirect(
        new URL('/admin/emails?error=no_email', req.url),
        303
      );
    }

    // Generar token
    const reviewToken = Buffer.from(`${booking.id}:${Date.now()}`).toString('base64url');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://orbitaevents.com';
    const reviewUrl = `${baseUrl}/${locale}/valoracio?token=${reviewToken}&ref=${booking.reference}`;

    // Nom del pack
    const packName = booking.pack?.translations?.find(t => t.locale === locale)?.name 
      || booking.pack?.translations?.[0]?.name 
      || 'El teu pack';

    // Enviar email
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

    // Marcar com enviat
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        postEventEmailSent: true,
        postEventEmailSentAt: new Date(),
        reviewToken,
      },
    });

    // Log
    await prisma.adminLog.create({
      data: {
        action: 'SEND_POST_EVENT_EMAIL',
        entity: 'booking',
        entityId: bookingId,
        details: { email, reference: booking.reference },
      },
    });

    // Redirect amb èxit
    return NextResponse.redirect(
      new URL('/admin/emails?success=email_sent', req.url),
      303
    );
  } catch (error) {
    log.error('Error enviant email post-event:', error);
    return NextResponse.redirect(
      new URL(`/admin/emails?error=${encodeURIComponent(error instanceof Error ? error.message : 'Error')}`, req.url),
      303
    );
  }
}

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

  const texts = {
    es: {
      title: '¡Gracias por tu confianza!',
      greeting: `Hola ${firstName},`,
      intro: `Esperamos que tu evento del <strong>${formattedDate}</strong> con el <strong>${packName}</strong> haya sido increíble.`,
      question: '¿Nos dejas tu opinión?',
      explanation: 'Tu feedback nos ayuda a mejorar y además... <strong>¡tenemos un regalo para ti!</strong>',
      reward: 'Al dejarnos tu valoración recibirás un <strong>código de descuento exclusivo</strong> para tu próximo evento.',
      cta: 'Dejar mi valoración y conseguir descuento',
      googleText: 'También puedes dejarnos una reseña en Google:',
      googleCta: 'Reseña en Google',
      footer: 'Gracias por formar parte de la familia Òrbita Events',
    },
    ca: {
      title: 'Gràcies per la teva confiança!',
      greeting: `Hola ${firstName},`,
      intro: `Esperem que el teu event del <strong>${formattedDate}</strong> amb el <strong>${packName}</strong> hagi estat increïble.`,
      question: 'Ens deixes la teva opinió?',
      explanation: 'El teu feedback ens ajuda a millorar i a més... <strong>tenim un regal per a tu!</strong>',
      reward: 'En deixar-nos la teva valoració rebràs un <strong>codi de descompte exclusiu</strong> pel teu pròxim event.',
      cta: 'Deixar valoració i aconseguir descompte',
      googleText: 'També pots deixar-nos una ressenya a Google:',
      googleCta: 'Ressenya a Google',
      footer: 'Gràcies per formar part de la família Òrbita Events',
    },
    en: {
      title: 'Thank you for your trust!',
      greeting: `Hi ${firstName},`,
      intro: `We hope your event on <strong>${formattedDate}</strong> with the <strong>${packName}</strong> was amazing.`,
      question: 'Would you leave us a review?',
      explanation: 'Your feedback helps us improve and... <strong>we have a gift for you!</strong>',
      reward: 'When you leave your review, you\'ll receive an <strong>exclusive discount code</strong> for your next event.',
      cta: 'Leave review and get discount',
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
                  padding: 20px 40px;
                  text-decoration: none;
                  border-radius: 50px;
                  font-weight: bold;
                  font-size: 16px;
                  display: inline-block;
                  box-shadow: 0 4px 20px rgba(255,184,0,0.3);">
          ⭐ ${t.cta}
        </a>
      </div>

      <!-- Google Review -->
      <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center; margin-top: 30px;">
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
