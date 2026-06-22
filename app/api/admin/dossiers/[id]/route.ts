import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { NextResponse, type NextRequest } from 'next/server';
import { getDossierById, softDeleteDossier, restoreDossier, purgeDossier } from '@/lib/services/dossierService';

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
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  await softDeleteDossier(params.id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (auth) return auth;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const body = await req.json() as { action?: string };
  if (body.action === 'restore') {
    await restoreDossier(params.id);
    return NextResponse.json({ ok: true });
  }
  if (body.action === 'purge') {
    await purgeDossier(params.id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Acció desconeguda' }, { status: 400 });
}
