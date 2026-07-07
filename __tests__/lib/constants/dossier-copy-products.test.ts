import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => ({
    raw: (key: string) => ({
      'dj-primera-hora': {
        nom: 'DJ professional',
        descripcio: ['Primera hora {first}; extres {extra}.'],
        inclou: ['DJ professional'],
      },
      bombolles: {
        nom: 'Bombolles',
        descripcio: ['Bombolles gegants.'],
        inclou: ['Material'],
      },
      'pont-llums-caps-mobils': {
        nom: 'Pont de llums',
        descripcio: ['Llums per a la pista.'],
        inclou: ['Caps mòbils'],
      },
      'operari-extra': {
        nom: 'Operari extra',
        descripcio: ['Suport tècnic.'],
        inclou: ['Operari'],
      },
    })[key],
  })),
}));

import { getOrbitaDossierProducts } from '@/lib/constants/dossier-copy';

describe('getOrbitaDossierProducts', () => {
  it('propaga imatges locals només als productes propis amb actiu coherent', async () => {
    const products = await getOrbitaDossierProducts('ca');
    const byId = new Map(products.map((product) => [product.id, product]));

    expect(byId.get('orbita:dj-primera-hora')?.image).toBe('/img/portfolio/discomovil/discomovil-01.avif');
    expect(byId.get('orbita:pont-llums-caps-mobils')?.image).toBe('/img/portfolio/produccion-tecnica/produccion-tecnica-01.avif');
    expect(byId.get('orbita:bombolles')?.image).toBeUndefined();
    expect(byId.get('orbita:operari-extra')?.image).toBeUndefined();
  });
});
