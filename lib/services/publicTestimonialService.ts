import { PUBLIC_VERIFIED_CUSTOMER_LABELS } from '@/lib/constants/index';
import { prisma } from '@/lib/prisma';
import { recordCustomerTestimonialSubmitted } from '@/lib/services/customerActivityService';

import type { Locale } from '@/i18n';

type SubmitPublicTestimonialInput = {
  rating: number;
  comment: string;
  name: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  videoUrl?: string;
  allowGoogleShare: boolean;
  consentPhotoPublication: boolean;
  token?: string;
  bookingRef?: string;
};

const DEFAULT_PUBLIC_TESTIMONIAL_LIMIT = 10;
const MAX_PUBLIC_TESTIMONIAL_LIMIT = 50;

export function normalizePublicTestimonialPagination(limit: number, offset: number) {
  const safeLimit = Number.isFinite(limit)
    ? Math.trunc(limit)
    : DEFAULT_PUBLIC_TESTIMONIAL_LIMIT;
  const safeOffset = Number.isFinite(offset)
    ? Math.trunc(offset)
    : 0;

  return {
    limit: Math.min(Math.max(safeLimit, 1), MAX_PUBLIC_TESTIMONIAL_LIMIT),
    offset: Math.max(safeOffset, 0),
  };
}

function generateDiscountCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'OE-';
  for (let i = 0; i < 6; i += 1) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function normalizeString(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

async function reserveDiscountCode() {
  let discountCode = generateDiscountCode();

  for (let attempts = 0; attempts < 10; attempts += 1) {
    const existing = await prisma.customerDiscountCode.findUnique({
      where: { code: discountCode },
      select: { code: true },
    });

    if (!existing) {
      return discountCode;
    }

    discountCode = generateDiscountCode();
  }

  return discountCode;
}

export async function listApprovedPublicTestimonials(limit: number, offset: number, locale: Locale) {
  const pagination = normalizePublicTestimonialPagination(limit, offset);
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
    take: pagination.limit,
    skip: pagination.offset,
  });

  const total = await prisma.customerTestimonial.count({
    where: { isApproved: true },
  });

  return {
    testimonials: testimonials.map((testimonial) => ({
      id: testimonial.id,
      name: testimonial.showName ? testimonial.customer.name : PUBLIC_VERIFIED_CUSTOMER_LABELS[locale],
      text: testimonial.text,
      rating: testimonial.rating,
      photoUrl: testimonial.showPhoto ? testimonial.photoUrl : null,
      eventType: testimonial.eventType,
      createdAt: testimonial.createdAt,
    })),
    total,
    hasMore: pagination.offset + pagination.limit < total,
  };
}

export async function listApprovedDatabaseReviews() {
  const testimonials = await prisma.customerTestimonial.findMany({
    where: {
      isApproved: true,
      showName: true,
    },
    include: {
      customer: {
        select: {
          name: true,
          email: true,
          source: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  });

  return testimonials.filter((testimonial) => !testimonial.customer.email?.includes('@reviews.orbitaevents.com'));
}

export async function submitPublicTestimonial(input: SubmitPublicTestimonialInput) {
  const emailNormalized = input.email.toLowerCase().trim();
  const nameNormalized = normalizeString(input.name);
  const phoneNormalized = input.phone?.replace(/\D/g, '') || null;

  let discountPercent = 5;
  if (input.photoUrl) discountPercent += 5;
  if (input.videoUrl) discountPercent += 10;
  if (input.allowGoogleShare) discountPercent += 5;

  const discountCode = await reserveDiscountCode();
  const validUntil = new Date();
  validUntil.setMonth(validUntil.getMonth() + 6);

  return prisma.$transaction(async (tx) => {
    const booking = input.token && input.bookingRef
      ? await tx.booking.findFirst({
          where: {
            reference: input.bookingRef,
            reviewToken: input.token,
          },
          select: {
            id: true,
            customerId: true,
            eventType: true,
            eventDate: true,
          },
        })
      : null;

    let customer = booking?.customerId
      ? await tx.customer.findUnique({ where: { id: booking.customerId } })
      : await tx.customer.findUnique({ where: { emailNormalized } });

    if (!customer) {
      customer = await tx.customer.create({
        data: {
          email: input.email,
          emailNormalized,
          name: input.name,
          nameNormalized,
          phone: input.phone || null,
          phoneNormalized,
          gdprConsent: true,
          gdprConsentDate: new Date(),
        },
      });
    }

    const testimonial = await tx.customerTestimonial.create({
      data: {
        customerId: customer.id,
        text: input.comment,
        rating: input.rating,
        eventType: booking?.eventType || null,
        eventDate: booking?.eventDate || null,
        photoUrl: input.photoUrl || null,
        showName: true,
        showPhoto: input.consentPhotoPublication,
        isApproved: false,
      },
    });

    const discount = await tx.customerDiscountCode.create({
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

    await tx.customerTestimonial.update({
      where: { id: testimonial.id },
      data: { discountCodeId: discount.id },
    });

    if (booking) {
      await tx.booking.update({
        where: { id: booking.id },
        data: { reviewSubmittedAt: new Date() },
      });
    }

    await recordCustomerTestimonialSubmitted({
      customerId: customer.id,
      testimonialId: testimonial.id,
      rating: input.rating,
      discountCode,
      discountPercent,
    }, tx);

    return {
      customerId: customer.id,
      testimonialId: testimonial.id,
      discountCode,
      discountPercent,
    };
  });
}
