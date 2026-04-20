import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { loadSocialPerformanceReport } from '@/lib/services/socialPerformanceService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const windowDays = Number(req.nextUrl.searchParams.get('days') || '90');
  const report = await loadSocialPerformanceReport(windowDays);

  return NextResponse.json(report);
}
