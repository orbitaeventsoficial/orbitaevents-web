import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    customer: { findUnique: vi.fn() },
    booking: { findUnique: vi.fn() },
    customerActivity: { create: vi.fn() },
    socialPost: { findFirst: vi.fn(), create: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { recordPostEventRecurrenceDecision } from '@/lib/services/postEventRecurrenceDecisionService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.customer.findUnique.mockResolvedValue({ id: 'cust-1' });
  mockPrisma.booking.findUnique.mockResolvedValue({
    id: 'book-1',
    reference: 'OE-2026-001',
    customerId: 'cust-1',
    clientName: 'Anna Garcia',
    eventDate: new Date('2026-07-01T18:00:00.000Z'),
    eventType: 'BIRTHDAY',
  });
  mockPrisma.customerActivity.create.mockResolvedValue({ id: 'act-1' });
  mockPrisma.socialPost.findFirst.mockResolvedValue(null);
  mockPrisma.socialPost.create.mockResolvedValue({ id: 'social-1', status: 'DRAFT' });
});

describe('recordPostEventRecurrenceDecision', () => {
  it('registra una decisio post-event sense enviar cap accio externa', async () => {
    const result = await recordPostEventRecurrenceDecision({
      customerId: 'cust-1',
      bookingId: 'book-1',
      actionKey: 'referral_ask',
      draft: 'Hola Anna, tens algun contacte?',
      href: '/admin/clientes/referrals',
    });

    expect(result.status).toBe(201);
    expect(result.body.ok).toBe(true);
    expect(mockPrisma.customerActivity.create).toHaveBeenCalledWith({
      data: {
        customerId: 'cust-1',
        action: 'POST_EVENT_RECURRENCE_DECIDED',
        details: expect.objectContaining({
          actionKey: 'referral_ask',
          bookingId: 'book-1',
          bookingRef: 'OE-2026-001',
          draft: 'Hola Anna, tens algun contacte?',
          href: '/admin/clientes/referrals',
          source: 'post_event_playbook',
          safety: 'DECIDED_NOT_SENT',
          decidedAt: expect.any(String),
        }),
      },
    });
  });

  it('retorna 404 si el client no existeix', async () => {
    mockPrisma.customer.findUnique.mockResolvedValueOnce(null);

    const result = await recordPostEventRecurrenceDecision({
      customerId: 'missing',
      bookingId: 'book-1',
      actionKey: 'testimonial',
      draft: 'Testimoni curt',
      href: '/admin/clientes/cust-1?tab=comms',
    });

    expect(result.status).toBe(404);
    expect(mockPrisma.customerActivity.create).not.toHaveBeenCalled();
  });

  it('crea un esborrany social intern quan la decisio es social_post', async () => {
    const result = await recordPostEventRecurrenceDecision({
      customerId: 'cust-1',
      bookingId: 'book-1',
      actionKey: 'social_post',
      draft: 'Bolo a Barcelona pendent de revisar.',
      href: '/admin/social',
    });

    expect(result.status).toBe(201);
    expect(mockPrisma.socialPost.findFirst).toHaveBeenCalledWith({
      where: {
        status: { not: 'PUBLISHED' },
        OR: [
          { bookingId: 'book-1' },
          { originType: 'BOOKING', originId: 'book-1' },
        ],
      },
      select: { id: true, status: true },
    });
    expect(mockPrisma.socialPost.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Post-event OE-2026-001 · Anna Garcia',
        caption: 'Bolo a Barcelona pendent de revisar.',
        platforms: ['INSTAGRAM'],
        status: 'DRAFT',
        contentType: 'TEXT',
        category: 'EVENT_SHOWCASE',
        publishedAt: null,
        booking: { connect: { id: 'book-1' } },
        originType: 'BOOKING',
        originId: 'book-1',
        originLabel: 'OE-2026-001 · Anna Garcia',
      }),
      select: { id: true, status: true },
    });
    expect(mockPrisma.customerActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        details: expect.objectContaining({
          actionKey: 'social_post',
          safety: 'DRAFT_NOT_PUBLISHED',
          socialPostId: 'social-1',
          socialPostStatus: 'DRAFT',
          href: '/admin/social?postId=social-1',
        }),
      }),
    });
    expect(result.body.decision).toMatchObject({
      actionKey: 'social_post',
      socialPostId: 'social-1',
      socialPostHref: '/admin/social?postId=social-1',
      href: '/admin/social?postId=social-1',
      safety: 'DRAFT_NOT_PUBLISHED',
    });
  });

  it('reutilitza un esborrany social existent per la reserva', async () => {
    mockPrisma.socialPost.findFirst.mockResolvedValueOnce({ id: 'social-existing', status: 'DRAFT' });

    await recordPostEventRecurrenceDecision({
      customerId: 'cust-1',
      bookingId: 'book-1',
      actionKey: 'social_post',
      draft: 'Draft social.',
      href: '/admin/social',
    });

    expect(mockPrisma.socialPost.create).not.toHaveBeenCalled();
    expect(mockPrisma.customerActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        details: expect.objectContaining({
          socialPostId: 'social-existing',
          socialPostStatus: 'DRAFT',
          href: '/admin/social?postId=social-existing',
        }),
      }),
    });
  });

  it('bloqueja reserves que no corresponen al client', async () => {
    mockPrisma.booking.findUnique.mockResolvedValueOnce({
      id: 'book-1',
      reference: 'OE-2026-001',
      customerId: 'other-cust',
      clientName: 'Anna Garcia',
      eventDate: new Date('2026-07-01T18:00:00.000Z'),
      eventType: 'BIRTHDAY',
    });

    const result = await recordPostEventRecurrenceDecision({
      customerId: 'cust-1',
      bookingId: 'book-1',
      actionKey: 'referral_ask',
      draft: 'Hola Anna',
      href: '/admin/clientes/referrals',
    });

    expect(result.status).toBe(409);
    expect(mockPrisma.customerActivity.create).not.toHaveBeenCalled();
  });

  it('rebutja accions que no formen part de recurrencia post-event', async () => {
    const result = await recordPostEventRecurrenceDecision({
      customerId: 'cust-1',
      bookingId: 'book-1',
      actionKey: 'thank_you',
      draft: 'Gracies',
      href: '/admin/bookings/book-1#sec-client',
    });

    expect(result.status).toBe(400);
    expect(mockPrisma.customerActivity.create).not.toHaveBeenCalled();
  });
});
