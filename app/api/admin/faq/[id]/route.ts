import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { getAdminFaqById, updateAdminFaq } from '@/lib/services/faqAdminService';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const result = await getAdminFaqById(id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error obtenint FAQ:', error);
    return NextResponse.json({ ok: false, error: 'Error obtenint FAQ' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const { id } = await params;
    const body = await req.json();
    const result = await updateAdminFaq(id, body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error actualitzant FAQ:', error);
    return NextResponse.json({ ok: false, error: 'Error actualitzant FAQ' }, { status: 500 });
  }
}
