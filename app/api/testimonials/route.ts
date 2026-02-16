// app/api/testimonials/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { z } from 'zod';

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

// Validation schema
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

function generateDiscountCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'OE-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export async function POST(request: NextRequest) {
  const t = MESSAGES[resolveLocale(request)];
  try {
    const body = await request.json();
    const data = testimonialSchema.parse(body);

    const emailNormalized = data.email.toLowerCase().trim();
    const nameNormalized = normalizeString(data.name);
    const phoneNormalized = data.phone?.replace(/\D/g, '') || null;

    // Find or create customer
    let customer = await prisma.customer.findUnique({
      where: { emailNormalized },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          email: data.email,
          emailNormalized,
          name: data.name,
          nameNormalized,
          phone: data.phone || null,
          phoneNormalized,
          gdprConsent: true,
          gdprConsentDate: new Date(),
        },
      });
    }

    // Calculate discount percentage
    let discountPercent = 5; // Base
    if (data.photoUrl) discountPercent += 5;
    if (data.videoUrl) discountPercent += 10;
    if (data.allowGoogleShare) discountPercent += 5;

    // Generate unique discount code
    let discountCode = generateDiscountCode();
    let codeExists = true;
    let attempts = 0;

    while (codeExists && attempts < 10) {
      const existing = await prisma.customerDiscountCode.findUnique({
        where: { code: discountCode },
      });
      if (!existing) {
        codeExists = false;
      } else {
        discountCode = generateDiscountCode();
        attempts++;
      }
    }

    // Create testimonial
    const testimonial = await prisma.customerTestimonial.create({
      data: {
        customerId: customer.id,
        text: data.comment,
        rating: data.rating,
        photoUrl: data.photoUrl || null,
        showName: true,
        showPhoto: data.consentPhotoPublication,
        isApproved: false, // Requires admin approval
      },
    });

    // Create discount code
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + 6);

    await prisma.customerDiscountCode.create({
      data: {
        customerId: customer.id,
        code: discountCode,
        discountPercent,
        validFrom: new Date(),
        validUntil,
        maxUses: 1,
        sourceType: 'TESTIMONIAL',
        sourceId: testimonial.id,
        isActive: true,
      },
    });

    // Update testimonial with discount code ID
    await prisma.customerTestimonial.update({
      where: { id: testimonial.id },
      data: { discountCodeId: discountCode },
    });

    // Log activity
    await prisma.customerActivity.create({
      data: {
        customerId: customer.id,
        action: 'TESTIMONIAL_SUBMITTED',
        details: {
          testimonialId: testimonial.id,
          rating: data.rating,
          discountCode,
          discountPercent,
        },
      },
    });

    return NextResponse.json({
      success: true,
      discountCode,
      discountPercent,
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

// GET: Fetch approved testimonials for public display
export async function GET(request: NextRequest) {
  const t = MESSAGES[resolveLocale(request)];
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const testimonials = await prisma.customerTestimonial.findMany({
      where: {
        isApproved: true,
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    const total = await prisma.customerTestimonial.count({
      where: { isApproved: true },
    });

    const formattedTestimonials = testimonials.map((testimonial) => ({
      id: testimonial.id,
      name: testimonial.showName ? testimonial.customer.name : t.verifiedCustomer,
      text: testimonial.text,
      rating: testimonial.rating,
      photoUrl: testimonial.showPhoto ? testimonial.photoUrl : null,
      eventType: testimonial.eventType,
      createdAt: testimonial.createdAt,
    }));

    return NextResponse.json({
      testimonials: formattedTestimonials,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    log.error('Error fetching testimonials', error);
    return NextResponse.json(
      { error: t.fetching },
      { status: 500 }
    );
  }
}
