import { prisma } from '@/lib/prisma';
import { recordLeadNoteAdded } from '@/lib/services/leadActivityService';

function extractUid(content: string): string | null {
  const match = content.match(/\(UID\s*(\d+)\)/i);
  return match?.[1] || null;
}

export async function createLeadNote(leadId: string, content: string, createdBy?: string) {
  if (!content || content.trim().length === 0) {
    return { status: 400, body: { error: 'El contingut de la nota és obligatori' } };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true },
  });

  if (!lead) {
    return { status: 404, body: { error: 'Lead no trobat' } };
  }

  const author = createdBy || 'Admin';
  const trimmed = content.trim();

  const note = await prisma.leadNote.create({
    data: {
      leadId,
      content: trimmed,
      createdBy: author,
    },
  });

  await recordLeadNoteAdded({
    leadId,
    content: trimmed,
    createdBy: author,
  });

  return { status: 200, body: { ok: true, note } };
}

export async function cleanupDuplicateLeadNotes(leadId: string) {
  const notes = await prisma.leadNote.findMany({
    where: { leadId },
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
        leadId,
      },
    });
  }

  return { ok: true, deleted: idsToDelete.length };
}

export async function deleteLeadNote(leadId: string, noteId?: string | null) {
  if (!noteId) {
    return { status: 400, body: { error: 'noteId és obligatori' } };
  }

  const note = await prisma.leadNote.findFirst({
    where: {
      id: noteId,
      leadId,
    },
    select: { id: true },
  });

  if (!note) {
    return { status: 404, body: { error: 'Nota no trobada' } };
  }

  await prisma.leadNote.delete({ where: { id: noteId } });
  return { status: 200, body: { ok: true } };
}
