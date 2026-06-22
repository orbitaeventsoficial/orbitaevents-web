import { NextResponse, type NextRequest } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { createCollaboratorProduct, listCollaboratorProducts } from '@/lib/services/collaboratorProductService';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const products = await listCollaboratorProducts(params.id);
    return NextResponse.json({ products });
  } catch (error) {
    log.error('Error llistant productes del col·laborador:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const result = await createCollaboratorProduct(params.id, body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error creant producte del col·laborador:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}
