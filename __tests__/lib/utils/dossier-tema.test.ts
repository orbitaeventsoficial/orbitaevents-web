import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { buildDossierHtml, type DossierCopy } from '@/lib/utils/dossier-html-builder';
import type { AnimacioProduct } from '@/lib/constants/animacio-products';

const CLIENT = { nom: 'Luna Gonzalez', eventDesc: 'Festa privada · 2026-10-31 · Viladecans · 80 pax' };

const PRODUCTES = [
  {
    id: 'orbita:dj-primera-hora',
    nom: 'DJ',
    descripcio: ['Música tota la nit amb equip propi.'],
    preuText: 'des de 150 €',
    durada: '1 h',
    inclou: ['So', 'Llums', 'DJ'],
    image: '/img/dossier/dj.jpg',
  },
] as unknown as AnimacioProduct[];

// Els textos de veritat, els mateixos que llegeix el client.
const missatges = JSON.parse(readFileSync('messages/ca.json', 'utf8')) as { dossier: DossierCopy };
const COPY = missatges.dossier;

function html(tema: 'general' | 'halloween') {
  return buildDossierHtml(CLIENT, PRODUCTES, COPY, {
    locale: 'ca-ES',
    tema,
    travelKm: 94.4,
    quoteLines: [{ label: 'DJ · 3 hores', amount: 350 }],
  });
}

describe('la decoració del dossier', () => {
  it('Halloween canvia els colors', () => {
    expect(html('halloween')).toContain('--paper: #100d13;');
    expect(html('halloween')).toContain('--or: #f47a36;');
    expect(html('general')).toContain('--paper: #fbf8f1;');
  });

  it('Halloween no toca ni els productes ni els preus', () => {
    const netejaColors = (doc: string) => doc.replace(/:root\s*\{[\s\S]*?\}/, ':root{}');
    expect(netejaColors(html('halloween'))).toEqual(netejaColors(html('general')));
  });

  it('deixa els dos documents per mirar-los', () => {
    const carpeta = process.env.SORTIDA_TEMES;
    if (!carpeta) return;
    mkdirSync(carpeta, { recursive: true });
    writeFileSync(`${carpeta}/general.html`, html('general'), 'utf8');
    writeFileSync(`${carpeta}/halloween.html`, html('halloween'), 'utf8');
    expect(true).toBe(true);
  });
});
