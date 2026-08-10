import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { buildDossierHtmlFor, renderDossierPdf } from '@/lib/services/dossierDocumentService';
import {
  collaboratorProductToAnimacioProduct,
  listDossierCollaboratorProducts,
} from '@/lib/services/collaboratorProductService';
import { getAnimacioProducts } from '@/lib/constants/animacio-products-resolver';
import { PDF_PREVIEW_PLACEHOLDER } from '@/lib/constants/pdfDocuments';
import { COLLABORATOR_EXTRA_CATEGORY } from '@/lib/constants/admin';
import { renderPdfPreviewResponse } from '../previewResponse';

export const dynamic = 'force-dynamic';

// Preview del dossier: mostra TOTS els productes ofertats (animació propis + productes
// de col·laborador del catàleg), amb textos i preus canònics. Zero hardcoded.
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  return renderPdfPreviewResponse('dossier', async () => {
    const animacioProducts = await getAnimacioProducts('ca');
    const allCollaboratorProducts = await listDossierCollaboratorProducts();
    // Els extres (pintacares, globoflèxia, tècnic de so) no s'oferten com a capítol propi.
    const collaboratorProducts = allCollaboratorProducts.filter(
      (product) => product.categoria !== COLLABORATOR_EXTRA_CATEGORY,
    );

    // Dedup: bingo/batalla són productes de Carlos (col·laborador). Si un producte
    // d'animació coincideix en nom amb un de col·laborador, preval el de col·laborador
    // (porta imatge real, cost i preu canònic). Així no surt duplicat al dossier.
    const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
    const collaboratorNames = new Set(collaboratorProducts.map((product) => normalize(product.nom)));
    const ownProducts = animacioProducts.filter((product) => !collaboratorNames.has(normalize(product.nom)));

    const html = await buildDossierHtmlFor({
      client: {
        nom: PDF_PREVIEW_PLACEHOLDER,
        empresa: PDF_PREVIEW_PLACEHOLDER,
        email: PDF_PREVIEW_PLACEHOLDER,
      },
      products: [
        ...ownProducts,
        ...collaboratorProducts.map(collaboratorProductToAnimacioProduct),
      ],
      locale: 'ca',
    });

    return renderDossierPdf(html);
  });
}
