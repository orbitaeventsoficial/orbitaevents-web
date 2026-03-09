import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getTemplate, type TemplateSlug } from '@/lib/services/emailTemplateService';

export const dynamic = 'force-dynamic';

// GET - Obtenir una plantilla per slug + locale
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const locale = req.nextUrl.searchParams.get('locale') || 'ca';
  const slug = params.slug as TemplateSlug;

  // Obtenir de BD si existeix
  const dbTemplate = await prisma.emailTemplate.findUnique({
    where: { slug_locale: { slug, locale } },
  });

  // Obtenir default amb preview
  const resolved = await getTemplate(slug, locale, {
    clientName: 'Maria Garcia',
    reference: 'ORB-2026-042',
    eventDate: '15 de juny de 2026',
    eventType: 'Casament',
    packName: 'Premium DJ',
    location: 'Mas Can Ferrer, Granollers',
    total: '1.850',
    depositAmount: '500',
    startTime: '21:00',
    endTime: '04:00',
    pendingAmount: '1.350',
    daysUntilEvent: '14',
    reviewUrl: 'https://orbitaevents.com/ca/valoracio?token=demo',
    googleReviewUrl: 'https://g.page/r/orbitaevents/review',
    discountCode: 'GRACIES10',
    discountAmount: '10',
    clientEmail: 'maria@example.com',
    clientPhone: '612 345 678',
  });

  return NextResponse.json({
    ok: true,
    slug,
    locale,
    template: dbTemplate || null,
    resolved,
  });
}
