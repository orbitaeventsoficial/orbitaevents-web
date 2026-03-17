// app/api/testimonials/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { z } from 'zod';
import { listApprovedPublicTestimonials, submitPublicTestimonial } from '@/lib/services/publicTestimonialService';

type Locale = 'ca' | 'es' | 'en';
const MESSAGES: Record<Locale, Record<string, string>> = {
  ca: {
    success: 'Valoració enviada correctament',
    invalid: 'Dades no vàlides',
    processing: 'Error processant la valoració',
    fetching: 'Error carregant valoracions',
    verifiedCustomer: 'Client verificat',
  },
  es: {
    success: 'Valoración enviada correctamente',
    invalid: 'Datos inválidos',
    processing: 'Error procesando la valoración',
    fetching: 'Error cargando valoraciones',
    verifiedCustomer: 'Cliente verificado',
  },
  en: {
    success: 'Testimonial submitted successfully',
    invalid: 'Invalid data',
    processing: 'Error processing testimonial',
    fetching: 'Error fetching testimonials',
    verifiedCustomer: 'Verified customer',
  },
};

function resolveLocale(request: NextRequest): Locale {
  const lang = request.headers.get('accept-language')?.toLowerCase() || '';
  if (lang.includes('ca')) return 'ca';
  if (lang.includes('en')) return 'en';
  return 'es';
}

const testimonialSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
  videoUrl: z.string().url().optional().or(z.literal('')),
  allowGoogleShare: z.boolean().default(false),
  consentPhotoPublication: z.boolean().default(false),
  token: z.string().optional(),
  bookingRef: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const t = MESSAGES[resolveLocale(request)];
  try {
    const body = await request.json();
    const data = testimonialSchema.parse(body);

    const result = await submitPublicTestimonial({
      rating: data.rating,
      comment: data.comment,
      name: data.name,
      email: data.email,
      phone: data.phone,
      photoUrl: data.photoUrl || undefined,
      videoUrl: data.videoUrl || undefined,
      allowGoogleShare: data.allowGoogleShare,
      consentPhotoPublication: data.consentPhotoPublication,
    });

    return NextResponse.json({
      success: true,
      discountCode: result.discountCode,
      discountPercent: result.discountPercent,
      message: t.success,
    });
  } catch (error) {
    log.error('Error submitting testimonial', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: t.invalid, details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: t.processing },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const t = MESSAGES[resolveLocale(request)];
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const locale = resolveLocale(request);

    const result = await listApprovedPublicTestimonials(limit, offset, locale);
    return NextResponse.json(result);
  } catch (error) {
    log.error('Error fetching testimonials', error);
    return NextResponse.json(
      { error: t.fetching },
      { status: 500 }
    );
  }
}
