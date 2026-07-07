import {
  POST_EVENT_REVIEW_MARKERS,
  POST_EVENT_REVIEW_RESOLVED_NOTE,
  SOCIAL_REVIEW_BLOCKED_MESSAGE,
  SOCIAL_REVIEW_GATED_STATUSES,
} from '@/lib/constants/socialPostReview';

export {
  POST_EVENT_REVIEW_MARKERS,
  POST_EVENT_REVIEW_RESOLVED_NOTE,
  SOCIAL_REVIEW_BLOCKED_MESSAGE,
  SOCIAL_REVIEW_GATED_STATUSES,
};

export function hasPendingPostEventReviewNotes(notes: string | null | undefined): boolean {
  const normalized = (notes ?? '').toLowerCase();
  return POST_EVENT_REVIEW_MARKERS.some((marker) => normalized.includes(marker));
}

export function requiresPostEventReview(input: { bookingId?: string | null; category?: string | null; notes?: string | null }): boolean {
  return Boolean(input.bookingId && input.category === 'EVENT_SHOWCASE' && hasPendingPostEventReviewNotes(input.notes));
}

export function resolvePostEventReviewNotes(notes: string): string {
  const cleaned = notes
    .replace(/Revisar consentiment, imatges i dades personals abans de publicar\.\s*/i, '')
    .replace(/No publicat automaticament\.\s*/i, '')
    .trim();
  return [cleaned, POST_EVENT_REVIEW_RESOLVED_NOTE].filter(Boolean).join('\n');
}

export function validateSocialPostReviewGate(input: {
  status?: string | null;
  bookingId?: string | null;
  category?: string | null;
  notes?: string | null;
}): string | null {
  if (input.status && SOCIAL_REVIEW_GATED_STATUSES.has(input.status) && requiresPostEventReview(input)) {
    return SOCIAL_REVIEW_BLOCKED_MESSAGE;
  }
  return null;
}
