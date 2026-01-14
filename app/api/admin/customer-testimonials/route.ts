/**
 * API ROUTE: Admin Customer Testimonials
 * Gesti¢ dels testimonis enviats pels clients
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { getTestimonialStats } from '@/lib/services/testimonialService';

export const dynamic = 'force-dynamic';

const EVENT_TYPES = [
  'WEDDING',
  'BIRTHDAY',
  'CORPORATE',
  'COMMUNION',
  'BAPTISM',
  'GRADUATION',
  'ANNIVERSARY',
  'PRIVATE_PARTY',
  'OTHER',
] as const;

type EventTypeValue = (typeof EVENT_TYPES)[number];

const DISCOUNT_SOURCE = 'TESTIMONIAL';

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function generateDiscountCode(name: string, percent: number): string {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'ORBI';
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${clean}${percent}-${random}`;
}

type DiscountInfo = {
  id: string;
  code: string;
  discountPercent: number;
  validUntil: Date;
  isActive: boolean;
};

function mapTestimonial(
  t: {
    id: string;
    text: string;
    rating: number;
    eventType: string | null;
    eventDate: Date | null;
    photoUrl: string | null;
    showPhoto: boolean;
    showName: boolean;
    isApproved: boolean;
    createdAt: Date;
    customer: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      instagram: string | null;
    };
  },
  discount?: DiscountInfo
) {
  return {
    id: t.id,
    name: t.showName ? t.customer.name : 'Cliente verificado',
    rating: t.rating,
    comment: t.text,
    photoUrl: t.showPhoto ? t.photoUrl : null,
    showPhoto: t.showPhoto,
    showName: t.showName,
    eventType: t.eventType,
    eventDate: t.eventDate,
    createdAt: t.createdAt,
    isApproved: t.isApproved,
    customer: t.customer,
    discount: discount || null,
  };
}


/**
 * GET - Obtenir testimonis per admin
 */
