import { describe, expect, it } from 'vitest';
import { getPacksByService } from '@/app/config/packs-config';
import { SUBCONTRACTED_MARKUP_TARGET_PCT } from '@/lib/services/costEngine';

/**
 * Doctrina del propietari (2026-07-12, Canvi #2018): tots els preus són canònics
 * i el preu de client d'un format de partner surt del cervell econòmic
 * (cost del partner × markup objectiu), no d'un preu d'aparador paral·lel.
 *
 * Bingo Musical i Batalla Musical són formats de partner (Carlos Lucas /
 * Masquerade) amb cost 200€. El catàleg públic ha de vendre exactament el
 * preu del cervell: 200 × 1,20 = 240€. Si aquest test falla, algú ha tornat
 * a crear un preu paral·lel — és un bug de monocapa, no s'ajusta el test
 * sense ordre explícita del propietari.
 */
const PARTNER_FORMAT_COST = 200;

describe('packs-config — preu canònic dels formats de partner', () => {
  const expectedClientPrice = PARTNER_FORMAT_COST * (1 + SUBCONTRACTED_MARKUP_TARGET_PCT / 100);

  it.each(['bingo-musical', 'batalla-musical'])('%s ven el preu del cervell econòmic', (packId) => {
    const pack = getPacksByService('animacion').find((p) => p.id === packId);
    expect(pack, `el pack ${packId} ha d'existir al catàleg d'animació`).toBeDefined();
    expect(pack!.priceValue).toBe(expectedClientPrice);
    expect(pack!.price).toBe(`${expectedClientPrice}€`);
  });
});
