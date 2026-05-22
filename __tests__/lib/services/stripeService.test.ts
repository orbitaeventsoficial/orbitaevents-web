import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSessionCreate, mockConstructEvent } = vi.hoisted(() => ({
  mockSessionCreate: vi.fn(),
  mockConstructEvent: vi.fn(),
}));

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(function () {
    return {
      checkout: { sessions: { create: mockSessionCreate } },
      webhooks: { constructEvent: mockConstructEvent },
    };
  }),
}));

describe('stripeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
  });

  describe('createStripeCheckoutSession', () => {
    it('retorna sessionId i url quan Stripe respon correctament', async () => {
      mockSessionCreate.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      });

      const { createStripeCheckoutSession } = await import('@/lib/services/stripeService');
      const result = await createStripeCheckoutSession({
        bookingId: 'booking-1',
        paymentType: 'deposit',
        amountEur: 300,
        clientEmail: 'client@test.com',
        description: 'Paga i senyal',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(result).toEqual({
        sessionId: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      });
      expect(mockSessionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'payment',
          metadata: { bookingId: 'booking-1', paymentType: 'deposit' },
          line_items: [expect.objectContaining({
            price_data: expect.objectContaining({ unit_amount: 30000 }),
          })],
        }),
      );
    });

    it('converteix euros a centèsims correctament', async () => {
      mockSessionCreate.mockResolvedValue({
        id: 'cs_test_2',
        url: 'https://checkout.stripe.com/pay/cs_test_2',
      });

      const { createStripeCheckoutSession } = await import('@/lib/services/stripeService');
      await createStripeCheckoutSession({
        bookingId: 'b',
        paymentType: 'remaining',
        amountEur: 750.5,
        clientEmail: null,
        description: 'Resta',
        successUrl: 'https://x.com/ok',
        cancelUrl: 'https://x.com/no',
      });

      const call = mockSessionCreate.mock.calls[0][0];
      expect(call.line_items[0].price_data.unit_amount).toBe(75050);
      expect(call.customer_email).toBeUndefined();
    });

    it('llança error si Stripe no retorna url', async () => {
      mockSessionCreate.mockResolvedValue({ id: 'cs_test_3', url: null });

      const { createStripeCheckoutSession } = await import('@/lib/services/stripeService');
      await expect(
        createStripeCheckoutSession({
          bookingId: 'b',
          paymentType: 'deposit',
          amountEur: 100,
          clientEmail: null,
          description: 'Test',
          successUrl: 'https://x.com/ok',
          cancelUrl: 'https://x.com/no',
        }),
      ).rejects.toThrow('No Stripe session URL returned');
    });
  });

  describe('constructStripeEvent', () => {
    it('delega a stripe.webhooks.constructEvent i retorna l\'event', async () => {
      const fakeEvent = { type: 'checkout.session.completed', data: { object: {} } };
      mockConstructEvent.mockReturnValue(fakeEvent);

      const { constructStripeEvent } = await import('@/lib/services/stripeService');
      const result = constructStripeEvent('raw-body', 'stripe-sig', 'whsec_test');

      expect(result).toBe(fakeEvent);
      expect(mockConstructEvent).toHaveBeenCalledWith('raw-body', 'stripe-sig', 'whsec_test');
    });

    it('propaga l\'error de firma invàlida', async () => {
      mockConstructEvent.mockImplementation(() => { throw new Error('Invalid signature'); });

      const { constructStripeEvent } = await import('@/lib/services/stripeService');
      expect(() => constructStripeEvent('raw', 'bad-sig', 'whsec')).toThrow('Invalid signature');
    });
  });
});
