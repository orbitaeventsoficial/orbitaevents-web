import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma, mockCreateStripeCheckoutSession, mockConstructStripeEvent } = vi.hoisted(() => ({
  mockPrisma: {
    booking: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    clientPortalAccess: {
      findFirst: vi.fn(),
    },
    adminLog: {
      create: vi.fn(),
    },
    stripeWebhookEvent: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  mockCreateStripeCheckoutSession: vi.fn(),
  mockConstructStripeEvent: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/stripeService', () => ({
  createStripeCheckoutSession: mockCreateStripeCheckoutSession,
  constructStripeEvent: mockConstructStripeEvent,
}));

import {
  createBookingStripeCheckoutLink,
  processStripeWebhook,
  StripeWebhookSignatureError,
} from '@/lib/services/bookingStripePaymentService';

const booking = {
  id: 'booking-1',
  reference: 'OE-2026-001',
  clientEmail: 'client@test.com',
  total: 1000,
  depositAmount: 300,
  depositPaid: false,
  remainingAmount: 700,
  remainingPaid: false,
  cashAmount: null,
};

describe('createBookingStripeCheckoutLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.booking.findUnique.mockResolvedValue(booking);
    mockPrisma.booking.update.mockResolvedValue({});
    mockPrisma.clientPortalAccess.findFirst.mockResolvedValue({ locale: 'ca' });
    mockCreateStripeCheckoutSession.mockResolvedValue({
      sessionId: 'cs_test_123',
      url: 'https://checkout.stripe.com/c/pay_deposit',
    });
  });

  it('crea i desa link de paga i senyal', async () => {
    const result = await createBookingStripeCheckoutLink({
      bookingId: 'booking-1',
      paymentType: 'deposit',
      baseUrl: 'https://orbita.test',
    });

    expect(result).toEqual({ status: 200, body: { url: 'https://checkout.stripe.com/c/pay_deposit' } });
    expect(mockCreateStripeCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
      bookingId: 'booking-1',
      paymentType: 'deposit',
      amountEur: 300,
      successUrl: 'https://orbita.test/ca/portal/payment-success?type=deposit&ref=OE-2026-001',
      cancelUrl: 'https://orbita.test/admin/bookings/booking-1',
    }));
    expect(mockPrisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'booking-1' },
      data: { depositPaymentUrl: 'https://checkout.stripe.com/c/pay_deposit' },
    });
  });

  it('bloqueja la resta si la paga i senyal encara no està pagada', async () => {
    const result = await createBookingStripeCheckoutLink({
      bookingId: 'booking-1',
      paymentType: 'remaining',
      baseUrl: 'https://orbita.test',
    });

    expect(result).toEqual({ status: 409, body: { error: 'DEPOSIT_NOT_PAID' } });
    expect(mockCreateStripeCheckoutSession).not.toHaveBeenCalled();
  });

  it('bloqueja la paga i senyal si cashAmount ja la cobreix', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ ...booking, cashAmount: 300 });

    const result = await createBookingStripeCheckoutLink({
      bookingId: 'booking-1',
      paymentType: 'deposit',
      baseUrl: 'https://orbita.test',
    });

    expect(result).toEqual({ status: 409, body: { error: 'ALREADY_PAID' } });
    expect(mockCreateStripeCheckoutSession).not.toHaveBeenCalled();
  });

  it('bloqueja link online si cashAmount redueix parcialment la paga i senyal', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ ...booking, cashAmount: 100 });

    const result = await createBookingStripeCheckoutLink({
      bookingId: 'booking-1',
      paymentType: 'deposit',
      baseUrl: 'https://orbita.test',
    });

    expect(result).toEqual({ status: 409, body: { error: 'PARTIAL_CASH_REQUIRES_MANUAL' } });
    expect(mockCreateStripeCheckoutSession).not.toHaveBeenCalled();
  });

  it('permet generar la resta si la paga i senyal queda coberta per cashAmount', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ ...booking, cashAmount: 300 });
    mockCreateStripeCheckoutSession.mockResolvedValue({
      sessionId: 'cs_test_456',
      url: 'https://checkout.stripe.com/c/pay_remaining',
    });

    const result = await createBookingStripeCheckoutLink({
      bookingId: 'booking-1',
      paymentType: 'remaining',
      baseUrl: 'https://orbita.test',
    });

    expect(result).toEqual({ status: 200, body: { url: 'https://checkout.stripe.com/c/pay_remaining' } });
    expect(mockCreateStripeCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
      paymentType: 'remaining',
      amountEur: 700,
    }));
  });

  it('bloqueja link online si cashAmount redueix parcialment la resta', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ ...booking, depositPaid: true, cashAmount: 100 });

    const result = await createBookingStripeCheckoutLink({
      bookingId: 'booking-1',
      paymentType: 'remaining',
      baseUrl: 'https://orbita.test',
    });

    expect(result).toEqual({ status: 409, body: { error: 'PARTIAL_CASH_REQUIRES_MANUAL' } });
    expect(mockCreateStripeCheckoutSession).not.toHaveBeenCalled();
  });

  it('crea i desa link de pagament final quan toca', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ ...booking, depositPaid: true });
    mockCreateStripeCheckoutSession.mockResolvedValue({
      sessionId: 'cs_test_456',
      url: 'https://checkout.stripe.com/c/pay_remaining',
    });

    const result = await createBookingStripeCheckoutLink({
      bookingId: 'booking-1',
      paymentType: 'remaining',
      baseUrl: 'https://orbita.test',
    });

    expect(result).toEqual({ status: 200, body: { url: 'https://checkout.stripe.com/c/pay_remaining' } });
    expect(mockCreateStripeCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
      successUrl: 'https://orbita.test/ca/portal/payment-success?type=remaining&ref=OE-2026-001',
    }));
    expect(mockPrisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'booking-1' },
      data: { remainingPaymentUrl: 'https://checkout.stripe.com/c/pay_remaining' },
    });
  });

  it('usa locale per defecte si no hi ha portal access', async () => {
    mockPrisma.clientPortalAccess.findFirst.mockResolvedValue(null);

    await createBookingStripeCheckoutLink({
      bookingId: 'booking-1',
      paymentType: 'deposit',
      baseUrl: 'https://orbita.test',
    });

    expect(mockCreateStripeCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
      successUrl: 'https://orbita.test/ca/portal/payment-success?type=deposit&ref=OE-2026-001',
    }));
  });
});

