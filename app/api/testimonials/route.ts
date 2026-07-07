// app/api/testimonials/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PUBLIC_TESTIMONIAL_API_MESSAGES, type PublicTestimonialApiLocale } from '@/lib/constants';
import { log } from '@/lib/logger';
import { z } from 'zod';
import { listApprovedPublicTestimonials, submitPublicTestimonial } from '@/lib/services/publicTestimonialService';

function resolveLocale(request: NextRequest): PublicTestimonialApiLocale {
  const lang = request.headers.get('accept-language')?.toLowerCase() || '';
  if (lang.includes('ca')) return 'ca';
  if (lang.includes('en')) return 'en';
  return 'es';
}

const optionalContextString = z.union([z.string(), z.null(), z.undefined()]).transform((value) => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || undefined;
});

const optionalUrlString = z.preprocess((value) => {
  if (typeof value !== 'string') return undefined;
  return value.trim() || undefined;
}, z.string().url().optional());

const testimonialSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().trim().min(10),
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().optional(),
  photoUrl: optionalUrlString,
  videoUrl: optionalUrlString,
  allowGoogleShare: z.boolean().default(false),
  consentPhotoPublication: z.boolean().default(false),
  token: optionalContextString,
  bookingRef: optionalContextString,
});

export async function POST(request: NextRequest) {
  const t = PUBLIC_TESTIMONIAL_API_MESSAGES[resolveLocale(request)];
  try {
    const body = await request.json();
    const parsed = testimonialSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: t.invalid, details: parsed.error.errors },
        { status: 400 }
      );
    }
    const data = parsed.data;

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
      token: data.token,
      bookingRef: data.bookingRef,
    });

    return NextResponse.json({
      success: true,
      discountCode: result.discountCode,
      discountPercent: result.discountPercent,
      message: t.success,
    });
  } catch (error) {
    log.error('Error submitting testimonial', error);

    return NextResponse.json(
      { error: t.processing },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const t = PUBLIC_TESTIMONIAL_API_MESSAGES[resolveLocale(request)];
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


