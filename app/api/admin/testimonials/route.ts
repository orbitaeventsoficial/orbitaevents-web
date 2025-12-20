/**
 * API ROUTE: Admin Testimonials
 * ==============================
 * GET - Obtenir tots els testimonis
 * PATCH - Aprovar un testimoni
 * DELETE - Eliminar un testimoni
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getPendingTestimonials,
  getApprovedTestimonials,
  approveTestimonial,
  deleteTestimonial,
  getTestimonialStats,
} from '@/lib/services/testimonialService';

export const dynamic = 'force-dynamic';

/**
 * Verificar autenticació admin
 */
function verifyAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;

  if (authHeader.startsWith('Basic ')) {
    const base64 = authHeader.slice(6);
    const decoded = Buffer.from(base64, 'base64').toString();
    const [user, pass] = decoded.split(':');
    return user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS;
  }

  if (authHeader.startsWith('Bearer ')) {
    const key = authHeader.slice(7);
    return key === process.env.ADMIN_KEY;
  }

  return false;
}

/**
 * GET - Obtenir testimonis
 */
export async function GET(request: NextRequest) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const includeStats = searchParams.get('stats') === 'true';

    let data;
    if (filter === 'pending') {
      const pending = await getPendingTestimonials();
      data = pending.map(t => ({
        id: t.id,
        comment: t.text,
        rating: t.rating,
        eventType: t.eventType,
        eventDate: t.eventDate,
        photoUrl: t.photoUrl,
        isApproved: t.isApproved,
        createdAt: t.createdAt,
        customer: {
          id: t.customer.id,
          name: t.customer.name,
          email: t.customer.email,
          phone: t.customer.phone,
          instagram: t.customer.instagram,
        },
      }));
    } else {
      const approved = await getApprovedTestimonials();
      data = approved;
    }

    const response: Record<string, unknown> = {
      success: true,
      data,
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
 * PATCH - Aprovar testimoni
 */
export async function PATCH(request: NextRequest) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'Falten paràmetres' }, { status: 400 });
    }

    let result;

    if (action === 'approve') {
      result = await approveTestimonial(id);
    } else if (action === 'reject' || action === 'delete') {
      result = await deleteTestimonial(id);
    } else {
      return NextResponse.json({ error: 'Acció no vàlida' }, { status: 400 });
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

    await deleteTestimonial(id);

    return NextResponse.json({
      success: true,
      message: 'Testimoni eliminat',
    });
  } catch (error) {
    console.error('Error eliminant testimoni:', error);
    return NextResponse.json({ error: 'Error eliminant testimoni' }, { status: 500 });
  }
}
