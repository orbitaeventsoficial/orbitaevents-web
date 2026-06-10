import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { createDossierFromBolo } from '@/lib/services/dossierService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const mode = body?.mode === 'quote' ? 'quote' : 'full';
    const result = await createDossierFromBolo(params.id, mode);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error generant dossier des del bolo:', error as Error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}
