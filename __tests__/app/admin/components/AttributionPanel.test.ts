import { describe, expect, it } from 'vitest';
import { formatAttributionEuro } from '@/app/admin/components/AttributionPanel';

describe('formatAttributionEuro', () => {
  it('conserva centims en imports atribuits', () => {
    expect(formatAttributionEuro(199.99)).toContain('199,99');
  });

  it('manté el buit visual per imports zero', () => {
    expect(formatAttributionEuro(0)).toBe('—');
  });
});
