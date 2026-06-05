import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { generateFullCatalogPDF, generateServiceBrochure } from '@/lib/services/catalogPdfService';
import type { ServiceSlug } from '@/app/config/packs-config';
import { renderPdfPreviewResponse } from '../previewResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const service = req.nextUrl.searchParams.get('service') as ServiceSlug | null;
  const locale = (req.nextUrl.searchParams.get('locale') || 'ca') as 'ca' | 'es' | 'en';

  return renderPdfPreviewResponse('cataleg', async () => {
    const doc = service
      ? await generateServiceBrochure(service, locale)
      : await generateFullCatalogPDF(undefined, locale);
    return Buffer.from(doc.output('arraybuffer'));
  });
}
