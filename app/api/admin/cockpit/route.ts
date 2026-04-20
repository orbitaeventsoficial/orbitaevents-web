import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { loadExecutiveCockpit } from '@/lib/services/executiveCockpitService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const cockpit = await loadExecutiveCockpit();
  return NextResponse.json(cockpit);
}
