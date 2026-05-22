import { NextRequest, NextResponse } from 'next/server';
import { processStripeWebhook, StripeWebhookSignatureError } from '@/lib/services/bookingStripePaymentService';

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  try {
    const result = await processStripeWebhook({ rawBody, signature: sig, webhookSecret });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof StripeWebhookSignatureError) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
