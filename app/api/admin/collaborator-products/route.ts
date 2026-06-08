import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { listActiveCollaboratorProductsForBooking } from '@/lib/services/collaboratorProductService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const products = await listActiveCollaboratorProductsForBooking();
    return NextResponse.json({ ok: true, products });
  } catch (error) {
    log.error('Error llistant productes de col·laboradors:', error as Error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}
