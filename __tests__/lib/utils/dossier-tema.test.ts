import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { buildDossierHtml, type DossierCopy } from '@/lib/utils/dossier-html-builder';
import type { AnimacioProduct } from '@/lib/constants/animacio-products';

const CLIENT = { nom: 'Luna Gonzalez', eventDesc: 'Festa privada · 2026-10-31 · Viladecans · 80 pax' };

const PRODUCTES = [
  {
    id: 'collab:animacio',
    nom: 'Animació amb personatge',
    descripcio: ['Un personatge nostre a la vostra festa.'],
    durada: '1 h',
    inclou: ['Personatge caracteritzat'],
    image: '/img/dossier/estand-dj.jpg',
  },
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
    quoteLines: [{ label: 'DJ · 3 hores', amount: 350 }, { label: 'Animació amb personatge', amount: 300 }],
    personatges: ['bruja-salem', 'jack-skelleton', 'elfo'],
  });
}

describe('la decoració del dossier', () => {
  it('Halloween canvia els colors', () => {
    expect(html('halloween')).toContain('--paper: #100d13;');
    expect(html('halloween')).toContain('--or: #f47a36;');
    expect(html('general')).toContain('--paper: #fbf8f1;');
  });

  it('Halloween no toca ni els productes ni els preus', () => {
    // La decoració sí que canvia (teranyines, boira). El que no pot canviar és
    // res del que el client compra: noms, imports i ordre.
    const contingut = (doc: string) => doc.match(
      /<h3 class="fitxa-nom">[^<]*|<span class="linia-nom">[^<]*|<span class="linia-import">[^<]*|class="total-xifra">[^<]*/g,
    ) ?? [];
    expect(contingut(html('halloween'))).toEqual(contingut(html('general')));
    expect(contingut(html('halloween')).length).toBeGreaterThan(3);
  });

  it('els personatges triats surten amb la seva foto', () => {
    const doc = html('halloween');
    expect(doc).toContain('/img/personatges/bruja-salem.jpg');
    expect(doc).toContain('Jack Skelleton');
    expect(doc).toContain('Tria el teu personatge');
  });

  it('el tema de Halloween porta teranyines i el general no', () => {
    expect(html('halloween')).toContain('<svg class="teranyina teranyina--esq"');
    expect(html('general')).not.toContain('<svg class="teranyina');
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
