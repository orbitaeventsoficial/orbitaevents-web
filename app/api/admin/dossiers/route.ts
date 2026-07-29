import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { NextResponse, type NextRequest } from 'next/server';
import type { CreateDossierInput } from '@/lib/services/dossierService';
import { createDossierDraftFromLead } from '@/lib/services/dossierAutoDraftService';

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth) return auth;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  const body = await req.json() as CreateDossierInput;
  const leadId = typeof body.leadId === 'string' ? body.leadId.trim() : '';
  if (leadId) {
    const result = await createDossierDraftFromLead(leadId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(
      { ...result, id: result.dossierId },
      { status: result.status === 'created' ? 201 : 200 },
    );
  }

  return NextResponse.json({
    error: 'El dossier canònic requereix leadId. Crea o vincula un lead abans de desar-lo.',
    canonicalRoute: '/admin/dossiers?leadId=...',
  }, { status: 410 });
}
