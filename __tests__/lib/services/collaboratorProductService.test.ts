import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    collaboratorProduct: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    collaborator: {
      findUnique: vi.fn(),
    },
    dossier: {
      count: vi.fn(),
    },
  },
}));
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  collaboratorProductToAnimacioProduct,
  collaboratorProductToDossierProduct,
  parseDossierCollaboratorProductId,
  toDossierCollaboratorProductId,
  listCollaboratorProducts,
  listDossierCollaboratorProducts,
  listActiveCollaboratorProductsForBooking,
  createCollaboratorProduct,
  updateCollaboratorProduct,
  deleteCollaboratorProduct,
  stripProviderBrand,
} from '@/lib/services/collaboratorProductService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.collaboratorProduct.findUnique.mockResolvedValue({
    id: 'p1',
    name: 'Producte inactiu',
    isActive: false,
    visibleInDossier: false,
    visibleInBooking: false,
  });
  mockPrisma.dossier.count.mockResolvedValue(0);
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
    costPrice: 320,
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
    expect(product.costPrice).toBe(320);
    expect(product.imageUrl).toBe('/img/pirates.jpg');
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
    expect(dossierProduct.sourceCostPrice).toBe(320);
    expect(dossierProduct.image).toBe('/img/pirates.jpg');
  });

  it('inclou qualsevol producte actiu de partner al catàleg del dossier', async () => {
    mockPrisma.collaboratorProduct.findMany.mockResolvedValue([
      {
        ...rawProduct,
        id: 'prod-nou',
        name: 'Viatge musical pel món',
        category: 'Animació infantil',
        collaboratorId: 'collab-1',
        isActive: true,
      },
    ]);

    const products = await listDossierCollaboratorProducts();

    expect(mockPrisma.collaboratorProduct.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { isActive: true, visibleInDossier: true, collaborator: { isActive: true } },
    }));
    expect(products).toHaveLength(1);
    expect(products[0]).toEqual(expect.objectContaining({
      id: 'collab:prod-nou',
      nom: 'Viatge musical pel món',
      categoria: 'Animació infantil',
    }));
  });

  it('oculta del configurador el producte intern de so Isma', async () => {
    mockPrisma.collaboratorProduct.findMany.mockResolvedValue([
      {
        ...rawProduct,
        id: 'isma-altaveus',
        name: 'Lloguer altaveus DJ',
        category: 'Cost intern DJ',
        collaboratorId: 'isma-lloguer-altaveus',
        costPrice: 50,
        sellPrice: 0,
        visibleInDossier: false,
        visibleInBooking: true,
        collaborator: { name: 'Isma', company: 'Isma — lloguer altaveus', roles: ['EQUIPMENT_RENTAL', 'PROVIDER'] },
      },
    ]);

    const products = await listActiveCollaboratorProductsForBooking();

    expect(mockPrisma.collaboratorProduct.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { isActive: true, visibleInBooking: true, collaborator: { isActive: true } },
    }));
    expect(products).toEqual([]);
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
      costPrice: 200.126,
      sellPrice: 250.455,
      category: '  Bingo  ',
      crew: '',
      sortOrder: -4,
    });
    expect(res.status).toBe(201);
    const data = mockPrisma.collaboratorProduct.create.mock.calls[0][0].data;
    expect(data.name).toBe('Bingo');
    expect(data.category).toBe('Bingo');
    expect(data.crew).toBeNull();
    expect(data.costPrice).toBe(200.13);
    expect(data.sellPrice).toBe(250.46);
    expect(data.sortOrder).toBe(0);
    expect(data.visibleInDossier).toBe(true);
    expect(data.visibleInBooking).toBe(true);
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
    const res = await updateCollaboratorProduct('p1', { costPrice: '120.126', sellPrice: 300.455, sortOrder: 2.7 });
    expect(res.status).toBe(200);
    const data = mockPrisma.collaboratorProduct.update.mock.calls[0][0].data;
    expect(data.costPrice).toBe(120.13);
    expect(data.sellPrice).toBe(300.46);
    expect(data.sortOrder).toBe(3);
    expect(data.name).toBeUndefined();
  });

  it('neutralitza sortOrder brut en actualitzar', async () => {
    mockPrisma.collaboratorProduct.update.mockResolvedValue({ id: 'p1', sortOrder: 0 });
    const res = await updateCollaboratorProduct('p1', { sortOrder: -8 });

    expect(res.status).toBe(200);
    expect(mockPrisma.collaboratorProduct.update.mock.calls[0][0].data.sortOrder).toBe(0);
  });
});

describe('deleteCollaboratorProduct', () => {
  it('elimina el producte només si és inactiu i sense dossiers vinculats', async () => {
    mockPrisma.collaboratorProduct.delete.mockResolvedValue({});
    const res = await deleteCollaboratorProduct('p1');
    expect(res.status).toBe(200);
    expect(mockPrisma.dossier.count).toHaveBeenCalledWith({
      where: { productIds: { has: 'collab:p1' } },
    });
    expect(mockPrisma.collaboratorProduct.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
  });

  it('retorna 404 si el producte no existeix', async () => {
    mockPrisma.collaboratorProduct.findUnique.mockResolvedValueOnce(null);

    const res = await deleteCollaboratorProduct('ghost');

    expect(res.status).toBe(404);
    expect(mockPrisma.collaboratorProduct.delete).not.toHaveBeenCalled();
  });

  it('bloqueja esborrar un producte actiu visible', async () => {
    mockPrisma.collaboratorProduct.findUnique.mockResolvedValueOnce({
      id: 'p1',
      name: 'Bingo Musical KIDS',
      isActive: true,
      visibleInDossier: true,
      visibleInBooking: true,
    });

    const res = await deleteCollaboratorProduct('p1');

    expect(res.status).toBe(409);
    expect(res.body.impact).toEqual(expect.objectContaining({
      isActive: true,
      visibleInDossier: true,
      visibleInBooking: true,
    }));
    expect(mockPrisma.collaboratorProduct.delete).not.toHaveBeenCalled();
  });

  it('bloqueja esborrar un producte inactiu si algun dossier el referencia', async () => {
    mockPrisma.dossier.count.mockResolvedValueOnce(2);

    const res = await deleteCollaboratorProduct('p1');

    expect(res.status).toBe(409);
    expect(res.body.impact).toEqual(expect.objectContaining({ dossierRefs: 2 }));
    expect(mockPrisma.collaboratorProduct.delete).not.toHaveBeenCalled();
  });

  it('bloqueja esborrar si no pot verificar dossiers vinculats', async () => {
    mockPrisma.dossier.count.mockRejectedValueOnce(new Error('db down'));

    const res = await deleteCollaboratorProduct('p1');

    expect(res.status).toBe(409);
    expect(res.body.impact).toEqual(expect.objectContaining({
      verificationFailed: ['dossierRefs'],
    }));
    expect(mockPrisma.collaboratorProduct.delete).not.toHaveBeenCalled();
  });
});
