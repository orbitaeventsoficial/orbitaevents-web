/**
 * API ROUTE: Google Reviews
 *
 * Obtiene las reseñas reales de Google My Business usando Google Places API.
 * Los datos NO están hardcodeados - se obtienen en tiempo real.
 *
 * Configuración requerida en .env:
 * - GOOGLE_PLACES_API_KEY
 * - NEXT_PUBLIC_GOOGLE_PLACE_ID
 */

import { NextResponse } from 'next/server';

export interface GoogleReview {
  author_name: string;
  author_url?: string;
  language: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

export interface GoogleReviewsResponse {
  rating: number;
  user_ratings_total: number;
  reviews: GoogleReview[];
}

export async function GET() {
  const placeId = process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  // Si no está configurado, devolver fallback
  if (!placeId || !apiKey) {
    return NextResponse.json({
      rating: 0,
      user_ratings_total: 0,
      reviews: [],
      error: 'Google Places API no configurada',
    }, { status: 200 });
  }

  try {
    // Obtener detalles del Place usando Google Places API
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total,reviews&key=${apiKey}&language=es`;

    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache de 1 hora
    });

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google API status: ${data.status}`);
    }

    const result = data.result;

    return NextResponse.json({
      rating: result.rating || 0,
      user_ratings_total: result.user_ratings_total || 0,
      reviews: result.reviews || [],
    });

  } catch (error) {
    console.error('Error fetching Google reviews:', error);

    return NextResponse.json({
      rating: 0,
      user_ratings_total: 0,
      reviews: [],
      error: 'Error al obtener reseñas',
    }, { status: 500 });
  }
}
