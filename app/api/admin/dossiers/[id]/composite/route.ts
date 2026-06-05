import { readFileSync } from 'fs';
import { join } from 'path';
import { requireAuth } from '@/lib/auth';
import { NextResponse, type NextRequest } from 'next/server';
import { getAnimacioProducts } from '@/lib/constants/animacio-products-resolver';
import { getDossierById } from '@/lib/services/dossierService';
import { generateDossierCompositePDF } from '@/lib/services/dossierCompositePdfService';
import {
  collaboratorProductToAnimacioProduct,
  getDossierCollaboratorProductsByIds,
} from '@/lib/services/collaboratorProductService';
import type { DossierClientInfo } from '@/lib/utils/dossier-html-builder';

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

  const dossier = await getDossierById(params.id);
  if (!dossier) return NextResponse.json({ error: 'No trobat' }, { status: 404 });

  const allProducts = await getAnimacioProducts('ca');
  const collaboratorProducts = await getDossierCollaboratorProductsByIds(dossier.productIds);
  const products = [
    ...allProducts.filter((product) => dossier.productIds.includes(product.id)),
    ...collaboratorProducts.map(collaboratorProductToAnimacioProduct),
  ];
  const client: DossierClientInfo = {
    nom: dossier.nom,
    empresa: dossier.empresa ?? undefined,
    telefon: dossier.telefon ?? undefined,
    email: dossier.email ?? undefined,
    eventDesc: dossier.eventDesc ?? undefined,
    salutacio: dossier.salutacio ?? undefined,
  };

  const doc = await generateDossierCompositePDF({
    client,
    products,
    productIds: dossier.productIds,
    collaboratorProducts,
    locale: 'ca',
    logoDataUri: readLogoDataUri(),
  });
  const pdf = Buffer.from(doc.output('arraybuffer'));
  const filename = `dossier-complet-${params.id}.pdf`;

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  });
}
