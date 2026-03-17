import { NextResponse, type NextRequest } from 'next/server';
import { log } from '@/lib/logger';
import { deleteAdminCustomQuote, getAdminCustomQuote, updateAdminCustomQuote } from '@/lib/services/customQuoteAdminService';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await getAdminCustomQuote(params.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error obtenint custom quote:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const result = await updateAdminCustomQuote(params.id, body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error actualitzant custom quote:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await deleteAdminCustomQuote(params.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error eliminant custom quote:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}
