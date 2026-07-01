/**
 * Public Booking Page
 * Allows users to create reservations
 */

import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { BookingForm } from '@/components/booking/BookingForm';
import StarIcon from '@/app/components/public/StarIcon';
import PublicPageHeader from '@/app/components/public/PublicPageHeader';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'booking' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    robots: { index: true, follow: true },
  };
}

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { fecha?: string };
}) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'booking' });

  // Fetch available packs
  const packs = await prisma.pack.findMany({
    where: { isActive: true },
    include: {
      translations: {
        where: { locale },
      },
    },
    orderBy: { price: 'asc' },
  });

  // Fetch available extras
  const extras = await prisma.extra.findMany({
    where: { isActive: true },
    include: {
      translations: {
        where: { locale },
      },
    },
    orderBy: { price: 'asc' },
  });

  // Transform data for component
  const packsForForm = packs.map((pack: (typeof packs)[number]) => ({
    id: pack.id,
    slug: pack.slug,
    name: pack.translations[0]?.name || pack.slug,
    price: pack.price,
    extraHourPrice: pack.extraHourPrice || undefined,
    djHours: pack.djHours,
  }));

  const extrasForForm = extras.map((extra: (typeof extras)[number]) => ({
    id: extra.id,
    slug: extra.slug,
    name: extra.translations[0]?.name || extra.slug,
    price: extra.price,
  }));

  return (
    <main className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <PublicPageHeader title={t('hero.title')} description={t('hero.description')} />

        {/* Trust Indicators */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[color-mix(in_oklab,var(--oe-gold)_16%,transparent)] flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--oe-gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">{t('trust.items.1.title')}</h3>
            <p className="text-sm text-white/60">{t('trust.items.1.description')}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[color-mix(in_oklab,var(--oe-gold)_16%,transparent)] flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--oe-gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">{t('trust.items.2.title')}</h3>
            <p className="text-sm text-white/60">{t('trust.items.2.description')}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[color-mix(in_oklab,var(--oe-gold)_16%,transparent)] flex items-center justify-center">
              <StarIcon className="w-6 h-6 text-[var(--oe-gold)]" fill="currentColor" />
            </div>
            <h3 className="font-semibold text-white mb-2">{t('trust.items.3.title')}</h3>
            <p className="text-sm text-white/60">{t('trust.items.3.description')}</p>
          </div>
        </div>

        {/* Booking Form */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/10">
          <BookingForm
            packs={packsForForm}
            extras={extrasForForm}
            preselectedDate={searchParams.fecha}
            locale={locale}
          />
        </div>

        {/* Help Section */}
        <div className="mt-12 text-center">
          <p className="text-white/60 mb-4">{t('help.title')}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={`/${locale}/contacto`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {t('help.contact')}
            </a>
            <a
              href={`/${locale}/disponibilidad`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {t('help.availability')}
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
