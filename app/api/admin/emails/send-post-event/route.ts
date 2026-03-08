// app/api/admin/emails/send-post-event/route.ts
// Enviament manual d'email post-event des del panell admin
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { SITE_CONFIG } from '@/app/config/site-config';
import { requireAuth } from '@/lib/auth';
import {
  generatePostEventEmail,
  getPostEventSubject,
  normalizeLocale,
  resolvePackName,
} from '@/lib/services/postEventEmailService';

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const formData = await req.formData();
    const bookingId = formData.get('bookingId') as string;

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId requerit' }, { status: 400 });
    }

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

    if (booking.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: `La reserva no està completada (estat: ${booking.status})` },
        { status: 422 }
      );
    }

    if (booking.postEventEmailSent) {
      return NextResponse.json(
        { error: 'Ja s\'ha enviat l\'email post-event per aquesta reserva' },
        { status: 409 }
      );
    }

    const email = booking.clientEmail;
    const name = booking.clientName;
    const locale = normalizeLocale(booking.lead?.preferredLocale || booking.preferredLocale);

    if (!email || email.includes('@leads.orbitaevents.local')) {
      return NextResponse.json(
        { error: 'La reserva no té un email vàlid' },
        { status: 422 }
      );
    }

    const reviewToken = Buffer.from(`${booking.id}:${Date.now()}`).toString('base64url');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://orbitaevents.com';
    const reviewUrl = `${baseUrl}/${locale}/valoracio?token=${reviewToken}&ref=${booking.reference}`;
    const packName = resolvePackName(booking.pack?.translations, locale);

    const emailHtml = generatePostEventEmail({
      name, packName, eventDate: booking.eventDate, reviewUrl,
      googleReviewUrl: SITE_CONFIG.reviews.googleReviewUrl, locale,
    });

    await sendEmail({ to: email, subject: getPostEventSubject(locale, name), html: emailHtml });

    await prisma.booking.update({
      where: { id: bookingId },
      data: { postEventEmailSent: true, postEventEmailSentAt: new Date(), reviewToken },
    });

    await prisma.adminLog.create({
      data: {
        action: 'SEND_POST_EVENT_EMAIL',
        entity: 'booking',
        entityId: bookingId,
        details: { email, reference: booking.reference },
      },
    });

    return NextResponse.json({ ok: true, email, reference: booking.reference });
  } catch (error) {
    log.error('Error enviant email post-event:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error enviant email' },
      { status: 500 }
    );
  }
}
