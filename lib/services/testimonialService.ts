/**
 * TESTIMONIAL SERVICE - Prisma Version
 * =====================================
 * Gestió d'opinions/testimonis amb Prisma
 */

import { prisma } from '@/lib/prisma';

// ═══════════════════════════════════════════════════════════════════════════
// TIPUS
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateTestimonialInput {
  // Dades del client
  email: string;
  name: string;
  phone?: string;
  city?: string;
  instagram?: string;

  // Testimoni
  comment: string;
  rating: number;
  eventType?: string;
  eventDate?: string;

  // Media
  photoUrl?: string;
  videoUrl?: string;

  // Permisos
  allowGoogleShare?: boolean;
  consentPhotoPublication?: boolean;
}

export interface TestimonialResult {
  testimonial: {
    id: string;
    rating: number;
    comment: string;
  };
  discountCode: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function generateDiscountCode(name: string, percent: number): string {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'ORBI';
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${clean}${percent}-${random}`;
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function normalizeName(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONS PÚBLIQUES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Crea un nou testimoni des del formulari públic
 */
export async function createTestimonial(
  input: CreateTestimonialInput
): Promise<TestimonialResult> {
  const email = normalizeEmail(input.email);
  const now = new Date();

  // 1. Buscar o crear client
  let customer = await prisma.customer.findUnique({
    where: { email },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        email,
        emailNormalized: email,
        name: capitalizeWords(input.name),
        nameNormalized: normalizeName(input.name),
        phone: input.phone || null,
        phoneNormalized: input.phone?.replace(/\D/g, '') || null,
        instagram: input.instagram?.replace('@', '').toLowerCase() || null,
        instagramNormalized: input.instagram?.replace('@', '').toLowerCase() || null,
        gdprConsent: true,
        gdprConsentDate: now,
      },
    });
  }

  // 2. Calcular descompte
  let discountPercent = 5;
  if (input.photoUrl) discountPercent += 5;
  if (input.videoUrl) discountPercent += 10;
  if (input.allowGoogleShare) discountPercent += 5;

  const discountCode = generateDiscountCode(input.name, discountPercent);

  // 3. Mapear eventType a enum
  const eventTypeMap: Record<string, 'WEDDING' | 'BIRTHDAY' | 'CORPORATE' | 'COMMUNION' | 'BAPTISM' | 'PRIVATE_PARTY' | 'OTHER'> = {
    boda: 'WEDDING',
    cumpleanos: 'BIRTHDAY',
    corporativo: 'CORPORATE',
    comunion: 'COMMUNION',
    bautizo: 'BAPTISM',
    fiesta: 'PRIVATE_PARTY',
  };
  const eventType = input.eventType ? eventTypeMap[input.eventType] || 'OTHER' : undefined;

  // 4. Crear testimoni a CustomerTestimonial (per clients)
  const testimonial = await prisma.customerTestimonial.create({
    data: {
      customerId: customer.id,
      text: input.comment,
      rating: Math.min(5, Math.max(1, input.rating)),
      eventType,
      eventDate: input.eventDate ? new Date(input.eventDate) : null,
      photoUrl: input.photoUrl || null,
      showName: true,
      showPhoto: !!input.photoUrl && input.consentPhotoPublication,
      isApproved: false,
    },
  });

  // 5. Crear codi de descompte
  await prisma.customerDiscountCode.create({
    data: {
      customerId: customer.id,
      code: discountCode,
      discountPercent,
      validFrom: now,
      validUntil: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
      maxUses: 1,
      currentUses: 0,
      sourceType: 'TESTIMONIAL',
      sourceId: testimonial.id,
      isActive: true,
    },
  });

  // 6. Log activitat
  await prisma.customerActivity.create({
    data: {
      customerId: customer.id,
      action: 'TESTIMONIAL_SUBMITTED',
      details: {
        testimonialId: testimonial.id,
        rating: input.rating,
        discountCode,
        discountPercent,
        hasPhoto: !!input.photoUrl,
        hasVideo: !!input.videoUrl,
      },
    },
  });

  return {
    testimonial: {
      id: testimonial.id,
      rating: testimonial.rating,
      comment: testimonial.text,
    },
    discountCode,
  };
}

/**
 * Obtenir testimonis aprovats (per la web)
 */
export async function getApprovedTestimonials(limit = 20) {
  // Combinar testimonis aprovats de CustomerTestimonial i Testimonial
  const customerTestimonials = await prisma.customerTestimonial.findMany({
    where: { isApproved: true },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  const staticTestimonials = await prisma.testimonial.findMany({
    where: { isActive: true },
    include: { translations: true },
    orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }],
    take: limit,
  });

  // Combinar i formatar
  const combined = [
    ...customerTestimonials.map(t => ({
      id: t.id,
      name: t.showName ? t.customer.name : 'Client verificat',
      rating: t.rating,
      comment: t.text,
      photoUrl: t.showPhoto ? t.photoUrl : null,
      eventType: t.eventType,
      createdAt: t.createdAt,
      source: 'customer' as const,
    })),
    ...staticTestimonials.map(t => ({
      id: t.id,
      name: t.authorName,
      rating: t.rating,
      comment: t.translations[0]?.quote || '',
      photoUrl: null,
      eventType: t.eventType,
      createdAt: t.createdAt,
      source: 'static' as const,
    })),
  ];

  return combined.slice(0, limit);
}

/**
 * Obtenir testimonis pendents (per admin)
 */
export async function getPendingTestimonials() {
  return prisma.customerTestimonial.findMany({
    where: { isApproved: false },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Aprovar o despublicar testimoni
 */
export async function approveTestimonial(id: string, approved: boolean = true) {
  return prisma.customerTestimonial.update({
    where: { id },
    data: { isApproved: approved },
  });
}

/**
 * Rebutjar/eliminar testimoni
 */
export async function deleteTestimonial(id: string) {
  return prisma.customerTestimonial.delete({
    where: { id },
  });
}

/**
 * Estadístiques
 */
export async function getTestimonialStats() {
  const [total, pending, approved] = await Promise.all([
    prisma.customerTestimonial.count(),
    prisma.customerTestimonial.count({ where: { isApproved: false } }),
    prisma.customerTestimonial.count({ where: { isApproved: true } }),
  ]);

  const ratings = await prisma.customerTestimonial.aggregate({
    where: { isApproved: true },
    _avg: { rating: true },
  });

  return {
    total,
    pending,
    approved,
    avgRating: Math.round((ratings._avg.rating || 0) * 10) / 10,
  };
}
