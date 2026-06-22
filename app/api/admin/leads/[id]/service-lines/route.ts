import { NextResponse, type NextRequest } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { listLeadServiceLines, replaceLeadServiceLines } from '@/lib/services/leadServiceLineService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const result = await listLeadServiceLines(params.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error llistant línies del bolo del lead:', error as Error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const result = await replaceLeadServiceLines(params.id, Array.isArray(body?.lines) ? body.lines : []);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error desant línies del bolo del lead:', error as Error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}
