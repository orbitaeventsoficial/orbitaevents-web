/**
 * API ROUTE: Privacy Data Download
 * Descàrrega segura de dades exportades per una sol·licitud ARCO (ACCESS/PORTABILITY)
 * completada. Reutilitza el mateix verificationToken que ja identifica la sol·licitud
 * (font única d'autenticació d'aquest flux; no es crea cap token nou).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDownloadableDataRequestExport } from '@/lib/services/privacyService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token requerit' }, { status: 400 });
  }

  const exportResult = await getDownloadableDataRequestExport(token);

  if (!exportResult) {
    return NextResponse.json({ error: 'Dades no disponibles' }, { status: 404 });
  }

  const filename = `orbita-events-dades-${exportResult.id}.json`;

  return new NextResponse(JSON.stringify(exportResult.data, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
