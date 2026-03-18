/**
 * Tipus i helpers purs per l'API de ressenyes Google.
 * Extret de route.ts per reduir la mida del handler.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

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

export interface GoogleBusinessProfileReview {
  createTime?: string;
  comment?: string;
  starRating?: string | number;
  reviewer?: {
    displayName?: string;
    profilePhotoUrl?: string;
  };
}

export interface StaticGoogleReview extends Partial<GoogleReview> {
  author_name?: string;
  rating?: number;
  text?: string;
  time?: number;
  relative_time_description?: string;
  language?: string;
}

export interface GooglePlacesReview {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
  language?: string;
}

export interface GoogleReviewsResponse {
  rating: number;
  user_ratings_total: number;
  reviews: GoogleReview[];
  source: 'google' | 'database' | 'json' | 'mixed';
  googleReviewsUrl: string;
  lastUpdated?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

export const TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const LOCATION_API = 'https://businessprofile.googleapis.com/v1';

// ─── Helpers ────────────────────────────────────────────────────────────────

export function shouldSkipDb(): boolean {
  return (
    process.env.SKIP_DB_QUERIES === '1' ||
    process.env.CI === 'true' ||
    process.env.NEXT_PHASE === 'phase-production-build'
  );
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<string | null> {
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

export function mapStarRating(rating?: string | number): number {
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

export function getRelativeTime(date: Date): string {
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
