/**
 * API ROUTE: Admin Customer Testimonials
 * Gestió dels testimonis enviats pels clients (amb sistema de descomptes)
 *
 * GET - Obtenir tots els testimonis (inclosos pendents)
 * PATCH - Aprovar/rebutjar testimoni
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getPendingTestimonials,
  getApprovedTestimonials,
  approveTestimonial,
  rejectTestimonial,
  getTestimonialStats,
} from '@/lib/services/testimonialService';

// Forçar ruta dinàmica
export const dynamic = 'force-dynamic';

/**
 * GET - Obtenir testimonis per admin
 * Query params:
 * - status: 'pending' | 'approved' | 'all'
 * - stats: boolean - incloure estadístiques
 */
export async function GET(request: NextRequest) {
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
      default:
        const [pending, approved] = await Promise.all([
          getPendingTestimonials(),
          getApprovedTestimonials(),
        ]);
        testimonials = [...pending, ...approved];
    }

    const response: Record<string, unknown> = {
      success: true,
      data: testimonials.map(t => ({
        id: t.id,
        title: t.title,
        comment: t.comment,
        rating: t.rating,
        eventType: t.submitted_event_type,
        eventDate: t.submitted_event_date,
        consentPhotoPublication: t.consent_photo_publication,
        status: t.status,
        canvasUrl: t.canvas_url,
        discountCode: t.discount_code,
        customer: t.customer ? {
          id: t.customer.id,
          name: t.customer.name,
          email: t.customer.email,
          phone: t.customer.phone,
          city: t.customer.city,
          instagram: t.customer.instagram,
        } : {
          name: t.submitted_name,
          email: t.submitted_email,
          city: t.submitted_city,
        },
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      })),
    };

    if (includeStats) {
      response.stats = await getTestimonialStats();
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching customer testimonials:', error);
    const message = error instanceof Error ? error.message : 'Error obtenint testimonis';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH - Aprovar o rebutjar testimoni
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'ID i acció requerits' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Acció invàlida (approve/reject)' }, { status: 400 });
    }

    let testimonial;

    if (action === 'approve') {
      testimonial = await approveTestimonial(id);
    } else {
      testimonial = await rejectTestimonial(id);
    }

    return NextResponse.json({
      success: true,
      data: testimonial,
      message: action === 'approve' ? 'Testimoni aprovat' : 'Testimoni rebutjat',
    });
  } catch (error) {
    console.error('Error updating customer testimonial:', error);
    const message = error instanceof Error ? error.message : 'Error actualitzant testimoni';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
