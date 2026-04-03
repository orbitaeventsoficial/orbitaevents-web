import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { createAdminCollaborator, listAdminCollaborators } from '@/lib/services/collaboratorAdminService';

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    return NextResponse.json(await listAdminCollaborators());
  } catch (error) {
    log.error('Error llistant col·laboradors:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const result = await createAdminCollaborator(body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error creant col·laborador:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}
