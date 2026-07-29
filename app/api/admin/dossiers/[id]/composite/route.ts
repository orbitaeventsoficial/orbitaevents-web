import { readFileSync } from 'fs';
import { join } from 'path';
import { requireAuth } from '@/lib/auth';
import { NextResponse, type NextRequest } from 'next/server';
import { resolveDossierHtmlRenderPayload, resolveDossierTraceOrigin } from '@/lib/services/dossierService';
import { generateDossierCompositePDF } from '@/lib/services/dossierCompositePdfService';
import { DOCUMENT_ADMIN_LOG_ACTIONS, recordDocumentAdminLog } from '@/lib/services/documentAuditTrailService';

function readLogoDataUri(): string | undefined {
  try {
    const svgPath = join(process.cwd(), 'public', 'img', 'logoplanetatextdreta.svg');
    const svg = readFileSync(svgPath, 'utf-8');
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  } catch {
    return undefined;
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (auth) return auth;

  const render = await resolveDossierHtmlRenderPayload(params.id);
  if (!render) return NextResponse.json({ error: 'No trobat' }, { status: 404 });
  const { dossier, clientInfo, products, transport, dataSource } = render;

  // Extres opcionals via query: ?extras=Nom:preu,Nom2:preu2
  const extrasParam = req.nextUrl.searchParams.get('extras');
  const extras = (extrasParam ? extrasParam.split(',') : [])
    .map((entry) => {
      const idx = entry.lastIndexOf(':');
      if (idx < 0) return null;
      const nom = entry.slice(0, idx).trim();
      const preu = Number(entry.slice(idx + 1).trim());
      return nom && Number.isFinite(preu) ? { nom, preu } : null;
    })
    .filter((extra): extra is { nom: string; preu: number } => extra !== null);

  const doc = await generateDossierCompositePDF({
    client: clientInfo,
    products,
    productIds: dossier.productIds,
    extras,
    transport,
    locale: 'ca',
    logoDataUri: readLogoDataUri(),
  });
  const pdf = Buffer.from(doc.output('arraybuffer'));
  const filename = `dossier-complet-${params.id}.pdf`;
  const origin = await resolveDossierTraceOrigin(dossier.leadId);
  await recordDocumentAdminLog({
    action: DOCUMENT_ADMIN_LOG_ACTIONS.DOSSIER_COMPOSITE_PDF_GENERATED,
    entity: 'dossier',
    entityId: params.id,
    details: {
      documentType: 'DOSSIER',
      source: 'dossier_composite_pdf',
      dataSource,
      dossierId: params.id,
      leadId: origin.leadId,
      leadName: origin.leadName,
      customerId: origin.customerId,
      customerName: origin.customerName,
      filename,
      clientName: dossier.nom,
      productIds: dossier.productIds,
      productCount: products.length,
      collaboratorProductCount: render.collaboratorDossierProducts.length,
      extrasCount: extras.length,
      travelKm: transport.travelKm ?? null,
      travelTollsEur: transport.travelTollsEur ?? null,
    },
  });

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  });
}
