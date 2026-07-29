import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => {
  return {
    mockPrisma: {
      portfolioEvent: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        aggregate: vi.fn(),
        groupBy: vi.fn(),
      },
      portfolioMedia: {
        update: vi.fn(),
      },
      booking: {
        findUnique: vi.fn(),
      },
    },
  };
});

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  createPortfolioEvent,
  ensurePortfolioEventFromPostEventReport,
  listPortfolioEvents,
  getPortfolioEvent,
  updatePortfolioEvent,
  deletePortfolioEvent,
} from '@/lib/services/portfolioEventService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.booking.findUnique.mockResolvedValue(null);
  mockPrisma.portfolioEvent.findFirst.mockResolvedValue(null);
});

describe('createPortfolioEvent', () => {
  const baseInput = {
    slug: 'boda-laura-marc',
    categorySlug: 'bodas',
    title: 'Boda Laura & Marc',
    coverImage: '/img/portfolio/bodas/cover.webp',
  };

  it('crea un event correctament', async () => {
    mockPrisma.portfolioEvent.findUnique.mockResolvedValue(null);
    mockPrisma.portfolioEvent.aggregate.mockResolvedValue({ _max: { sortOrder: 2 } });
    mockPrisma.portfolioEvent.create.mockResolvedValue({ id: 'ev1', ...baseInput });

    await createPortfolioEvent(baseInput);

    expect(mockPrisma.portfolioEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        slug: 'boda-laura-marc',
        title: 'Boda Laura & Marc',
        sortOrder: 3,
        services: [],
        published: false,
        originType: 'MANUAL',
        sourceBookingId: null,
      }),
    });
  });

  it('llença error amb categoria invàlida', async () => {
    await expect(
      createPortfolioEvent({ ...baseInput, categorySlug: 'invalid' }),
    ).rejects.toThrow('Categoria invàlida');
  });

  it('llença error si slug ja existeix', async () => {
    mockPrisma.portfolioEvent.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(createPortfolioEvent(baseInput)).rejects.toThrow('Ja existeix');
  });

  it('llença error si la portada ve d’un producte de col·laborador', async () => {
    await expect(
      createPortfolioEvent({
        ...baseInput,
        coverImage: '/img/collaborators/masquerade/bingo-musical-cover.jpg',
      }),
    ).rejects.toThrow('La portada del portfolio ha de sortir de media de portfolio o galeria de booking');

    expect(mockPrisma.portfolioEvent.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.portfolioEvent.create).not.toHaveBeenCalled();
  });

  it('accepta portades de media editable i galeria de booking', async () => {
    mockPrisma.portfolioEvent.findUnique.mockResolvedValue(null);
    mockPrisma.portfolioEvent.aggregate.mockResolvedValue({ _max: { sortOrder: null } });
    mockPrisma.portfolioEvent.create.mockResolvedValue({ id: 'ev1' });

    await createPortfolioEvent({
      ...baseInput,
      slug: 'portfolio-upload',
      coverImage: '/api/uploads/portfolio/bodas/123-cover.avif',
    });
    await createPortfolioEvent({
      ...baseInput,
      slug: 'booking-gallery',
      coverImage: '/api/uploads/bookings/booking-1/gallery/123-cover.avif',
    });

    expect(mockPrisma.portfolioEvent.create).toHaveBeenCalledTimes(2);
  });

  it('deriva origen canonic quan la portada ve de galeria de booking', async () => {
    mockPrisma.portfolioEvent.findUnique.mockResolvedValue(null);
    mockPrisma.portfolioEvent.aggregate.mockResolvedValue({ _max: { sortOrder: null } });
    mockPrisma.portfolioEvent.create.mockResolvedValue({ id: 'ev1' });

    await createPortfolioEvent({
      ...baseInput,
      coverImage: '/api/uploads/bookings/booking-1/gallery/123-cover.avif',
    });

    expect(mockPrisma.portfolioEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        originType: 'BOOKING_GALLERY',
        sourceBookingId: 'booking-1',
      }),
    });
  });

  it('accepta origen explicit de report post-event', async () => {
    mockPrisma.portfolioEvent.findUnique.mockResolvedValue(null);
    mockPrisma.portfolioEvent.aggregate.mockResolvedValue({ _max: { sortOrder: null } });
    mockPrisma.portfolioEvent.create.mockResolvedValue({ id: 'ev1' });

    await createPortfolioEvent({
      ...baseInput,
      originType: 'POST_EVENT_REPORT',
      sourceBookingId: 'booking-1',
      originLabel: 'OE-2026-001',
    });

    expect(mockPrisma.portfolioEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        originType: 'POST_EVENT_REPORT',
        sourceBookingId: 'booking-1',
        originLabel: 'OE-2026-001',
      }),
    });
  });

  it('rebutja origen post-event sense booking', async () => {
    await expect(
      createPortfolioEvent({
        ...baseInput,
        originType: 'POST_EVENT_REPORT',
      }),
    ).rejects.toThrow('sourceBookingId');

    expect(mockPrisma.portfolioEvent.create).not.toHaveBeenCalled();
  });

  it('assigna sortOrder 0 quan no hi ha events previs', async () => {
    mockPrisma.portfolioEvent.findUnique.mockResolvedValue(null);
    mockPrisma.portfolioEvent.aggregate.mockResolvedValue({ _max: { sortOrder: null } });
    mockPrisma.portfolioEvent.create.mockResolvedValue({ id: 'ev1' });

    await createPortfolioEvent(baseInput);

    expect(mockPrisma.portfolioEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ sortOrder: 0 }),
    });
  });

  it('accepta tots els camps opcionals', async () => {
    mockPrisma.portfolioEvent.findUnique.mockResolvedValue(null);
    mockPrisma.portfolioEvent.aggregate.mockResolvedValue({ _max: { sortOrder: 0 } });
    mockPrisma.portfolioEvent.create.mockResolvedValue({ id: 'ev1' });

    await createPortfolioEvent({
      ...baseInput,
      subtitle: 'Masía Can Riera',
      venue: 'Can Riera',
      location: 'Girona',
      eventDate: new Date('2024-09-15'),
      guestCount: 120,
      description: 'Boda temàtica',
      services: ['DJ', 'Iluminación'],
      published: true,
    });

    expect(mockPrisma.portfolioEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        subtitle: 'Masía Can Riera',
        venue: 'Can Riera',
        services: ['DJ', 'Iluminación'],
        published: true,
      }),
    });
  });
});

