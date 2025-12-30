/**
 * API ROUTE: Public Testimonials
 * ==============================
 * POST - Enviar una nova opinió (des del formulari públic o post-event)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTestimonial } from '@/lib/services/testimonialService';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * POST - Crear nou testimoni
 * Supports both public form and post-event review with token validation
 */
export async function POST(request: NextRequest) {
  // Rate limit: 5 submissions per hour
  const rateLimitResult = checkRateLimit(request, { ...RATE_LIMITS.testimonials, limit: 5 });
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await request.json();

    const {
      name,
      email,
      phone,
      city,
      instagram,
      rating,
      comment,
      eventType,
      eventDate,
      photoUrl,
      videoUrl,
      allowGoogleShare,
      consentDataProcessing,
      consentPhotoPublication,
      // Post-event review fields
      token,
      bookingRef,
    } = body;

    // If token provided, validate against booking
    if (token && bookingRef) {
      const booking = await prisma.booking.findFirst({
        where: {
          reference: bookingRef,
          reviewToken: token,
          reviewSubmittedAt: null, // Not already submitted
        },
      });

      if (!booking) {
        return NextResponse.json(
          { error: 'Token de valoració invàlid o ja utilitzat' },
          { status: 400 }
        );
      }

      // Mark review as submitted
      await prisma.booking.update({
        where: { id: booking.id },
        data: { reviewSubmittedAt: new Date() },
      });
    }

    // Validacions bàsiques
    if (!name || !email || !rating || !comment) {
      return NextResponse.json(
        { error: 'Falten camps obligatoris (nom, email, valoració, comentari)' },
        { status: 400 }
      );
    }

    // Skip consent check for post-event reviews (implicit consent)
    if (!token && !consentDataProcessing) {
      return NextResponse.json(
        { error: 'Cal acceptar el consentiment de dades' },
        { status: 400 }
      );
    }

    // Crear testimoni
    const result = await createTestimonial({
      name,
      email,
      phone,
      city,
      instagram,
      rating,
      comment,
      eventType,
      eventDate,
      photoUrl,
      videoUrl,
      allowGoogleShare,
      consentPhotoPublication,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result.testimonial.id,
        discountCode: result.discountCode,
        message: 'Gràcies per la teva opinió! La revisarem aviat.',
      },
    });
  } catch (error) {
    console.error('Error creant testimoni:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconegut';
    return NextResponse.json(
      { error: 'Error processant la sol·licitud', details: errorMessage },
      { status: 500 }
    );
  }
}
