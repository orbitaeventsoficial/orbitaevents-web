import Stripe from 'stripe';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key, { apiVersion: '2026-04-22.dahlia' });
}

export type StripePaymentType = 'deposit' | 'remaining';

export async function createStripeCheckoutSession(input: {
  bookingId: string;
  paymentType: StripePaymentType;
  amountEur: number;
  clientEmail?: string | null;
  description: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripe();
  const amountCents = Math.round(input.amountEur * 100);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: input.clientEmail || undefined,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: { name: input.description },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: { bookingId: input.bookingId, paymentType: input.paymentType },
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  });

  if (!session.url) throw new Error('No Stripe session URL returned');
  return { sessionId: session.id, url: session.url };
}

export function constructStripeEvent(
  rawBody: string,
  signature: string,
  webhookSecret: string,
): Stripe.Event {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}
