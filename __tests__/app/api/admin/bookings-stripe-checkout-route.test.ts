import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockRequirePermission, mockPrisma, mockCreateStripeCheckoutSession } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockPrisma: {
    booking: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    // bookingStripePaymentService.ts:43 consulta clientPortalAccess.findFirst
    // per resoldre la URL de retorn del checkout — sense el mock el servei peta
    // amb "Cannot read properties of undefined (reading 'findFirst')".
    clientPortalAccess: {
      findFirst: vi.fn(),
    },
  },
  mockCreateStripeCheckoutSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
  requirePermission: mockRequirePermission,
}));
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/stripeService', () => ({
  createStripeCheckoutSession: mockCreateStripeCheckoutSession,
}));

import { POST } from '@/app/api/admin/bookings/[id]/stripe-checkout/route';

function makeRequest(body: Record<string, unknown>, id = 'booking-1') {
  return {
    req: new NextRequest(`http://localhost/api/admin/bookings/${id}/stripe-checkout`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
    params: { params: { id } },
  };
}

const booking = {
  id: 'booking-1',
  reference: 'OE-2026-001',
  clientEmail: 'client@test.com',
  depositAmount: 300,
  depositPaid: false,
  remainingAmount: 700,
  remainingPaid: false,
};

describe('POST /api/admin/bookings/[id]/stripe-checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue({ user: { id: 'admin-1' } });
    mockRequirePermission.mockReturnValue(null);
    mockPrisma.booking.findUnique.mockResolvedValue(booking);
    mockPrisma.booking.update.mockResolvedValue({});
    // Per defecte no hi ha portal access — el servei usa el baseUrl fallback.
    mockPrisma.clientPortalAccess.findFirst.mockResolvedValue(null);
    mockCreateStripeCheckoutSession.mockResolvedValue({
      sessionId: 'cs_test_123',
      url: 'https://checkout.stripe.com/c/pay_deposit',
    });
  });

  it('exigeix permís de mutació', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }));
    const { req, params } = makeRequest({ paymentType: 'deposit' });

    const res = await POST(req, params);

    expect(res.status).toBe(403);
    expect(mockPrisma.booking.findUnique).not.toHaveBeenCalled();
  });

  it('genera link Stripe per la paga i senyal i el desa a la reserva', async () => {
    const { req, params } = makeRequest({ paymentType: 'deposit' });

    const res = await POST(req, params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ url: 'https://checkout.stripe.com/c/pay_deposit' });
    expect(mockCreateStripeCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
      bookingId: 'booking-1',
      paymentType: 'deposit',
      amountEur: 300,
      clientEmail: 'client@test.com',
    }));
    expect(mockPrisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'booking-1' },
      data: { depositPaymentUrl: 'https://checkout.stripe.com/c/pay_deposit' },
    });
  });

  it('bloqueja el pagament final fins que la paga i senyal està pagada', async () => {
    const { req, params } = makeRequest({ paymentType: 'remaining' });

    const res = await POST(req, params);
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body).toEqual({ error: 'DEPOSIT_NOT_PAID' });
    expect(mockCreateStripeCheckoutSession).not.toHaveBeenCalled();
  });

  it('genera link Stripe per la resta quan la paga i senyal ja està pagada', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ ...booking, depositPaid: true });
    mockCreateStripeCheckoutSession.mockResolvedValue({
      sessionId: 'cs_test_456',
      url: 'https://checkout.stripe.com/c/pay_remaining',
    });
    const { req, params } = makeRequest({ paymentType: 'remaining' });

    const res = await POST(req, params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ url: 'https://checkout.stripe.com/c/pay_remaining' });
    expect(mockPrisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'booking-1' },
      data: { remainingPaymentUrl: 'https://checkout.stripe.com/c/pay_remaining' },
    });
  });
});
