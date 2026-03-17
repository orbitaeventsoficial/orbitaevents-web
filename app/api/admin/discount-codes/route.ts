/**
 * API ROUTE: Admin Discount Codes
 * GET - Llistar codis de descompte
 * POST - Crear nou codi
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { z } from 'zod';
import { createAdminDiscountCode, listAdminDiscountCodes } from '@/lib/services/discountCodeAdminService';

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
    const result = await listAdminDiscountCodes();
    return NextResponse.json(result);
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

    const result = await createAdminDiscountCode(parsed.data);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error creant codi de descompte:', error);
    return NextResponse.json(
      { error: 'Error creant codi' },
      { status: 500 }
    );
  }
}
