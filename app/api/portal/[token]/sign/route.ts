import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { signContractOnline } from '@/lib/services/contractSignatureService';

const BodySchema = z.object({
  signedBy: z.string().min(2).max(200).trim(),
  signatureBlob: z.string().max(150000).nullable().optional(),
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

  const ip =
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    null;
  const userAgent = req.headers.get('user-agent') || null;

  const result = await signContractOnline({
    rawToken: params.token,
    signedBy: parsed.data.signedBy,
    ip,
    userAgent,
    signatureBlob: parsed.data.signatureBlob ?? null,
  }).catch(() => null);

  if (!result) {
    return NextResponse.json({ error: 'SIGNATURE_FAILED' }, { status: 500 });
  }

  if (!result.ok) {
    const status = result.reason === 'INVALID_TOKEN' ? 404 : 409;
    return NextResponse.json({ error: result.reason }, { status });
  }

  return NextResponse.json({ ok: true });
}
