import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => {
  return {
    mockPrisma: {
      portfolioEvent: {
        create: vi.fn(),
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
    },
  };
});

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  createPortfolioEvent,
  listPortfolioEvents,
  getPortfolioEvent,
  updatePortfolioEvent,
  deletePortfolioEvent,
  linkMediaToEvent,
  unlinkMediaFromEvent,
  getPortfolioEventCounts,
} from '@/lib/services/portfolioEventService';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createPortfolioEvent', () => {
  const baseInput = {
    slug: 'boda-laura-marc',
    categorySlug: 'bodas',
    title: 'Boda Laura & Marc',
    coverImage: '/img/cover.webp',
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
});

describe('deletePortfolioEvent', () => {
  it('elimina event per id', async () => {
    mockPrisma.portfolioEvent.delete.mockResolvedValue({ id: 'ev1' });

    await deletePortfolioEvent('ev1');

    expect(mockPrisma.portfolioEvent.delete).toHaveBeenCalledWith({ where: { id: 'ev1' } });
  });
});

describe('linkMediaToEvent', () => {
  it('vincula media a un event', async () => {
    mockPrisma.portfolioMedia.update.mockResolvedValue({ id: 'm1', eventId: 'ev1' });

    await linkMediaToEvent('m1', 'ev1');

    expect(mockPrisma.portfolioMedia.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { eventId: 'ev1' },
    });
  });
});

describe('unlinkMediaFromEvent', () => {
  it('desvincula media (eventId = null)', async () => {
    mockPrisma.portfolioMedia.update.mockResolvedValue({ id: 'm1', eventId: null });

    await unlinkMediaFromEvent('m1');

    expect(mockPrisma.portfolioMedia.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { eventId: null },
    });
  });
});

describe('getPortfolioEventCounts', () => {
  it('retorna mapa categorySlug → count', async () => {
    mockPrisma.portfolioEvent.groupBy.mockResolvedValue([
      { categorySlug: 'bodas', _count: { id: 5 } },
      { categorySlug: 'discomovil', _count: { id: 3 } },
    ]);

    const result = await getPortfolioEventCounts();

    expect(result).toEqual({ bodas: 5, discomovil: 3 });
  });

  it('retorna objecte buit si no hi ha events', async () => {
    mockPrisma.portfolioEvent.groupBy.mockResolvedValue([]);

    const result = await getPortfolioEventCounts();

    expect(result).toEqual({});
  });
});
