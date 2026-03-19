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
import { getGoogleBusinessIntegrationConfig } from '@/lib/services/googleBusinessIntegrationService';
import { readGoogleReviewsCache } from '@/lib/services/googleReviewsCacheService';
import { SITE_CONFIG } from '@/app/config/site-config';
import { listApprovedDatabaseReviews } from '@/lib/services/publicTestimonialService';
import { promises as fs } from 'fs';
import path from 'path';
import type { GoogleReview, GoogleBusinessProfileReview, StaticGoogleReview, GooglePlacesReview, GoogleReviewsResponse } from './reviews-types';
import { LOCATION_API, shouldSkipDb, refreshGoogleAccessToken, mapStarRating, getRelativeTime } from './reviews-types';

export const revalidate = 1800;


// ═══════════════════════════════════════════════════════════════════════════
// OBTENIR RESSENYES DEL JSON ESTÀTIC (generat durant deploy)
// ═══════════════════════════════════════════════════════════════════════════
async function getReviewsFromJson(): Promise<{ reviews: GoogleReview[]; lastUpdated?: string; total?: number; rating?: number }> {
  try {
    const jsonPath = path.join(process.cwd(), 'public', 'data', 'google-reviews.json');
    const content = await fs.readFile(jsonPath, 'utf-8');
    const data = JSON.parse(content);
    
    const reviews: GoogleReview[] = (data.reviews || []).map((r: StaticGoogleReview) => ({
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
  const data = await readGoogleReviewsCache();
  if (!data) return { reviews: [] };
  const reviews: GoogleReview[] = (data.reviews || []).map((r) => ({
    ...r,
    source: 'json' as const,
    language: r.language || 'es',
  }));
  return { reviews, lastUpdated: data.lastUpdated, total: data.total, rating: data.rating };
}

// ═══════════════════════════════════════════════════════════════════════════
// OBTENIR RESSENYES DE LA BASE DE DADES
// ═══════════════════════════════════════════════════════════════════════════
async function getReviewsFromDatabase(): Promise<GoogleReview[]> {
  if (shouldSkipDb()) return [];
  try {
    const testimonials = await listApprovedDatabaseReviews();

    return testimonials.map((testimonial) => ({
      author_name: testimonial.customer.name,
      rating: testimonial.rating,
      text: testimonial.text,
      time: Math.floor(testimonial.createdAt.getTime() / 1000),
      relative_time_description: getRelativeTime(testimonial.createdAt),
      language: 'ca',
      source: 'database' as const,
      eventType: testimonial.eventType || undefined,
      profile_photo_url: testimonial.photoUrl || undefined,
    }));
  } catch (error) {
    log.error('[Reviews] Error obtenint de BBDD:', error);
    return [];
  }
}
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

    return (data.result.reviews as GooglePlacesReview[]).map((review) => ({
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
// OBTENIR RESSENYES DE GOOGLE BUSINESS PROFILE (OAuth)
// ═══════════════════════════════════════════════════════════════════════════
async function getReviewsFromBusinessProfile(): Promise<GoogleReview[]> {
  const config = await getGoogleBusinessIntegrationConfig();
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
    const reviews = (data.reviews || []).map((review: GoogleBusinessProfileReview) => {
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

    // Total real de Google (KG o cache), mai el nombre filtrat local
    const totalReviews = (jsonData.total && jsonData.total > 0)
      ? jsonData.total
      : filteredReviews.length;

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





