'use client';

/**
 * Hook para obtener reseñas de Google en tiempo real
 * NO usa datos hardcodeados - consume API
 */

import { useEffect, useState } from 'react';
import type { GoogleReviewsResponse } from '@/api/google-reviews/route';

export function useGoogleReviews() {
  const [data, setData] = useState<GoogleReviewsResponse>({
    rating: 0,
    user_ratings_total: 0,
    reviews: [],
    source: 'database',
    googleReviewsUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await fetch('/api/google-reviews');
        if (!response.ok) {
          throw new Error('Error al cargar reseñas');
        }
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, []);

  return { data, loading, error };
}
