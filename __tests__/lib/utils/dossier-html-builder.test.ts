import { describe, it, expect, vi } from 'vitest';

vi.mock('@/app/config/site-config', () => ({
  SITE_CONFIG: {
    business: {
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
    totalLabel: 'Inversió orientativa de la proposta',
    customSuffix: '+ propostes a mida',
  },
  budget: {
    kicker: 'El pressupost',
    title: 'Pressupost orientatiu',
    lead: 'Desglossament amb desplaçament fins a {includedKm} km.',
    servicesLabel: 'Serveis seleccionats',
    travelTitle: 'Desplaçament',
    travelTo: 'Fins a {location}',
    travelTotalKm: '{km} km (anada i tornada)',
    travelIncludedKm: '{km} km inclosos',
    travelBillableKm: '{km} km a facturar',
    travelBlocks: '{blocks} tram(s) × {price}',
    travelIncludedAll: 'Desplaçament inclòs — sense suplement',
    travelLine: 'Suplement de desplaçament',
    travelNote: 'Inclòs fins a {includedKm} km; després {blockPrice} per {blockKm} km.',
    totalLabel: 'Total orientatiu',
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

  it('inclou el resum econòmic amb total "des de" sumant els priceFrom', () => {
    const a: AnimacioProduct = {
      id: 'orbita:dj-base',
      nom: 'DJ base',
      descripcio: ['Servei base de DJ.'],
      inclou: ['DJ professional'],
      priceFrom: 150,
    };
    const b: AnimacioProduct = {
      id: 'orbita:photocall',
      nom: 'Photocall',
      descripcio: ['Racó fotogràfic.'],
      inclou: ['Atrezzo'],
      priceFrom: 200,
    };
    const html = build(client, [a, b]);
    expect(html).toContain('Resum de la proposta');
    expect(html).toContain('class="resum-total"');
    expect(html).toContain('resum-total-value');
    // 150 + 200 = 350 → total formatat amb formatCurrency
    expect(html).toContain('350');
    // El total és sempre "des de"
    expect(html).toMatch(/resum-total-value">des de/);
  });

  it('el total marca "+ propostes a mida" si algun producte no té priceFrom', () => {
    const amb: AnimacioProduct = {
      id: 'orbita:dj-base',
      nom: 'DJ base',
      descripcio: ['Servei base de DJ.'],
      inclou: ['DJ professional'],
      priceFrom: 150,
    };
    const html = build(client, [amb, productWithTrams]);
    // productWithTrams no té priceFrom → contribueix com "a mida"
    expect(html).toContain('resum-total-mida');
    expect(html).toContain('propostes a mida');
    // El total només suma els priceFrom coneguts (150), mai els preus de trams
    expect(html).toContain('150');
    expect(html).not.toContain('900€');
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

  it('pinta el pressupost desglossat amb total = serveis + suplement de desplaçament', () => {
    const a: AnimacioProduct = { id: 'orbita:dj', nom: 'DJ', descripcio: ['x'], inclou: ['x'], priceFrom: 200 };
    // 90 km totals: 50 inclosos → 40 facturables → 2 trams × 10€ = 20€ suplement.
    const html = build(client, [a], { travelKm: 90, location: 'Arenys de Munt' });
    expect(html).toContain('class="bud-page"');
    expect(html).toContain('Pressupost orientatiu');
    expect(html).toContain('Arenys de Munt');
    // Total = 200 (servei) + 20 (transport) = 220
    expect(html).toContain('bud-total-value');
    expect(html).toContain('220');
  });

  it('marca "desplaçament inclòs sense suplement" si la distància és dins els km inclosos', () => {
    const a: AnimacioProduct = { id: 'orbita:dj', nom: 'DJ', descripcio: ['x'], inclou: ['x'], priceFrom: 150 };
    // 40 km totals < 50 inclosos → 0 suplement.
    const html = build(client, [a], { travelKm: 40 });
    expect(html).toContain('class="bud-page"');
    expect(html).toContain('sense suplement');
    // Total = només el servei (150), sense transport.
    expect(html).toContain('150');
  });

  it('funciona amb llista de productes buida', () => {
    const html = build(client, []);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Joan Pla');
  });
});
