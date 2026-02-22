import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

interface Params {
  params: { id: string; documentId: string };
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const doc = await prisma.leadDocument.findFirst({
      where: {
        id: params.documentId,
        leadId: params.id,
      },
      select: {
        id: true,
        leadId: true,
        title: true,
        filePath: true,
      },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document no trobat' }, { status: 404 });
    }

    if (doc.filePath && supabaseAdmin) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('media')
        .remove([doc.filePath]);
      if (storageError) {
        log.warn('No s’ha pogut eliminar el fitxer de storage', {
          message: storageError.message,
          name: storageError.name,
        });
      }
    }

    await prisma.leadDocument.delete({
      where: { id: doc.id },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: doc.leadId,
        type: 'DOCUMENT',
        title: 'Document eliminat',
        description: doc.title,
        metadata: { documentId: doc.id },
        createdBy: 'Admin',
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('Error eliminant document', error);
    return NextResponse.json({ error: 'Error eliminant document' }, { status: 500 });
  }
}
