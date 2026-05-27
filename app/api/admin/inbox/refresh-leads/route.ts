import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getSafataLeads, getSafataStats } from '@/lib/services/safataService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const [leads, stats] = await Promise.all([getSafataLeads(), getSafataStats()]);
    return NextResponse.json({ ok: true, leads, stats });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error carregant leads' },
      { status: 500 }
    );
  }
}
