import { requireAuth } from '@/lib/auth';
import { NextResponse, type NextRequest } from 'next/server';
import { getDossierById, deleteDossier } from '@/lib/services/dossierService';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (auth) return auth;
  const dossier = await getDossierById(params.id);
  if (!dossier) return NextResponse.json({ error: 'No trobat' }, { status: 404 });
  return NextResponse.json(dossier);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (auth) return auth;
  await deleteDossier(params.id);
  return NextResponse.json({ ok: true });
}
