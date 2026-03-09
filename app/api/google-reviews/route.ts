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
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { SITE_CONFIG } from '@/app/config/site-config';
import { promises as fs } from 'fs';
import path from 'path';

export const revalidate = 1800;

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const LOCATION_API = 'https://businessprofile.googleapis.com/v1';

function shouldSkipDb(): boolean {
  return (
    process.env.SKIP_DB_QUERIES === '1' ||
    process.env.CI === 'true' ||
    process.env.NEXT_PHASE === 'phase-production-build'
  );
}

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

type GoogleIntegrationConfig = {
  refreshToken?: string;
  accountId?: string;
  locationId?: string;
  locationName?: string;
};

async function getGoogleIntegrationConfig(): Promise<GoogleIntegrationConfig | null> {
  if (shouldSkipDb()) return null;
  if (!process.env.DATABASE_URL) return null;
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          'integrations.google.refreshToken',
          'integrations.google.accountId',
          'integrations.google.locationId',
          'integrations.google.locationName',
        ],
      },
    },
  });

  const map = settings.reduce<Record<string, string>>((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});

  return {
    refreshToken: map['integrations.google.refreshToken'],
    accountId: map['integrations.google.accountId'],
    locationId: map['integrations.google.locationId'],
    locationName: map['integrations.google.locationName'],
  };
}

async function refreshGoogleAccessToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token || null;
}

function mapStarRating(rating?: string | number): number {
  if (typeof rating === 'number') return rating;
  const map: Record<string, number> = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  };
  return map[rating || ''] || 5;
}

