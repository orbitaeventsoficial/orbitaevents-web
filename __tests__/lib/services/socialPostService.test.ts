import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    socialPost: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      groupBy: vi.fn(),
    },
    setting: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    adminLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({ log: { info: vi.fn(), error: vi.fn() } }));

import {
  createSocialPost,
  getSocialPost,
  listSocialPosts,
  updateSocialPost,
  deleteSocialPost,
  getSocialCalendar,
  getSocialPostCounts,
  validateSocialPostInput,
} from '@/lib/services/socialPostService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.socialPost.create.mockImplementation(async ({ data }: any) => ({
    id: 'sp-1',
    hashtags: [],
    mediaUrls: [],
    platforms: [],
    status: 'IDEA',
    contentType: 'IMAGE',
    category: null,
    scheduledAt: null,
    publishedAt: null,
    bookingId: null,
    originType: 'MANUAL',
    originId: null,
    originLabel: null,
    caption: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
  }));
  mockPrisma.socialPost.findUnique.mockResolvedValue(null);
  mockPrisma.socialPost.findMany.mockResolvedValue([]);
  mockPrisma.socialPost.update.mockImplementation(async ({ data }: any) => ({ id: 'sp-1', ...data }));
  mockPrisma.socialPost.delete.mockResolvedValue({});
  mockPrisma.socialPost.groupBy.mockResolvedValue([]);
  mockPrisma.setting.findMany.mockResolvedValue([]);
  mockPrisma.setting.upsert.mockResolvedValue({});
  mockPrisma.setting.deleteMany.mockResolvedValue({});
  mockPrisma.adminLog.create.mockResolvedValue({});
});

// ───────────────────────────────────────────────────────────────────────────
// VALIDATION
// ───────────────────────────────────────────────────────────────────────────

describe('validateSocialPostInput', () => {
  const baseInput = {
    title: 'Test post',
    platforms: ['INSTAGRAM' as const],
  };

  it('accepta input vàlid', () => {
    expect(validateSocialPostInput(baseInput)).toBeNull();
  });

  it('rebutja títol buit', () => {
    expect(validateSocialPostInput({ ...baseInput, title: '' })).toBe('El títol és obligatori');
  });

  it('rebutja títol massa llarg', () => {
    const longTitle = 'a'.repeat(201);
    expect(validateSocialPostInput({ ...baseInput, title: longTitle })).toContain('200');
  });

  it('rebutja sense plataformes', () => {
    expect(validateSocialPostInput({ ...baseInput, platforms: [] })).toBe('Cal almenys una plataforma');
  });

  it('rebutja plataforma invàlida', () => {
    expect(
      validateSocialPostInput({ ...baseInput, platforms: ['MYSPACE' as never] })
    ).toContain('Plataforma invàlida');
  });

  it('rebutja estat invàlid', () => {
    expect(
      validateSocialPostInput({ ...baseInput, status: 'UNKNOWN' as never })
    ).toContain('Estat invàlid');
  });

  it('exigeix scheduledAt per SCHEDULED', () => {
    expect(
      validateSocialPostInput({ ...baseInput, status: 'SCHEDULED' })
    ).toContain('requereixen una data');
  });

  it('accepta SCHEDULED amb data', () => {
    expect(
      validateSocialPostInput({
        ...baseInput,
        status: 'SCHEDULED',
        scheduledAt: '2026-05-01T10:00:00Z',
      })
    ).toBeNull();
  });
});

// ───────────────────────────────────────────────────────────────────────────
// CREATE
// ───────────────────────────────────────────────────────────────────────────

