export const PORTFOLIO_MEDIA_IMAGE_MAX_SIZE = 10 * 1024 * 1024;
export const PORTFOLIO_MEDIA_VIDEO_MAX_SIZE = 100 * 1024 * 1024;
export const PORTFOLIO_MEDIA_UPLOAD_ACCEPT = 'image/*,video/mp4,video/webm,video/quicktime';
export const PORTFOLIO_MEDIA_ADMIN_EMPTY_STATE = 'Encara no hi ha media en aquesta categoria';
export const PORTFOLIO_EVENT_COVER_ALLOWED_PREFIXES = [
  '/api/uploads/portfolio/',
  '/api/uploads/bookings/',
  '/img/portfolio/',
] as const;
export const PORTFOLIO_EVENT_COVER_SOURCE_ERROR =
  'La portada del portfolio ha de sortir de media de portfolio o galeria de booking, no d’un producte o proveïdor.';

export const PORTFOLIO_EVENT_ORIGIN_TYPES = {
  MANUAL: 'MANUAL',
  BOOKING_GALLERY: 'BOOKING_GALLERY',
  POST_EVENT_REPORT: 'POST_EVENT_REPORT',
  TESTIMONIAL: 'TESTIMONIAL',
} as const;
export type PortfolioEventOriginType = (typeof PORTFOLIO_EVENT_ORIGIN_TYPES)[keyof typeof PORTFOLIO_EVENT_ORIGIN_TYPES];

export const PORTFOLIO_EVENT_ORIGIN_LABELS: Record<PortfolioEventOriginType, string> = {
  MANUAL: 'Manual',
  BOOKING_GALLERY: 'Galeria de reserva',
  POST_EVENT_REPORT: 'Report post-event',
  TESTIMONIAL: 'Testimoni',
};

export function isPortfolioEventCoverImage(value: string): boolean {
  const trimmed = value.trim();
  return PORTFOLIO_EVENT_COVER_ALLOWED_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

export function extractBookingIdFromPortfolioCoverImage(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.trim().match(/^\/api\/uploads\/bookings\/([^/]+)\//);
  return match?.[1] ?? null;
}
