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
import { POST_EVENT_DAY_MS, POST_EVENT_WORKFLOW } from '@/lib/constants/postEventWorkflow';

const NOW = new Date('2026-04-10T12:00:00.000Z');
const EVENT_DATE = new Date('2026-04-04T12:00:00.000Z');

describe('loadPostEventPlaybook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.booking.findMany.mockResolvedValue([
      {
        id: 'booking-1',
        reference: 'OE-2026-001',
        clientName: 'Anna Garcia',
        customerId: 'customer-1',
        eventDate: EVENT_DATE,
        eventType: 'BIRTHDAY',
        eventLocation: 'Barcelona',
        postEventEmailSent: false,
        postEventEmailSentAt: null,
      },
    ]);
    mockPrisma.customerTestimonial.findMany.mockResolvedValue([]);
    mockPrisma.socialPost.findMany.mockResolvedValue([]);
    mockPrisma.task.findMany.mockResolvedValue([]);
    mockPrisma.customerActivity.findMany.mockResolvedValue([]);
  });

  it('carrega bookings dins la finestra canonica de catch-up post-event', async () => {
    await loadPostEventPlaybook(NOW);

    expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        status: 'COMPLETED',
        eventDate: {
          gte: new Date(NOW.getTime() - POST_EVENT_WORKFLOW.catchupWindowDays * POST_EVENT_DAY_MS),
          lte: NOW,
        },
      },
      orderBy: { eventDate: 'desc' },
      take: POST_EVENT_WORKFLOW.playbookTake,
    }));
  });

  it('nomes compta testimonis aprovats com a accio post-event feta', async () => {
    await loadPostEventPlaybook(NOW);

    expect(mockPrisma.customerTestimonial.findMany).toHaveBeenCalledWith({
      where: { customerId: { in: ['customer-1'] }, isApproved: true },
      select: { customerId: true, eventDate: true },
    });
  });

  it('manté testimonial pendent si no hi ha cap testimoni aprovat proper a la data del bolo', async () => {
    const result = await loadPostEventPlaybook(NOW);

    const testimonial = result.items[0].actions.find((action) => action.key === 'testimonial');
    expect(testimonial?.status).toBe('PENDING');
  });

  it('marca testimonial fet quan existeix un testimoni aprovat proper a la data del bolo', async () => {
    mockPrisma.customerTestimonial.findMany.mockResolvedValueOnce([
      { customerId: 'customer-1', eventDate: EVENT_DATE },
    ]);

    const result = await loadPostEventPlaybook(NOW);

    const testimonial = result.items[0].actions.find((action) => action.key === 'testimonial');
    expect(testimonial?.status).toBe('DONE');
    expect(testimonial?.note).toBe('Rebut');
  });
});
