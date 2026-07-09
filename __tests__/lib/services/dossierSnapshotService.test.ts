import { describe, expect, it } from 'vitest';
import {
  buildDossierLineSnapshot,
  hydrateDossierSnapshotProductImages,
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
      travelTollsEur: 18.456,
      travelLocation: " l'Aldosa ",
      eventDate: '2026-07-17T20:30:00.000Z',
    });

    expect(snapshot).toMatchObject({
      version: 1,
      travelKm: 422.35,
      travelTollsEur: 18.46,
      travelLocation: "l'Aldosa",
      eventDate: '2026-07-17',
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
      travelTollsEur: 12.5,
      travelLocation: 'Granollers',
    });

    expect(productsFromDossierLineSnapshot(snapshot)?.map((p) => p.id)).toEqual(['collab:bingo']);
    expect(transportFromDossierLineSnapshot(snapshot)).toEqual({
      travelKm: 50,
      travelTollsEur: 12.5,
      travelLocation: 'Granollers',
    });
  });

  it('rehidrata imatges de productes congelats sense canviar el text del snapshot', () => {
    const hydrated = hydrateDossierSnapshotProductImages(
      [
        {
          ...product,
          nom: 'Bingo Musical congelat',
          image: undefined,
        },
        {
          ...product,
          id: 'collab:amb-imatge',
          sourceProductId: 'amb-imatge',
          image: '/img/snapshot.webp',
        },
      ],
      [
        {
          ...product,
          nom: 'Bingo Musical actual',
          image: '/img/catalog.webp',
        },
        {
          ...product,
          id: 'collab:amb-imatge',
          sourceProductId: 'amb-imatge',
          image: '/img/catalog-ignored.webp',
        },
      ],
    );

    expect(hydrated?.[0]).toEqual(expect.objectContaining({
      nom: 'Bingo Musical congelat',
      image: '/img/catalog.webp',
    }));
    expect(hydrated?.[1].image).toBe('/img/snapshot.webp');
  });

  it('substitueix imatges de snapshot que apunten a assets retirats', () => {
    const hydrated = hydrateDossierSnapshotProductImages(
      [{
        ...product,
        image: '/img/collaborators/masquerade/bingo-musical-cover.jpg',
      }],
      [],
    );

    expect(hydrated?.[0].image).toBe('/img/collaborators/masquerade/bingo-musical.jpg');
  });
});
