import { NextResponse, type NextRequest } from 'next/server';
import { log } from '@/lib/logger';
import { createAdminCustomQuote, listAdminCustomQuotes } from '@/lib/services/customQuoteAdminService';

export async function GET() {
  try {
    return NextResponse.json(await listAdminCustomQuotes());
  } catch (error) {
    log.error('Error llistant custom quotes:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createAdminCustomQuote(body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error creant custom quote:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}
