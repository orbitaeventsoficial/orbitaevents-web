/**
 * API ROUTE: Admin Customer Testimonials
 * Gesti¢ dels testimonis enviats pels clients
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getPendingTestimonials,
  getApprovedTestimonials,
  approveTestimonial,
  deleteTestimonial,
  getTestimonialStats,
} from '@/lib/services/testimonialService';

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

    let testimonials;

    switch (status) {
      case 'pending':
        testimonials = await getPendingTestimonials();
        break;
      case 'approved':
        testimonials = await getApprovedTestimonials();
        break;
      default: {
        const [pending, approved] = await Promise.all([
          getPendingTestimonials(),
          getApprovedTestimonials(),
        ]);
        const formattedPending = pending.map(t => ({
          id: t.id,
          name: t.showName ? t.customer.name : 'Client verificat',
          rating: t.rating,
          comment: t.text,
          photoUrl: t.showPhoto ? t.photoUrl : null,
          eventType: t.eventType,
          eventDate: t.eventDate,
          createdAt: t.createdAt,
          isApproved: t.isApproved,
          customer: t.customer,
          source: 'pending' as const,
        }));
        testimonials = [...formattedPending, ...approved];
      }
    }

    const response: Record<string, unknown> = {
      success: true,
      data: testimonials,
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
    const { id, action, isApproved } = body as { id?: string; action?: string; isApproved?: boolean };

    if (!id) {
      return NextResponse.json({ error: 'ID requerit' }, { status: 400 });
    }

    let result;
    if (typeof isApproved === 'boolean') {
      result = await approveTestimonial(id, isApproved);
    } else {
      if (!action || !['approve', 'reject'].includes(action)) {
        return NextResponse.json({ error: 'Acci¢ inv…lida (approve/reject)' }, { status: 400 });
      }
      result = action === 'approve' ? await approveTestimonial(id) : await deleteTestimonial(id);
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: action === 'approve' || isApproved === true ? 'Testimoni aprovat' : 'Testimoni actualitzat',
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

    const result = await deleteTestimonial(id);
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
    } = body as {
      customerName?: string;
      customerEmail?: string;
      rating?: number;
      text?: string;
      eventType?: string;
      eventDate?: string;
    };

    if (!customerName || !text || !rating) {
      return NextResponse.json(
        { error: 'Nom, valoraci¢ i text s¢n obligatoris' },
        { status: 400 }
      );
    }

    const normalizedEmail = (customerEmail || `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@orbitaevents.local`).toLowerCase();
    const normalizedName = customerName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

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
