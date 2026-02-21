import { NextRequest, NextResponse } from 'next/server';
import { getAdminRole, requireAuth, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import {
  getPackPricingModelConfigEditable,
  upsertPackPricingModelConfig,
} from '@/lib/services/packPricingHealth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;

  const config = await getPackPricingModelConfigEditable();
  return NextResponse.json({ ok: true, config });
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  try {
    const body = await req.json().catch(() => ({}));
    const previous = await getPackPricingModelConfigEditable();
    const saved = await upsertPackPricingModelConfig(body?.config || {});
    const role = getAdminRole(req);

    await prisma.adminLog.create({
      data: {
        action: 'UPDATE',
        entity: 'setting',
        entityId: 'pricing.pack.modelConfig',
        details: {
          role,
          before: previous,
          after: saved,
        },
      },
    });

    return NextResponse.json({ ok: true, config: saved });
  } catch (error) {
    log.error('Error updating pack pricing model config', error);
    return NextResponse.json(
      { ok: false, error: 'No s\'ha pogut actualitzar la configuració econòmica dels packs' },
      { status: 500 }
    );
  }
}

