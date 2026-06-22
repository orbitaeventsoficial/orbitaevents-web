// app/api/admin/leads/[id]/notes/route.ts
// API per gestionar notes d'un lead
import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { cleanupDuplicateLeadNotes, createLeadNote, deleteLeadNote } from '@/lib/services/leadNoteService';

interface Params {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  try {
    const body = await req.json();
    const result = await createLeadNote(params.id, body?.content, body?.createdBy);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error creant nota:', error);
    return NextResponse.json(
      { error: 'Error creant nota' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  try {
    const result = await cleanupDuplicateLeadNotes(params.id);
    return NextResponse.json(result);
  } catch (error) {
    log.error('Error netejant notes duplicades:', error);
    return NextResponse.json({ error: 'Error netejant notes duplicades' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  try {
    const { searchParams } = new URL(req.url);
    const result = await deleteLeadNote(params.id, searchParams.get('noteId'));
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error eliminant nota:', error);
    return NextResponse.json(
      { error: 'Error eliminant nota' },
      { status: 500 }
    );
  }
}
