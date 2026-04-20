// app/api/admin/email-tracking/route.ts
// Report de rendiment d'email per plantilla (A/B testing).

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { loadEmailTrackingReport } from '@/lib/services/emailTrackingService';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const windowDays = Number(req.nextUrl.searchParams.get('days') || '90');
    const report = await loadEmailTrackingReport(
      Number.isFinite(windowDays) && windowDays > 0 ? windowDays : 90
    );
    return NextResponse.json(report);
  } catch (error) {
    console.error('[email-tracking] Error loading report:', error);
    return NextResponse.json({ error: 'Error carregant report de tracking' }, { status: 500 });
  }
}
