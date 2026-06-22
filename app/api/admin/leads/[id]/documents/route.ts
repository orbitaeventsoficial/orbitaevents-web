import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { listLeadDocuments, uploadLeadDocument } from '@/lib/services/leadDocumentService';

interface Params {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const result = await listLeadDocuments(params.id);
    return NextResponse.json(result);
  } catch (error) {
    log.error('Error obtenint documents', error);
    return NextResponse.json({ error: 'Error obtenint documents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  try {
    const result = await uploadLeadDocument(params.id, await req.formData());
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error afegint document', error);
    return NextResponse.json({ error: 'Error afegint document' }, { status: 500 });
  }
}
