import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockProcessStripeWebhook } = vi.hoisted(() => ({
  mockProcessStripeWebhook: vi.fn(),
}));

vi.mock('@/lib/services/bookingStripePaymentService', async () => {
  const actual = await vi.importActual<typeof import('@/lib/services/bookingStripePaymentService')>('@/lib/services/bookingStripePaymentService');
  return {
    StripeWebhookSignatureError: actual.StripeWebhookSignatureError,
    processStripeWebhook: mockProcessStripeWebhook,
  };
});

import { POST } from '@/app/api/webhooks/stripe/route';
import { StripeWebhookSignatureError } from '@/lib/services/bookingStripePaymentService';

function makeRequest(signature: string | null = 'sig') {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (signature) headers.set('stripe-signature', signature);
  return new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    body: JSON.stringify({ id: 'evt_1' }),
    headers,
  });
}

describe('POST /api/webhooks/stripe', () => {
  const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    mockProcessStripeWebhook.mockResolvedValue({ received: true });
  });

  afterEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
  });

  it('retorna 500 si el webhook no està configurat', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'Webhook not configured' });
    expect(mockProcessStripeWebhook).not.toHaveBeenCalled();
  });

  it('retorna 400 si falta la signatura Stripe', async () => {
    const res = await POST(makeRequest(null));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Missing signature' });
  });

  it('retorna 400 si Stripe rebutja la signatura', async () => {
    mockProcessStripeWebhook.mockRejectedValue(new StripeWebhookSignatureError());

    const res = await POST(makeRequest('bad-sig'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid signature' });
  });

  it('retorna 500 si falla el processament intern', async () => {
    mockProcessStripeWebhook.mockRejectedValue(new Error('database down'));

    const res = await POST(makeRequest('sig'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'Webhook processing failed' });
  });

  it('retorna received si el servei processa el webhook', async () => {
    const res = await POST(makeRequest('sig'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ received: true });
    expect(mockProcessStripeWebhook).toHaveBeenCalledWith({
      rawBody: '{"id":"evt_1"}',
      signature: 'sig',
      webhookSecret: 'whsec_test',
    });
  });
});
