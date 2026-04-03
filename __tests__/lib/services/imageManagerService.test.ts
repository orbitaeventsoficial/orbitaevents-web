import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockUploadFile, mockDeleteFile, mockProcessUpload } = vi.hoisted(() => ({
  mockPrisma: {
    imageAsset: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  },
  mockUploadFile: vi.fn(),
  mockDeleteFile: vi.fn(),
  mockProcessUpload: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/storage', () => ({
  uploadFile: mockUploadFile,
  deleteFile: mockDeleteFile,
  isLocalStorageUrl: (url: string) => url.includes('/api/uploads/'),
  extractPathFromUrl: (url: string) => url.match(/\/api\/uploads\/(.+)$/)?.[1] || null,
}));
vi.mock('@/lib/services/imageManagerProcessing', () => ({
  processImageManagerUpload: mockProcessUpload,
}));

import {
  getManagedImageOverride,
  getManagedImageCollection,
  getImageManagerPayload,
  uploadImageManagerAsset,
  deleteImageManagerAsset,
  saveImageManagerModifications,
  reorderImageManagerAssets,
  inferPlacementKind,
  invalidateCache,
} from '@/lib/services/imageManagerService';

const NOW = new Date('2026-04-03T10:00:00Z');

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cuid1',
    placement: 'services.bodas.hero',
    src: '/api/uploads/image-manager/test.avif',
    filePath: 'image-manager/test.avif',
    alt: 'Boda hero',
    label: null,
    mimeType: 'image/avif',
    width: 1600,
    height: 900,
    sizeBytes: 50000,
    sortOrder: 0,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  invalidateCache();
  mockPrisma.imageAsset.findFirst.mockResolvedValue(null);
  mockPrisma.imageAsset.findUnique.mockResolvedValue(null);
  mockPrisma.imageAsset.findMany.mockResolvedValue([]);
  mockPrisma.imageAsset.create.mockImplementation(({ data }) => Promise.resolve({ ...makeRow(), ...data, id: 'new1', createdAt: NOW, updatedAt: NOW }));
  mockPrisma.imageAsset.update.mockImplementation(({ data }) => Promise.resolve({ ...makeRow(), ...data }));
  mockPrisma.imageAsset.delete.mockResolvedValue(makeRow());
  mockPrisma.imageAsset.deleteMany.mockResolvedValue({ count: 0 });
  mockPrisma.imageAsset.count.mockResolvedValue(0);
  mockUploadFile.mockResolvedValue({ path: 'image-manager/test.avif', publicUrl: '/api/uploads/image-manager/test.avif' });
  mockDeleteFile.mockResolvedValue(undefined);
  mockProcessUpload.mockResolvedValue({
    buffer: Buffer.from('processed'),
    mimeType: 'image/avif',
    ext: '.avif',
    width: 1600,
    height: 900,
    sizeBytes: 50000,
  });
});

// ---------------------------------------------------------------------------
// inferPlacementKind
// ---------------------------------------------------------------------------

describe('inferPlacementKind', () => {
  it('retorna single per heroes', () => {
    expect(inferPlacementKind('services.bodas.hero')).toBe('single');
  });

  it('retorna collection per galeries', () => {
    expect(inferPlacementKind('services.bodas.gallery')).toBe('collection');
  });

  it('retorna collection per hero slides', () => {
    expect(inferPlacementKind('home.hero.slides')).toBe('collection');
  });

  it('retorna brand per layout', () => {
    expect(inferPlacementKind('layout.logo.header')).toBe('brand');
  });
});

// ---------------------------------------------------------------------------
// getManagedImageOverride
// ---------------------------------------------------------------------------

describe('getManagedImageOverride', () => {
  it('retorna null si no hi ha assets', async () => {
    const result = await getManagedImageOverride('services.bodas.hero');
    expect(result).toBeNull();
    // Ara usa cache intern (findMany una vegada, filtra en memòria)
    expect(mockPrisma.imageAsset.findMany).toHaveBeenCalledWith({ orderBy: { sortOrder: 'asc' } });
  });

  it('retorna asset mapejat correctament', async () => {
    mockPrisma.imageAsset.findMany.mockResolvedValue([makeRow()]);

    const result = await getManagedImageOverride('services.bodas.hero');
    expect(result).toEqual({
      id: 'cuid1',
      src: '/api/uploads/image-manager/test.avif',
      alt: 'Boda hero',
      path: 'image-manager/test.avif',
      label: undefined,
      mimeType: 'image/avif',
      width: 1600,
      height: 900,
      sizeBytes: 50000,
      sortOrder: 0,
      updatedAt: NOW.toISOString(),
    });
  });
});

