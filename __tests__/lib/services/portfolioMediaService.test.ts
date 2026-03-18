/**
 * Tests del servei de media del portfolio (Portfolio Media Service).
 *
 * Aquest servei gestiona la pujada, llistat, actualització i eliminació
 * de fitxers multimèdia (imatges i vídeos) associats a les categories
 * del portfolio públic d'Òrbita Events.
 *
 * CONCEPTES CLAU:
 *
 * 1. SLUGS VÀLIDS: Només 9 categories predefinides (bodas, discomovil, etc.).
 *    Qualsevol slug fora d'aquesta llista es rebutja.
 *
 * 2. TIPUS DE MEDIA: Suporta imatges (jpeg, png, webp, avif, gif)
 *    i vídeos (mp4, webm, quicktime, mpeg). Altres MIME types es rebutgen.
 *
 * 3. SORTORDER: Cada media nou s'afegeix al final (max sortOrder + 1).
 *    Es pot reordenar manualment via updatePortfolioMedia.
 *
 * 4. ELIMINACIÓ: En eliminar un media, primer s'esborra el fitxer físic
 *    de storage i després el registre de la BD.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockUploadFile, mockDeleteFile, mockGetPublicUrl } = vi.hoisted(() => ({
  mockPrisma: {
    portfolioMedia: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
  },
  mockUploadFile: vi.fn(),
  mockDeleteFile: vi.fn(),
  mockGetPublicUrl: vi.fn((p: string) => `/api/uploads/${p}`),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

vi.mock('@/lib/storage', () => ({
  uploadFile: mockUploadFile,
  deleteFile: mockDeleteFile,
  getPublicUrl: mockGetPublicUrl,
}));

import {
  isValidSlug,
  detectMediaType,
  addPortfolioMedia,
  listPortfolioMedia,
  getPortfolioMediaCounts,
  updatePortfolioMedia,
  deletePortfolioMedia,
} from '@/lib/services/portfolioMediaService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.portfolioMedia.findMany.mockResolvedValue([]);
  mockPrisma.portfolioMedia.findUnique.mockResolvedValue(null);
  mockPrisma.portfolioMedia.create.mockResolvedValue({ id: 'media-1' });
  mockPrisma.portfolioMedia.update.mockResolvedValue({ id: 'media-1' });
  mockPrisma.portfolioMedia.delete.mockResolvedValue({});
  mockPrisma.portfolioMedia.aggregate.mockResolvedValue({ _max: { sortOrder: null } });
  mockPrisma.portfolioMedia.groupBy.mockResolvedValue([]);
  mockUploadFile.mockResolvedValue(undefined);
  mockDeleteFile.mockResolvedValue(undefined);
});

// ═══════════════════════════════════════════════════════════════════════════
// isValidSlug
// ═══════════════════════════════════════════════════════════════════════════

describe('isValidSlug', () => {
  const VALID_SLUGS = [
    'bodas', 'discomovil', 'eventos-empresa', 'fiestas-infantiles',
    'fiestas-privadas', 'produccion-tecnica', 'alquiler-equipo',
    'fiestas-tematicas-halloween', 'fiestas-tematicas-mon-magic',
  ];

  it.each(VALID_SLUGS)('retorna true per al slug vàlid "%s"', (slug) => {
    expect(isValidSlug(slug)).toBe(true);
  });

  it('retorna false per un slug inventat', () => {
    expect(isValidSlug('karaoke')).toBe(false);
  });

  it('retorna false per un string buit', () => {
    expect(isValidSlug('')).toBe(false);
  });

  it('retorna false per un slug amb majúscules (case-sensitive)', () => {
    expect(isValidSlug('Bodas')).toBe(false);
  });

  it('retorna false per un slug amb espais', () => {
    expect(isValidSlug('fiestas privadas')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// detectMediaType
// ═══════════════════════════════════════════════════════════════════════════

describe('detectMediaType', () => {
  describe('imatges', () => {
    it.each([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/gif',
    ])('retorna "image" per %s', (mimeType) => {
      expect(detectMediaType(mimeType)).toBe('image');
    });
  });

  describe('vídeos', () => {
    it.each([
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/mpeg',
    ])('retorna "video" per %s', (mimeType) => {
      expect(detectMediaType(mimeType)).toBe('video');
    });
  });

  describe('tipus no permesos', () => {
    it('retorna null per application/pdf', () => {
      expect(detectMediaType('application/pdf')).toBeNull();
    });

    it('retorna null per text/plain', () => {
      expect(detectMediaType('text/plain')).toBeNull();
    });

    it('retorna null per audio/mpeg', () => {
      expect(detectMediaType('audio/mpeg')).toBeNull();
    });

    it('retorna null per un string buit', () => {
      expect(detectMediaType('')).toBeNull();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// addPortfolioMedia
// ═══════════════════════════════════════════════════════════════════════════

describe('addPortfolioMedia', () => {
  const baseImageInput = {
    slug: 'bodas',
    fileBuffer: Buffer.from('fake-image-data'),
    fileName: 'foto-casament.jpg',
    mimeType: 'image/jpeg',
    caption: 'Casament a la platja',
    uploadedBy: 'admin-1',
  };

  const baseVideoInput = {
    slug: 'discomovil',
    fileBuffer: Buffer.from('fake-video-data'),
    fileName: 'after-party.mp4',
    mimeType: 'video/mp4',
    caption: 'After party Granollers',
    uploadedBy: 'admin-1',
  };

  it('puja una imatge i crea el registre correctament', async () => {
    mockPrisma.portfolioMedia.aggregate.mockResolvedValue({ _max: { sortOrder: 2 } });
    mockPrisma.portfolioMedia.create.mockResolvedValue({
      id: 'media-1',
      slug: 'bodas',
      mediaType: 'image',
      caption: 'Casament a la platja',
      sortOrder: 3,
    });

    const result = await addPortfolioMedia(baseImageInput);

    expect(result.id).toBe('media-1');
    expect(result.sortOrder).toBe(3);
    expect(mockUploadFile).toHaveBeenCalledWith(
      expect.stringMatching(/^portfolio\/bodas\/\d+-[a-z0-9]+\.jpg$/),
      baseImageInput.fileBuffer
    );
    expect(mockPrisma.portfolioMedia.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        slug: 'bodas',
        mediaType: 'image',
        caption: 'Casament a la platja',
        sortOrder: 3,
        uploadedBy: 'admin-1',
      }),
    });
  });

  it('puja un vídeo i crea el registre correctament', async () => {
    mockPrisma.portfolioMedia.aggregate.mockResolvedValue({ _max: { sortOrder: 0 } });
    mockPrisma.portfolioMedia.create.mockResolvedValue({
      id: 'media-2',
      slug: 'discomovil',
      mediaType: 'video',
      caption: 'After party Granollers',
      sortOrder: 1,
    });

    const result = await addPortfolioMedia(baseVideoInput);

    expect(result.id).toBe('media-2');
    expect(result.mediaType).toBe('video');
    expect(mockUploadFile).toHaveBeenCalledWith(
      expect.stringMatching(/^portfolio\/discomovil\/\d+-[a-z0-9]+\.mp4$/),
      baseVideoInput.fileBuffer
    );
    expect(mockPrisma.portfolioMedia.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        slug: 'discomovil',
        mediaType: 'video',
        sortOrder: 1,
      }),
    });
  });

  it('assigna sortOrder 0 quan no hi ha media previ (max és null)', async () => {
    mockPrisma.portfolioMedia.aggregate.mockResolvedValue({ _max: { sortOrder: null } });
    mockPrisma.portfolioMedia.create.mockResolvedValue({
      id: 'media-1',
      sortOrder: 0,
    });

    await addPortfolioMedia(baseImageInput);

    expect(mockPrisma.portfolioMedia.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ sortOrder: 0 }),
    });
  });

  it('llença error amb un slug invàlid', async () => {
    await expect(
      addPortfolioMedia({ ...baseImageInput, slug: 'karaoke' })
    ).rejects.toThrow('Slug invàlid: karaoke');

    expect(mockUploadFile).not.toHaveBeenCalled();
    expect(mockPrisma.portfolioMedia.create).not.toHaveBeenCalled();
  });

  it('llença error amb un MIME type no permès', async () => {
    await expect(
      addPortfolioMedia({ ...baseImageInput, mimeType: 'application/pdf' })
    ).rejects.toThrow('Tipus de fitxer no permès: application/pdf');

    expect(mockUploadFile).not.toHaveBeenCalled();
    expect(mockPrisma.portfolioMedia.create).not.toHaveBeenCalled();
  });

  it('genera la URL pública correctament amb getPublicUrl', async () => {
    mockPrisma.portfolioMedia.aggregate.mockResolvedValue({ _max: { sortOrder: null } });
    mockPrisma.portfolioMedia.create.mockResolvedValue({ id: 'media-1' });

    await addPortfolioMedia(baseImageInput);

    expect(mockGetPublicUrl).toHaveBeenCalledWith(
      expect.stringMatching(/^portfolio\/bodas\/\d+-[a-z0-9]+\.jpg$/)
    );
    expect(mockPrisma.portfolioMedia.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        mediaUrl: expect.stringMatching(/^\/api\/uploads\/portfolio\/bodas\//),
      }),
    });
  });

  it('funciona sense caption ni uploadedBy (opcionals)', async () => {
    const inputMinim = {
      slug: 'bodas',
      fileBuffer: Buffer.from('data'),
      fileName: 'img.webp',
      mimeType: 'image/webp',
    };
    mockPrisma.portfolioMedia.aggregate.mockResolvedValue({ _max: { sortOrder: null } });
    mockPrisma.portfolioMedia.create.mockResolvedValue({ id: 'media-1' });

    await addPortfolioMedia(inputMinim);

    expect(mockPrisma.portfolioMedia.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        slug: 'bodas',
        mediaType: 'image',
        caption: undefined,
        uploadedBy: undefined,
        sortOrder: 0,
      }),
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// listPortfolioMedia
// ═══════════════════════════════════════════════════════════════════════════

describe('listPortfolioMedia', () => {
  it('retorna la llista de media ordenada per sortOrder ascendent', async () => {
    const mockMedia = [
      { id: 'm1', slug: 'bodas', sortOrder: 0, mediaType: 'image' },
      { id: 'm2', slug: 'bodas', sortOrder: 1, mediaType: 'video' },
      { id: 'm3', slug: 'bodas', sortOrder: 2, mediaType: 'image' },
    ];
    mockPrisma.portfolioMedia.findMany.mockResolvedValue(mockMedia);

    const result = await listPortfolioMedia('bodas');

    expect(result).toEqual(mockMedia);
    expect(result).toHaveLength(3);
    expect(mockPrisma.portfolioMedia.findMany).toHaveBeenCalledWith({
      where: { slug: 'bodas' },
      orderBy: { sortOrder: 'asc' },
    });
  });

  it('retorna llista buida si la categoria no té media', async () => {
    mockPrisma.portfolioMedia.findMany.mockResolvedValue([]);

    const result = await listPortfolioMedia('alquiler-equipo');

    expect(result).toEqual([]);
    expect(mockPrisma.portfolioMedia.findMany).toHaveBeenCalledWith({
      where: { slug: 'alquiler-equipo' },
      orderBy: { sortOrder: 'asc' },
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// getPortfolioMediaCounts
// ═══════════════════════════════════════════════════════════════════════════

describe('getPortfolioMediaCounts', () => {
  it('retorna un mapa slug → count amb les dades de groupBy', async () => {
    mockPrisma.portfolioMedia.groupBy.mockResolvedValue([
      { slug: 'bodas', _count: { id: 12 } },
      { slug: 'discomovil', _count: { id: 5 } },
      { slug: 'fiestas-infantiles', _count: { id: 8 } },
    ]);

    const result = await getPortfolioMediaCounts();

    expect(result).toEqual({
      bodas: 12,
      discomovil: 5,
      'fiestas-infantiles': 8,
    });
  });

  it('retorna un objecte buit si no hi ha cap media', async () => {
    mockPrisma.portfolioMedia.groupBy.mockResolvedValue([]);

    const result = await getPortfolioMediaCounts();

    expect(result).toEqual({});
  });

  it('crida groupBy amb els paràmetres correctes', async () => {
    mockPrisma.portfolioMedia.groupBy.mockResolvedValue([]);

    await getPortfolioMediaCounts();

    expect(mockPrisma.portfolioMedia.groupBy).toHaveBeenCalledWith({
      by: ['slug'],
      _count: { id: true },
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// updatePortfolioMedia
// ═══════════════════════════════════════════════════════════════════════════

describe('updatePortfolioMedia', () => {
  it('actualitza el caption d\'un media', async () => {
    mockPrisma.portfolioMedia.update.mockResolvedValue({
      id: 'media-1',
      caption: 'Nou caption',
      sortOrder: 0,
    });

    const result = await updatePortfolioMedia('media-1', { caption: 'Nou caption' });

    expect(result.caption).toBe('Nou caption');
    expect(mockPrisma.portfolioMedia.update).toHaveBeenCalledWith({
      where: { id: 'media-1' },
      data: { caption: 'Nou caption' },
    });
  });

  it('actualitza el sortOrder d\'un media', async () => {
    mockPrisma.portfolioMedia.update.mockResolvedValue({
      id: 'media-1',
      sortOrder: 5,
    });

    const result = await updatePortfolioMedia('media-1', { sortOrder: 5 });

    expect(result.sortOrder).toBe(5);
    expect(mockPrisma.portfolioMedia.update).toHaveBeenCalledWith({
      where: { id: 'media-1' },
      data: { sortOrder: 5 },
    });
  });

  it('actualitza caption i sortOrder alhora', async () => {
    const data = { caption: 'Actualitzat', sortOrder: 3 };
    mockPrisma.portfolioMedia.update.mockResolvedValue({ id: 'media-1', ...data });

    await updatePortfolioMedia('media-1', data);

    expect(mockPrisma.portfolioMedia.update).toHaveBeenCalledWith({
      where: { id: 'media-1' },
      data,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// deletePortfolioMedia
// ═══════════════════════════════════════════════════════════════════════════

describe('deletePortfolioMedia', () => {
  it('elimina el fitxer físic i el registre de la BD', async () => {
    mockPrisma.portfolioMedia.findUnique.mockResolvedValue({
      id: 'media-1',
      mediaUrl: '/api/uploads/portfolio/bodas/123-abc.jpg',
    });

    const result = await deletePortfolioMedia('media-1');

    expect(result).toBe(true);
    expect(mockDeleteFile).toHaveBeenCalledWith('portfolio/bodas/123-abc.jpg');
    expect(mockPrisma.portfolioMedia.delete).toHaveBeenCalledWith({
      where: { id: 'media-1' },
    });
  });

  it('llença error si el media no existeix', async () => {
    mockPrisma.portfolioMedia.findUnique.mockResolvedValue(null);

    await expect(deletePortfolioMedia('inexistent')).rejects.toThrow('Media no trobat');

    expect(mockDeleteFile).not.toHaveBeenCalled();
    expect(mockPrisma.portfolioMedia.delete).not.toHaveBeenCalled();
  });

  it('elimina el registre de BD encara que falli l\'eliminació del fitxer', async () => {
    mockPrisma.portfolioMedia.findUnique.mockResolvedValue({
      id: 'media-1',
      mediaUrl: '/api/uploads/portfolio/bodas/123-abc.jpg',
    });
    mockDeleteFile.mockRejectedValue(new Error('Storage error'));

    const result = await deletePortfolioMedia('media-1');

    expect(result).toBe(true);
    expect(mockPrisma.portfolioMedia.delete).toHaveBeenCalledWith({
      where: { id: 'media-1' },
    });
  });

  it('no crida deleteFile si la URL no té el patró esperat', async () => {
    mockPrisma.portfolioMedia.findUnique.mockResolvedValue({
      id: 'media-1',
      mediaUrl: 'https://cdn.example.com/image.jpg',
    });

    const result = await deletePortfolioMedia('media-1');

    expect(result).toBe(true);
    expect(mockDeleteFile).not.toHaveBeenCalled();
    expect(mockPrisma.portfolioMedia.delete).toHaveBeenCalledWith({
      where: { id: 'media-1' },
    });
  });
});
