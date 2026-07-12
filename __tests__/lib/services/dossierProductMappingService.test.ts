import { describe, expect, it } from 'vitest';
import type { AnimacioProduct } from '@/lib/constants/animacio-products';
import {
  DOSSIER_DJ_CONTINUATION_PRODUCT_ID,
  DOSSIER_DJ_PRODUCT_ID,
  buildDossierProductsForSelection,
  dossierDjHoursFromServiceLines,
  orderDossierProductsForDossier,
  productIdsFromDossierServiceLines,
  productToDossierServiceLine,
} from '@/lib/services/dossierProductMappingService';

const products: AnimacioProduct[] = [
  { id: DOSSIER_DJ_PRODUCT_ID, nom: 'DJ Òrbita', descripcio: ['DJ'], inclou: ['DJ'], priceFrom: 150 },
  { id: DOSSIER_DJ_CONTINUATION_PRODUCT_ID, nom: 'Hora extra DJ amb equip muntat', descripcio: ['DJ'], inclou: ['DJ'], priceFrom: 100 },
  { id: 'orbita:pont-llums-caps-mobils', nom: 'Pont de llums + caps mòbils', descripcio: ['Llums'], inclou: ['Pont'], priceFrom: 180 },
  { id: 'collab:masq-bingo', nom: 'Bingo Musical', descripcio: ['Bingo'], inclou: ['Animació'], priceFrom: 250, sourceProviderId: 'carlos-lucas-fernandez', sourceProviderName: 'Masquerade Events', sourceProductId: 'masq-bingo', sourceCostPrice: 200 },
];

describe('dossierProductMappingService', () => {
  it('mapeja línies DJ a un sol producte i deriva les hores pel dossier', () => {
    const lines = [
      { kind: 'DJ', label: 'DJ · primera hora', revenueAmount: 150, quantity: 1 },
      { kind: 'DJ', label: 'DJ · hora extra', revenueAmount: 100, quantity: 2 },
    ];
    expect(productIdsFromDossierServiceLines(lines, products)).toEqual([DOSSIER_DJ_PRODUCT_ID]);
    expect(dossierDjHoursFromServiceLines(lines)).toBe(3);
    expect(buildDossierProductsForSelection(products, [DOSSIER_DJ_PRODUCT_ID], 3)[0]).toMatchObject({
      id: DOSSIER_DJ_PRODUCT_ID,
      durada: '3h',
      priceFrom: 350,
    });
  });

  it('manté la hora DJ amb equip muntat com a producte separat de la primera hora', () => {
    const lines = [
      { kind: 'PROVIDER_SERVICE', label: 'Bingo Musical KIDS · Masquerade', revenueAmount: 200, quantity: 1 },
      { kind: 'DJ', label: 'DJ · hora extra amb equip muntat', revenueAmount: 100, quantity: 1 },
    ];

    expect(productIdsFromDossierServiceLines(lines, products)).toContain(DOSSIER_DJ_CONTINUATION_PRODUCT_ID);
    expect(productIdsFromDossierServiceLines(lines, products)).not.toContain(DOSSIER_DJ_PRODUCT_ID);
    expect(dossierDjHoursFromServiceLines(lines)).toBe(1);
    expect(productToDossierServiceLine(products[1])).toMatchObject({
      kind: 'DJ',
      label: 'DJ · hora extra amb equip muntat',
      revenueAmount: 100,
      quantity: 1,
    });
  });

  it('mapeja equip per etiqueta normalitzada encara que porti accents', () => {
    const ids = productIdsFromDossierServiceLines(
      [{ kind: 'EQUIPMENT', label: 'Pont de llums + caps mobils', revenueAmount: 180, quantity: 1 }],
      products,
    );
    expect(ids).toEqual(['orbita:pont-llums-caps-mobils']);
  });

  it('crea línia de lead amb cost intern per productes de partner', () => {
    expect(productToDossierServiceLine(products[3])).toMatchObject({
      collaboratorId: 'carlos-lucas-fernandez',
      kind: 'PROVIDER_SERVICE',
      revenueAmount: 250,
      costAmount: 200,
      notes: 'Producte de catàleg: masq-bingo',
    });
  });

  it('prioritza l ID de catàleg de notes abans de fer matching per nom o partner', () => {
    const ids = productIdsFromDossierServiceLines(
      [{
        collaboratorId: 'carlos-lucas-fernandez',
        kind: 'PROVIDER_SERVICE',
        label: 'Animació musical venuda amb nom comercial canviat',
        revenueAmount: 250,
        costAmount: 200,
        quantity: 1,
        notes: 'Producte de catàleg: masq-bingo',
      }],
      products,
    );

    expect(ids).toEqual(['collab:masq-bingo']);
  });

  it('ordena el dossier amb experiències visuals abans que extres/equipament', () => {
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
    const noImageMain: AnimacioProduct = {
      id: 'collab:adults',
      nom: 'Animació adults 1h',
      categoria: 'Animació adulta',
      descripcio: ['Animació principal sense foto.'],
      inclou: ['Animador'],
      priceFrom: 192,
      dossierSortOrder: 2,
    };

    const ordered = orderDossierProductsForDossier([bubble, noImageMain, pirates]);

    expect(ordered.map((product) => product.nom)).toEqual([
      'El secret dels pirates',
      'Animació adults 1h',
      'Màquina de bombolles',
    ]);
  });
});
