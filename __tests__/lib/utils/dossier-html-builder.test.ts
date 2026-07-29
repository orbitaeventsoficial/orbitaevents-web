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
    greeting: 'Hola {name},',
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
    kicker: 'En resum',
    title: 'Tot el que us proposem',
    lead: 'El punt de partida —el «des de»— i com funciona el desplaçament.',
  },
  budget: {
    servicesLabel: 'Les propostes',
    travelTitle: 'Desplaçament',
    travelNote: 'Inclòs fins a {includedKm} km anada i tornada; després, cost real del trajecte.',
    travelRoute: 'El vostre esdeveniment és a {location}, a uns {km} km (anada i tornada). El desplaçament s\'aplica sobre aquesta ruta.',
    travelRouteIncluded: 'El vostre esdeveniment és a {location}, a uns {km} km (anada i tornada): el desplaçament us queda inclòs.',
    travelPriceLabel: 'Cost del desplaçament',
    travelBreakdownLabel: 'Desglossament',
    travelBreakdownVehicle: 'Vehicle i combustible',
    travelBreakdownVehicleDetail: '{km} km facturables · {rate}/km',
    travelBreakdownPeople: '{headcount} operaris en ruta · {hours} h',
    travelBreakdownTolls: 'Peatges de ruta',
    travelBreakdownMeals: 'Dietes de ruta llarga',
    vatNote: 'Preus sense IVA. El pressupost definitiu desglossa IVA, transport i total final.',
  },
  cta: { label: 'Per confirmar disponibilitat o per a qualsevol dubte' },
};

