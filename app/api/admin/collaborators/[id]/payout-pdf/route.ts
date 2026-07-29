import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { loadCollaboratorPayout } from '@/lib/services/collaboratorPayoutService';
import { generateCollaboratorPayoutPDF } from '@/lib/services/collaboratorPayoutPdfService';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const summary = await loadCollaboratorPayout(params.id);
    if (!summary) {
      return NextResponse.json({ error: 'Col·laborador no trobat' }, { status: 404 });
    }
    const doc = await generateCollaboratorPayoutPDF(summary);
    const pdf = Buffer.from(doc.output('arraybuffer'));
    const filename = `liquidacio-${summary.collaboratorName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    log.error('Error generant PDF de liquidació:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}
