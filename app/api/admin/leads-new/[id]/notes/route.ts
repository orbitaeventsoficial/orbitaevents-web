// app/api/admin/leads-new/[id]/notes/route.ts
// API per gestionar notes d'un lead
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

interface Params {
  params: { id: string };
}

// POST - Afegir nota a un lead
export async function POST(req: NextRequest, { params }: Params) {
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

// DELETE - Eliminar nota
export async function DELETE(req: NextRequest, { params: _params }: Params) {
  try {
    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json(
        { error: 'noteId és obligatori' },
        { status: 400 }
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
