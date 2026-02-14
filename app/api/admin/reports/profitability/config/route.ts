import { NextRequest, NextResponse } from 'next/server';
import { getAdminRole, requireAuth, requirePermission } from '@/lib/auth';
import {
  DEFAULT_PROFITABILITY_CONFIG,
  getProfitabilityConfig,
  normalizeProfitabilityConfig,
  upsertProfitabilityConfig,
} from '@/lib/services/profitabilityService';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;

  const config = await getProfitabilityConfig();
  return NextResponse.json({ ok: true, config, defaults: DEFAULT_PROFITABILITY_CONFIG });
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  try {
    const body = await req.json().catch(() => ({}));
    const incoming = normalizeProfitabilityConfig(body?.config);
    const previous = await getProfitabilityConfig();
    const saved = await upsertProfitabilityConfig(incoming);
    const role = getAdminRole(req);

    await prisma.adminLog.create({
      data: {
        action: 'UPDATE',
        entity: 'setting',
        entityId: 'finance.profitabilityConfig',
        details: {
          key: 'finance.profitabilityConfig',
          role,
          before: previous,
          after: saved,
        },
      },
    });

    return NextResponse.json({ ok: true, config: saved });
  } catch (error) {
    log.error('Error updating profitability config', error);
    return NextResponse.json(
      { ok: false, error: 'No se pudo actualizar configuración de rentabilidad' },
      { status: 500 }
    );
  }
}
