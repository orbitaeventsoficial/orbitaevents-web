import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { fetchCanonicalAdminActivityPage } from '@/lib/services/timelineQueryService';

export const dynamic = 'force-dynamic';

function normalizePositiveInteger(value: string | null, fallback: number, max?: number): number {
  const parsed = Number(value);
  const normalized = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
  return max ? Math.min(normalized, max) : normalized;
}

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category'); // comms | automation | system | crud
    const days = normalizePositiveInteger(searchParams.get('days'), 7, 90);
    const page = normalizePositiveInteger(searchParams.get('page'), 1);
    const limit = normalizePositiveInteger(searchParams.get('limit'), 50, 200);

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await fetchCanonicalAdminActivityPage({ since, category, page, limit });
    return NextResponse.json(result);
  } catch (error) {
    log.error('Error fetching activity logs', error);
    return NextResponse.json(
      { ok: false, error: 'No s\'han pogut carregar els registres d\'activitat' },
      { status: 500 }
    );
  }
}
