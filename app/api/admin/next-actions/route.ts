import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { loadNextBestActions } from '@/lib/services/nextBestActionService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const report = await loadNextBestActions();
  return NextResponse.json(report);
}
