import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import {
  listMarketingSpend,
  upsertMarketingSpend,
  deleteMarketingSpend,
} from '@/lib/services/marketingSpendService';

const CHANNELS = [
  'WEBSITE', 'CONFIGURATOR', 'PHONE', 'WHATSAPP', 'INSTAGRAM',
  'WALLAPOP', 'REFERRAL', 'GOOGLE', 'OTHER',
] as const;

const spendSchema = z.object({
  channel: z.enum(CHANNELS),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  amount: z.number().min(0),
  notes: z.string().max(500).optional().nullable(),
});

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;
  try {
    const entries = await listMarketingSpend();
    return NextResponse.json({ entries });
  } catch (error) {
    log.error('Error llistant despesa de màrqueting', error);
    return NextResponse.json({ error: 'Error llistant despesa' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  try {
    const body = await req.json();
    const parsed = spendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dades invàlides', details: parsed.error.flatten() }, { status: 400 });
    }
    const entry = await upsertMarketingSpend(parsed.data);
    return NextResponse.json({ entry });
  } catch (error) {
    log.error('Error desant despesa de màrqueting', error);
    return NextResponse.json({ error: 'Error desant despesa' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Falta id' }, { status: 400 });
    }
    await deleteMarketingSpend(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('Error eliminant despesa de màrqueting', error);
    return NextResponse.json({ error: 'Error eliminant despesa' }, { status: 500 });
  }
}
