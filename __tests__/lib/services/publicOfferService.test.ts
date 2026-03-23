import { describe, it, expect, vi, beforeEach } from 'vitest';

import { PUBLIC_OFFER_FALLBACK } from '@/lib/constants';

describe('publicOfferService', () => {
  it('PUBLIC_OFFER_FALLBACK té estructura correcta', () => {
    expect(PUBLIC_OFFER_FALLBACK.isActive).toBe(false);
    expect(PUBLIC_OFFER_FALLBACK.endDate).toBeNull();
    expect(PUBLIC_OFFER_FALLBACK.discount).toBe(0);
    expect(PUBLIC_OFFER_FALLBACK.ctaLink).toBe('/contacto');
    expect(PUBLIC_OFFER_FALLBACK.title).toBe('');
    expect(PUBLIC_OFFER_FALLBACK.description).toBe('');
  });
});