describe('ensurePortfolioEventFromPostEventReport', () => {
  function makeBooking(overrides: Record<string, unknown> = {}) {
    return {
      id: 'booking-1',
      reference: 'OE-2026-001',
      clientName: 'Anna Garcia',
      eventDate: new Date('2026-07-01T18:00:00.000Z'),
      eventType: 'WEDDING',
      eventLocation: 'Barcelona',
      eventVenue: 'Masia Test',
      guestCount: 120,
      postEventReport: {
        status: 'COMPLETED',
        lessonsLearned: 'La pista va respondre molt bé.',
        memorableMoment: 'Entrada dels nuvis molt potent.',
        whatWorkedBest: null,
      },
      galleryPhotos: [
        {
          id: 'photo-1',
          photoUrl: '/api/uploads/bookings/booking-1/gallery/cover.avif',
          caption: 'Moment de pista',
          portfolioSlug: 'bodas',
        },
      ],
      ...overrides,
    };
  }

  it('retorna BOOKING_NOT_FOUND si la reserva no existeix', async () => {
    const result = await ensurePortfolioEventFromPostEventReport('missing');

    expect(result.status).toBe('BOOKING_NOT_FOUND');
    expect(mockPrisma.portfolioEvent.findFirst).not.toHaveBeenCalled();
  });

  it('exigeix report post-event completat abans de crear portfolio', async () => {
    mockPrisma.booking.findUnique.mockResolvedValueOnce(makeBooking({
      postEventReport: { status: 'DRAFT', lessonsLearned: null, memorableMoment: null, whatWorkedBest: null },
    }));

    const result = await ensurePortfolioEventFromPostEventReport('booking-1');

    expect(result.status).toBe('REPORT_REQUIRED');
    expect(mockPrisma.portfolioEvent.findFirst).not.toHaveBeenCalled();
  });

  it('reutilitza un PortfolioEvent existent per la mateixa reserva', async () => {
    mockPrisma.booking.findUnique.mockResolvedValueOnce(makeBooking());
    mockPrisma.portfolioEvent.findFirst.mockResolvedValueOnce({ id: 'event-existing' });

    const result = await ensurePortfolioEventFromPostEventReport('booking-1');

    expect(result.status).toBe('EXISTS');
    expect(mockPrisma.portfolioEvent.findFirst).toHaveBeenCalledWith({
      where: {
        sourceBookingId: 'booking-1',
        originType: { in: ['POST_EVENT_REPORT', 'BOOKING_GALLERY'] },
      },
    });
    expect(mockPrisma.portfolioEvent.create).not.toHaveBeenCalled();
  });

  it('exigeix una foto marcada per portfolio amb categoria valida', async () => {
    mockPrisma.booking.findUnique.mockResolvedValueOnce(makeBooking({ galleryPhotos: [] }));

    const result = await ensurePortfolioEventFromPostEventReport('booking-1');

    expect(result.status).toBe('PORTFOLIO_MEDIA_REQUIRED');
    expect(mockPrisma.portfolioEvent.create).not.toHaveBeenCalled();
  });

  it('crea un PortfolioEvent draft amb origen POST_EVENT_REPORT i portada de galeria', async () => {
    mockPrisma.booking.findUnique.mockResolvedValueOnce(makeBooking());
    mockPrisma.portfolioEvent.findUnique.mockResolvedValueOnce(null);
    mockPrisma.portfolioEvent.aggregate.mockResolvedValueOnce({ _max: { sortOrder: 4 } });
    mockPrisma.portfolioEvent.create.mockResolvedValueOnce({ id: 'event-1' });

    const result = await ensurePortfolioEventFromPostEventReport('booking-1');

    expect(result.status).toBe('CREATED');
    expect(mockPrisma.portfolioEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        slug: 'oe-2026-001-anna-garcia',
        categorySlug: 'bodas',
        title: 'Anna Garcia',
        subtitle: 'Masia Test',
        venue: 'Masia Test',
        location: 'Barcelona',
        guestCount: 120,
        description: 'Entrada dels nuvis molt potent.',
        services: ['WEDDING'],
        coverImage: '/api/uploads/bookings/booking-1/gallery/cover.avif',
        published: false,
        sortOrder: 5,
        originType: 'POST_EVENT_REPORT',
        sourceBookingId: 'booking-1',
        sourceGalleryPhotoId: 'photo-1',
        originLabel: 'OE-2026-001 · Anna Garcia',
      }),
    });
  });
});

