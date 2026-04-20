import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { buildExecutiveReport } from '@/lib/services/executiveReportService';
import { exportExecutiveReportPdf } from '@/lib/services/executiveReportPdfService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;

  const report = await buildExecutiveReport();
  const pdfBuffer = await exportExecutiveReportPdf(report);

  const filename = `informe-executiu-${new Date().toISOString().slice(0, 10)}.pdf`;

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
