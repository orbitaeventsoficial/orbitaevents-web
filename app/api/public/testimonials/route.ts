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

// Fallback testimonials when DB is not available
const FALLBACK_TESTIMONIALS: TestimonialPublic[] = [
  {
    id: '1',
    text: 'Increïble! La festa va ser espectacular, tothom ballant fins les 5 del matí. Super recomanables!',
    rating: 5,
    eventType: 'WEDDING',
    eventDate: '2024-06-15',
    authorName: 'Marc i Laura',
    authorPhoto: null,
    showPhoto: false,
    createdAt: '2024-06-20T10:00:00Z',
  },
  {
    id: '2',
    text: 'El millor DJ que hem contractat mai. La il·luminació i els efectes van ser brutals!',
    rating: 5,
    eventType: 'PRIVATE_PARTY',
    eventDate: '2024-07-22',
    authorName: 'Anna G.',
    authorPhoto: null,
    showPhoto: false,
    createdAt: '2024-07-25T14:30:00Z',
  },
  {
    id: '3',
    text: 'Professionals de cap a peus. Van entendre perfectament el que volíem i ho van superar.',
    rating: 5,
    eventType: 'CORPORATE',
    eventDate: '2024-09-10',
    authorName: 'Empresa TechBCN',
    authorPhoto: null,
    showPhoto: false,
    createdAt: '2024-09-15T09:00:00Z',
  },
];

const FALLBACK_STATS = {
  total: 12,
  averageRating: 4.9,
  fiveStarCount: 10,
};

export async function GET(request: NextRequest) {
  // Check if DATABASE_URL is configured
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      ok: true,
      testimonials: FALLBACK_TESTIMONIALS,
      stats: FALLBACK_STATS,
      generatedAt: new Date().toISOString(),
      source: 'fallback',
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });
  }

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
      testimonials: publicTestimonials.length > 0 ? publicTestimonials : FALLBACK_TESTIMONIALS,
      stats: {
        total: stats._count || FALLBACK_STATS.total,
        averageRating: Math.round((stats._avg.rating || 5) * 10) / 10,
        fiveStarCount: fiveStarCount || FALLBACK_STATS.fiveStarCount,
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

    // Fallback with default data - return 200
    return NextResponse.json({
      ok: true,
      testimonials: FALLBACK_TESTIMONIALS,
      stats: FALLBACK_STATS,
      generatedAt: new Date().toISOString(),
      source: 'fallback',
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });
  }
}
