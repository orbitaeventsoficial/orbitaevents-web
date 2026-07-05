import { describe, expect, it } from 'vitest';
import type { AnimacioProduct } from '@/lib/constants/animacio-products';
import {
  DOSSIER_DJ_PRODUCT_ID,
  buildDossierProductsForSelection,
  dossierDjHoursFromServiceLines,
  productIdsFromDossierServiceLines,
  productToDossierServiceLine,
} from '@/lib/services/dossierProductMappingService';

const products: AnimacioProduct[] = [
  { id: DOSSIER_DJ_PRODUCT_ID, nom: 'DJ Òrbita', descripcio: ['DJ'], inclou: ['DJ'], priceFrom: 150 },
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

  it('mapeja equip per etiqueta normalitzada encara que porti accents', () => {
    const ids = productIdsFromDossierServiceLines(
      [{ kind: 'EQUIPMENT', label: 'Pont de llums + caps mobils', revenueAmount: 180, quantity: 1 }],
      products,
    );
    expect(ids).toEqual(['orbita:pont-llums-caps-mobils']);
  });

  it('crea línia de lead amb cost intern per productes de partner', () => {
    expect(productToDossierServiceLine(products[2])).toMatchObject({
      collaboratorId: 'carlos-lucas-fernandez',
      kind: 'PROVIDER_SERVICE',
      revenueAmount: 250,
      costAmount: 200,
      notes: 'Producte de catàleg: masq-bingo',
    });
  });
});
