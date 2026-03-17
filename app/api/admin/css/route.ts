import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { getAdminCustomCss, saveAdminCustomCss } from '@/lib/services/adminCustomCssService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;

  const css = await getAdminCustomCss();
  return NextResponse.json({ ok: true, css });
}

export async function PUT(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  const body = await req.json().catch(() => null) as { css?: string } | null;
  const { hadForbiddenRules } = await saveAdminCustomCss(typeof body?.css === 'string' ? body.css : '');

  return NextResponse.json({ ok: true, sanitized: hadForbiddenRules });
}
