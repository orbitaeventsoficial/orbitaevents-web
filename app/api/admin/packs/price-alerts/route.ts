import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { getPackPricingAlertsCount } from '@/lib/services/packPricingHealth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;

  const count = await getPackPricingAlertsCount();
  return NextResponse.json({ ok: true, count });
}
