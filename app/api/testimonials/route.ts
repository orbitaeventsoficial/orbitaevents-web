/**
 * API ROUTE: Testimonials
 * ========================
 * POST - Crear nou testimoni des del formulari públic
 * GET - Obtenir testimonis aprovats
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createTestimonial,
  getApprovedTestimonials,
  getFeaturedTestimonials,
} from '@/lib/services/testimonialService';

export const dynamic = 'force-dynamic';

// Esquema de validació actualitzat per nou esquema amb NPS i vídeo
const createTestimonialSchema = z.object({
  // Dades client
  email: z.string().email('Email no vàlid'),
  name: z.string().min(2, 'Nom mínim 2 caràcters').max(100, 'Nom màxim 100 caràcters').optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  instagram: z.string().optional(),

  // Opinió
  title: z.string().max(200, 'Títol màxim 200 caràcters').optional(),
  comment: z
    .string()
    .min(10, 'Comentari mínim 10 caràcters')
    .max(1000, 'Comentari màxim 1000 caràcters'),
  rating: z.number().min(1).max(5),
  eventType: z
    .enum([
      'boda',
      'cumpleaños',
      'corporativo',
      'comunion',
      'bautizo',
      'fiesta',
      'festival',
      'otro',
    ])
    .optional(),
  eventDate: z.string().optional(),

  // Media
  photoUrl: z.string().url().optional().or(z.literal('')),
  videoUrl: z.string().url().optional().or(z.literal('')),

  // NPS i recompenses
  npsScore: z.number().min(0).max(10).optional(),
  allowGoogleShare: z.boolean().optional().default(false),

  // Verificació booking
  verifiedBookingId: z.string().optional(),

  // Consentiments
  consentPhotoPublication: z.boolean().optional().default(false),
  consentDataProcessing: z.boolean().refine(val => val === true, "Has d'acceptar els termes"),
  consentMarketing: z.boolean().optional(),
});

/**
 * POST - Crear nou testimoni
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar dades
    const validation = createTestimonialSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dades invàlides', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Crear testimoni
    const result = await createTestimonial({
      // Dades client
      email: data.email,
      name: data.name,
      phone: data.phone,
      city: data.city,
      instagram: data.instagram,

      // Opinió
      title: data.title,
      comment: data.comment,
      rating: data.rating,
      eventType: data.eventType,
      eventDate: data.eventDate,

      // Media
      photoUrl: data.photoUrl || undefined,
      videoUrl: data.videoUrl || undefined,

      // NPS i recompenses
      npsScore: data.npsScore,
      allowGoogleShare: data.allowGoogleShare,

      // Verificació booking
      verifiedBookingId: data.verifiedBookingId,

      // Consentiments
      consentPhotoPublication: data.consentPhotoPublication,
      consentDataProcessing: data.consentDataProcessing,
      consentMarketing: data.consentMarketing,
    });

    // Calcular descompte total per la resposta
    let discountPercent = 5; // Base
    if (data.photoUrl) discountPercent += 5;
    if (data.videoUrl) discountPercent += 10;
    if (data.allowGoogleShare) discountPercent += 5;

    return NextResponse.json({
      success: true,
      data: {
        testimonialId: result.testimonial.id,
        discountCode: result.discountCode,
        discountPercent,
        message:
          'Gràcies pel teu testimoni! Quan sigui aprovat, rebràs el teu codi de descompte per email.',
      },
    });
  } catch (error) {
    console.error('Error creant testimoni:', error);
    const message = error instanceof Error ? error.message : 'Error creant testimoni';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET - Obtenir testimonis
 * Query params:
 * - featured: boolean - només testimonis destacats
 * - limit: number - límit de resultats
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');

    let testimonials;

    if (featured) {
      testimonials = await getFeaturedTestimonials(limit);
    } else {
      testimonials = await getApprovedTestimonials(limit);
    }

    // Transformar per a la resposta pública
    const publicTestimonials = testimonials.map(t => {
      const customerName = t.customer?.name || t.submitted_name || 'Client verificat';
      const showName = t.consent_photo_publication || !!t.submitted_name;

      return {
        id: t.id,
        title: t.title,
        comment: t.comment,
        rating: t.rating,
        eventType: t.submitted_event_type,
        eventDate: t.submitted_event_date,
        customerName: showName ? customerName : 'Client verificat',
        customerCity: t.customer?.city || t.submitted_city || null,
        customerInitials: showName && customerName
          ? customerName
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()
          : 'CV',
        photoUrl: t.consent_photo_publication ? t.photo_url : null,
        createdAt: t.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: publicTestimonials,
    });
  } catch (error) {
    console.error('Error obtenint testimonis:', error);
    const message = error instanceof Error ? error.message : 'Error obtenint testimonis';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
