import { describe, expect, it } from 'vitest';

import { readLogoDataUri } from '@/lib/utils/dossier-logo';

/**
 * El logo del dossier.
 *
 * És autoritat única des que se'n van trobar dues còpies idèntiques —la pàgina
 * de dossiers i la ruta del PDF—, i el document ha de sortir sempre amb el
 * mateix logo vingui d'on vingui la petició.
 *
 * El contracte que es prova és el que consumeix el constructor del document:
 * o un data URI d'SVG utilitzable, o cadena buida. Mai una excepció, perquè un
 * logo que falta no pot impedir que surti el dossier.
 */
describe('readLogoDataUri', () => {
  it('torna el logo com a data URI d\'SVG', () => {
    const uri = readLogoDataUri();
    expect(uri).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it('el contingut incrustat és l\'SVG de veritat', () => {
    const uri = readLogoDataUri();
    const base64 = uri.replace('data:image/svg+xml;base64,', '');
    const svg = Buffer.from(base64, 'base64').toString('utf-8');
    expect(svg).toContain('<svg');
  });

  it('no llança mai: el document ha de sortir encara que falti el logo', () => {
    expect(() => readLogoDataUri()).not.toThrow();
  });
});
