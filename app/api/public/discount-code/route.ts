import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { type PublicDiscountValidation, validatePublicDiscountCode } from '@/lib/services/publicDiscountCodeService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const result = await validatePublicDiscountCode(req.nextUrl.searchParams.get('code') || '');
    return NextResponse.json({ ok: true, ...result } satisfies { ok: true } & PublicDiscountValidation);
  } catch (error) {
    log.error('Error validant codi de descompte públic', error);
    return NextResponse.json({ ok: true, valid: false, reason: 'SERVICE_UNAVAILABLE' } satisfies { ok: true } & PublicDiscountValidation);
  }
}
