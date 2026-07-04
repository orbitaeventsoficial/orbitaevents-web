import { describe, it, expect, vi } from 'vitest';

vi.mock('@/app/config/site-config', () => ({
  SITE_CONFIG: {
    business: {
      phone: '+34654467087',
      phoneDisplay: '654 46 70 87',
      email: 'info@orbitaevents.com',
    },
    web: {
      url: 'https://www.orbitaevents.com',
    },
  },
}));

import { buildDossierHtml, type DossierClientInfo, type DossierCopy } from '@/lib/utils/dossier-html-builder';
import type { AnimacioProduct } from '@/lib/constants/animacio-products';

const client: DossierClientInfo = {
  nom: 'Joan Pla',
  email: 'joan@example.com',
  telefon: '600123456',
};

// Còpia canònica de prova (mirall de messages.dossier.* en català).
const copy: DossierCopy = {
  portada: { eyebrow: 'Esdeveniments a mida', clientLabel: 'Dossier preparat per a', bottom: 'Dossier de propostes · Òrbita Events' },
  intro: {
    kicker: "Una mirada a l'experiència",
    title: "Un dossier per imaginar l'esdeveniment abans de parlar de números.",
    greetingDefault: 'Gràcies per contactar amb nosaltres.',
    offerCountOne: '1 proposta activada',
    offerCountMany: '{count} propostes activades',
    summaryOfferLabel: 'Oferta',
    summaryFormatLabel: 'Format',
    summaryFormatValue: 'Dossier narratiu + resum econòmic',
    summaryGoalLabel: 'Objectiu',
    summaryGoalValue: 'Sentir el valor abans de comparar preus',
  },
  chapter: {
    eyebrow: 'Capítol',
    priceLabel: 'Inversió',
    priceFromPrefix: 'des de',
    priceCustom: 'a mida',
    durationLabel: 'Durada orientativa',
    includesTitle: "Què aporta a l'experiència",
    noteLabel: 'Bo de saber',
  },
  resum: {
    kicker: 'El conjunt',
    title: 'Resum de la proposta',
    lead: 'Una mirada de conjunt.',
    totalLabel: 'La proposta',
  },
  budget: {
    kicker: 'Transparència',
    title: 'Preus clars, sense sorpreses',
    lead: 'El que val cada cosa, amb desplaçament fins a {includedKm} km.',
    servicesLabel: 'El que inclou cada proposta',
    travelTitle: 'Desplaçament',
    travelNote: 'Inclòs fins a {includedKm} km; després, cost real del trajecte.',
    travelRoute: 'El vostre esdeveniment és a {location}, a uns {km} km des de Granollers.',
    travelPriceLabel: 'Cost del desplaçament',
    vatNote: "Preus orientatius; l'IVA es tanca a la proposta.",
  },
  cta: { label: 'Per confirmar disponibilitat o per a qualsevol dubte' },
};

function build(
  c: DossierClientInfo,
  products: AnimacioProduct[],
  options?: { autoPrint?: boolean; logoDataUri?: string; locale?: string; travelKm?: number; location?: string },
): string {
  return buildDossierHtml(c, products, copy, { locale: 'ca-ES', ...options });
}

const productWithTrams: AnimacioProduct = {
  id: 'bingo-musical',
  nom: 'Bingo Musical',
  descripcio: ['Descripció del bingo.'],
  inclou: ['DJ professional', 'Cartrons'],
  noInclou: 'No inclou desplaçament',
  trams: [
    { participants: '50-100', team: '2 persones', price: 900 },
    { participants: '100-200', team: '3 persones', price: 1200 },
  ],
};

const productWithDjOptions: AnimacioProduct = {
  id: 'discomobil',
  nom: 'Discomòbil',
  descripcio: ['Sessió DJ professional.'],
  inclou: ['So', 'Llums'],
  djOptions: [
    { label: '3 hores', price: 600, sublabel: 'Bàsic' },
    { label: '5 hores', price: 900, sublabel: 'Estàndard' },
    { label: '8 hores', price: 1200, sublabel: 'Premium' },
  ],
};

