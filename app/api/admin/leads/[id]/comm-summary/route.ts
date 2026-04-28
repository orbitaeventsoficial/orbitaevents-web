import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { loadCommTimeline } from '@/lib/services/commTimelineService';

interface Params {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const customerId = req.nextUrl.searchParams.get('customerId');
    const summary = await loadCommTimeline(params.id, customerId);
    return NextResponse.json(summary);
  } catch (error) {
    log.error('Error obtenint resum de comunicacions', error);
    return NextResponse.json({ error: 'Error obtenint resum de comunicacions' }, { status: 500 });
  }
}
