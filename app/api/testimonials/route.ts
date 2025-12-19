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
      npsScore,
      title,
      comment,
      eventType,
      eventDate,
      photoUrl,
      videoUrl,
      allowGoogleShare,
      consentDataProcessing,
      consentMarketing,
      consentPhotoPublication,
      totalDiscount,
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
      // Dades client
      name,
      email,
      phone: phone || undefined,
      city: city || undefined,
      instagram: instagram || undefined,
      // Testimoni
      rating,
      comment,
      title: title || undefined,
      eventType: eventType || undefined,
      eventDate: eventDate || undefined,
      // Media
      photoUrl: photoUrl || undefined,
      videoUrl: videoUrl || undefined,
      // NPS i recompenses
      npsScore: npsScore || undefined,
      allowGoogleShare: allowGoogleShare || false,
      // Consentiments
      consentDataProcessing,
      consentMarketing: consentMarketing || false,
      consentPhotoPublication: consentPhotoPublication || false,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Error creant el testimoni' },
        { status: 500 }
      );
    }

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
    return NextResponse.json(
      { error: 'Error processant la sol·licitud' },
      { status: 500 }
    );
  }
}
