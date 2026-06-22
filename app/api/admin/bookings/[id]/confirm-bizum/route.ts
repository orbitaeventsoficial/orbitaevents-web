import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth';
import { confirmBizumPayment } from '@/lib/services/bookingBizumService';

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
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  }

  const result = await confirmBizumPayment({
    bookingId: params.id,
    paymentType: parsed.data.paymentType,
  });

  if (!result.ok) {
    const status = result.reason === 'NOT_FOUND' ? 404
      : result.reason === 'NO_DECLARATION' ? 409
      : 409;
    return NextResponse.json({ error: result.reason }, { status });
  }

  return NextResponse.json({ ok: true });
}
