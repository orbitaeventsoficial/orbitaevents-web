import { requireAuth } from '@/lib/auth';
import { NextResponse, type NextRequest } from 'next/server';
import { getDeletedDossiers } from '@/lib/services/dossierService';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth) return auth;
  const dossiers = await getDeletedDossiers();
  return NextResponse.json({ ok: true, dossiers });
}
