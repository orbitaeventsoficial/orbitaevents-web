// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('partner product seeds visibility', () => {
  const masqueradeSeed = readFileSync(join(process.cwd(), 'scripts/seed-masquerade-products.mjs'), 'utf8');
  const ismaSeed = readFileSync(join(process.cwd(), 'scripts/seed-isma-products.mjs'), 'utf8');

  it('sembra Bingo Musical KIDS com a producte infantil visible a dossier i booking', () => {
    expect(masqueradeSeed).toContain("name: 'Bingo Musical KIDS'");
    expect(masqueradeSeed).toContain('category: CHILDREN_CATEGORY');
    expect(masqueradeSeed).toContain('sellPrice: commercialProductPrice(160)');
    expect(masqueradeSeed).toContain('BINGO_KIDS_IMG = `${IMG}/bingo-musical-kids.jpg`');
    expect(masqueradeSeed).toContain('imageUrl: BINGO_KIDS_IMG');
    expect(masqueradeSeed).toContain('visibleInDossier: true');
    expect(masqueradeSeed).toContain('visibleInBooking: true');
  });

  it('sembra Bingo Musical adult amb la portada editorial sense sostre dominant', () => {
    expect(masqueradeSeed).toContain('BINGO_ADULT_IMG = `${IMG}/bingo-musical-cover.jpg`');
    expect(masqueradeSeed).toContain("name: 'Bingo Musical'");
    expect(masqueradeSeed).toContain('imageUrl: BINGO_ADULT_IMG');
  });

  it('sembra els altaveus d Isma com a cost intern de booking, no com a dossier', () => {
    expect(ismaSeed).toContain("COLLABORATOR_ID = 'isma-lloguer-altaveus'");
    expect(ismaSeed).toContain("name: 'Lloguer altaveus DJ'");
    expect(ismaSeed).toContain('costPrice: 50');
    expect(ismaSeed).toContain('sellPrice: 0');
    expect(ismaSeed).toContain('visibleInDossier: false');
    expect(ismaSeed).toContain('visibleInBooking: true');
  });

  it('quan desactiva productes obsolets de Masquerade també els oculta', () => {
    expect(masqueradeSeed).toContain('data: { isActive: false, visibleInDossier: false, visibleInBooking: false }');
  });
});
