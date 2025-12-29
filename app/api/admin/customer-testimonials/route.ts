/**
 * API ROUTE: Admin Customer Testimonials
 * Gestió dels testimonis enviats pels clients
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  getPendingTestimonials,
  getApprovedTestimonials,
  approveTestimonial,
  deleteTestimonial,
  getTestimonialStats,
} from '@/lib/services/testimonialService';

export const dynamic = 'force-dynamic';

/**
 * GET - Obtenir testimonis per admin
 */
export async function GET(request: NextRequest) {
  // Verificar autenticació
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
      default:
        const [pending, approved] = await Promise.all([
          getPendingTestimonials(),
          getApprovedTestimonials(),
        ]);
        // Format pending testimonials to match approved format
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

    const response: Record<string, unknown> = {
      success: true,
      data: testimonials,
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
  // Verificar autenticació
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'ID i acció requerits' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Acció invàlida (approve/reject)' }, { status: 400 });
    }

    let result;

    if (action === 'approve') {
      result = await approveTestimonial(id);
    } else {
      result = await deleteTestimonial(id);
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: action === 'approve' ? 'Testimoni aprovat' : 'Testimoni eliminat',
    });
  } catch (error) {
    console.error('Error updating customer testimonial:', error);
    const message = error instanceof Error ? error.message : 'Error actualitzant testimoni';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
