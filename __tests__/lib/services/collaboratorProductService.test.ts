import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    collaboratorProduct: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    collaborator: {
      findUnique: vi.fn(),
    },
  },
}));
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  computeProductMargin,
  collaboratorProductToAnimacioProduct,
  collaboratorProductToDossierProduct,
  parseDossierCollaboratorProductId,
  toDossierCollaboratorProductId,
  listCollaboratorProducts,
  createCollaboratorProduct,
  updateCollaboratorProduct,
  deleteCollaboratorProduct,
  stripProviderBrand,
} from '@/lib/services/collaboratorProductService';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('stripProviderBrand', () => {
  it('elimina la marca i el nom del proveïdor i neteja residus', () => {
    expect(stripProviderBrand('Espectacle de Masquerade Events per a tothom')).toBe('Espectacle de per a tothom');
    expect(stripProviderBrand('Gestionat per Carlos Lucas Fernández')).toBe('Gestionat per');
    expect(stripProviderBrand('Vestuari Masquerade · Desplaçament')).toBe('Vestuari · Desplaçament');
  });

  it('deixa intacte el text sense marca', () => {
    expect(stripProviderBrand('Animació en directe per a adults')).toBe('Animació en directe per a adults');
  });
});

describe('computeProductMargin', () => {
  it('calcula profit net i % sobre el cost del col·laborador', () => {
    const { marginNet, marginPct } = computeProductMargin(200, 240);
    expect(marginNet).toBe(40);
    expect(marginPct).toBeCloseTo(20, 1);
  });

  it('retorna 0% si el cost és 0', () => {
    const { marginNet, marginPct } = computeProductMargin(0, 100);
    expect(marginNet).toBe(100);
    expect(marginPct).toBe(0);
  });
});

