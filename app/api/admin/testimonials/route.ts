/**
 * API ROUTE: Admin Testimonials
 * ==============================
 * GET - Obtenir tots els testimonis (pendents i aprovats)
 * PATCH - Aprovar/rebutjar/destacar un testimoni
 * DELETE - Eliminar un testimoni
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAllTestimonials,
  getPendingTestimonials,
  approveTestimonial,
  rejectTestimonial,
  deleteTestimonial,
  toggleFeatured,
  getTestimonialStats,
} from '@/lib/services/testimonialService';

export const dynamic = 'force-dynamic';

/**
 * Verificar autenticació admin
 */
function verifyAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;

  // Basic auth
  if (authHeader.startsWith('Basic ')) {
    const base64 = authHeader.slice(6);
    const decoded = Buffer.from(base64, 'base64').toString();
    const [user, pass] = decoded.split(':');
    return user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASSWORD;
  }

  // API Key auth
  if (authHeader.startsWith('Bearer ')) {
    const key = authHeader.slice(7);
    return key === process.env.ADMIN_KEY;
  }

  return false;
}

/**
 * GET - Obtenir testimonis
 * Query params:
 * - filter: 'all' | 'pending' | 'approved'
 * - stats: 'true' - retorna estadístiques
 */
export async function GET(request: NextRequest) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const includeStats = searchParams.get('stats') === 'true';

    let testimonials;
    if (filter === 'pending') {
      testimonials = await getPendingTestimonials();
    } else {
      testimonials = await getAllTestimonials();
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
        photoUrl: t.photo_url,
        consentPhotoPublication: t.consent_photo_publication,
        status: t.status,
        discountCode: t.discount_code,
        rejectionReason: t.rejection_reason,
        approvedAt: t.approved_at,
        createdAt: t.created_at,
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
      })),
    };

    if (includeStats) {
      response.stats = await getTestimonialStats();
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error obtenint testimonis:', error);
    return NextResponse.json({ error: 'Error obtenint testimonis' }, { status: 500 });
  }
}

/**
 * PATCH - Actualitzar estat d'un testimoni
 * Body:
 * - id: string
 * - action: 'approve' | 'reject' | 'toggle_featured'
 * - featured?: boolean (per approve)
 * - reason?: string (per reject)
 */
export async function PATCH(request: NextRequest) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, action, featured, reason } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'Falten paràmetres' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'approve':
        result = await approveTestimonial(id, featured);
        break;
      case 'reject':
        result = await rejectTestimonial(id, reason);
        break;
      case 'toggle_featured':
        result = await toggleFeatured(id);
        break;
      default:
        return NextResponse.json({ error: 'Acció no vàlida' }, { status: 400 });
    }

    if (!result) {
      return NextResponse.json({ error: 'Testimoni no trobat' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error actualitzant testimoni:', error);
    return NextResponse.json({ error: 'Error actualitzant testimoni' }, { status: 500 });
  }
}

/**
 * DELETE - Eliminar un testimoni
 * Query params:
 * - id: string
 */
export async function DELETE(request: NextRequest) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Falta ID' }, { status: 400 });
    }

    const success = await deleteTestimonial(id);

    if (!success) {
      return NextResponse.json({ error: 'Error eliminant testimoni' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Testimoni eliminat',
    });
  } catch (error) {
    console.error('Error eliminant testimoni:', error);
    return NextResponse.json({ error: 'Error eliminant testimoni' }, { status: 500 });
  }
}