describe('processStripeWebhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.booking.update.mockResolvedValue({});
    mockPrisma.adminLog.create.mockResolvedValue({});
    mockPrisma.stripeWebhookEvent.create.mockResolvedValue({});
    mockPrisma.$transaction.mockImplementation(async (callback) => callback(mockPrisma));
  });

  it('marca la paga i senyal com a pagada quan Stripe confirma checkout', async () => {
    mockConstructStripeEvent.mockReturnValue({
      id: 'evt_deposit_1',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_deposit', amount_total: 30000, metadata: { bookingId: 'booking-1', paymentType: 'deposit' } } },
    });

    const result = await processStripeWebhook({
      rawBody: '{}',
      signature: 'sig',
      webhookSecret: 'whsec',
    });

    expect(result).toEqual({ received: true });
    expect(mockPrisma.stripeWebhookEvent.create).toHaveBeenCalledWith({
      data: {
        eventId: 'evt_deposit_1',
        type: 'checkout.session.completed',
        bookingId: 'booking-1',
        paymentType: 'deposit',
        stripeSessionId: 'cs_deposit',
      },
    });
    expect(mockPrisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'booking-1' },
      data: { depositPaid: true, depositPaidAt: expect.any(Date) },
    });
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: {
        action: 'PAYMENT_RECORDED',
        entity: 'booking',
        entityId: 'booking-1',
        details: {
          message: 'Pagament Stripe registrat: paga i senyal',
          source: 'stripe',
          paymentType: 'deposit',
          stripeSessionId: 'cs_deposit',
          amountCents: 30000,
        },
      },
    });
  });

  it('marca la resta com a pagada quan Stripe confirma checkout final', async () => {
    mockConstructStripeEvent.mockReturnValue({
      id: 'evt_remaining_1',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_remaining', amount_total: 70000, metadata: { bookingId: 'booking-1', paymentType: 'remaining' } } },
    });

    await processStripeWebhook({ rawBody: '{}', signature: 'sig', webhookSecret: 'whsec' });

    expect(mockPrisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'booking-1' },
      data: { remainingPaid: true, remainingPaidAt: expect.any(Date) },
    });
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: {
        action: 'PAYMENT_RECORDED',
        entity: 'booking',
        entityId: 'booking-1',
        details: {
          message: 'Pagament Stripe registrat: resta',
          source: 'stripe',
          paymentType: 'remaining',
          stripeSessionId: 'cs_remaining',
          amountCents: 70000,
        },
      },
    });
  });

  it('ignora un retry Stripe ja processat sense duplicar update ni log', async () => {
    mockConstructStripeEvent.mockReturnValue({
      id: 'evt_deposit_1',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_deposit', amount_total: 30000, metadata: { bookingId: 'booking-1', paymentType: 'deposit' } } },
    });
    mockPrisma.$transaction.mockRejectedValue(Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }));

    const result = await processStripeWebhook({ rawBody: '{}', signature: 'sig', webhookSecret: 'whsec' });

    expect(result).toEqual({ received: true });
    expect(mockPrisma.booking.update).not.toHaveBeenCalled();
    expect(mockPrisma.adminLog.create).not.toHaveBeenCalled();
  });

  it('separa errors de signatura Stripe dels errors de processament intern', async () => {
    mockConstructStripeEvent.mockImplementation(() => {
      throw new Error('bad signature');
    });

    await expect(processStripeWebhook({ rawBody: '{}', signature: 'bad', webhookSecret: 'whsec' }))
      .rejects.toBeInstanceOf(StripeWebhookSignatureError);
    expect(mockPrisma.booking.update).not.toHaveBeenCalled();
  });
});
