/**
 * API ROUTE: Public Testimonials
 * POST - Enviar una nueva opinion
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { createTestimonial } from '@/lib/services/testimonialService';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { verifyCsrf } from '@/lib/csrf';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ratingSchema = z.preprocess(
  (value) => (typeof value === 'string' ? Number(value) : value),
  z.number().int().min(1).max(5)
);

const testimonialSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(30).optional(),
  city: z.string().max(100).optional(),
  instagram: z.string().max(100).optional(),
  rating: ratingSchema,
  comment: z.string().min(5).max(2000),
  eventType: z.string().max(50).optional(),
  eventDate: z
    .string()
    .optional()
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
      message: 'Invalid eventDate',
    }),
  photoUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  allowGoogleShare: z.boolean().optional(),
  consentDataProcessing: z.boolean().optional(),
  consentPhotoPublication: z.boolean().optional(),
  token: z.string().optional(),
  bookingRef: z.string().optional(),
}).refine(
  (data) => (data.token && data.bookingRef) || (!data.token && !data.bookingRef),
  {
    message: 'token and bookingRef must be provided together',
    path: ['token'],
  }
);

export async function POST(request: NextRequest) {
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  const rateLimitResult = await checkRateLimit(request, { ...RATE_LIMITS.testimonials, limit: 5 });
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await request.json();
    const parsed = testimonialSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: parsed.error.format() },
        { status: 400 }
      );
    }

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
      token,
      bookingRef,
    } = parsed.data;

    if (token && bookingRef) {
      const booking = await prisma.booking.findFirst({
        where: {
          reference: bookingRef,
          reviewToken: token,
          reviewSubmittedAt: null,
        },
      });

      if (!booking) {
        return NextResponse.json(
          { error: 'Token de valoracion invalido o ya utilizado' },
          { status: 400 }
        );
      }

      await prisma.booking.update({
        where: { id: booking.id },
        data: { reviewSubmittedAt: new Date() },
      });
    }

    if (!name || !email || !rating || !comment) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios (nombre, email, valoracion, comentario)' },
        { status: 400 }
      );
    }

    if (!token && !consentDataProcessing) {
      return NextResponse.json(
        { error: 'Debes aceptar el consentimiento de datos' },
        { status: 400 }
      );
    }

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
        message: 'Gracias por tu opinion. La revisaremos pronto.',
      },
    });
  } catch (error) {
    log.error('Error creando testimonio:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: 'Error procesando la solicitud', details: errorMessage },
      { status: 500 }
    );
  }
}