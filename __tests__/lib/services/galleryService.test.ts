import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockUploadFile, mockDeleteFile } = vi.hoisted(() => ({
  mockPrisma: {
    bookingGalleryPhoto: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      aggregate: vi.fn(),
      count: vi.fn(),
    },
    booking: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
  mockUploadFile: vi.fn(),
  mockDeleteFile: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

vi.mock('@/lib/storage', () => ({
  uploadFile: mockUploadFile,
  deleteFile: mockDeleteFile,
  getPublicUrl: vi.fn((path: string) => `/api/uploads/${path}`),
}));

vi.mock('@/lib/services/portfolioImageService', () => ({
  buildBookingGalleryImagePath: (bookingId: string, fileName: string) => `bookings/${bookingId}/gallery/${Date.now()}-${fileName}`,
  normalizePortfolioImageBuffer: vi.fn(async (buf: Buffer) => buf),
}));

import {
  addGalleryPhoto,
  listGalleryPhotos,
  listPortalPhotos,
  listPortfolioPhotos,
  updateGalleryPhoto,
  deleteGalleryPhoto,
  getGallerySummary,
  createGalleryShareToken,
  revokeGalleryShareToken,
  getGalleryByShareToken,
  getGalleryShareInfo,
} from '@/lib/services/galleryService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.booking.findUnique.mockResolvedValue(null);
  mockPrisma.booking.update.mockResolvedValue({});
  mockPrisma.bookingGalleryPhoto.findMany.mockResolvedValue([]);
  mockPrisma.bookingGalleryPhoto.findUnique.mockResolvedValue(null);
  mockPrisma.bookingGalleryPhoto.create.mockResolvedValue({ id: 'photo-1' });
  mockPrisma.bookingGalleryPhoto.update.mockResolvedValue({ id: 'photo-1' });
  mockPrisma.bookingGalleryPhoto.delete.mockResolvedValue({});
  mockPrisma.bookingGalleryPhoto.aggregate.mockResolvedValue({ _max: { sortOrder: null } });
  mockPrisma.bookingGalleryPhoto.count.mockResolvedValue(0);
  mockUploadFile.mockResolvedValue(undefined);
  mockDeleteFile.mockResolvedValue(undefined);
});

// ═══════════════════════════════════════════════════════════════════════════
// addGalleryPhoto
// ═══════════════════════════════════════════════════════════════════════════

describe('addGalleryPhoto', () => {
  const baseInput = {
    bookingId: 'bk-1',
    fileBuffer: Buffer.from('fake-image'),
    fileName: 'photo.jpg',
    caption: 'Una foto',
    isPortfolio: false,
    isPortal: true,
    uploadedBy: 'admin-1',
  };

  it('crea foto correctament', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ id: 'bk-1' });
    mockPrisma.bookingGalleryPhoto.aggregate.mockResolvedValue({ _max: { sortOrder: 2 } });
    mockPrisma.bookingGalleryPhoto.create.mockResolvedValue({
      id: 'photo-1',
      bookingId: 'bk-1',
      caption: 'Una foto',
      sortOrder: 3,
    });

    const result = await addGalleryPhoto(baseInput);

    expect(result.id).toBe('photo-1');
    expect(mockUploadFile).toHaveBeenCalledWith(
      expect.stringMatching(/^bookings\/bk-1\/gallery\/\d+-[a-z0-9]+\.jpg$/),
      baseInput.fileBuffer
    );
    expect(mockPrisma.bookingGalleryPhoto.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        bookingId: 'bk-1',
        caption: 'Una foto',
        sortOrder: 3,
        isPortfolio: false,
        isPortal: true,
        portfolioSlug: null,
        uploadedBy: 'admin-1',
      }),
    });
  });

  it('assigna sortOrder 0 quan no hi ha fotos prèvies', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ id: 'bk-1' });
    mockPrisma.bookingGalleryPhoto.aggregate.mockResolvedValue({ _max: { sortOrder: null } });

    await addGalleryPhoto(baseInput);

    expect(mockPrisma.bookingGalleryPhoto.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ sortOrder: 0 }),
    });
  });

  it('llança error si booking no existeix', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(null);

    await expect(addGalleryPhoto(baseInput)).rejects.toThrow('Booking no trobat');
    expect(mockUploadFile).not.toHaveBeenCalled();
  });

  it('guarda portfolioSlug quan isPortfolio=true', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ id: 'bk-1' });

    await addGalleryPhoto({
      ...baseInput,
      isPortfolio: true,
      portfolioSlug: 'casaments',
    });

    expect(mockPrisma.bookingGalleryPhoto.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        isPortfolio: true,
        portfolioSlug: 'casaments',
      }),
    });
  });

  it('ignora portfolioSlug quan isPortfolio=false', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ id: 'bk-1' });

    await addGalleryPhoto({
      ...baseInput,
      isPortfolio: false,
      portfolioSlug: 'casaments',
    });

    expect(mockPrisma.bookingGalleryPhoto.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        isPortfolio: false,
        portfolioSlug: null,
      }),
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// listGalleryPhotos
// ═══════════════════════════════════════════════════════════════════════════

