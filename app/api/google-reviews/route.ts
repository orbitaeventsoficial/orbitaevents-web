/**
 * API ROUTE: Google Reviews
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Obtiene las reseñas de Òrbita Events de múltiples fuentes:
 * 1. JSON estàtic (generat durant el deploy)
 * 2. Base de datos (testimonios verificados)
 * 3. Google Places API (si está configurado)
 * 
 * URL de Google Reviews: https://g.page/r/CXcgbvANsXSzEBM/review
 * CID: CXcgbvANsXSzEBM
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SITE_CONFIG } from '@/app/config/site-config';
import { promises as fs } from 'fs';
import path from 'path';

export interface GoogleReview {
  author_name: string;
  author_url?: string;
  language: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
  source: 'google' | 'database' | 'json';
  eventType?: string;
}

export interface GoogleReviewsResponse {
  rating: number;
  user_ratings_total: number;
  reviews: GoogleReview[];
  source: 'google' | 'database' | 'json' | 'mixed';
  googleReviewsUrl: string;
  lastUpdated?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Calcular temps relatiu
// ═══════════════════════════════════════════════════════════════════════════
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 1) return 'avui';
  if (diffDays === 1) return 'ahir';
  if (diffDays < 7) return `fa ${diffDays} dies`;
  if (diffDays < 30) return `fa ${Math.floor(diffDays / 7)} setmanes`;
  if (diffDays < 365) return `fa ${Math.floor(diffDays / 30)} mesos`;
  return `fa ${Math.floor(diffDays / 365)} anys`;
}

// ═══════════════════════════════════════════════════════════════════════════
// OBTENIR RESSENYES DEL JSON ESTÀTIC (generat durant deploy)
// ═══════════════════════════════════════════════════════════════════════════
async function getReviewsFromJson(): Promise<{ reviews: GoogleReview[]; lastUpdated?: string }> {
  try {
    const jsonPath = path.join(process.cwd(), 'public', 'data', 'google-reviews.json');
    const content = await fs.readFile(jsonPath, 'utf-8');
    const data = JSON.parse(content);
    
    const reviews: GoogleReview[] = (data.reviews || []).map((r: any) => ({
      ...r,
      source: 'json' as const,
      language: 'ca',
    }));
    
    return { reviews, lastUpdated: data.lastUpdated };
  } catch (error) {
    // Fitxer no existeix, normal si no s'ha executat el script
    return { reviews: [] };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// OBTENIR RESSENYES DE LA BASE DE DADES
// ═══════════════════════════════════════════════════════════════════════════
async function getReviewsFromDatabase(): Promise<GoogleReview[]> {
  try {
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

    return testimonials
      .filter(t => !t.customer.email?.includes('@reviews.orbitaevents.com')) // Excloure les de Google (ja estan al JSON)
      .map((t) => ({
        author_name: t.customer.name,
        rating: t.rating,
        text: t.text,
        time: Math.floor(t.createdAt.getTime() / 1000),
        relative_time_description: getRelativeTime(t.createdAt),
        language: 'ca',
        source: 'database' as const,
        eventType: t.eventType || undefined,
        profile_photo_url: t.photoUrl || undefined,
      }));
  } catch (error) {
    console.error('[Reviews] Error obtenint de BBDD:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// OBTENIR RESSENYES DE GOOGLE PLACES API (opcional, de pagament)
// ═══════════════════════════════════════════════════════════════════════════
async function getReviewsFromGoogle(): Promise<GoogleReview[]> {
  const placeId = process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!placeId || !apiKey) {
    return [];
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total,reviews&key=${apiKey}&language=es`;

    const response = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.result?.reviews) {
      return [];
    }

    return data.result.reviews.map((review: any) => ({
      author_name: review.author_name,
      author_url: review.author_url,
      profile_photo_url: review.profile_photo_url,
      rating: review.rating,
      text: review.text,
      time: review.time,
      relative_time_description: review.relative_time_description,
      language: review.language || 'es',
      source: 'google' as const,
    }));
  } catch (error) {
    console.error('[Reviews] Error obtenint de Google:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export async function GET() {
  try {
    // Obtenir ressenyes de totes les fonts
    const [jsonData, dbReviews, googleReviews] = await Promise.all([
      getReviewsFromJson(),
      getReviewsFromDatabase(),
      getReviewsFromGoogle(),
    ]);

    // Prioritat: Google API > JSON estàtic > Database
    let allReviews: GoogleReview[] = [];
    let source: 'google' | 'database' | 'json' | 'mixed' = 'database';

    if (googleReviews.length > 0) {
      allReviews = [...googleReviews, ...dbReviews];
      source = dbReviews.length > 0 ? 'mixed' : 'google';
    } else if (jsonData.reviews.length > 0) {
      allReviews = [...jsonData.reviews, ...dbReviews];
      source = dbReviews.length > 0 ? 'mixed' : 'json';
    } else {
      allReviews = dbReviews;
      source = 'database';
    }

    // Ordenar per data i filtrar per rating mínim
    allReviews.sort((a, b) => b.time - a.time);
    
    const minRating = SITE_CONFIG.reviews.minRatingToShow || 4;
    const filteredReviews = allReviews.filter((r) => r.rating >= minRating);

    // Calcular rating promig
    let avgRating = 0;
    if (filteredReviews.length > 0) {
      avgRating = filteredReviews.reduce((sum, r) => sum + r.rating, 0) / filteredReviews.length;
      avgRating = Math.round(avgRating * 10) / 10;
    }

    const response: GoogleReviewsResponse = {
      rating: avgRating || 5.0,
      user_ratings_total: filteredReviews.length,
      reviews: filteredReviews,
      source,
      googleReviewsUrl: SITE_CONFIG.reviews.googleBusinessUrl || '',
      lastUpdated: jsonData.lastUpdated,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('[Reviews] Error general:', error);

    return NextResponse.json(
      {
        rating: 0,
        user_ratings_total: 0,
        reviews: [],
        source: 'database',
        googleReviewsUrl: SITE_CONFIG.reviews.googleBusinessUrl || '',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  }
}
