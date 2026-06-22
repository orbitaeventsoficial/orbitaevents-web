import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { NextResponse, type NextRequest } from 'next/server';
import { createDossier } from '@/lib/services/dossierService';
import type { CreateDossierInput } from '@/lib/services/dossierService';

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth) return auth;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  const body = await req.json() as CreateDossierInput;
  if (!body.nom?.trim()) {
    return NextResponse.json({ error: 'Nom requerit' }, { status: 400 });
  }
  if (!body.productIds?.length) {
    return NextResponse.json({ error: 'Cal seleccionar almenys un producte' }, { status: 400 });
  }

  const dossier = await createDossier(body);
  return NextResponse.json(dossier, { status: 201 });
}