describe('listPortfolioEvents', () => {
  it('retorna events publicats per defecte', async () => {
    mockPrisma.portfolioEvent.findMany.mockResolvedValue([]);
    mockPrisma.portfolioEvent.count.mockResolvedValue(0);

    const result = await listPortfolioEvents();

    expect(mockPrisma.portfolioEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { published: true },
      }),
    );
    expect(result).toEqual({ events: [], total: 0 });
  });

  it('filtra per categorySlug', async () => {
    mockPrisma.portfolioEvent.findMany.mockResolvedValue([]);
    mockPrisma.portfolioEvent.count.mockResolvedValue(0);

    await listPortfolioEvents({ categorySlug: 'bodas' });

    expect(mockPrisma.portfolioEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { categorySlug: 'bodas', published: true },
      }),
    );
  });

  it('respecta limit i offset', async () => {
    mockPrisma.portfolioEvent.findMany.mockResolvedValue([]);
    mockPrisma.portfolioEvent.count.mockResolvedValue(0);

    await listPortfolioEvents({ limit: 10, offset: 5 });

    expect(mockPrisma.portfolioEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10, skip: 5 }),
    );
  });

  it('published undefined usa default true', async () => {
    mockPrisma.portfolioEvent.findMany.mockResolvedValue([]);
    mockPrisma.portfolioEvent.count.mockResolvedValue(0);

    await listPortfolioEvents({ published: undefined });

    expect(mockPrisma.portfolioEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { published: true },
      }),
    );
  });
});

describe('getPortfolioEvent', () => {
  it('retorna event amb media', async () => {
    const event = { id: 'ev1', slug: 'test', media: [{ id: 'm1' }] };
    mockPrisma.portfolioEvent.findUnique.mockResolvedValue(event);

    const result = await getPortfolioEvent('test');

    expect(result).toEqual(event);
    expect(mockPrisma.portfolioEvent.findUnique).toHaveBeenCalledWith({
      where: { slug: 'test' },
      include: { media: { orderBy: { sortOrder: 'asc' } } },
    });
  });

  it('retorna null si no existeix', async () => {
    mockPrisma.portfolioEvent.findUnique.mockResolvedValue(null);

    const result = await getPortfolioEvent('noexiste');

    expect(result).toBeNull();
  });
});

describe('updatePortfolioEvent', () => {
  it('actualitza camps', async () => {
    mockPrisma.portfolioEvent.update.mockResolvedValue({ id: 'ev1', title: 'Nou títol' });

    await updatePortfolioEvent('ev1', { title: 'Nou títol', published: true });

    expect(mockPrisma.portfolioEvent.update).toHaveBeenCalledWith({
      where: { id: 'ev1' },
      data: { title: 'Nou títol', published: true },
    });
  });

  it('bloqueja que una imatge de producte esdevingui portada del portfolio', async () => {
    await expect(
      updatePortfolioEvent('ev1', {
        coverImage: '/img/collaborators/masquerade/bingo-musical-cover.jpg',
      }),
    ).rejects.toThrow('La portada del portfolio ha de sortir de media de portfolio o galeria de booking');

    expect(mockPrisma.portfolioEvent.update).not.toHaveBeenCalled();
  });

  it('actualitza origen quan la portada nova ve de booking gallery', async () => {
    mockPrisma.portfolioEvent.update.mockResolvedValue({ id: 'ev1' });

    await updatePortfolioEvent('ev1', {
      coverImage: '/api/uploads/bookings/booking-1/gallery/123-cover.avif',
    });

    expect(mockPrisma.portfolioEvent.update).toHaveBeenCalledWith({
      where: { id: 'ev1' },
      data: expect.objectContaining({
        coverImage: '/api/uploads/bookings/booking-1/gallery/123-cover.avif',
        originType: 'BOOKING_GALLERY',
        sourceBookingId: 'booking-1',
      }),
    });
  });
});

describe('deletePortfolioEvent', () => {
  it('elimina event per id', async () => {
    mockPrisma.portfolioEvent.delete.mockResolvedValue({ id: 'ev1' });

    await deletePortfolioEvent('ev1');

    expect(mockPrisma.portfolioEvent.delete).toHaveBeenCalledWith({ where: { id: 'ev1' } });
  });
});
