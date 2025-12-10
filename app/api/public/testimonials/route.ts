// app/api/public/testimonials/route.ts
// ═══════════════════════════════════════════════════════════════════════════
// API PÚBLICA DE TESTIMONIOS
// ═══════════════════════════════════════════════════════════════════════════
//
// Devuelve testimonios APROBADOS de la BBDD para mostrar en el frontend.
// Solo muestra testimonios verificados y aprobados por admin.
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Cache: revalidar cada 30 minutos
export const revalidate = 1800;

interface TestimonialPublic {
  id: string;
  text: string;
  rating: number;
  eventType: string | null;
  eventDate: string | null;
  authorName: string;
  authorPhoto: string | null;
  showPhoto: boolean;
  createdAt: string;
}

interface TestimonialsResponse {
  ok: boolean;
  testimonials: TestimonialPublic[];
  stats: {
    total: number;
    averageRating: number;
    fiveStarCount: number;
  };
  generatedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const eventType = searchParams.get('eventType');

    // Query base
    const where: Record<string, unknown> = {
      isApproved: true,
    };

    // Filtrar por tipo de evento si se especifica
    if (eventType && eventType !== 'all') {
      where.eventType = eventType.toUpperCase();
    }

    // Obtener testimonios aprobados
    const testimonials = await prisma.customerTestimonial.findMany({
      where,
      take: Math.min(limit, 50), // Máximo 50
      orderBy: [
        { rating: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
    });

    // Estadísticas
    const stats = await prisma.customerTestimonial.aggregate({
      where: { isApproved: true },
      _count: true,
      _avg: {
        rating: true,
      },
    });

    const fiveStarCount = await prisma.customerTestimonial.count({
      where: {
        isApproved: true,
        rating: 5,
      },
    });

    // Transformar para respuesta pública
    const publicTestimonials: TestimonialPublic[] = testimonials.map((t) => ({
      id: t.id,
      text: t.text,
      rating: t.rating,
      eventType: t.eventType,
      eventDate: t.eventDate?.toISOString().slice(0, 10) || null,
      authorName: t.showName ? t.customer.name : 'Cliente verificado',
      authorPhoto: t.showPhoto ? t.photoUrl : null,
      showPhoto: t.showPhoto,
      createdAt: t.createdAt.toISOString(),
    }));

    const response: TestimonialsResponse = {
      ok: true,
      testimonials: publicTestimonials,
      stats: {
        total: stats._count,
        averageRating: Math.round((stats._avg.rating || 5) * 10) / 10,
        fiveStarCount,
      },
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });

  } catch (error) {
    console.error('Error obteniendo testimonios:', error);

    // Fallback vacío
    return NextResponse.json({
      ok: false,
      error: 'Error obteniendo testimonios',
      testimonials: [],
      stats: {
        total: 0,
        averageRating: 5,
        fiveStarCount: 0,
      },
      generatedAt: new Date().toISOString(),
    }, { status: 500 });
  }
}
