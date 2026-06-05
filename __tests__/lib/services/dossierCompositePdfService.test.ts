import { describe, expect, it } from 'vitest';
import { generateDossierCompositePDF } from '@/lib/services/dossierCompositePdfService';
import type { AnimacioProduct } from '@/lib/constants/animacio-products';

const product: AnimacioProduct = {
  id: 'bingo-musical',
  nom: 'Bingo Musical',
  durada: '1h30',
  descripcio: ['Una experiencia participativa per obrir el ritme de la festa.'],
  inclou: ['Dinamitzacio', 'Musica', 'Premis opcionals'],
};

describe('generateDossierCompositePDF', () => {
  it('genera un dossier editorial: portada + introducció + capítol narratiu', async () => {
    const doc = await generateDossierCompositePDF({
      client: {
        nom: 'Joan Pla',
        eventDesc: 'Festa privada',
      },
      products: [product],
      productIds: ['bingo-musical'],
      locale: 'ca',
    });

    // Portada + introducció + 1 capítol = 3 pàgines (els preus van per capítol, sense annex).
    expect(doc.internal.pages.length - 1).toBeGreaterThanOrEqual(3);
    expect(doc.output('arraybuffer').byteLength).toBeGreaterThan(1000);
  });

  it('manté el dossier encara que no hi hagi servei de cataleg resolt', async () => {
    const doc = await generateDossierCompositePDF({
      client: { nom: 'Joan Pla' },
      products: [product],
      productIds: ['unknown-product'],
      locale: 'ca',
    });

    expect(doc.internal.pages.length - 1).toBe(3);
  });

  it('presenta els productes de col·laborador com a capítols propis', async () => {
    const doc = await generateDossierCompositePDF({
      client: { nom: 'Joan Pla' },
      products: [
        {
          id: 'collab:pirates',
          nom: 'El secret dels pirates',
          durada: '70 min',
          descripcio: ['Musical infantil amb aventura pirata.'],
          inclou: ['2 actors', 'Decoració', 'Tècnic de so'],
        },
      ],
      productIds: ['collab:pirates'],
      collaboratorProducts: [
        {
          id: 'collab:pirates',
          sourceProductId: 'pirates',
          nom: 'El secret dels pirates',
          categoria: 'Musical',
          durada: '70 min',
          colaborador: 'Masquerade Events',
          descripcio: ['Musical infantil amb aventura pirata.'],
          inclou: ['2 actors', 'Decoració', 'Tècnic de so'],
          sellPrice: 385,
        },
      ],
      locale: 'ca',
    });

    expect(doc.internal.pages.length - 1).toBe(4);
    expect(doc.output('arraybuffer').byteLength).toBeGreaterThan(1000);
  });
});
