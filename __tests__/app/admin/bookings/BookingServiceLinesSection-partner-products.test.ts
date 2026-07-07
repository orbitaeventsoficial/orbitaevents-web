import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('BookingServiceLinesSection partner products guard', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/bookings/BookingServiceLinesSection.tsx'), 'utf8');

  it('no amaga una fallada de productes partner com a cataleg buit', () => {
    const start = source.indexOf('useEffect(() => {');
    const end = source.indexOf('const update =');
    const loadBlock = source.slice(start, end);

    expect(source).toContain('const PARTNER_PRODUCTS_LOAD_ERROR =');
    expect(loadBlock).toContain('throw new Error(data.error || data.message || PARTNER_PRODUCTS_LOAD_ERROR);');
    expect(loadBlock).toContain('setPartnerProductsError(error instanceof Error ? error.message : PARTNER_PRODUCTS_LOAD_ERROR);');
    expect(source).toContain('partnerProductsError && (');
    expect(source).toContain('role="alert"');
    expect(loadBlock).not.toContain(".catch((e) => console.error('[ServiceLines] Error carregant productes', e));");
  });

  it('mostra productes interns de booking com a cost, no com a PVP client', () => {
    expect(source).toContain('visibleInDossier?: boolean;');
    expect(source).toContain('const productCatalogPriceLabel =');
    expect(source).toContain('p.visibleInDossier === false');
    expect(source).toContain('`cost ${p.costPrice}€`');
    expect(source).toContain('{productCatalogPriceLabel(p)}');
  });
});
