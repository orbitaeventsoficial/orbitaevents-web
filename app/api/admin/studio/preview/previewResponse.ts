import { NextResponse } from 'next/server';
import {
  PDF_PREVIEW_FILENAMES,
  PDF_PREVIEW_RESPONSE_HEADERS,
  type PdfDocumentId,
} from '@/lib/constants/pdfDocuments';

type PreviewablePdfDocumentId = Exclude<PdfDocumentId, 'dossier'>;

export function pdfPreviewResponse(documentId: PreviewablePdfDocumentId, buffer: Buffer | ArrayBuffer): NextResponse {
  const filename = PDF_PREVIEW_FILENAMES[documentId];
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': PDF_PREVIEW_RESPONSE_HEADERS.contentType,
      'X-Frame-Options': PDF_PREVIEW_RESPONSE_HEADERS.frameOptions,
      'Content-Security-Policy': PDF_PREVIEW_RESPONSE_HEADERS.contentSecurityPolicy,
      'Content-Disposition': `${PDF_PREVIEW_RESPONSE_HEADERS.dispositionMode}; filename="${filename}"`,
    },
  });
}

export async function renderPdfPreviewResponse(
  documentId: PreviewablePdfDocumentId,
  render: () => Promise<Buffer | ArrayBuffer>,
): Promise<NextResponse> {
  try {
    return pdfPreviewResponse(documentId, await render());
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'No s’ha pogut generar la preview PDF',
    }, { status: 404 });
  }
}
