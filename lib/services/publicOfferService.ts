import { PUBLIC_OFFER_FALLBACK } from '@/lib/constants';
import { isBuildPrerenderPhase } from '@/lib/build-phase';

export async function getPublicOffer() {
  if (!process.env.DATABASE_URL || isBuildPrerenderPhase()) {
    return PUBLIC_OFFER_FALLBACK;
  }

  const { prisma } = await import('@/lib/prisma');
  const settings = await prisma.setting.findMany({
    where: { category: 'offer' },
  });

  const settingsMap = settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {} as Record<string, string>);

  return {
    isActive: settingsMap['offer_active'] === 'true',
    endDate: settingsMap['offer_end_date'] || null,
    discount: parseInt(settingsMap['offer_discount'] || '0', 10),
    ctaLink: settingsMap['offer_cta_link'] || '/contacto',
    title: settingsMap['offer_title'] || '',
    description: settingsMap['offer_description'] || '',
  };
}