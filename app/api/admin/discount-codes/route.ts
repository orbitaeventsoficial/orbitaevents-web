/**
 * API ROUTE: Admin Discount Codes
 * GET - Llistar codis de descompte
 * POST - Crear nou codi
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  code: z.string().min(2).max(30),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).default('PERCENTAGE'),
  value: z.number().min(0),
  description: z.string().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string(),
  maxUses: z.number().int().positive().optional(),
  minOrderValue: z.number().min(0).optional(),
  applicablePacks: z.array(z.string()).optional(),
  isAccumulative: z.boolean().default(false),
  sourceType: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const codes = await prisma.discountCode.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      total: codes.length,
      active: codes.filter((c) => c.isActive).length,
      expired: codes.filter(
        (c) => c.validUntil < new Date()
      ).length,
      totalUses: codes.reduce((sum, c) => sum + c.currentUses, 0),
    };

    return NextResponse.json({ ok: true, codes, stats });
  } catch (error) {
    log.error('Error obtenint codis de descompte:', error);
    return NextResponse.json(
      { error: 'Error obtenint codis' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dades invàlides', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const normalizedCode = data.code.trim().toUpperCase();

    // Check uniqueness
    const existing = await prisma.discountCode.findUnique({
      where: { code: normalizedCode },
    });
    if (existing) {
      return NextResponse.json(
        { error: `El codi "${normalizedCode}" ja existeix` },
        { status: 409 }
      );
    }

    const code = await prisma.discountCode.create({
      data: {
        code: normalizedCode,
        type: data.type,
        value: data.value,
        description: data.description,
        validFrom: data.validFrom ? new Date(data.validFrom) : new Date(),
        validUntil: new Date(data.validUntil),
        maxUses: data.maxUses,
        minOrderValue: data.minOrderValue,
        applicablePacks: data.applicablePacks || [],
        isAccumulative: data.isAccumulative,
        sourceType: data.sourceType || 'MANUAL',
      },
    });

    await prisma.adminLog.create({
      data: {
        action: 'CREATE',
        entity: 'discountCode',
        entityId: code.id,
        details: { code: normalizedCode, type: data.type, value: data.value },
      },
    });

    return NextResponse.json({ ok: true, code });
  } catch (error) {
    log.error('Error creant codi de descompte:', error);
    return NextResponse.json(
      { error: 'Error creant codi' },
      { status: 500 }
    );
  }
}
