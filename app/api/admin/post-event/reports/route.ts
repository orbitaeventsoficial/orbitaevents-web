import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { createAdminPostEventReport } from '@/lib/services/postEventReportAdminService';

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const result = await createAdminPostEventReport(body);
    const report = result.body.ok && 'report' in result.body ? result.body.report : null;

    if (report) {
      log.info(`Created post-event report for booking ${body.bookingId}`, {
        reportId: report.id,
        status: report.status,
      });
    }

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error creating post-event report:', error as Error);
    return NextResponse.json({ ok: false, error: 'Error creant informe' }, { status: 500 });
  }
}