// ---------------------------------------------------------------------------
// getManagedImageCollection
// ---------------------------------------------------------------------------

describe('getManagedImageCollection', () => {
  it('retorna null si no hi ha assets', async () => {
    const result = await getManagedImageCollection('home.hero.slides');
    expect(result).toBeNull();
  });

  it('retorna array ordenat', async () => {
    mockPrisma.imageAsset.findMany.mockResolvedValue([
      makeRow({ id: 'a', placement: 'home.hero.slides', sortOrder: 0 }),
      makeRow({ id: 'b', placement: 'home.hero.slides', sortOrder: 1, src: '/api/uploads/image-manager/b.avif' }),
    ]);

    const result = await getManagedImageCollection('home.hero.slides');
    expect(result).toHaveLength(2);
    expect(result![0].id).toBe('a');
    expect(result![1].id).toBe('b');
  });
});

// ---------------------------------------------------------------------------
// getImageManagerPayload
// ---------------------------------------------------------------------------

describe('getImageManagerPayload', () => {
  it('retorna placements amb mode auto per defecte', async () => {
    const result = await getImageManagerPayload();
    expect(result.ok).toBe(true);
    expect(result.placements.length).toBeGreaterThan(0);

    const bodas = result.placements.find((p) => p.key === 'services.bodas.hero');
    expect(bodas?.override.mode).toBe('auto');
    expect(bodas?.kind).toBe('single');
  });

  it('retorna mode manual si hi ha assets', async () => {
    mockPrisma.imageAsset.findMany.mockResolvedValue([
      makeRow({ placement: 'services.bodas.hero' }),
    ]);

    const result = await getImageManagerPayload();
    const bodas = result.placements.find((p) => p.key === 'services.bodas.hero');
    expect(bodas?.override.mode).toBe('manual');
    expect(bodas?.override.itemCount).toBe(1);
    expect(bodas?.override.items).toHaveLength(1);
  });

  it('inclou stats correctes', async () => {
    mockPrisma.imageAsset.findMany.mockResolvedValue([
      makeRow({ placement: 'services.bodas.hero' }),
    ]);

    const result = await getImageManagerPayload();
    expect(result.stats.manual).toBe(1);
    expect(result.stats.auto).toBe(result.stats.total - 1);
  });
});

// ---------------------------------------------------------------------------
// uploadImageManagerAsset
// ---------------------------------------------------------------------------

describe('uploadImageManagerAsset', () => {
  it('processa i puja un asset single', async () => {
    // Simular que ja existeix un asset previ (clearPlacement ha d'eliminar-lo)
    mockPrisma.imageAsset.findMany.mockResolvedValue([makeRow()]);

    const result = await uploadImageManagerAsset({
      key: 'services.bodas.hero',
      fileBuffer: Buffer.from('raw'),
      fileName: 'hero.jpg',
      mimeType: 'image/jpeg',
      alt: 'Boda hero',
    });

    expect(mockProcessUpload).toHaveBeenCalledWith('services.bodas.hero', expect.any(Buffer), 'image/jpeg', 'hero.jpg');
    expect(mockUploadFile).toHaveBeenCalled();
    expect(mockPrisma.imageAsset.deleteMany).toHaveBeenCalledWith({ where: { placement: 'services.bodas.hero' } });
    expect(mockPrisma.imageAsset.create).toHaveBeenCalled();
    expect(result.src).toBe('/api/uploads/image-manager/test.avif');
  });

  it('afegeix a col·lecció sense eliminar anteriors', async () => {
    mockPrisma.imageAsset.count.mockResolvedValue(3);

    await uploadImageManagerAsset({
      key: 'home.hero.slides',
      fileBuffer: Buffer.from('raw'),
      fileName: 'slide.jpg',
      mimeType: 'image/jpeg',
    });

    expect(mockPrisma.imageAsset.deleteMany).not.toHaveBeenCalled();
    expect(mockPrisma.imageAsset.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ sortOrder: 3 }),
    });
  });

  it('col·lecció amb replace elimina anteriors', async () => {
    // Simular assets existents perquè clearPlacement arribi a deleteMany
    mockPrisma.imageAsset.findMany.mockResolvedValue([
      makeRow({ id: 'old1', placement: 'home.hero.slides' }),
    ]);

    await uploadImageManagerAsset({
      key: 'home.hero.slides',
      fileBuffer: Buffer.from('raw'),
      fileName: 'slide.jpg',
      mimeType: 'image/jpeg',
      replace: true,
    });

    expect(mockPrisma.imageAsset.deleteMany).toHaveBeenCalledWith({ where: { placement: 'home.hero.slides' } });
  });

  it('rebutja placement desconegut', async () => {
    await expect(uploadImageManagerAsset({
      key: 'fake.placement',
      fileBuffer: Buffer.from('raw'),
      fileName: 'test.jpg',
    })).rejects.toThrow('Placement desconegut');
  });
});

