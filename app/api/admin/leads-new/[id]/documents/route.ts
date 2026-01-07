import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';

const MAX_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]);
const ALLOWED_DOC_TYPES = new Set([
  'QUOTE',
  'CONTRACT',
  'INVOICE',
  'IMAGE',
  'FILE',
  'OTHER',
]);

interface Params {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const documents = await prisma.leadDocument.findMany({
      where: { leadId: params.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, documents });
  } catch (error) {
    log.error('Error obtenint documents', error);
    return NextResponse.json({ error: 'Error obtenint documents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Storage no configurat' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = String(formData.get('title') || '').trim();
    const type = String(formData.get('type') || 'FILE');
    const createdBy = String(formData.get('createdBy') || 'Admin');

    if (!file) {
      return NextResponse.json({ error: 'Falta el fitxer' }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: 'Falta el títol' }, { status: 400 });
    }
    if (!ALLOWED_DOC_TYPES.has(type)) {
      return NextResponse.json({ error: 'Tipus de document no permès' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Tipus de fitxer no permès' }, { status: 400 });
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'Fitxer massa gran' }, { status: 413 });
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const ext = file.name.split('.').pop() || 'bin';
    const path = `leads/${params.id}/documents/${timestamp}-${random}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { data, error } = await supabaseAdmin.storage
      .from('media')
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      log.error('Error pujant document', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('media')
      .getPublicUrl(data.path);

    const doc = await prisma.leadDocument.create({
      data: {
        leadId: params.id,
        type,
        source: 'MANUAL',
        title,
        fileUrl: urlData.publicUrl,
        filePath: data.path,
        mimeType: file.type,
        size: file.size,
        createdBy,
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: params.id,
        type: 'DOCUMENT',
        title: 'Document afegit',
        description: title,
        metadata: { documentId: doc.id, type: doc.type },
        createdBy,
      },
    });

    return NextResponse.json({ ok: true, document: doc });
  } catch (error) {
    log.error('Error afegint document', error);
    return NextResponse.json({ error: 'Error afegint document' }, { status: 500 });
  }
}
