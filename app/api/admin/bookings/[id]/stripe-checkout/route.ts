import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth';
import { createBookingStripeCheckoutLink } from '@/lib/services/bookingStripePaymentService';

const BodySchema = z.object({
  paymentType: z.enum(['deposit', 'remaining']),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'STRIPE_NOT_CONFIGURED' }, { status: 500 });
  }

  const result = await createBookingStripeCheckoutLink({
    bookingId: params.id,
    paymentType: parsed.data.paymentType,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL ?? 'https://orbitaevents.com',
  });

  return NextResponse.json(result.body, { status: result.status });
}
