import { describe, it, expect, vi, beforeEach } from 'vitest';

import { FALLBACK_OFFER } from '@/lib/services/publicOfferService';

describe('publicOfferService', () => {
  it('FALLBACK_OFFER té estructura correcta', () => {
    expect(FALLBACK_OFFER.isActive).toBe(false);
    expect(FALLBACK_OFFER.endDate).toBeNull();
    expect(FALLBACK_OFFER.discount).toBe(0);
    expect(FALLBACK_OFFER.ctaLink).toBe('/contacto');
    expect(FALLBACK_OFFER.title).toBe('');
    expect(FALLBACK_OFFER.description).toBe('');
  });
});
