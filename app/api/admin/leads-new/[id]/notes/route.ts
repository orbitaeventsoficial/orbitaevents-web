// app/api/admin/leads-new/[id]/notes/route.ts
// API per gestionar notes d'un lead
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

interface Params {
  params: { id: string };
}

function extractUid(content: string): string | null {
  const match = content.match(/\(UID\s*(\d+)\)/i);
  return match?.[1] || null;
}

// POST - Afegir nota a un lead
export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const { id } = params;
    const body = await req.json();
    const { content, createdBy } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'El contingut de la nota és obligatori' },
        { status: 400 }
      );
    }

    // Verificar que el lead existeix
    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead no trobat' },
        { status: 404 }
      );
    }

    const note = await prisma.leadNote.create({
      data: {
        leadId: id,
        content: content.trim(),
        createdBy: createdBy || 'Admin',
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: id,
        type: 'NOTE',
        title: 'Nota afegida',
        description: content.trim().slice(0, 200),
        createdBy: createdBy || 'Admin',
      },
    });

    return NextResponse.json({
      ok: true,
      note,
    });
  } catch (error) {
    log.error('Error creant nota:', error);
    return NextResponse.json(
      { error: 'Error creant nota' },
      { status: 500 }
    );
  }
}

// PUT - Netejar notes duplicades
export async function PUT(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const notes = await prisma.leadNote.findMany({
      where: { leadId: params.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, content: true },
    });

    const keepByKey = new Map<string, string>();
    const idsToDelete: string[] = [];

    for (const note of notes) {
      const uid = extractUid(note.content);
      const normalized = note.content.trim().replace(/\s+/g, ' ');
      const key = uid ? `uid:${uid}` : `content:${normalized}`;
      if (keepByKey.has(key)) {
        idsToDelete.push(note.id);
      } else {
        keepByKey.set(key, note.id);
      }
    }

    if (idsToDelete.length > 0) {
      await prisma.leadNote.deleteMany({
        where: {
          id: { in: idsToDelete },
          leadId: params.id,
        },
      });
    }

    return NextResponse.json({ ok: true, deleted: idsToDelete.length });
  } catch (error) {
    log.error('Error netejant notes duplicades:', error);
    return NextResponse.json({ error: 'Error netejant notes duplicades' }, { status: 500 });
  }
}

// DELETE - Eliminar nota
export async function DELETE(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json(
        { error: 'noteId és obligatori' },
        { status: 400 }
      );
    }

    const note = await prisma.leadNote.findFirst({
      where: {
        id: noteId,
        leadId: params.id,
      },
      select: { id: true },
    });

    if (!note) {
      return NextResponse.json(
        { error: 'Nota no trobada' },
        { status: 404 }
      );
    }

    await prisma.leadNote.delete({
      where: { id: noteId },
    });

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    log.error('Error eliminant nota:', error);
    return NextResponse.json(
      { error: 'Error eliminant nota' },
      { status: 500 }
    );
  }
}
