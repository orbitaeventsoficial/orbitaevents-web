import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
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

  const result = await getAdminLeadScore(params.id);
  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'automation');
  if (permissionError) return permissionError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  const result = await createAdminLeadScoreSnapshot(params.id);
  return NextResponse.json(result.body, { status: result.status });
}
