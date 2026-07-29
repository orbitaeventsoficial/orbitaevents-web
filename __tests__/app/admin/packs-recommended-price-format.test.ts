import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('/admin/packs recommended price display', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/packs/page.tsx'), 'utf8');

  it('mostra els recomanats comercials amb format net sense decimals', () => {
    expect(source).toContain('formatCurrency(health.recommendedPrice)');
    expect(source).toContain('formatCurrency(health.recommendedExtraHourPrice)');
    expect(source).toContain('formatCurrency(health.recommendedOperatorExtraHourPrice)');
    expect(source).not.toContain('formatCurrencyExact(health.recommended');
    expect(source).not.toContain('recommendedOperatorExtraHourPrice.toFixed(2)');
  });
});
