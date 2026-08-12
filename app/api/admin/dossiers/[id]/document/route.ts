import { NextResponse, type NextRequest } from 'next/server';

import { requireAuth } from '@/lib/auth';
import { buildDossierDocument, renderDossierPdf } from '@/lib/services/dossierDocumentService';

/**
 * El dossier desat, en la seva única versió.
 *
 * `?format=pdf` el torna imprès; sense format, el torna com a pàgina per
 * previsualitzar. Són el mateix document: el PDF surt d'imprimir aquest HTML,
 * no de tornar-lo a dibuixar.
 *
 * Substitueix `/composite`, que era una segona implementació del mateix
 * document feta amb jsPDF i que mai coincidia amb el que es veia a pantalla.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = requireAuth(req);
  if (auth) return auth;

  const format = req.nextUrl.searchParams.get('format');
  const wantsPdf = format === 'pdf';

  const document = await buildDossierDocument(params.id, {
    autoPrint: !wantsPdf && req.nextUrl.searchParams.get('print') === '1',
  });
  if (!document) {
    return NextResponse.json({ error: 'Dossier no trobat' }, { status: 404 });
  }

  if (!wantsPdf) {
    return new NextResponse(document.html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, no-store',
      },
    });
  }

  try {
    const pdf = await renderDossierPdf(document.html, req.nextUrl.origin);
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${document.filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('[dossiers/document] no s\'ha pogut imprimir a PDF:', error);
    return NextResponse.json(
      {
        error: 'No s\'ha pogut generar el PDF. Falta el navegador d\'impressió al '
          + 'servidor (playwright chromium). La previsualització sí que funciona.',
      },
      { status: 503 },
    );
  }
}