async function getReviewsFromBusinessProfile(): Promise<GoogleReview[]> {
  const config = await getGoogleIntegrationConfig();
  if (!config?.refreshToken || !config.accountId || !config.locationId) {
    return [];
  }

  const accessToken = await refreshGoogleAccessToken(config.refreshToken);
  if (!accessToken) return [];

  try {
    const reviewsRes = await fetch(
      `${LOCATION_API}/accounts/${config.accountId}/locations/${config.locationId}/reviews`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        next: { revalidate: 1800 },
      }
    );

    if (!reviewsRes.ok) {
      return [];
    }

    const data = await reviewsRes.json();
    const reviews = (data.reviews || []).map((review: any) => {
      const createdAt = review.createTime ? new Date(review.createTime) : new Date();
      return {
        author_name: review.reviewer?.displayName || 'Google User',
        author_url: review.reviewer?.profilePhotoUrl,
        profile_photo_url: review.reviewer?.profilePhotoUrl,
        rating: mapStarRating(review.starRating),
        text: review.comment || '',
        time: Math.floor(createdAt.getTime() / 1000),
        relative_time_description: getRelativeTime(createdAt),
        language: 'es',
        source: 'google' as const,
      };
    });

    return reviews;
  } catch (error) {
    log.error('[Reviews] Error obtenint de GBP:', error);
    return [];
  }
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
async function getReviewsFromJson(): Promise<{ reviews: GoogleReview[]; lastUpdated?: string; total?: number; rating?: number }> {
  try {
    const jsonPath = path.join(process.cwd(), 'public', 'data', 'google-reviews.json');
    const content = await fs.readFile(jsonPath, 'utf-8');
    const data = JSON.parse(content);
    
    const reviews: GoogleReview[] = (data.reviews || []).map((r: any) => ({
      ...r,
      source: 'json' as const,
      language: 'ca',
    }));
    
    return { reviews, lastUpdated: data.lastUpdated, total: data.total, rating: data.rating };
  } catch (error) {
    // Fitxer no existeix, normal si no s'ha executat el script
    return { reviews: [] };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// OBTENIR RESSENYES DEL CACHE CRON (BD Setting cache.googleReviews)
// ═══════════════════════════════════════════════════════════════════════════
async function getReviewsFromCache(): Promise<{ reviews: GoogleReview[]; lastUpdated?: string; total?: number; rating?: number }> {
  if (shouldSkipDb()) return { reviews: [] };
  try {
    const cached = await prisma.setting.findUnique({ where: { key: 'cache.googleReviews' } });
    if (!cached?.value) return { reviews: [] };
    const data = JSON.parse(cached.value);
    const reviews: GoogleReview[] = (data.reviews || []).map((r: Record<string, unknown>) => ({
      ...r,
      source: 'json' as const,
      language: (r.language as string) || 'es',
    }));
    return { reviews, lastUpdated: data.lastUpdated, total: data.total, rating: data.rating };
  } catch {
    return { reviews: [] };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// OBTENIR RESSENYES DE LA BASE DE DADES
// ═══════════════════════════════════════════════════════════════════════════
async function getReviewsFromDatabase(): Promise<GoogleReview[]> {
  if (shouldSkipDb()) return [];
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
    log.error('[Reviews] Error obtenint de BBDD:', error);
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
    log.error('[Reviews] Error obtenint de Google:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export async function GET() {
  try {
    // Obtenir ressenyes de totes les fonts en paral·lel
    const [jsonData, dbReviews, googleReviews, gbpReviews, cachedData] = await Promise.all([
      getReviewsFromJson(),
      getReviewsFromDatabase(),
      getReviewsFromGoogle(),
      getReviewsFromBusinessProfile(),
      getReviewsFromCache(),
    ]);

    // Prioritat: GBP API > Google Places > Cache cron > JSON deploy > Database
    let allReviews: GoogleReview[] = [];
    let source: 'google' | 'database' | 'json' | 'mixed' = 'database';

    if (gbpReviews.length > 0) {
      allReviews = [...gbpReviews, ...dbReviews];
      source = dbReviews.length > 0 ? 'mixed' : 'google';
    } else if (googleReviews.length > 0) {
      allReviews = [...googleReviews, ...dbReviews];
      source = dbReviews.length > 0 ? 'mixed' : 'google';
    } else if (cachedData.reviews.length > 0) {
      allReviews = [...cachedData.reviews, ...dbReviews];
      source = dbReviews.length > 0 ? 'mixed' : 'json';
    } else if (jsonData.reviews.length > 0) {
      allReviews = [...jsonData.reviews, ...dbReviews];
      source = dbReviews.length > 0 ? 'mixed' : 'json';
    } else {
      allReviews = dbReviews;
      source = 'database';
    }

    // Usar total/rating del cache o JSON (el que sigui més recent)
    if (cachedData.total && cachedData.total > (jsonData.total || 0)) {
      jsonData.total = cachedData.total;
      jsonData.rating = cachedData.rating;
      jsonData.lastUpdated = cachedData.lastUpdated;
    }

    // Ordenar per data i filtrar per rating mínim
    allReviews.sort((a, b) => b.time - a.time);

    // NOMÉS 5 ESTRELLES - tal com sol·licitat
    const minRating = 5;
    const filteredReviews = allReviews.filter((r) => r.rating >= minRating);

    // Calcular rating promig
    let avgRating = 0;
    if (filteredReviews.length > 0) {
      avgRating = filteredReviews.reduce((sum, r) => sum + r.rating, 0) / filteredReviews.length;
      avgRating = Math.round(avgRating * 10) / 10;
    } else if (typeof jsonData.rating === 'number' && jsonData.rating > 0) {
      avgRating = jsonData.rating;
    }

    const totalReviews = filteredReviews.length > 0
      ? filteredReviews.length
      : (jsonData.total && jsonData.total > 0 ? jsonData.total : 0);

    const response: GoogleReviewsResponse = {
      rating: avgRating || 5.0,
      user_ratings_total: totalReviews,
      reviews: filteredReviews,
      source,
      googleReviewsUrl: SITE_CONFIG.reviews.googleBusinessUrl || SITE_CONFIG.reviews.googleReviewUrl || '',
      lastUpdated: jsonData.lastUpdated,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    log.error('[Reviews] Error general:', error);

    return NextResponse.json(
      {
        rating: 0,
        user_ratings_total: 0,
        reviews: [],
        source: 'database',
        googleReviewsUrl: SITE_CONFIG.reviews.googleBusinessUrl || SITE_CONFIG.reviews.googleReviewUrl || '',
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
