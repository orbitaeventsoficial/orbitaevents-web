import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { listPrivacyAuditLogs } from '@/lib/services/privacyService';

export const dynamic = 'force-dynamic';

function normalizePositiveInteger(value: string | null, fallback: number, max?: number): number {
  const parsed = Number(value);
  const normalized = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
  return max ? Math.min(normalized, max) : normalized;
}

function normalizeNonNegativeInteger(value: string | null): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const limit = normalizePositiveInteger(searchParams.get('limit'), 50, 200);
    const offset = normalizeNonNegativeInteger(searchParams.get('offset'));
    const action = searchParams.get('action');

    const { logs, total } = await listPrivacyAuditLogs({ limit, offset, action });
    return NextResponse.json({ ok: true, body: { logs, total } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconegut';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

