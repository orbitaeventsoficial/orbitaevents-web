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
      domain: 'orbitaevents.com',
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
    titleQuoted: 'El pressupost',
    totalLabelQuoted: 'Total',
    vatNoteQuoted: 'Preus tancats. IVA no inclòs.',
  },
  cta: { label: 'Per confirmar disponibilitat o per a qualsevol dubte' },
};

function build(
  c: DossierClientInfo,
  products: AnimacioProduct[],
  options?: { autoPrint?: boolean; logoDataUri?: string; locale?: string; travelKm?: number; location?: string; quoteLines?: { label: string; amount: number }[] },
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

  it('numera els serveis des de 01', () => {
    const html = build(client, [productWithTrams, productWithDjOptions]);
    expect(html).toContain('class="fitxa-num">01<');
    expect(html).toContain('class="fitxa-num">02<');
  });

  it('obre amb la portada carbon i el nom del client, amb logo o sense', () => {
    const ambLogo = build(client, [productWithTrams], { logoDataUri: 'data:image/png;base64,abc' });
    expect(ambLogo).toContain('class="capçal"');
    expect(ambLogo).toContain('data:image/png;base64,abc');
    expect(ambLogo).toContain('Dossier preparat per a');

    const senseLogo = build(client, [productWithTrams]);
    expect(senseLogo).toContain('class="capçal"');
    expect(senseLogo).toContain('capçal-marca');
  });

  it('afegeix script autoPrint si cal', () => {
    const html = build(client, [productWithTrams], { autoPrint: true });
    expect(html).toContain('window.print()');
  });

  /**
   * L'explicació no es retalla mai.
   *
   * El document es va escurçar traient la pàgina en blanc que hi havia entre
   * servei i servei, no traient text: el propietari el fa servir per vendre.
   */
  it('conserva tota l\'explicació i tot el que inclou cada servei', () => {
    const producte: AnimacioProduct = {
      id: 'orbita:dj',
      nom: 'DJ professional',
      descripcio: ['Primer paràgraf.', 'Segon paràgraf.', 'Tercer paràgraf.'],
      inclou: ['Un', 'Dos', 'Tres', 'Quatre', 'Cinc', 'Sis'],
      priceFrom: 150,
    };
    const html = build(client, [producte]);
    for (const text of producte.descripcio) expect(html).toContain(text);
    for (const item of producte.inclou) expect(html).toContain(`<li>${item}</li>`);
  });

  // ─── El preu ────────────────────────────────────────────────────────────────

  /**
   * Ordre del propietari (2026-08-10): «si li ofereixo 2 h de DJ, posa 2 h de
   * DJ, no des de…». Amb el bolo muntat, el catàleg calla: un preu orientatiu
   * al costat d'un preu real només fa dubtar el client.
   */
  it('amb bolo muntat, mana la línia real i el "des de" desapareix del document', () => {
    const dj: AnimacioProduct = {
      id: 'orbita:dj-primera-hora',
      nom: 'DJ professional',
      descripcio: ['Servei base de DJ.'],
      inclou: ['DJ professional'],
      priceFrom: 150,
      categoria: 'DJ',
    };
    const html = build(client, [dj], {
      travelKm: 0,
      quoteLines: [{ label: 'DJ · 2 hores', amount: 250 }],
    });
    expect(html).toContain('DJ · 2 hores');
    expect(html).toContain('250');
    expect(html).not.toContain('des de');
    expect(html).not.toContain('class="fitxa-preu"');
  });

  it('amb bolo muntat, els rètols no diuen "orientatiu"', () => {
    const dj: AnimacioProduct = { id: 'orbita:dj', nom: 'DJ', descripcio: ['x'], inclou: ['x'], priceFrom: 150 };
    const html = build(client, [dj], { quoteLines: [{ label: 'DJ · 2 hores', amount: 250 }] });
    expect(html).toContain('Total</span>');
    expect(html).not.toContain('Total orientatiu');
    expect(html).not.toContain('Pressupost orientatiu');
  });

  it('sense bolo muntat, el catàleg orienta amb "des de" i amb "a mida"', () => {
    const dj: AnimacioProduct = {
      id: 'orbita:dj-primera-hora',
      nom: 'DJ professional',
      descripcio: ['Servei base de DJ.'],
      inclou: ['DJ professional'],
      priceFrom: 150,
    };
    const ambPreu = build(client, [dj]);
    expect(ambPreu).toContain('des de');
    expect(ambPreu).toContain('150');

    // Un producte sense priceFrom es declara «a mida» i mai ensenya el preu cru
    // d'un tram intern.
    const aMida = build(client, [productWithTrams]);
    expect(aMida).toContain('a mida');
    expect(aMida).not.toContain('900€');
  });

  /**
   * Regressió: abans la pàgina de preu només es pintava si hi havia
   * quilòmetres de desplaçament, i un dossier sense distància coneguda sortia
   * **sense cap preu enlloc**. El desplaçament és una secció de dins, no la
   * condició per existir.
   */
  it('pinta el preu encara que no hi hagi desplaçament', () => {
    const a: AnimacioProduct = { id: 'orbita:dj', nom: 'DJ', descripcio: ['x'], inclou: ['x'], priceFrom: 150 };
    const html = build(client, [a]);
    expect(html).toContain('class="full full--preu"');
    expect(html).toContain('150');
    expect(html).not.toContain('Desplaçament</div>');
  });

  it('suma el suplement de desplaçament al total', () => {
    const a: AnimacioProduct = { id: 'orbita:dj', nom: 'DJ', descripcio: ['x'], inclou: ['x'], priceFrom: 200 };
    // 90 km totals: 50 inclosos → 40 facturables → 2 trams × 10 € = 20 €.
    const html = build(client, [a], { travelKm: 90, location: 'Arenys de Munt' });
    expect(html).toContain('Arenys de Munt');
    expect(html).toContain('total-xifra');
    expect(html).toContain('220');
  });

  it('diu que el desplaçament va inclòs quan la distància hi cap', () => {
    const a: AnimacioProduct = { id: 'orbita:dj', nom: 'DJ', descripcio: ['x'], inclou: ['x'], priceFrom: 150 };
    const html = build(client, [a], { travelKm: 40 });
    expect(html).toContain('sense suplement');
    expect(html).toContain('150');
  });

  it('no pinta cap pàgina de preu si no hi ha ni línies ni preus de catàleg', () => {
    const html = build(client, [productWithTrams]);
    expect(html).not.toContain('class="full full--preu"');
  });

  it('funciona amb llista de productes buida', () => {
    const html = build(client, []);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Joan Pla');
  });
});
