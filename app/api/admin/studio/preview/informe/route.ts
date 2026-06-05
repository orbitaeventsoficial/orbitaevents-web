import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { buildExecutiveReport } from '@/lib/services/executiveReportService';
import { exportExecutiveReportPdf } from '@/lib/services/executiveReportPdfService';
import { renderPdfPreviewResponse } from '../previewResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  return renderPdfPreviewResponse('informe', async () => exportExecutiveReportPdf(await buildExecutiveReport()));
}