describe('createSocialPost', () => {
  it('crea post amb valors per defecte', async () => {
    const result = await createSocialPost({
      title: 'Nou post',
      platforms: ['INSTAGRAM'],
    });

    expect(mockPrisma.socialPost.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Nou post',
        status: 'IDEA',
        contentType: 'IMAGE',
        platforms: ['INSTAGRAM'],
        originType: 'MANUAL',
        originId: null,
      }),
    });
    expect(result.id).toBe('sp-1');
  });

  it('trim del títol', async () => {
    await createSocialPost({ title: '  Amb espais  ', platforms: ['TIKTOK'] });
    expect(mockPrisma.socialPost.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ title: 'Amb espais' }),
    });
  });

  it('connecta booking si es proporciona', async () => {
    await createSocialPost({
      title: 'Event post',
      platforms: ['INSTAGRAM'],
      bookingId: 'booking-1',
    });
    expect(mockPrisma.socialPost.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        booking: { connect: { id: 'booking-1' } },
        originType: 'BOOKING',
        originId: 'booking-1',
      }),
    });
  });

  it('crea post derivat de testimoni amb origen canonic', async () => {
    await createSocialPost({
      title: 'Testimoni Anna',
      platforms: ['INSTAGRAM'],
      originType: 'TESTIMONIAL',
      originId: 'testimonial-1',
      originLabel: 'Anna Garcia',
    });
    expect(mockPrisma.socialPost.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        originType: 'TESTIMONIAL',
        originId: 'testimonial-1',
        originLabel: 'Anna Garcia',
      }),
    });
  });

  it('rebutja origen derivat sense originId', async () => {
    await expect(createSocialPost({
      title: 'Testimoni sense id',
      platforms: ['INSTAGRAM'],
      originType: 'TESTIMONIAL',
    })).rejects.toThrow('originId');
    expect(mockPrisma.socialPost.create).not.toHaveBeenCalled();
  });

  it('converteix scheduledAt a Date', async () => {
    await createSocialPost({
      title: 'Scheduled',
      platforms: ['INSTAGRAM'],
      status: 'SCHEDULED',
      scheduledAt: '2026-05-01T10:00:00Z',
    });
    const call = mockPrisma.socialPost.create.mock.calls[0][0];
    expect(call.data.scheduledAt).toBeInstanceOf(Date);
  });

  it('bloqueja programar post-event pendent de revisio al servei', async () => {
    await expect(createSocialPost({
      title: 'Post-event pendent',
      platforms: ['INSTAGRAM'],
      status: 'SCHEDULED',
      scheduledAt: '2026-05-01T10:00:00Z',
      bookingId: 'booking-1',
      category: 'EVENT_SHOWCASE',
      notes: 'Revisar consentiment, imatges i dades personals abans de publicar. No publicat automaticament.',
    })).rejects.toThrow('Revisa consentiment');
    expect(mockPrisma.socialPost.create).not.toHaveBeenCalled();
  });

  it("peta si l'input és invàlid", async () => {
    await expect(
      createSocialPost({ title: '', platforms: ['INSTAGRAM'] })
    ).rejects.toThrow('El títol');
  });
});

// ───────────────────────────────────────────────────────────────────────────
// GET / LIST
// ───────────────────────────────────────────────────────────────────────────

describe('getSocialPost', () => {
  it('retorna null si no existeix', async () => {
    const result = await getSocialPost('missing');
    expect(result).toBeNull();
  });

  it('inclou booking relacionat', async () => {
    mockPrisma.socialPost.findUnique.mockResolvedValue({ id: 'sp-1' });
    await getSocialPost('sp-1');
    expect(mockPrisma.socialPost.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sp-1' },
        include: expect.objectContaining({ booking: expect.any(Object) }),
      })
    );
  });
});

describe('listSocialPosts', () => {
  it('llista sense filtres', async () => {
    await listSocialPosts();
    expect(mockPrisma.socialPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });

  it('filtra per status', async () => {
    await listSocialPosts({ status: 'SCHEDULED' });
    expect(mockPrisma.socialPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'SCHEDULED' } })
    );
  });

  it('filtra per plataforma amb has', async () => {
    await listSocialPosts({ platform: 'INSTAGRAM' });
    expect(mockPrisma.socialPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { platforms: { has: 'INSTAGRAM' } },
      })
    );
  });

  it('filtra per rang de dates', async () => {
    const from = new Date('2026-05-01');
    const to = new Date('2026-05-31');
    await listSocialPosts({ from, to });
    expect(mockPrisma.socialPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { scheduledAt: { gte: from, lte: to } },
      })
    );
  });
});

