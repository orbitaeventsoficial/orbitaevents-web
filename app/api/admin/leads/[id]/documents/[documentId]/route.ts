import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { deleteLeadDocument } from '@/lib/services/leadDocumentService';

interface Params {
  params: { id: string; documentId: string };
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const result = await deleteLeadDocument(params.id, params.documentId);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error eliminant document', error);
    return NextResponse.json({ error: 'Error eliminant document' }, { status: 500 });
  }
}
