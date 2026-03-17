import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { listPrivacyAuditLogs } from '@/lib/services/privacyAuditService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    return NextResponse.json(
      await listPrivacyAuditLogs({
        limit: Math.min(Number(searchParams.get('limit') || 50), 200),
        offset: Number(searchParams.get('offset') || 0),
        action: searchParams.get('action'),
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconegut';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
