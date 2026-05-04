import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { sendBulkComposeSegment, type BulkComposeSegmentKey } from '@/lib/services/bulkComposeSegmentService';

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const result = await sendBulkComposeSegment({
      segmentKey: String(body?.segmentKey || '') as BulkComposeSegmentKey,
      subject: String(body?.subject || ''),
      body: String(body?.body || ''),
      templateKey: body?.templateKey ? String(body.templateKey) : null,
    });
    return NextResponse.json(result.ok ? { ok: true, summary: result } : { ok: false, error: result.error }, {
      status: result.ok ? 200 : result.status,
    });
  } catch (error) {
    log.error('Error enviant correu massiu admin:', error);
    return NextResponse.json(
      { ok: false, error: 'Error enviant correu massiu' },
      { status: 500 },
    );
  }
}
