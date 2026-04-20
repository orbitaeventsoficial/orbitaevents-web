import { NextResponse } from 'next/server';
import { getEnabledCoverageAreas, getEnabledCoverageCities } from '@/lib/coverage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [areas, cities] = await Promise.all([
      getEnabledCoverageAreas(),
      getEnabledCoverageCities(),
    ]);

    return NextResponse.json({ ok: true, areas, cities });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Error loading coverage data' },
      { status: 500 }
    );
  }
}

