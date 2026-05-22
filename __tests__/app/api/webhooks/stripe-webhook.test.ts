import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockPrisma, mockConstructEvent } = vi.hoisted(() => ({
  mockPrisma: {
    booking: {
      update: vi.fn().mockResolvedValue({}),
    },
    adminLog: {
      create: vi.fn().mockResolvedValue({}),
    },
    stripeWebhookEvent: {
      create: vi.fn().mockResolvedValue({}),
    },
    $transaction: vi.fn(),
  },
  mockConstructEvent: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/stripeService', () => ({
  constructStripeEvent: mockConstructEvent,
}));

function makeRequest(body: string, sig: string): NextRequest {
  return new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': sig, 'content-type': 'text/plain' },
    body,
  });
}

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (callback) => callback(mockPrisma));
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  });

  it('retorna 400 si no hi ha signatura', async () => {
    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const req = new NextRequest('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: '{}',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('retorna 400 si la signatura és invàlida', async () => {
    mockConstructEvent.mockImplementation(() => { throw new Error('Invalid signature'); });
    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const res = await POST(makeRequest('{}', 'bad-sig'));
    expect(res.status).toBe(400);
  });

  it('marca el dipòsit com pagat quan checkout.session.completed + deposit', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt-deposit',
      type: 'checkout.session.completed',
      data: { object: { metadata: { bookingId: 'bk-1', paymentType: 'deposit' } } },
    });
    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const res = await POST(makeRequest('{}', 'valid-sig'));
    expect(res.status).toBe(200);
    expect(mockPrisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'bk-1' },
        data: expect.objectContaining({ depositPaid: true }),
      }),
    );
  });

  it('marca la resta com pagada quan paymentType=remaining', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt-remaining',
      type: 'checkout.session.completed',
      data: { object: { metadata: { bookingId: 'bk-2', paymentType: 'remaining' } } },
    });
    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const res = await POST(makeRequest('{}', 'valid-sig'));
    expect(res.status).toBe(200);
    expect(mockPrisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'bk-2' },
        data: expect.objectContaining({ remainingPaid: true }),
      }),
    );
  });

  it('ignora events d\'altres tipus sense actualitzar la DB', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'payment_intent.created',
      data: { object: {} },
    });
    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const res = await POST(makeRequest('{}', 'valid-sig'));
    expect(res.status).toBe(200);
    expect(mockPrisma.booking.update).not.toHaveBeenCalled();
  });

  it('retorna 500 si STRIPE_WEBHOOK_SECRET no és present', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    vi.resetModules();
    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const res = await POST(makeRequest('{}', 'sig'));
    expect(res.status).toBe(500);
  });
});
