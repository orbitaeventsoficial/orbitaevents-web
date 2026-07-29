import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const pagePath = join(process.cwd(), 'app/admin/pricing/page.tsx');

describe('Pricing tariff source contract', () => {
  it('no conserva estat local mort per editar tarifes sense servei', () => {
    const source = readFileSync(pagePath, 'utf8');

    expect(source).not.toContain('pricingConfig');
    expect(source).not.toContain('setPricingConfig');
    expect(source).not.toContain('savingConfig');
    expect(source).not.toContain('setSavingConfig');
    expect(source).not.toContain("Aviat: editable des d'aquí");
    expect(source).toContain('SERVICE_HOURLY_RATES');
    expect(source).toContain('Tarifes de referència.');
  });
});
