import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { deleteCollaboratorMember, updateCollaboratorMember } from '@/lib/services/collaboratorMemberService';

export async function PATCH(request: NextRequest, { params }: { params: { id: string; memberId: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const result = await updateCollaboratorMember(params.memberId, body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error actualitzant membre del proveïdor:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; memberId: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const result = await deleteCollaboratorMember(params.memberId);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error eliminant membre del proveïdor:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}
