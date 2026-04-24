import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { loadLossReport } from '@/lib/services/leadLossAnalyticsService';

export const dynamic = 'force-dynamic';

const DEFAULT_DAYS = 90;
const MIN_DAYS = 1;
const MAX_DAYS = 365;

function parseSinceDays(raw: string | null): number {
  if (!raw) return DEFAULT_DAYS;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_DAYS;
  if (parsed < MIN_DAYS) return MIN_DAYS;
  if (parsed > MAX_DAYS) return MAX_DAYS;
  return parsed;
}

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;

  const sinceDays = parseSinceDays(req.nextUrl.searchParams.get('days'));
  const summary = await loadLossReport({ sinceDays });

  return NextResponse.json({ ok: true, sinceDays, summary });
}