describe('listCollaboratorProducts', () => {
  it('llista per col·laborador ordenat per sortOrder', async () => {
    mockPrisma.collaboratorProduct.findMany.mockResolvedValue([{ id: 'p1' }]);
    const res = await listCollaboratorProducts('col1');
    expect(res).toEqual([{ id: 'p1' }]);
    expect(mockPrisma.collaboratorProduct.findMany).toHaveBeenCalledWith({
      where: { collaboratorId: 'col1' },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  });
});

describe('dossier collaborator product mapping', () => {
  const rawProduct = {
    id: 'prod-1',
    name: 'El secret dels pirates',
    description: 'Musical infantil amb cançons en directe.',
    category: 'Musical',
    crew: '2 actors + tècnic de so',
    durationLabel: '70 min',
    sellPrice: 385,
    imageUrl: '/img/pirates.jpg',
    includes: "Vestuari d'alta qualitat · Desplaçament inclòs · Disponible en català",
    sortOrder: 1,
    collaborator: { name: 'Carlos Lucas Fernández', company: 'Masquerade Events' },
  };

  it('genera i parseja ids de dossier amb prefix de col·laborador', () => {
    expect(toDossierCollaboratorProductId('prod-1')).toBe('collab:prod-1');
    expect(parseDossierCollaboratorProductId('collab:prod-1')).toBe('prod-1');
    expect(parseDossierCollaboratorProductId('bingo-musical')).toBeNull();
  });

  it('converteix un producte de col·laborador a pack seleccionable de dossier', () => {
    const product = collaboratorProductToDossierProduct(rawProduct);
    expect(product.id).toBe('collab:prod-1');
    expect(product.nom).toBe('El secret dels pirates');
    expect(product.colaborador).toBe('Masquerade Events');
    expect(product.inclou).toContain('2 actors + tècnic de so');
    expect(product.inclou).toContain('Disponible en català');
    expect(product.sellPrice).toBe(385);
  });

  it('sanititza qualsevol menció de marca de proveïdor del text client-facing', () => {
    const branded = {
      ...rawProduct,
      description: 'Els personatges més entranyables de Masquerade obren un món de màgia. Gestionat per Carlos Lucas Fernández.',
      includes: 'Vestuari Masquerade · Desplaçament inclòs',
    };
    const product = collaboratorProductToDossierProduct(branded);
    const allText = [...product.descripcio, ...product.inclou, product.nom].join(' ');
    expect(allText).not.toMatch(/masquerade/i);
    expect(allText).not.toMatch(/carlos/i);
    expect(allText).toContain('Desplaçament inclòs');
  });

  it('converteix el pack a format narratiu compatible amb el dossier', () => {
    const product = collaboratorProductToDossierProduct(rawProduct);
    const dossierProduct = collaboratorProductToAnimacioProduct(product);
    expect(dossierProduct.id).toBe('collab:prod-1');
    expect(dossierProduct.nom).toBe('El secret dels pirates');
    expect(dossierProduct.inclou).toContain('Desplaçament inclòs');
    expect(dossierProduct.noInclou).toContain('IVA');
  });
});

describe('createCollaboratorProduct', () => {
  it('rebutja sense nom', async () => {
    const res = await createCollaboratorProduct('col1', { costPrice: 10, sellPrice: 20 });
    expect(res.status).toBe(400);
    expect(mockPrisma.collaboratorProduct.create).not.toHaveBeenCalled();
  });

  it('rebutja cost negatiu', async () => {
    const res = await createCollaboratorProduct('col1', { name: 'X', costPrice: -5, sellPrice: 20 });
    expect(res.status).toBe(400);
  });

  it('rebutja PVP no numèric', async () => {
    const res = await createCollaboratorProduct('col1', { name: 'X', costPrice: 10, sellPrice: 'abc' });
    expect(res.status).toBe(400);
  });

  it('retorna 404 si el col·laborador no existeix', async () => {
    mockPrisma.collaborator.findUnique.mockResolvedValue(null);
    const res = await createCollaboratorProduct('ghost', { name: 'X', costPrice: 10, sellPrice: 20 });
    expect(res.status).toBe(404);
  });

  it('crea el producte amb camps netejats', async () => {
    mockPrisma.collaborator.findUnique.mockResolvedValue({ id: 'col1' });
    mockPrisma.collaboratorProduct.create.mockResolvedValue({ id: 'p1', name: 'Bingo' });
    const res = await createCollaboratorProduct('col1', {
      name: '  Bingo  ',
      costPrice: 200,
      sellPrice: 250,
      category: '  Bingo  ',
      crew: '',
    });
    expect(res.status).toBe(201);
    const data = mockPrisma.collaboratorProduct.create.mock.calls[0][0].data;
    expect(data.name).toBe('Bingo');
    expect(data.category).toBe('Bingo');
    expect(data.crew).toBeNull();
    expect(data.costPrice).toBe(200);
    expect(data.sellPrice).toBe(250);
  });
});

describe('updateCollaboratorProduct', () => {
  it('rebutja PVP negatiu', async () => {
    const res = await updateCollaboratorProduct('p1', { sellPrice: -1 });
    expect(res.status).toBe(400);
    expect(mockPrisma.collaboratorProduct.update).not.toHaveBeenCalled();
  });

  it('actualitza només els camps presents', async () => {
    mockPrisma.collaboratorProduct.update.mockResolvedValue({ id: 'p1', sellPrice: 300 });
    const res = await updateCollaboratorProduct('p1', { sellPrice: 300 });
    expect(res.status).toBe(200);
    const data = mockPrisma.collaboratorProduct.update.mock.calls[0][0].data;
    expect(data.sellPrice).toBe(300);
    expect(data.name).toBeUndefined();
  });
});

describe('deleteCollaboratorProduct', () => {
  it('elimina el producte', async () => {
    mockPrisma.collaboratorProduct.delete.mockResolvedValue({});
    const res = await deleteCollaboratorProduct('p1');
    expect(res.status).toBe(200);
    expect(mockPrisma.collaboratorProduct.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
  });
});
