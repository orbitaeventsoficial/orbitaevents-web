import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('/admin/packs/[id] recommended pricing', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/packs/[id]/EditPackForm.tsx'), 'utf8');

  it('aplica el mateix arrodoniment premium que el motor de pricing', () => {
    expect(source).toContain('roundRecommendedSellingPrice(recommendedPackRaw)');
    expect(source).toContain('roundRecommendedSellingPrice(recommendedExtraRaw)');
    expect(source).toContain('commercialEur(recommended.pack)');
    expect(source).toContain('commercialEur(recommended.extra)');
    expect(source).not.toContain('round2(recommended.pack');
    expect(source).not.toContain('round2(recommended.extra');
  });
});
