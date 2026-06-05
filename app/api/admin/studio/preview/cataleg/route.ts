import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { generateServiceBrochure } from '@/lib/pdf-utils';
import type { ServiceSlug } from '@/app/config/packs-config';
import { renderPdfPreviewResponse } from '../previewResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const service = (req.nextUrl.searchParams.get('service') || 'bodas') as ServiceSlug;
  return renderPdfPreviewResponse('cataleg', async () => {
    const doc = await generateServiceBrochure(service, 'ca');
    return Buffer.from(doc.output('arraybuffer'));
  });
}