describe('listGalleryPhotos', () => {
  it('retorna fotos ordenades per sortOrder asc', async () => {
    const photos = [
      { id: 'p1', sortOrder: 0 },
      { id: 'p2', sortOrder: 1 },
      { id: 'p3', sortOrder: 2 },
    ];
    mockPrisma.bookingGalleryPhoto.findMany.mockResolvedValue(photos);

    const result = await listGalleryPhotos('bk-1');

    expect(result).toEqual(photos);
    expect(mockPrisma.bookingGalleryPhoto.findMany).toHaveBeenCalledWith({
      where: { bookingId: 'bk-1' },
      orderBy: { sortOrder: 'asc' },
    });
  });

  it('retorna array buit si no hi ha fotos', async () => {
    mockPrisma.bookingGalleryPhoto.findMany.mockResolvedValue([]);

    const result = await listGalleryPhotos('bk-1');

    expect(result).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// listPortalPhotos
// ═══════════════════════════════════════════════════════════════════════════

describe('listPortalPhotos', () => {
  it('només retorna fotos amb isPortal=true', async () => {
    const portalPhotos = [
      { id: 'p1', photoUrl: '/img1.jpg', caption: 'Foto 1', sortOrder: 0 },
      { id: 'p2', photoUrl: '/img2.jpg', caption: 'Foto 2', sortOrder: 1 },
    ];
    mockPrisma.bookingGalleryPhoto.findMany.mockResolvedValue(portalPhotos);

    const result = await listPortalPhotos('bk-1');

    expect(result).toEqual(portalPhotos);
    expect(mockPrisma.bookingGalleryPhoto.findMany).toHaveBeenCalledWith({
      where: { bookingId: 'bk-1', isPortal: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        photoUrl: true,
        caption: true,
        sortOrder: true,
      },
    });
  });

  it('retorna array buit si cap foto és portal', async () => {
    mockPrisma.bookingGalleryPhoto.findMany.mockResolvedValue([]);

    const result = await listPortalPhotos('bk-1');

    expect(result).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// listPortfolioPhotos
// ═══════════════════════════════════════════════════════════════════════════

describe('listPortfolioPhotos', () => {
  it('retorna fotos amb isPortfolio=true i total', async () => {
    const photos = [
      { id: 'p1', isPortfolio: true, booking: { eventType: 'WEDDING', eventDate: new Date(), eventLocation: 'BCN', eventVenue: 'Sala' } },
    ];
    mockPrisma.bookingGalleryPhoto.findMany.mockResolvedValue(photos);
    mockPrisma.bookingGalleryPhoto.count.mockResolvedValue(1);

    const result = await listPortfolioPhotos();

    expect(result.photos).toEqual(photos);
    expect(result.total).toBe(1);
    expect(mockPrisma.bookingGalleryPhoto.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isPortfolio: true },
        take: 50,
        skip: 0,
      })
    );
  });

  it('filtra per slug quan proporcionat', async () => {
    mockPrisma.bookingGalleryPhoto.findMany.mockResolvedValue([]);
    mockPrisma.bookingGalleryPhoto.count.mockResolvedValue(0);

    await listPortfolioPhotos({ slug: 'casaments' });

    expect(mockPrisma.bookingGalleryPhoto.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isPortfolio: true, portfolioSlug: 'casaments' },
      })
    );
    expect(mockPrisma.bookingGalleryPhoto.count).toHaveBeenCalledWith({
      where: { isPortfolio: true, portfolioSlug: 'casaments' },
    });
  });

  it('aplica paginació amb limit i offset', async () => {
    mockPrisma.bookingGalleryPhoto.findMany.mockResolvedValue([]);
    mockPrisma.bookingGalleryPhoto.count.mockResolvedValue(100);

    const result = await listPortfolioPhotos({ limit: 10, offset: 20 });

    expect(result.total).toBe(100);
    expect(mockPrisma.bookingGalleryPhoto.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        skip: 20,
      })
    );
  });

  it('inclou dades del booking', async () => {
    mockPrisma.bookingGalleryPhoto.findMany.mockResolvedValue([]);
    mockPrisma.bookingGalleryPhoto.count.mockResolvedValue(0);

    await listPortfolioPhotos();

    expect(mockPrisma.bookingGalleryPhoto.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          booking: {
            select: {
              eventType: true,
              eventDate: true,
              eventLocation: true,
              eventVenue: true,
            },
          },
        },
      })
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// updateGalleryPhoto
// ═══════════════════════════════════════════════════════════════════════════

describe('updateGalleryPhoto', () => {
  it('actualitza caption', async () => {
    mockPrisma.bookingGalleryPhoto.update.mockResolvedValue({
      id: 'photo-1',
      caption: 'Nou caption',
    });

    const result = await updateGalleryPhoto('photo-1', { caption: 'Nou caption' });

    expect(result.caption).toBe('Nou caption');
    expect(mockPrisma.bookingGalleryPhoto.update).toHaveBeenCalledWith({
      where: { id: 'photo-1' },
      data: { caption: 'Nou caption' },
    });
  });

  it('actualitza flags isPortfolio i isPortal', async () => {
    await updateGalleryPhoto('photo-1', { isPortfolio: true, isPortal: false });

    expect(mockPrisma.bookingGalleryPhoto.update).toHaveBeenCalledWith({
      where: { id: 'photo-1' },
      data: { isPortfolio: true, isPortal: false },
    });
  });

  it('neteja portfolioSlug quan isPortfolio=false', async () => {
    await updateGalleryPhoto('photo-1', {
      isPortfolio: false,
      portfolioSlug: 'casaments',
    });

    expect(mockPrisma.bookingGalleryPhoto.update).toHaveBeenCalledWith({
      where: { id: 'photo-1' },
      data: expect.objectContaining({
        isPortfolio: false,
        portfolioSlug: null,
      }),
    });
  });

  it('manté portfolioSlug quan isPortfolio=true', async () => {
    await updateGalleryPhoto('photo-1', {
      isPortfolio: true,
      portfolioSlug: 'casaments',
    });

    expect(mockPrisma.bookingGalleryPhoto.update).toHaveBeenCalledWith({
      where: { id: 'photo-1' },
      data: expect.objectContaining({
        isPortfolio: true,
        portfolioSlug: 'casaments',
      }),
    });
  });

  it('actualitza sortOrder', async () => {
    await updateGalleryPhoto('photo-1', { sortOrder: 5 });

    expect(mockPrisma.bookingGalleryPhoto.update).toHaveBeenCalledWith({
      where: { id: 'photo-1' },
      data: { sortOrder: 5 },
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// deleteGalleryPhoto
// ═══════════════════════════════════════════════════════════════════════════

describe('deleteGalleryPhoto', () => {
  it('elimina foto i fitxer físic', async () => {
    mockPrisma.bookingGalleryPhoto.findUnique.mockResolvedValue({
      id: 'photo-1',
      photoUrl: '/api/uploads/bookings/bk-1/gallery/123-abc.jpg',
    });

    const result = await deleteGalleryPhoto('photo-1');

    expect(result).toBe(true);
    expect(mockDeleteFile).toHaveBeenCalledWith('bookings/bk-1/gallery/123-abc.jpg');
    expect(mockPrisma.bookingGalleryPhoto.delete).toHaveBeenCalledWith({
      where: { id: 'photo-1' },
    });
  });

  it('llança error si foto no existeix', async () => {
    mockPrisma.bookingGalleryPhoto.findUnique.mockResolvedValue(null);

    await expect(deleteGalleryPhoto('inexistent')).rejects.toThrow('Foto no trobada');
    expect(mockDeleteFile).not.toHaveBeenCalled();
    expect(mockPrisma.bookingGalleryPhoto.delete).not.toHaveBeenCalled();
  });

  it('continua eliminant registre encara que falli deleteFile', async () => {
    mockPrisma.bookingGalleryPhoto.findUnique.mockResolvedValue({
      id: 'photo-1',
      photoUrl: '/api/uploads/bookings/bk-1/gallery/123-abc.jpg',
    });
    mockDeleteFile.mockRejectedValue(new Error('Storage error'));

    const result = await deleteGalleryPhoto('photo-1');

    expect(result).toBe(true);
    expect(mockPrisma.bookingGalleryPhoto.delete).toHaveBeenCalledWith({
      where: { id: 'photo-1' },
    });
  });

  it('no crida deleteFile si photoUrl no té el patró esperat', async () => {
    mockPrisma.bookingGalleryPhoto.findUnique.mockResolvedValue({
      id: 'photo-1',
      photoUrl: 'https://external-cdn.com/img.jpg',
    });

    const result = await deleteGalleryPhoto('photo-1');

    expect(result).toBe(true);
    expect(mockDeleteFile).not.toHaveBeenCalled();
    expect(mockPrisma.bookingGalleryPhoto.delete).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// getGallerySummary
// ═══════════════════════════════════════════════════════════════════════════

describe('getGallerySummary', () => {
  it('retorna comptadors correctes', async () => {
    mockPrisma.bookingGalleryPhoto.count
      .mockResolvedValueOnce(10)   // total
      .mockResolvedValueOnce(3)    // portfolioCount
      .mockResolvedValueOnce(7);   // portalCount

    const result = await getGallerySummary('bk-1');

    expect(result).toEqual({
      total: 10,
      portfolioCount: 3,
      portalCount: 7,
    });
  });

  it('retorna zeros quan no hi ha fotos', async () => {
    mockPrisma.bookingGalleryPhoto.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    const result = await getGallerySummary('bk-1');

    expect(result).toEqual({
      total: 0,
      portfolioCount: 0,
      portalCount: 0,
    });
  });

  it('crida count amb els filtres correctes', async () => {
    mockPrisma.bookingGalleryPhoto.count
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(4);

    await getGallerySummary('bk-1');

    expect(mockPrisma.bookingGalleryPhoto.count).toHaveBeenCalledTimes(3);
    expect(mockPrisma.bookingGalleryPhoto.count).toHaveBeenCalledWith({ where: { bookingId: 'bk-1' } });
    expect(mockPrisma.bookingGalleryPhoto.count).toHaveBeenCalledWith({ where: { bookingId: 'bk-1', isPortfolio: true } });
    expect(mockPrisma.bookingGalleryPhoto.count).toHaveBeenCalledWith({ where: { bookingId: 'bk-1', isPortal: true } });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// createGalleryShareToken
// ═══════════════════════════════════════════════════════════════════════════

describe('createGalleryShareToken', () => {
  it('crea token sense contrasenya', async () => {
    mockPrisma.booking.update.mockResolvedValue({});

    const result = await createGalleryShareToken('bk-1');

    expect(result.token).toMatch(/^[a-z0-9]{24}$/);
    expect(result.passwordProtected).toBe(false);
    expect(mockPrisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'bk-1' },
      data: expect.objectContaining({
        gallerySharePassword: null,
      }),
    });
  });

  it('crea token amb contrasenya', async () => {
    mockPrisma.booking.update.mockResolvedValue({});

    const result = await createGalleryShareToken('bk-1', 'secret123');

    expect(result.passwordProtected).toBe(true);
    expect(mockPrisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'bk-1' },
      data: expect.objectContaining({
        gallerySharePassword: 'secret123',
      }),
    });
  });

  it('ignora contrasenya buida (espais)', async () => {
    mockPrisma.booking.update.mockResolvedValue({});

    const result = await createGalleryShareToken('bk-1', '   ');

    expect(result.passwordProtected).toBe(false);
    expect(mockPrisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'bk-1' },
      data: expect.objectContaining({ gallerySharePassword: null }),
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// revokeGalleryShareToken
// ═══════════════════════════════════════════════════════════════════════════

describe('revokeGalleryShareToken', () => {
  it('esborra token i contrasenya', async () => {
    mockPrisma.booking.update.mockResolvedValue({});

    await revokeGalleryShareToken('bk-1');

    expect(mockPrisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'bk-1' },
      data: { galleryShareToken: null, gallerySharePassword: null },
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// getGalleryByShareToken
// ═══════════════════════════════════════════════════════════════════════════

describe('getGalleryByShareToken', () => {
  const baseBooking = {
    id: 'bk-1',
    reference: 'ORB-001',
    eventDate: new Date('2026-06-15'),
    gallerySharePassword: null,
    galleryPhotos: [
      { id: 'p1', photoUrl: '/img1.jpg', caption: 'Foto 1' },
    ],
  };

  it('retorna OK per galeria pública', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(baseBooking);

    const result = await getGalleryByShareToken('abc123');

    expect(result.status).toBe('OK');
    if (result.status === 'OK') {
      expect(result.bookingReference).toBe('ORB-001');
      expect(result.photos).toHaveLength(1);
    }
  });

  it('retorna NOT_FOUND si token no existeix', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(null);

    const result = await getGalleryByShareToken('inexistent');

    expect(result.status).toBe('NOT_FOUND');
  });

  it('retorna PASSWORD_REQUIRED si galeria protegida i no hi ha password', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      ...baseBooking,
      gallerySharePassword: 'secret',
    });

    const result = await getGalleryByShareToken('abc123');

    expect(result.status).toBe('PASSWORD_REQUIRED');
  });

  it('retorna WRONG_PASSWORD si la contrasenya no coincideix', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      ...baseBooking,
      gallerySharePassword: 'secret',
    });

    const result = await getGalleryByShareToken('abc123', 'wrongpass');

    expect(result.status).toBe('WRONG_PASSWORD');
  });

  it('retorna OK amb password correcte', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      ...baseBooking,
      gallerySharePassword: 'secret',
    });

    const result = await getGalleryByShareToken('abc123', 'secret');

    expect(result.status).toBe('OK');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// getGalleryShareInfo
// ═══════════════════════════════════════════════════════════════════════════

describe('getGalleryShareInfo', () => {
  it('retorna token i passwordProtected=true', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      galleryShareToken: 'tok123',
      gallerySharePassword: 'secret',
    });

    const result = await getGalleryShareInfo('bk-1');

    expect(result).toEqual({ token: 'tok123', passwordProtected: true });
  });

  it('retorna token i passwordProtected=false sense contrasenya', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      galleryShareToken: 'tok123',
      gallerySharePassword: null,
    });

    const result = await getGalleryShareInfo('bk-1');

    expect(result).toEqual({ token: 'tok123', passwordProtected: false });
  });

  it('retorna token=null si booking no té share token', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      galleryShareToken: null,
      gallerySharePassword: null,
    });

    const result = await getGalleryShareInfo('bk-1');

    expect(result).toEqual({ token: null, passwordProtected: false });
  });

  it('retorna token=null si booking no existeix', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(null);

    const result = await getGalleryShareInfo('bk-1');

    expect(result).toEqual({ token: null, passwordProtected: false });
  });
});