// ───────────────────────────────────────────────────────────────────────────
// UPDATE
// ───────────────────────────────────────────────────────────────────────────

describe('updateSocialPost', () => {
  const existingPost = {
    id: 'sp-1',
    title: 'Original',
    platforms: ['INSTAGRAM'],
    status: 'IDEA',
    contentType: 'IMAGE',
    category: null,
    scheduledAt: null,
    publishedAt: null,
    caption: null,
    hashtags: [],
    mediaUrls: [],
    bookingId: null,
    originType: 'MANUAL',
    originId: null,
    originLabel: null,
    notes: null,
  };

  beforeEach(() => {
    mockPrisma.socialPost.findUnique.mockResolvedValue(existingPost);
  });

  it('peta si post no existeix', async () => {
    mockPrisma.socialPost.findUnique.mockResolvedValue(null);
    await expect(updateSocialPost('missing', { title: 'X' })).rejects.toThrow('no trobat');
  });

  it('actualitza només camps proporcionats', async () => {
    await updateSocialPost('sp-1', { caption: 'Nova caption' });
    expect(mockPrisma.socialPost.update).toHaveBeenCalledWith({
      where: { id: 'sp-1' },
      data: { caption: 'Nova caption' },
    });
  });

  it('auto-set publishedAt quan passa a PUBLISHED', async () => {
    await updateSocialPost('sp-1', { status: 'PUBLISHED' });
    const call = mockPrisma.socialPost.update.mock.calls[0][0];
    expect(call.data.status).toBe('PUBLISHED');
    expect(call.data.publishedAt).toBeInstanceOf(Date);
  });

  it('bloqueja publicar post-event pendent de revisio al servei', async () => {
    mockPrisma.socialPost.findUnique.mockResolvedValue({
      ...existingPost,
      bookingId: 'booking-1',
      category: 'EVENT_SHOWCASE',
      notes: 'Creat des del playbook. Revisar consentiment, imatges i dades personals abans de publicar. No publicat automaticament.',
    });

    await expect(updateSocialPost('sp-1', { status: 'PUBLISHED' })).rejects.toThrow('Revisa consentiment');
    expect(mockPrisma.socialPost.update).not.toHaveBeenCalled();
  });

  it('no sobrescriu publishedAt existent', async () => {
    const fixedDate = new Date('2026-01-01');
    mockPrisma.socialPost.findUnique.mockResolvedValue({
      ...existingPost,
      publishedAt: fixedDate,
    });
    await updateSocialPost('sp-1', { status: 'PUBLISHED' });
    const call = mockPrisma.socialPost.update.mock.calls[0][0];
    expect(call.data.publishedAt).toBeUndefined();
  });

  it('disconnect de booking si bookingId null', async () => {
    await updateSocialPost('sp-1', { bookingId: null });
    expect(mockPrisma.socialPost.update).toHaveBeenCalledWith({
      where: { id: 'sp-1' },
      data: { booking: { disconnect: true } },
    });
  });

  it('desconnecta origen booking quan es treu la reserva', async () => {
    mockPrisma.socialPost.findUnique.mockResolvedValue({
      ...existingPost,
      bookingId: 'booking-1',
      originType: 'BOOKING',
      originId: 'booking-1',
      originLabel: 'OE-2026-001',
    });
    await updateSocialPost('sp-1', { bookingId: null });
    expect(mockPrisma.socialPost.update).toHaveBeenCalledWith({
      where: { id: 'sp-1' },
      data: {
        originType: 'MANUAL',
        originId: null,
        originLabel: null,
        booking: { disconnect: true },
      },
    });
  });

  it('connect booking si bookingId string', async () => {
    await updateSocialPost('sp-1', { bookingId: 'booking-2' });
    expect(mockPrisma.socialPost.update).toHaveBeenCalledWith({
      where: { id: 'sp-1' },
      data: {
        originType: 'BOOKING',
        originId: 'booking-2',
        originLabel: null,
        booking: { connect: { id: 'booking-2' } },
      },
    });
  });

  it('actualitza origen no booking sense connectar reserva', async () => {
    await updateSocialPost('sp-1', {
      originType: 'PORTFOLIO',
      originId: 'portfolio-1',
      originLabel: 'Casament a Girona',
    });
    expect(mockPrisma.socialPost.update).toHaveBeenCalledWith({
      where: { id: 'sp-1' },
      data: {
        originType: 'PORTFOLIO',
        originId: 'portfolio-1',
        originLabel: 'Casament a Girona',
      },
    });
  });

  it('valida quan es canvia a SCHEDULED sense data', async () => {
    await expect(
      updateSocialPost('sp-1', { status: 'SCHEDULED' })
    ).rejects.toThrow('requereixen una data');
  });
});

