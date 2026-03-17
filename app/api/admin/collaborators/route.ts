import { NextResponse, type NextRequest } from 'next/server';
import { log } from '@/lib/logger';
import { createAdminCollaborator, listAdminCollaborators } from '@/lib/services/collaboratorAdminService';

export async function GET() {
  try {
    return NextResponse.json(await listAdminCollaborators());
  } catch (error) {
    log.error('Error llistant col·laboradors:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createAdminCollaborator(body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error creant col·laborador:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}
