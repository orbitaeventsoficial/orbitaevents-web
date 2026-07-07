import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    booking: { findMany: vi.fn() },
    customerTestimonial: { findMany: vi.fn() },
    socialPost: { findMany: vi.fn() },
    task: { findMany: vi.fn() },
    customerActivity: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { loadPostEventPlaybook } from '@/lib/services/postEventPlaybookService';

const NOW = new Date('2026-07-10T12:00:00.000Z');

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.booking.findMany.mockResolvedValue([
    {
      id: 'book-1',
      reference: 'OE-2026-001',
      clientName: 'Anna Garcia',
      customerId: 'cust-1',
      eventDate: new Date('2026-07-01T18:00:00.000Z'),
      eventType: 'BIRTHDAY',
      eventLocation: 'Barcelona',
      postEventEmailSent: true,
      postEventEmailSentAt: new Date('2026-07-02T09:00:00.000Z'),
    },
  ]);
  mockPrisma.customerTestimonial.findMany.mockResolvedValue([]);
  mockPrisma.socialPost.findMany.mockResolvedValue([]);
  mockPrisma.task.findMany.mockResolvedValue([]);
  mockPrisma.customerActivity.findMany.mockResolvedValue([]);
});

describe('loadPostEventPlaybook', () => {
  it('reconeix un referral registrat com a customerActivity post-event', async () => {
    mockPrisma.customerActivity.findMany.mockResolvedValueOnce([
      {
        customerId: 'cust-1',
        details: { actionKey: 'referral_ask', bookingId: 'book-1' },
      },
    ]);

    const result = await loadPostEventPlaybook(NOW);
    const referral = result.items[0].actions.find((action) => action.key === 'referral_ask');

    expect(mockPrisma.customerActivity.findMany).toHaveBeenCalledWith({
      where: {
        customerId: { in: ['cust-1'] },
        action: 'POST_EVENT_RECURRENCE_DECIDED',
      },
      select: { customerId: true, details: true },
    });
    expect(referral?.status).toBe('DONE');
    expect(referral?.note).toBe('Programat');
  });

  it('reconeix una peticio de testimoni registrada com a customerActivity post-event', async () => {
    mockPrisma.customerActivity.findMany.mockResolvedValueOnce([
      {
        customerId: 'cust-1',
        details: { actionKey: 'testimonial', bookingId: 'book-1' },
      },
    ]);

    const result = await loadPostEventPlaybook(NOW);
    const testimonial = result.items[0].actions.find((action) => action.key === 'testimonial');

    expect(testimonial?.status).toBe('DONE');
    expect(testimonial?.note).toBe('Sol.licitat');
  });

  it('reconeix un social preparat sense marcar-lo publicat', async () => {
    mockPrisma.customerActivity.findMany.mockResolvedValueOnce([
      {
        customerId: 'cust-1',
        details: { actionKey: 'social_post', bookingId: 'book-1', socialPostId: 'social-1' },
      },
    ]);

    const result = await loadPostEventPlaybook(NOW);
    const social = result.items[0].actions.find((action) => action.key === 'social_post');

    expect(social?.status).toBe('PENDING');
    expect(social?.note).toBe('Preparat, no publicat');
    expect(social?.socialPostId).toBe('social-1');
  });
});