describe('buildDossierHtml', () => {
  it('genera HTML vàlid amb DOCTYPE', () => {
    const html = build(client, [productWithTrams]);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="ca">');
  });

  it('inclou el nom del client', () => {
    const html = build(client, [productWithTrams]);
    expect(html).toContain('Joan Pla');
  });

  it('inclou el nom del producte', () => {
    const html = build(client, [productWithTrams]);
    expect(html).toContain('Bingo Musical');
  });

  it('no duplica taules de preus dins el dossier editorial', () => {
    const html = build(client, [productWithTrams]);
    expect(html).toContain('Bingo Musical');
    expect(html).not.toContain('900€');
    expect(html).not.toContain('50-100');
    expect(html).not.toContain('<table>');
  });

  it('no duplica opcions DJ de preu dins el dossier editorial', () => {
    const html = build(client, [productWithDjOptions]);
    expect(html).not.toContain('dj-grid');
    expect(html).not.toContain('600€');
  });

  it('inclou noInclou si existeix', () => {
    const html = build(client, [productWithTrams]);
    expect(html).toContain('No inclou desplaçament');
  });

  it('mostra empresa si es proporciona', () => {
    const html = build({ ...client, empresa: 'Empresa SA' }, [productWithTrams]);
    expect(html).toContain('Empresa SA');
  });

  it('mostra eventDesc si es proporciona', () => {
    const html = build({ ...client, eventDesc: 'Aniversari 50è' }, [productWithTrams]);
    expect(html).toContain('Aniversari 50è');
  });

  it('usa salutació personalitzada si es proporciona', () => {
    const html = build(
      { ...client, salutacio: 'Benvingut al dossier exclusiu.' },
      [productWithTrams],
    );
    expect(html).toContain('Benvingut al dossier exclusiu.');
  });

  it('escapeja caràcters HTML perillosos', () => {
    const html = build({ ...client, nom: '<script>alert("xss")</script>' }, [productWithTrams]);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('inclou telèfon i email de contacte de SITE_CONFIG', () => {
    const html = build(client, [productWithTrams]);
    expect(html).toContain('654 46 70 87');
    expect(html).toContain('info@orbitaevents.com');
  });

  it('numera els capítols des de 01', () => {
    const html = build(client, [productWithTrams, productWithDjOptions]);
    expect(html).toContain('Capítol 01');
    expect(html).toContain('Capítol 02');
  });

  it('inclou portada carbon amb logo si es proporciona logoDataUri', () => {
    const html = build(client, [productWithTrams], {
      logoDataUri: 'data:image/png;base64,abc',
    });
    expect(html).toContain('portada');
    expect(html).toContain('data:image/png;base64,abc');
    expect(html).toContain('Dossier preparat per a');
  });

  it('inclou portada carbon també sense logoDataUri', () => {
    const html = build(client, [productWithTrams]);
    expect(html).toContain('class="portada"');
    expect(html).toContain('portada-wordmark');
  });

  it('afegeix script autoPrint si cal', () => {
    const html = build(client, [productWithTrams], { autoPrint: true });
    expect(html).toContain('window.print()');
  });

  it('pinta el preu canònic "des de X €" quan el producte té priceFrom', () => {
    const djProduct: AnimacioProduct = {
      id: 'orbita:dj-primera-hora',
      nom: 'DJ professional',
      descripcio: ['Servei base de DJ.'],
      inclou: ['DJ professional'],
      priceFrom: 150,
      categoria: 'DJ',
    };
    const html = build(client, [djProduct]);
    expect(html).toContain('class="producte-preu"');
    expect(html).toContain('des de');
    expect(html).toContain('150');
  });

  it('marca el preu del capítol "a mida" quan el producte no té priceFrom', () => {
    const html = build(client, [productWithTrams]);
    // Sense priceFrom el capítol mostra la inversió com a "a mida" (no s'amaga el bloc),
    // i mai pinta el preu cru d'un tram.
    expect(html).toContain('producte-preu--mida');
    expect(html).not.toContain('900€');
  });

  it('el resum ENSENYA cada preu «des de» però NO suma cap total dels elements (#1396)', () => {
    const a: AnimacioProduct = {
      id: 'orbita:dj-base',
      nom: 'DJ base',
      descripcio: ['Servei base de DJ.'],
      inclou: ['DJ professional'],
      priceFrom: 250,
    };
    const b: AnimacioProduct = {
      id: 'orbita:bingo',
      nom: 'Bingo Musical',
      descripcio: ['Bingo animat.'],
      inclou: ['Animador'],
      priceFrom: 240,
    };
    const html = build(client, [a, b]);
    expect(html).toContain('Resum de la proposta');
    // Els preus «des de» de cada element hi són com a referència.
    expect(html).toContain('250');
    expect(html).toContain('240');
    // Però MAI la suma dels elements (250 + 240 = 490) — el propietari no vol que sumi.
    expect(html).not.toContain('490');
  });

  it('el resum NO mostra la xifra del transport: va després, a la pàgina de transparència (#1396)', () => {
    const a: AnimacioProduct = {
      id: 'orbita:dj-base',
      nom: 'DJ base',
      descripcio: ['Servei base de DJ.'],
      inclou: ['DJ professional'],
      priceFrom: 250,
    };
    const html = build(client, [a], { travelKm: 422, location: "l'Aldosa" });
    // El resum és catàleg net: cap valor a la dreta del peu (ni suma ni transport).
    expect(html).not.toContain('resum-total-value');
    // El transport surt DESPRÉS, a la pàgina «Preus clars» (bud-page).
    const budIndex = html.indexOf('class="bud-travel-price"');
    const resumIndex = html.indexOf('class="resum-page"');
    expect(budIndex).toBeGreaterThan(resumIndex);
    expect(html).toContain('Cost del desplaçament');
  });

  it('no pinta el resum econòmic amb llista de productes buida', () => {
    const html = build(client, []);
    expect(html).not.toContain('class="resum-page"');
    expect(html).not.toContain('class="resum-total"');
  });

  // ─── Pressupost desglossat amb desplaçament ──────────────────────────────────

  it('NO pinta el pressupost desglossat si no hi ha travelKm', () => {
    const a: AnimacioProduct = { id: 'orbita:dj', nom: 'DJ', descripcio: ['x'], inclou: ['x'], priceFrom: 150 };
    const html = build(client, [a]);
    expect(html).not.toContain('class="bud-page"');
  });

  it('ENSENYA els serveis amb preu «des de» però NO suma cap total (#1371)', () => {
    const a: AnimacioProduct = { id: 'orbita:dj', nom: 'DJ', descripcio: ['x'], inclou: ['x'], priceFrom: 200 };
    const html = build(client, [a], { travelKm: 90, location: 'Arenys de Munt' });
    expect(html).toContain('class="bud-page"');
    // El preu del servei SÍ hi és (el que val), com a referència.
    expect(html).toContain('200');
    // El dossier és presentació de valor, NO una factura: cap total sumat que espanti.
    expect(html).not.toContain('class="bud-total"');
  });

  it('mostra la RUTA concreta de l\'esdeveniment per a una decisió conscient (#1394)', () => {
    const a: AnimacioProduct = { id: 'orbita:dj', nom: 'DJ', descripcio: ['x'], inclou: ['x'], priceFrom: 200 };
    const html = build(client, [a], { travelKm: 422, location: "l'Aldosa" });
    // El client veu ON és el seu bolo i quants km → decideix conscientment.
    expect(html).toContain("l'Aldosa");
    expect(html).toContain('422');
    // Segueix sent catàleg: cap total.
    expect(html).not.toContain('class="bud-total"');
  });

  it('el transport es mostra amb la seva xifra CLARA (no com a element del catàleg) (#1396)', () => {
    const a: AnimacioProduct = { id: 'orbita:dj', nom: 'DJ', descripcio: ['x'], inclou: ['x'], priceFrom: 150 };
    const html = build(client, [a], { travelKm: 422, location: "l'Aldosa" });
    expect(html).toContain('class="bud-page"');
    expect(html).toContain('150');
    // El desplaçament ja NO és només política: es mostra amb el seu cost concret.
    expect(html).toContain('class="bud-travel-price"');
    expect(html).toContain('Cost del desplaçament');
    // Segueix sense sumar un total dels elements (no és factura).
    expect(html).not.toContain('class="bud-total"');
  });

  it('funciona amb llista de productes buida', () => {
    const html = build(client, []);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Joan Pla');
  });
});
