import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type DiscountValidation =
  | {
      valid: true;
      code: string;
      source: 'customer' | 'global' | 'feedback';
      type: 'PERCENTAGE' | 'FIXED_AMOUNT';
      value: number;
      expiresAt: string;
      isAccumulative?: boolean;
    }
  | {
      valid: false;
      reason: string;
    };

function now() {
  return new Date();
}

export async function GET(req: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma');
    const rawCode = (req.nextUrl.searchParams.get('code') || '').trim();
    if (!rawCode) {
      return NextResponse.json({ ok: true, valid: false, reason: 'EMPTY_CODE' } satisfies { ok: true } & DiscountValidation);
    }

    const code = rawCode.toUpperCase();
    const current = now();

    const customerCode = await prisma.customerDiscountCode.findFirst({
      where: { code: { equals: code, mode: 'insensitive' } },
      select: {
        code: true,
        isActive: true,
        validFrom: true,
        validUntil: true,
        maxUses: true,
        currentUses: true,
        discountPercent: true,
      },
    });

    if (customerCode) {
      if (!customerCode.isActive) {
        return NextResponse.json({ ok: true, valid: false, reason: 'INACTIVE' } satisfies { ok: true } & DiscountValidation);
      }
      if (customerCode.validFrom > current || customerCode.validUntil < current) {
        return NextResponse.json({ ok: true, valid: false, reason: 'EXPIRED' } satisfies { ok: true } & DiscountValidation);
      }
      if (customerCode.currentUses >= customerCode.maxUses) {
        return NextResponse.json({ ok: true, valid: false, reason: 'MAX_USES_REACHED' } satisfies { ok: true } & DiscountValidation);
      }

      return NextResponse.json({
        ok: true,
        valid: true,
        code: customerCode.code,
        source: 'customer',
        type: 'PERCENTAGE',
        value: Number(customerCode.discountPercent || 0),
        expiresAt: customerCode.validUntil.toISOString(),
        isAccumulative: false,
      } satisfies { ok: true } & DiscountValidation);
    }

    const globalCode = await prisma.discountCode.findFirst({
      where: { code: { equals: code, mode: 'insensitive' } },
      select: {
        code: true,
        type: true,
        value: true,
        isActive: true,
        validFrom: true,
        validUntil: true,
        maxUses: true,
        currentUses: true,
        isAccumulative: true,
      },
    });

    if (globalCode) {
      if (!globalCode.isActive) {
        return NextResponse.json({ ok: true, valid: false, reason: 'INACTIVE' } satisfies { ok: true } & DiscountValidation);
      }
      if (globalCode.validFrom > current || globalCode.validUntil < current) {
        return NextResponse.json({ ok: true, valid: false, reason: 'EXPIRED' } satisfies { ok: true } & DiscountValidation);
      }
      if (typeof globalCode.maxUses === 'number' && globalCode.currentUses >= globalCode.maxUses) {
        return NextResponse.json({ ok: true, valid: false, reason: 'MAX_USES_REACHED' } satisfies { ok: true } & DiscountValidation);
      }

      return NextResponse.json({
        ok: true,
        valid: true,
        code: globalCode.code,
        source: 'global',
        type: globalCode.type,
        value: Number(globalCode.value || 0),
        expiresAt: globalCode.validUntil.toISOString(),
        isAccumulative: Boolean(globalCode.isAccumulative),
      } satisfies { ok: true } & DiscountValidation);
    }

    const feedbackCode = await prisma.clientFeedback.findFirst({
      where: { discountCode: { equals: code, mode: 'insensitive' } },
      select: {
        discountCode: true,
        discountPercent: true,
        discountValidUntil: true,
        discountUsed: true,
      },
    });

    if (feedbackCode) {
      if (feedbackCode.discountUsed) {
        return NextResponse.json({ ok: true, valid: false, reason: 'ALREADY_USED' } satisfies { ok: true } & DiscountValidation);
      }
      if (feedbackCode.discountValidUntil < current) {
        return NextResponse.json({ ok: true, valid: false, reason: 'EXPIRED' } satisfies { ok: true } & DiscountValidation);
      }

      return NextResponse.json({
        ok: true,
        valid: true,
        code: feedbackCode.discountCode,
        source: 'feedback',
        type: 'PERCENTAGE',
        value: Number(feedbackCode.discountPercent || 0),
        expiresAt: feedbackCode.discountValidUntil.toISOString(),
        isAccumulative: false,
      } satisfies { ok: true } & DiscountValidation);
    }

    return NextResponse.json({ ok: true, valid: false, reason: 'NOT_FOUND' } satisfies { ok: true } & DiscountValidation);
  } catch (error) {
    log.error('Error validant codi de descompte públic', error);
    return NextResponse.json({ ok: true, valid: false, reason: 'SERVICE_UNAVAILABLE' } satisfies { ok: true } & DiscountValidation);
  }
}
