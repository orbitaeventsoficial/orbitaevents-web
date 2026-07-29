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

function pdfText(doc: Awaited<ReturnType<typeof generateDossierCompositePDF>>): string {
  return String((doc as unknown as { internal: { pages: unknown[][] } }).internal.pages.flat().join('\n'));
}

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

  it('obre la introducció amb narrativa de valor, no amb una frase genèrica de catàleg', async () => {
    const doc = await generateDossierCompositePDF({
      client: {
        nom: 'Joan Pla',
        eventDesc: 'Festa privada',
      },
      products: [product],
      productIds: ['bingo-musical'],
      locale: 'ca',
    });
    const text = pdfText(doc);

    expect(text).toContain('Ritme, joc i moments que la gent');
    expect(text).toContain('recorda.');
    expect(text).toContain('Aquest dossier ordena una opció');
    expect(text).toContain('què anima, què acompanya');
    expect(text).not.toContain('Mireu què podem portar a la vostra festa.');
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

  it('afegeix desplaçament al PDF complet quan el dossier porta transport', async () => {
    const doc = await generateDossierCompositePDF({
      client: { nom: 'Joan Pla' },
      products: [product],
      productIds: ['bingo-musical'],
      transport: {
        travelKm: 422,
        travelTollsEur: 18.5,
        travelLocation: "l'Aldosa",
      },
      locale: 'ca',
    });
    const text = pdfText(doc);

    expect(doc.internal.pages.length - 1).toBeGreaterThanOrEqual(4);
    expect(text).toContain('DESPLAÇAMENT');
    expect(text).toContain('Cost del desplaçament');
    expect(text).toContain("l'Aldosa · 422 km");
    expect(text).toContain('Peatges de ruta');
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
          costPrice: 320,
          sellPrice: 385,
        },
      ],
      locale: 'ca',
    });

    expect(doc.internal.pages.length - 1).toBe(4);
    expect(doc.output('arraybuffer').byteLength).toBeGreaterThan(1000);
  });

  it('manté el mateix ordre editorial que el dossier HTML: espectacle principal abans que extra', async () => {
    const doc = await generateDossierCompositePDF({
      client: { nom: 'Joan Pla' },
      products: [
        {
          id: 'orbita:bombolles',
          nom: 'Màquina de bombolles',
          categoria: 'Efectes',
          descripcio: ['Extra visual.'],
          inclou: ['Màquina'],
          priceFrom: 50,
          dossierSortOrder: 1,
        },
        {
          id: 'collab:pirates',
          nom: 'El secret dels pirates',
          categoria: 'Animació infantil',
          image: '/img/collaborators/masquerade/secret-pirates.jpg',
          descripcio: ['Musical infantil amb aventura pirata.'],
          inclou: ['2 actors'],
          priceFrom: 385,
          dossierSortOrder: 5,
        },
      ],
      productIds: ['orbita:bombolles', 'collab:pirates'],
      locale: 'ca',
    });
    const text = pdfText(doc);

    expect(text.indexOf('El secret dels pirates')).toBeGreaterThan(-1);
    expect(text.indexOf('Màquina de bombolles')).toBeGreaterThan(-1);
    expect(text.indexOf('El secret dels pirates')).toBeLessThan(text.indexOf('Màquina de bombolles'));
  });
});
