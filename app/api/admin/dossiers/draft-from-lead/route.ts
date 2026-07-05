import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { createDossierDraftFromLead } from '@/lib/services/dossierAutoDraftService';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth) return auth;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  const body = await req.json().catch(() => ({})) as { leadId?: string };
  const result = await createDossierDraftFromLead(body.leadId ?? '');
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result, { status: result.status === 'created' ? 201 : 200 });
}
