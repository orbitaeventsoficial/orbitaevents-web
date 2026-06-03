import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { declareBizumPayment } from '@/lib/services/bookingBizumService';

const BodySchema = z.object({
  paymentType: z.enum(['deposit', 'remaining']),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } },
) {
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  }

  const result = await declareBizumPayment({
    rawToken: params.token,
    paymentType: parsed.data.paymentType,
  });

  if (!result.ok) {
    const status = result.reason === 'INVALID_TOKEN' ? 404
      : result.reason === 'ALREADY_PAID' || result.reason === 'ALREADY_DECLARED' ? 409
      : 500;
    return NextResponse.json({ error: result.reason }, { status });
  }

  return NextResponse.json({ ok: true });
}
