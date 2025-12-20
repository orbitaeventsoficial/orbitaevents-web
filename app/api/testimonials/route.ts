/**
 * API ROUTE: Public Testimonials
 * ==============================
 * POST - Enviar una nova opinió (des del formulari públic)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTestimonial } from '@/lib/services/testimonialService';

export const dynamic = 'force-dynamic';

/**
 * POST - Crear nou testimoni
 */
export async function POST(request: NextRequest) {
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
    } = body;

    // Validacions bàsiques
    if (!name || !email || !rating || !comment) {
      return NextResponse.json(
        { error: 'Falten camps obligatoris (nom, email, valoració, comentari)' },
        { status: 400 }
      );
    }

    if (!consentDataProcessing) {
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
