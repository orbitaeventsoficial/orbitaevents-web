import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { syncPackPublicPricesToRecommended } from '@/lib/services/packPricingHealth';

export const dynamic = 'force-dynamic';

function isCronAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const bearer = req.headers.get('authorization');
  return bearer === `Bearer ${cronSecret}`;
}

export async function POST(req: NextRequest) {
  const cronAllowed = isCronAuthorized(req);
  if (!cronAllowed) {
    const authError = requireAuth(req);
    if (authError) return authError;
    const permissionError = requirePermission(req, 'automation');
    if (permissionError) return permissionError;
  }

  const result = await syncPackPublicPricesToRecommended();
  return NextResponse.json({
    ok: true,
    ...result,
  });
}
