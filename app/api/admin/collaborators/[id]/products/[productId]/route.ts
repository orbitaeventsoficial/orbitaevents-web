import { NextResponse, type NextRequest } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { deleteCollaboratorProduct, updateCollaboratorProduct } from '@/lib/services/collaboratorProductService';

export async function PATCH(request: NextRequest, { params }: { params: { id: string; productId: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const result = await updateCollaboratorProduct(params.productId, body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error actualitzant producte del col·laborador:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; productId: string } }) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const result = await deleteCollaboratorProduct(params.productId);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error eliminant producte del col·laborador:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}
