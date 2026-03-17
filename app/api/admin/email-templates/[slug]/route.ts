import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getAdminTemplateDetail } from '@/lib/services/emailTemplateService';
import { absoluteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const { slug } = await params;
  const locale = req.nextUrl.searchParams.get('locale') || 'ca';
  const result = await getAdminTemplateDetail({
    slug,
    locale,
    variables: {
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
      reviewUrl: absoluteUrl('/ca/valoracio?token=demo'),
      googleReviewUrl: 'https://g.page/r/orbitaevents/review',
      discountCode: 'GRACIES10',
      discountAmount: '10',
      clientEmail: 'maria@example.com',
      clientPhone: '612 345 678',
    },
  });

  return NextResponse.json(result.body, { status: result.status });
}
