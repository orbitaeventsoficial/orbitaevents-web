import { NextRequest, NextResponse } from 'next/server';
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
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });

  const result = await createBookingStripeCheckoutLink({
    bookingId: params.id,
    paymentType: parsed.data.paymentType,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL ?? 'https://orbitaevents.com',
  });

  return NextResponse.json(result.body, { status: result.status });
}
