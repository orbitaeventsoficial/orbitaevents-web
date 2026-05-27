import { requireAuth } from '@/lib/auth';
import { NextResponse, type NextRequest } from 'next/server';
import { sendDossierByEmail } from '@/lib/services/dossierService';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (auth) return auth;
  const result = await sendDossierByEmail(params.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