// ───────────────────────────────────────────────────────────────────────────
// DELETE
// ───────────────────────────────────────────────────────────────────────────

describe('deleteSocialPost', () => {
  it('elimina per id', async () => {
    await deleteSocialPost('sp-1');
    expect(mockPrisma.socialPost.delete).toHaveBeenCalledWith({ where: { id: 'sp-1' } });
  });
});

// ───────────────────────────────────────────────────────────────────────────
// CALENDAR
// ───────────────────────────────────────────────────────────────────────────

describe('getSocialCalendar', () => {
  it('agrupa posts per dia (YYYY-MM-DD)', async () => {
    mockPrisma.socialPost.findMany.mockResolvedValue([
      { id: 'a', scheduledAt: new Date('2026-05-01T10:00:00Z'), publishedAt: null },
      { id: 'b', scheduledAt: new Date('2026-05-01T18:00:00Z'), publishedAt: null },
      { id: 'c', scheduledAt: new Date('2026-05-02T09:00:00Z'), publishedAt: null },
    ]);

    const calendar = await getSocialCalendar({
      from: new Date('2026-05-01'),
      to: new Date('2026-05-31'),
    });

    expect(calendar['2026-05-01']).toHaveLength(2);
    expect(calendar['2026-05-02']).toHaveLength(1);
  });

  it('usa publishedAt si no hi ha scheduledAt', async () => {
    mockPrisma.socialPost.findMany.mockResolvedValue([
      { id: 'a', scheduledAt: null, publishedAt: new Date('2026-05-03T12:00:00Z') },
    ]);

    const calendar = await getSocialCalendar({
      from: new Date('2026-05-01'),
      to: new Date('2026-05-31'),
    });

    expect(calendar['2026-05-03']).toHaveLength(1);
  });

  it('ignora posts sense cap data', async () => {
    mockPrisma.socialPost.findMany.mockResolvedValue([
      { id: 'a', scheduledAt: null, publishedAt: null },
    ]);

    const calendar = await getSocialCalendar({
      from: new Date('2026-05-01'),
      to: new Date('2026-05-31'),
    });

    expect(Object.keys(calendar)).toHaveLength(0);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// COUNTS
// ───────────────────────────────────────────────────────────────────────────

describe('getSocialPostCounts', () => {
  it('retorna tots els estats amb 0 per defecte', async () => {
    mockPrisma.socialPost.groupBy.mockResolvedValue([]);
    const counts = await getSocialPostCounts();
    expect(counts).toEqual({
      IDEA: 0,
      DRAFT: 0,
      SCHEDULED: 0,
      PUBLISHED: 0,
      ARCHIVED: 0,
    });
  });

  it('agrega counts per estat', async () => {
    mockPrisma.socialPost.groupBy.mockResolvedValue([
      { status: 'IDEA', _count: { _all: 5 } },
      { status: 'SCHEDULED', _count: { _all: 3 } },
      { status: 'PUBLISHED', _count: { _all: 12 } },
    ]);
    const counts = await getSocialPostCounts();
    expect(counts.IDEA).toBe(5);
    expect(counts.SCHEDULED).toBe(3);
    expect(counts.PUBLISHED).toBe(12);
    expect(counts.DRAFT).toBe(0);
    expect(counts.ARCHIVED).toBe(0);
  });
});