function build(
  c: DossierClientInfo,
  products: AnimacioProduct[],
  options?: { autoPrint?: boolean; logoDataUri?: string; locale?: string; travelKm?: number; travelTollsEur?: number; location?: string; assetBaseUrl?: string },
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

  it('indica que els preus del dossier no inclouen IVA', () => {
    const html = build(client, [productWithTrams]);
    expect(html).toContain('Preus sense IVA');
  });

  it('pinta la imatge del producte quan el catàleg en porta una', () => {
    const html = build(client, [{
      ...productWithTrams,
      image: '/img/collaborators/masquerade/bingo-musical.jpg',
    }]);
    expect(html).toContain('class="producte-media"');
    expect(html).toContain('src="/img/collaborators/masquerade/bingo-musical.jpg"');
    expect(html).toContain('alt="Bingo Musical"');
  });

  it('usa contenidors responsius i no retalla les imatges del dossier', () => {
    const html = build(client, [{
      ...productWithTrams,
      image: '/img/collaborators/masquerade/secret-pirates.jpg',
    }]);
    expect(html).toContain('display: flex; align-items: center; justify-content: center');
    expect(html).toContain('object-fit: contain !important');
    expect(html).toContain('max-width: 100%; max-height: min(72vh, 640px)');
    expect(html).not.toContain('aspect-ratio: 1 / 1');
    expect(html).not.toContain('object-fit: cover');
  });

  it('pot absolutitzar imatges quan la preview viu en un blob', () => {
    const html = build(client, [{
      ...productWithTrams,
      image: '/img/collaborators/masquerade/bingo-musical.jpg',
    }], { assetBaseUrl: 'http://localhost:3000' });
    expect(html).toContain('src="http://localhost:3000/img/collaborators/masquerade/bingo-musical.jpg"');
  });

  it('no crea cap bloc visual buit quan el producte no té imatge', () => {
    const html = build(client, [productWithTrams]);
    expect(html).not.toContain('class="producte-media"');
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

  it('genera la salutació des de la copy (monocapa, {name} interpolat, sense «Hola» hardcoded)', () => {
    const html = build(client, [productWithTrams]);
    expect(html).toContain('Hola Joan Pla,');
  });

  it('deriva l\'idioma del document del locale (en-GB → lang="en")', () => {
    const html = build(client, [productWithTrams], { locale: 'en-GB' });
    expect(html).toContain('<html lang="en">');
    expect(html).not.toContain('<html lang="ca">');
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

  it('ordena el resum i els capítols perquè els extres no passin davant d\'un espectacle principal', () => {
    const bubble: AnimacioProduct = {
      id: 'orbita:bombolles',
      nom: 'Màquina de bombolles',
      categoria: 'Efectes',
      descripcio: ['Extra visual.'],
      inclou: ['Màquina'],
      priceFrom: 50,
      dossierSortOrder: 1,
    };
    const pirates: AnimacioProduct = {
      id: 'collab:pirates',
      nom: 'El secret dels pirates',
      categoria: 'Animació infantil',
      image: '/img/collaborators/masquerade/secret-pirates.jpg',
      descripcio: ['Musical infantil.'],
      inclou: ['2 actors'],
      priceFrom: 385,
      dossierSortOrder: 5,
    };
    const html = build(client, [bubble, pirates]);

    expect(html.indexOf('Capítol 01')).toBeLessThan(html.indexOf('El secret dels pirates'));
    expect(html.indexOf('El secret dels pirates')).toBeLessThan(html.indexOf('Màquina de bombolles'));
    expect(html.indexOf('<span class="resum-card-num">01</span>')).toBeLessThan(html.indexOf('<h3>El secret dels pirates</h3>'));
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

  it('UNA sola pàgina de proposta: preus «des de», sense suma ni pàgina duplicada (#1397)', () => {
    const a: AnimacioProduct = {
      id: 'orbita:dj-base', nom: 'DJ base', descripcio: ['Servei base de DJ.'], inclou: ['DJ professional'], priceFrom: 250,
    };
    const b: AnimacioProduct = {
      id: 'orbita:bingo', nom: 'Bingo Musical', descripcio: ['Bingo animat.'], inclou: ['Animador'], priceFrom: 240,
    };
    const html = build(client, [a, b]);
    expect(html).toContain('Tot el que us proposem');
    // Els preus «des de» de cada element hi són com a referència.
    expect(html).toContain('250');
    expect(html).toContain('240');
    // MAI la suma dels elements (250 + 240 = 490).
    expect(html).not.toContain('490');
    // Fusió #1397: una sola pàgina de proposta, cap pàgina de pressupost paral·lela.
    expect(html.match(/class="resum-page"/g)?.length).toBe(1);
    expect(html.match(/class="resum-card"/g)?.length).toBe(2);
    expect(html).not.toContain('class="bud-page"');
    expect(html).not.toContain('class="resum-total"');
    expect(html).not.toContain('resum-row-dots');
  });

  it('el transport surt JUST DESPRÉS dels productes, a la MATEIXA pàgina, amb xifra clara (#1397)', () => {
    const a: AnimacioProduct = { id: 'orbita:dj', nom: 'DJ', descripcio: ['x'], inclou: ['x'], priceFrom: 200 };
    const html = build(client, [a], { travelKm: 422, travelTollsEur: 18.5, location: "l'Aldosa" });
    // Ordre: la llista de productes va abans que el bloc de desplaçament.
    const productsIndex = html.indexOf('class="resum-list"');
    const travelIndex = html.indexOf('class="bud-travel-price"');
    expect(productsIndex).toBeGreaterThan(-1);
    expect(travelIndex).toBeGreaterThan(productsIndex);
    // El client veu la ruta real i el cost concret del desplaçament; el vehicle usa km facturables.
    expect(html).toContain("l'Aldosa");
    expect(html).toContain('422');
    expect(html).toContain('Cost del desplaçament');
    expect(html).toContain('Desglossament');
    expect(html).toContain('Vehicle i combustible');
    expect(html).toContain('372 km facturables');
    expect(html).toContain('2 operaris en ruta');
    expect(html).toContain('Peatges de ruta');
    expect(html).toContain('Dietes de ruta llarga');
    // Tot dins la mateixa (única) pàgina de proposta.
    expect(html.match(/class="resum-page"/g)?.length).toBe(1);
  });

  it('ruta dins la franquícia (cas Vilassar, 44 km a/t): copy d\'inclòs, sense càrrec i franquícia en anada i tornada', () => {
    const a: AnimacioProduct = { id: 'orbita:dj', nom: 'DJ', descripcio: ['x'], inclou: ['x'], priceFrom: 200 };
    const html = build(client, [a], { travelKm: 44, location: 'Vilassar' });
    // La nota parla en la MATEIXA unitat que la ruta: 50 km anada i tornada (INCLUDED_TRAVEL_KM), no 25 d'anada.
    expect(html).toContain('Inclòs fins a 50 km anada i tornada');
    expect(html).not.toContain('fins a 25 km');
    // El cervell diu càrrec 0 → el copy diu inclòs, mai «el desplaçament s\'aplica».
    expect(html).toContain('44 km (anada i tornada): el desplaçament us queda inclòs');
    expect(html).not.toContain('s\'aplica sobre aquesta ruta');
    expect(html).not.toContain('class="bud-travel-price"');
  });

  it('ruta per sobre de la franquícia: copy de càrrec aplicat coherent amb el preu pintat', () => {
    const a: AnimacioProduct = { id: 'orbita:dj', nom: 'DJ', descripcio: ['x'], inclou: ['x'], priceFrom: 200 };
    const html = build(client, [a], { travelKm: 180, location: 'Reus' });
    expect(html).toContain('180 km (anada i tornada). El desplaçament s\'aplica sobre aquesta ruta');
    expect(html).not.toContain('queda inclòs');
    expect(html).toContain('class="bud-travel-price"');
  });

  it('no mostra cap recàrrec de temporada al dossier encara que hi hagi data', () => {
    const a: AnimacioProduct = {
      id: 'orbita:dj-base', nom: 'DJ base', descripcio: ['Servei base de DJ.'], inclou: ['DJ professional'], priceFrom: 250,
    };
    const b: AnimacioProduct = {
      id: 'orbita:bingo', nom: 'Bingo Musical', descripcio: ['Bingo animat.'], inclou: ['Animador'], priceFrom: 240,
    };
    const html = build(client, [a, b]);

    expect(html).not.toContain('class="bud-season"');
    expect(html).not.toContain('Recàrrec alta temporada');
    expect(html).not.toContain('+15% sobre');
    expect(html).toContain('250');
    expect(html).toContain('240');
    expect(html).not.toContain('490');
  });

  it('no conserva cap classe de recàrrec de temporada al dossier base', () => {
    const a: AnimacioProduct = { id: 'orbita:dj', nom: 'DJ', descripcio: ['x'], inclou: ['x'], priceFrom: 150 };
    const html = build(client, [a]);

    expect(html).not.toContain('class="bud-season"');
    expect(html).not.toContain('Recàrrec alta temporada');
  });

  it('sense km coneguts NO es pinta la secció de transport (#1397)', () => {
    const a: AnimacioProduct = { id: 'orbita:dj', nom: 'DJ', descripcio: ['x'], inclou: ['x'], priceFrom: 150 };
    const html = build(client, [a]);
    // La pàgina de proposta hi és (amb el preu), però sense bloc de desplaçament.
    expect(html).toContain('class="resum-page"');
    expect(html).toContain('150');
    expect(html).not.toContain('class="bud-travel-price"');
    expect(html).not.toContain('cost real del trajecte');
  });

  it('no pinta la pàgina de proposta amb llista de productes buida', () => {
    const html = build(client, []);
    expect(html).not.toContain('class="resum-page"');
  });

  it('funciona amb llista de productes buida', () => {
    const html = build(client, []);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Joan Pla');
  });
});
