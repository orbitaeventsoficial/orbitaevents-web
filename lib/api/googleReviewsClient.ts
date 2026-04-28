import type { GoogleReview, GoogleReviewsResponse } from '@/app/api/google-reviews/reviews-types';

export type { GoogleReview, GoogleReviewsResponse };

export async function fetchPublicGoogleReviews(
  init?: RequestInit,
): Promise<GoogleReviewsResponse> {
  const response = await fetch('/api/google-reviews', init);
  if (!response.ok) {
    throw new Error(`google-reviews fetch failed (${response.status})`);
  }
  return (await response.json()) as GoogleReviewsResponse;
}
