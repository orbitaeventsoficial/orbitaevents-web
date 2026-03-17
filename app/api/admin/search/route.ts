// app/api/admin/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { searchAdminEntities } from '@/lib/services/adminSearchService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const result = await searchAdminEntities(searchParams.get('q') || '');
    return NextResponse.json(result);
  } catch (error) {
    log.error('Error admin search', error);
    return NextResponse.json({ error: 'Error buscant' }, { status: 500 });
  }
}
