import { NextResponse, type NextRequest } from 'next/server';
import { log } from '@/lib/logger';
import { deleteAdminCollaborator, getAdminCollaborator, updateAdminCollaborator } from '@/lib/services/collaboratorAdminService';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await getAdminCollaborator(params.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error obtenint col·laborador:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const result = await updateAdminCollaborator(params.id, body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error actualitzant col·laborador:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await deleteAdminCollaborator(params.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error eliminant col·laborador:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}
