import { describe, expect, it } from 'vitest';
import {
  buildDossierLineSnapshot,
  parseDossierLineSnapshot,
  productsFromDossierLineSnapshot,
  transportFromDossierLineSnapshot,
} from '@/lib/services/dossierSnapshotService';
import type { AnimacioProduct } from '@/lib/constants/animacio-products';

const product: AnimacioProduct = {
  id: 'collab:bingo',
  nom: 'Bingo Musical',
  image: '/img/bingo.webp',
  descripcio: ['Bingo participatiu'],
  inclou: ['DJ', 'Presentador'],
  durada: '2h',
  priceFrom: 240,
  categoria: 'Animació adulta',
  sourceProviderName: 'Masquerade',
  sourceProviderId: 'masquerade',
  sourceProductId: 'bingo',
  sourceCostPrice: 200,
};

describe('dossierSnapshotService', () => {
  it('construeix una foto immutable de productes i transport', () => {
    const snapshot = buildDossierLineSnapshot({
      products: [product],
      travelKm: 422.345,
      travelLocation: " l'Aldosa ",
    });

    expect(snapshot).toMatchObject({
      version: 1,
      travelKm: 422.35,
      travelLocation: "l'Aldosa",
      products: [
        expect.objectContaining({
          id: 'collab:bingo',
          nom: 'Bingo Musical',
          priceFrom: 240,
          sourceCostPrice: 200,
        }),
      ],
    });
  });

  it('parseja només snapshots vàlids amb productes', () => {
    expect(parseDossierLineSnapshot(null)).toBeNull();
    expect(parseDossierLineSnapshot({ version: 1, products: [] })).toBeNull();

    const parsed = parseDossierLineSnapshot({
      version: 1,
      products: [{ id: 'dj', nom: 'DJ', descripcio: ['Sessió'], inclou: ['Equip'] }],
      travelKm: 70,
    });

    expect(parsed?.products[0]).toMatchObject({ id: 'dj', nom: 'DJ' });
  });

  it('retorna productes i transport per consumir el snapshot', () => {
    const snapshot = buildDossierLineSnapshot({
      products: [product],
      travelKm: 50,
      travelLocation: 'Granollers',
    });

    expect(productsFromDossierLineSnapshot(snapshot)?.map((p) => p.id)).toEqual(['collab:bingo']);
    expect(transportFromDossierLineSnapshot(snapshot)).toEqual({
      travelKm: 50,
      travelLocation: 'Granollers',
    });
  });
});
