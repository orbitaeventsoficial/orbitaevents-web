import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { createCollaboratorMember, listCollaboratorMembers } from '@/lib/services/collaboratorMemberService';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const result = await listCollaboratorMembers(params.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error llistant membres del proveïdor:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const result = await createCollaboratorMember(params.id, body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error creant membre del proveïdor:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}
