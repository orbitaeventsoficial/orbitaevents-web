import { NextRequest, NextResponse } from 'next/server';
import { getAdminRole, requireAuth, requirePermission } from '@/lib/auth';
import {
  DEFAULT_PROFITABILITY_CONFIG,
  getProfitabilityConfig,
  normalizeProfitabilityConfig,
  upsertProfitabilityConfig,
} from '@/lib/services/profitabilityService';
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
    const saved = await upsertProfitabilityConfig(incoming, getAdminRole(req));
    return NextResponse.json({ ok: true, config: saved });
  } catch (error) {
    log.error('Error updating profitability config', error);
    return NextResponse.json(
      { ok: false, error: 'No s\'ha pogut actualitzar la configuració de rendibilitat' },
      { status: 500 }
    );
  }
}
