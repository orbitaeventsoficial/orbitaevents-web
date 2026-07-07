import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

describe('DossierGeneratorClient catalog layout', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/dossiers/DossierGeneratorClient.tsx'), 'utf8');

  it('agrupa primer per proveidor i despres per audiencia', () => {
    expect(source).toContain('const productProviderGroups = useMemo');
    expect(source).toContain("(['orbita', 'masquerade', 'tino', 'altres'] as const)");
    expect(source).toContain('dossierProductGroupKey(product) === group');
    expect(source).toContain("key: 'infantil' as const");
    expect(source).toContain("key: 'adult' as const");
    expect(source).toContain('ADMIN_DOSSIER_GENERATOR_COPY.catalog.audiences[key]');
    expect(source).not.toContain('const productAudienceColumns = useMemo');
  });

  it('mostra miniatura del producte quan el cataleg porta imatge', () => {
    expect(source).toContain("import Image from 'next/image'");
    expect(source).toContain('{p.image && (');
    expect(source).toContain('<Image src={p.image}');
    expect(source).toContain('sizes="5rem"');
  });
});
