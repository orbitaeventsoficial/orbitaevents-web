import type { LeadDocumentType } from '@prisma/client';
import { LEAD_DOCUMENT_ALLOWED_MIME_TYPES, LEAD_DOCUMENT_TYPE_VALUES, LEAD_DOCUMENT_UPLOAD_MAX_SIZE_BYTES } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { deleteFile, uploadFile } from '@/lib/storage';
import { recordLeadDocumentAdded, recordLeadDocumentDeleted } from '@/lib/services/leadActivityService';


export async function listLeadDocuments(leadId: string) {
  const documents = await prisma.leadDocument.findMany({
    where: { leadId },
    orderBy: { createdAt: 'desc' },
  });
  return { ok: true, documents };
}

export async function uploadLeadDocument(leadId: string, formData: FormData) {
  const file = formData.get('file') as File | null;
  const title = String(formData.get('title') || '').trim();
  const rawType = String(formData.get('type') || 'FILE').trim().toUpperCase();
  const createdBy = String(formData.get('createdBy') || 'Admin');

  if (!file) {
    return { status: 400, body: { error: 'Falta el fitxer' } };
  }
  if (!title) {
    return { status: 400, body: { error: 'Falta el títol' } };
  }
  if (!(LEAD_DOCUMENT_TYPE_VALUES as readonly string[]).includes(rawType)) {
    return { status: 400, body: { error: 'Tipus de document no permès' } };
  }
  if (rawType === 'QUOTE') {
    return {
      status: 410,
      body: {
        error: 'Els pressupostos LeadDocument estan desactivats. Fes servir Proposal per crear o enviar pressupostos.',
        canonicalRoute: '/admin/presupuestos',
      },
    };
  }

  const type = rawType as LeadDocumentType;
  if (!(LEAD_DOCUMENT_ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return { status: 400, body: { error: 'Tipus de fitxer no permès' } };
  }
  if (file.size > LEAD_DOCUMENT_UPLOAD_MAX_SIZE_BYTES) {
    return { status: 413, body: { error: 'Fitxer massa gran' } };
  }

  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const ext = file.name.split('.').pop() || 'bin';
  const path = `leads/${leadId}/documents/${timestamp}-${random}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadFile(path, buffer);

  const doc = await prisma.leadDocument.create({
    data: {
      leadId,
      type,
      source: 'MANUAL',
      title,
      fileUrl: result.publicUrl,
      filePath: result.path,
      mimeType: file.type,
      size: file.size,
      createdBy,
    },
  });

  await recordLeadDocumentAdded({
    leadId,
    documentId: doc.id,
    documentType: doc.type,
    title,
    createdBy,
  });

  return { status: 200, body: { ok: true, document: doc } };
}

export async function deleteLeadDocument(leadId: string, documentId: string) {
  const doc = await prisma.leadDocument.findFirst({
    where: {
      id: documentId,
      leadId,
    },
    select: {
      id: true,
      leadId: true,
      title: true,
      filePath: true,
    },
  });

  if (!doc) {
    return { status: 404, body: { error: 'Document no trobat' } };
  }

  if (doc.filePath) {
    await deleteFile(doc.filePath);
  }

  await prisma.leadDocument.delete({ where: { id: doc.id } });
  await recordLeadDocumentDeleted({
    leadId: doc.leadId,
    documentId: doc.id,
    title: doc.title,
  });

  return { status: 200, body: { ok: true } };
}
