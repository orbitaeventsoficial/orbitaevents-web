import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { deleteAdminCustomQuote, getAdminCustomQuote, updateAdminCustomQuote } from '@/lib/services/customQuoteAdminService';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const result = await getAdminCustomQuote(params.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error obtenint custom quote:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const result = await updateAdminCustomQuote(params.id, body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error actualitzant custom quote:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const result = await deleteAdminCustomQuote(params.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error eliminant custom quote:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}
