import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { createAdminLeadScoreSnapshot, getAdminLeadScore } from '@/lib/services/leadScoreAdminService';

interface Params {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;

  try {
    const result = await getAdminLeadScore(params.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error obtenint score del lead', error, { context: { endpoint: 'GET /api/admin/leads/[id]/score', leadId: params.id } });
    return NextResponse.json({ ok: false, error: 'Error obtenint score del lead' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'automation');
  if (permissionError) return permissionError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const result = await createAdminLeadScoreSnapshot(params.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error creant snapshot score del lead', error, { context: { endpoint: 'POST /api/admin/leads/[id]/score', leadId: params.id } });
    return NextResponse.json({ ok: false, error: 'Error creant snapshot score' }, { status: 500 });
  }
}
