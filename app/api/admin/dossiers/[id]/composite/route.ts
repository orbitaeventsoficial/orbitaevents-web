import { readFileSync } from 'fs';
import { join } from 'path';
import { requireAuth } from '@/lib/auth';
import { NextResponse, type NextRequest } from 'next/server';
import { getAnimacioProducts } from '@/lib/constants/animacio-products-resolver';
import { getDossierById } from '@/lib/services/dossierService';
import { generateDossierCompositePDF } from '@/lib/services/dossierCompositePdfService';
import { getDossierCollaboratorProductsByIds } from '@/lib/services/collaboratorProductService';
import type { DossierClientInfo } from '@/lib/utils/dossier-html-builder';
import { productsFromDossierLineSnapshot } from '@/lib/services/dossierSnapshotService';

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

  const snapshotProducts = productsFromDossierLineSnapshot(dossier.lineSnapshot);
  const allProducts = snapshotProducts ? [] : await getAnimacioProducts('ca');
  const collaboratorProducts = snapshotProducts ? [] : await getDossierCollaboratorProductsByIds(dossier.productIds);
  // Només productes propis d'animació aquí; els de col·laborador entren via
  // `collaboratorProducts` (el generador ja els converteix). Evita duplicats.
  const products = snapshotProducts ?? allProducts.filter((product) => dossier.productIds.includes(product.id));
  const client: DossierClientInfo = {
    nom: dossier.nom,
    empresa: dossier.empresa ?? undefined,
    telefon: dossier.telefon ?? undefined,
    email: dossier.email ?? undefined,
    eventDesc: dossier.eventDesc ?? undefined,
    salutacio: dossier.salutacio ?? undefined,
  };

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
    client,
    products,
    productIds: dossier.productIds,
    collaboratorProducts,
    extras,
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