// ---------------------------------------------------------------------------
// deleteImageManagerAsset
// ---------------------------------------------------------------------------

describe('deleteImageManagerAsset', () => {
  it('elimina tots els assets d\'un placement single', async () => {
    mockPrisma.imageAsset.findMany.mockResolvedValue([makeRow()]);

    await deleteImageManagerAsset({ key: 'services.bodas.hero' });
    expect(mockDeleteFile).toHaveBeenCalledWith('image-manager/test.avif');
    expect(mockPrisma.imageAsset.deleteMany).toHaveBeenCalled();
  });

  it('elimina un asset específic d\'una col·lecció', async () => {
    const target = makeRow({ id: 'target1', placement: 'home.hero.slides' });
    mockPrisma.imageAsset.findUnique.mockResolvedValue(target);
    mockPrisma.imageAsset.findMany.mockResolvedValue([]);

    await deleteImageManagerAsset({ key: 'home.hero.slides', assetId: 'target1' });
    expect(mockDeleteFile).toHaveBeenCalledWith('image-manager/test.avif');
    expect(mockPrisma.imageAsset.delete).toHaveBeenCalledWith({ where: { id: 'target1' } });
  });
});

// ---------------------------------------------------------------------------
// saveImageManagerModifications
// ---------------------------------------------------------------------------

describe('saveImageManagerModifications', () => {
  it('mode auto elimina assets', async () => {
    mockPrisma.imageAsset.findMany.mockResolvedValue([makeRow()]);

    const result = await saveImageManagerModifications({
      modifications: { 'services.bodas.hero': { mode: 'auto' } },
    });

    expect(result.ok).toBe(true);
    expect(mockPrisma.imageAsset.deleteMany).toHaveBeenCalled();
  });

  it('actualitza alt d\'un asset existent', async () => {
    mockPrisma.imageAsset.findMany.mockResolvedValue([makeRow()]);

    await saveImageManagerModifications({
      modifications: { 'services.bodas.hero': { mode: 'manual', alt: 'Nou alt' } },
    });

    expect(mockPrisma.imageAsset.update).toHaveBeenCalledWith({
      where: { id: 'cuid1' },
      data: expect.objectContaining({ alt: 'Nou alt' }),
    });
  });

  it('crea asset des d\'URL externa si no existeix', async () => {
    await saveImageManagerModifications({
      modifications: { 'services.bodas.hero': { mode: 'manual', src: 'https://extern.com/img.jpg' } },
    });

    expect(mockPrisma.imageAsset.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        placement: 'services.bodas.hero',
        src: 'https://extern.com/img.jpg',
      }),
    });
  });

  it('rebutja placement desconegut', async () => {
    await expect(saveImageManagerModifications({
      modifications: { 'fake.key': { mode: 'manual' } },
    })).rejects.toThrow('Placement desconegut');
  });
});

// ---------------------------------------------------------------------------
// reorderImageManagerAssets
// ---------------------------------------------------------------------------

describe('reorderImageManagerAssets', () => {
  it('actualitza sortOrder de cada item', async () => {
    await reorderImageManagerAssets({
      key: 'home.hero.slides',
      items: [
        { id: 'a', sortOrder: 1 },
        { id: 'b', sortOrder: 0 },
      ],
    });

    expect(mockPrisma.imageAsset.update).toHaveBeenCalledTimes(2);
    expect(mockPrisma.imageAsset.update).toHaveBeenCalledWith({ where: { id: 'a' }, data: { sortOrder: 1 } });
    expect(mockPrisma.imageAsset.update).toHaveBeenCalledWith({ where: { id: 'b' }, data: { sortOrder: 0 } });
  });
});