export async function GET(request: NextRequest) {
  // Verificar autenticaci¢
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const includeStats = searchParams.get('stats') === 'true';

    let testimonialsQuery;
    if (status === 'pending') {
      testimonialsQuery = { isApproved: false };
    } else if (status === 'approved') {
      testimonialsQuery = { isApproved: true };
    } else {
      testimonialsQuery = {};
    }

    const testimonials = await prisma.customerTestimonial.findMany({
      where: testimonialsQuery,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            instagram: true,
          },
        },
      },
      orderBy: [{ isApproved: 'asc' }, { createdAt: 'desc' }],
    });

    const testimonialIds = testimonials.map(t => t.id);
    const discountCodes = await prisma.customerDiscountCode.findMany({
      where: {
        sourceType: DISCOUNT_SOURCE,
        sourceId: { in: testimonialIds },
      },
      select: {
        id: true,
        code: true,
        discountPercent: true,
        validUntil: true,
        isActive: true,
        sourceId: true,
      },
    });

    const discountBySource = new Map<string, DiscountInfo>();
    for (const discount of discountCodes) {
      if (discount.sourceId) {
        discountBySource.set(discount.sourceId, {
          id: discount.id,
          code: discount.code,
          discountPercent: discount.discountPercent,
          validUntil: discount.validUntil,
          isActive: discount.isActive,
        });
      }
    }

    const formatted = testimonials.map(t =>
      mapTestimonial(t, discountBySource.get(t.id))
    );

    const response: Record<string, unknown> = {
      success: true,
      data: formatted,
    };

    if (includeStats) {
      response.stats = await getTestimonialStats();
    }

    return NextResponse.json(response);
  } catch (error) {
    log.error('Error fetching customer testimonials:', error);
    const message = error instanceof Error ? error.message : 'Error obtenint testimonis';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH - Aprovar o rebutjar testimoni
 */
export async function PATCH(request: NextRequest) {
  // Verificar autenticaci¢
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id, action, isApproved } = body as {
      id?: string;
      action?: string;
      isApproved?: boolean;
    };

    if (!id) {
      return NextResponse.json({ error: 'ID requerit' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};

    if (typeof isApproved === 'boolean') {
      updates.isApproved = isApproved;
    }

    if (action === 'approve') {
      updates.isApproved = true;
    } else if (action === 'unpublish') {
      updates.isApproved = false;
    } else if (action === 'delete' || action === 'reject') {
      const deleted = await prisma.customerTestimonial.delete({ where: { id } });
      await prisma.adminLog.create({
        data: {
          action: 'DELETE',
          entity: 'customer_testimonial',
          entityId: id,
          details: { action },
        },
      });
      return NextResponse.json({ success: true, data: deleted, message: 'Testimoni eliminat' });
    }

    if (action === 'update') {
      const {
        text,
        rating,
        showName,
        showPhoto,
        eventType,
        eventDate,
      } = body as {
        text?: string;
        rating?: number;
        showName?: boolean;
        showPhoto?: boolean;
        eventType?: string;
        eventDate?: string | null;
      };

      if (typeof text === 'string') updates.text = text;
      if (typeof rating === 'number') {
        updates.rating = Math.min(5, Math.max(1, rating));
      }
      if (typeof showName === 'boolean') updates.showName = showName;
      if (typeof showPhoto === 'boolean') updates.showPhoto = showPhoto;
      if (typeof eventType === 'string') {
        updates.eventType = EVENT_TYPES.includes(eventType as EventTypeValue)
          ? (eventType as EventTypeValue)
          : null;
      }
      if (eventDate === null) {
        updates.eventDate = null;
      } else if (typeof eventDate === 'string' && eventDate) {
        updates.eventDate = new Date(eventDate);
      }
    }

    if (action === 'discount') {
      const { discountPercent } = body as { discountPercent?: number };
      if (!discountPercent || discountPercent <= 0) {
        return NextResponse.json({ error: 'Descompte invàlid' }, { status: 400 });
      }

      const testimonial = await prisma.customerTestimonial.findUnique({
        where: { id },
        include: { customer: true },
      });

      if (!testimonial) {
        return NextResponse.json({ error: 'Testimoni no trobat' }, { status: 404 });
      }

      const code = generateDiscountCode(testimonial.customer.name, discountPercent);
      const discount = await prisma.customerDiscountCode.create({
        data: {
          customerId: testimonial.customerId,
          code,
          discountPercent,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          maxUses: 1,
          currentUses: 0,
          sourceType: DISCOUNT_SOURCE,
          sourceId: testimonial.id,
          isActive: true,
        },
      });

      await prisma.customerTestimonial.update({
        where: { id },
        data: { discountCodeId: discount.id },
      });

      await prisma.adminLog.create({
        data: {
          action: 'UPDATE',
          entity: 'customer_testimonial',
          entityId: id,
          details: { action: 'discount', code: discount.code, discountPercent },
        },
      });

      return NextResponse.json({
        success: true,
        data: discount,
        message: 'Descompte assignat',
      });
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Cap canvi vàlid' }, { status: 400 });
    }

    const result = await prisma.customerTestimonial.update({
      where: { id },
      data: updates,
    });

    const details: Prisma.InputJsonValue = {
      action: action || 'update',
      updates: JSON.parse(JSON.stringify(updates)),
    };

    await prisma.adminLog.create({
      data: {
        action: 'UPDATE',
        entity: 'customer_testimonial',
        entityId: id,
        details,
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: updates.isApproved === true || action === 'approve'
        ? 'Testimoni aprovat'
        : 'Testimoni actualitzat',
    });
  } catch (error) {
    log.error('Error updating customer testimonial:', error);
    const message = error instanceof Error ? error.message : 'Error actualitzant testimoni';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
/**
 * DELETE - Eliminar testimoni
 */
export async function DELETE(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerit' }, { status: 400 });
    }

    const result = await prisma.customerTestimonial.delete({ where: { id } });
    await prisma.adminLog.create({
      data: {
        action: 'DELETE',
        entity: 'customer_testimonial',
        entityId: id,
      },
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    log.error('Error deleting customer testimonial:', error);
    const message = error instanceof Error ? error.message : 'Error eliminant testimoni';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST - Crear testimoni manual (admin)
 */
export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      rating,
      text,
      eventType,
      eventDate,
      discountPercent,
    } = body as {
      customerName?: string;
      customerEmail?: string;
      rating?: number;
      text?: string;
      eventType?: string;
      eventDate?: string;
      discountPercent?: number;
    };

    if (!customerName || !text || !rating) {
      return NextResponse.json(
        { error: 'Nom, valoraci¢ i text s¢n obligatoris' },
        { status: 400 }
      );
    }

    const normalizedEmail = (customerEmail || `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@orbitaevents.local`).toLowerCase();
    const normalizedName = normalizeName(customerName);

    const customer = await prisma.customer.upsert({
      where: { email: normalizedEmail },
      update: {
        name: customerName,
        nameNormalized: normalizedName,
      },
      create: {
        email: normalizedEmail,
        emailNormalized: normalizedEmail,
        name: customerName,
        nameNormalized: normalizedName,
        gdprConsent: true,
        gdprConsentDate: new Date(),
        source: 'OTHER',
      },
    });

    const eventTypeValue: EventTypeValue | null =
      eventType && EVENT_TYPES.includes(eventType as EventTypeValue)
        ? (eventType as EventTypeValue)
        : null;

    const testimonial = await prisma.customerTestimonial.create({
      data: {
        customerId: customer.id,
        text,
        rating: Math.min(5, Math.max(1, rating)),
        eventType: eventTypeValue,
        eventDate: eventDate ? new Date(eventDate) : null,
        showName: true,
        showPhoto: false,
        isApproved: true,
      },
    });

    let discountId: string | null = null;
    if (discountPercent && discountPercent > 0) {
      const code = generateDiscountCode(customer.name, discountPercent);
      const discount = await prisma.customerDiscountCode.create({
        data: {
          customerId: customer.id,
          code,
          discountPercent,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          maxUses: 1,
          currentUses: 0,
          sourceType: DISCOUNT_SOURCE,
          sourceId: testimonial.id,
          isActive: true,
        },
      });
      discountId = discount.id;
    }

    if (discountId) {
      await prisma.customerTestimonial.update({
        where: { id: testimonial.id },
        data: { discountCodeId: discountId },
      });
    }

    await prisma.adminLog.create({
      data: {
        action: 'CREATE',
        entity: 'customer_testimonial',
        entityId: testimonial.id,
        details: { discountId },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: testimonial.id,
      },
    });
  } catch (error) {
    log.error('Error creating manual testimonial:', error);
    const message = error instanceof Error ? error.message : 'Error afegint ressenya';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

