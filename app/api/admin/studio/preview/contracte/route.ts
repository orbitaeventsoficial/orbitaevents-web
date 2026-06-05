import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { renderCanonicalContractPreview } from '@/lib/services/pdfPreviewService';
import { renderPdfPreviewResponse } from '../previewResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  return renderPdfPreviewResponse('contracte', renderCanonicalContractPreview);
}
