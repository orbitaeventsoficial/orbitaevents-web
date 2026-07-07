import { describe, expect, it } from 'vitest';

import { roundRecommendedSellingPrice } from '@/lib/constants/pricing';

describe('roundRecommendedSellingPrice', () => {
  it('arrodoneix PVP recomanats sempre amunt a acabat en 0', () => {
    expect(roundRecommendedSellingPrice(340)).toBe(340);
    expect(roundRecommendedSellingPrice(340.01)).toBe(350);
    expect(roundRecommendedSellingPrice(349.99)).toBe(350);
  });

  it('retorna 0 per imports no vendibles', () => {
    expect(roundRecommendedSellingPrice(0)).toBe(0);
    expect(roundRecommendedSellingPrice(-12)).toBe(0);
    expect(roundRecommendedSellingPrice(Number.NaN)).toBe(0);
  });
});
