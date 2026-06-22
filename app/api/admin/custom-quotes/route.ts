import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { createAdminCustomQuote, listAdminCustomQuotes } from '@/lib/services/customQuoteAdminService';

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    return NextResponse.json(await listAdminCustomQuotes());
  } catch (error) {
    log.error('Error llistant custom quotes:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const result = await createAdminCustomQuote(body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error creant custom quote:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}
