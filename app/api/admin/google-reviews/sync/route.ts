import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { runReviewsSync } from '@/lib/services/reviewsSyncService';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const result = await runReviewsSync('reviews-sync:admin');
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  } catch (error) {
    log.error('reviews-sync:admin route error', error instanceof Error ? error : undefined);
    return NextResponse.json({ ok: false, error: 'Error sincronitzant ressenyes' }, { status: 500 });
  }
}
