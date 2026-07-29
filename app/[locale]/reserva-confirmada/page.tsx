/**
 * Booking Confirmation Page
 * Shown after successful booking
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { SITE_CONFIG } from '@/app/config/site-config';
import PublicPageHeader from '@/app/components/public/PublicPageHeader';
import { normalizePublicLocale } from '@/lib/public-locale';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = normalizePublicLocale(params.locale, 'es');
  const t = await getTranslations({ locale, namespace: 'booking.confirmed.meta' });

  return {
    title: t('title'),
    description: t('description'),
    robots: { index: false, follow: false },
  };
}

export default async function BookingConfirmedPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { ref?: string };
}) {
  const reference = searchParams.ref;
  const locale = normalizePublicLocale(params.locale, 'es');
  const t = await getTranslations({ locale, namespace: 'booking.confirmed' });

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-[color-mix(in_oklab,var(--oe-green)_18%,transparent)] border border-[color-mix(in_oklab,var(--oe-green)_35%,transparent)] flex items-center justify-center animate-bounce">
            <svg className="w-12 h-12 text-[var(--oe-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <PublicPageHeader title={t('title')} spacing="compact" />

        {reference && (
          <p className="text-xl text-white/70 mb-6">
            {t('referenceLabel')}: <span className="font-mono font-bold text-white">{reference}</span>
          </p>
        )}

        {/* Success Message */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 mb-8">
          <p className="text-lg text-white/80 mb-6">
            {t('message')}
          </p>

          <div className="space-y-4 text-left">
            <h2 className="text-xl font-semibold text-white mb-4">{t('nextSteps.title')}</h2>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-[color-mix(in_oklab,var(--oe-gold)_16%,transparent)] flex items-center justify-center flex-shrink-0">
                <span className="text-[var(--oe-gold)] font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">{t('nextSteps.review.title')}</h3>
                <p className="text-white/60">
                  {t('nextSteps.review.description')}
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-[color-mix(in_oklab,var(--oe-gold)_16%,transparent)] flex items-center justify-center flex-shrink-0">
                <span className="text-[var(--oe-gold)] font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">{t('nextSteps.finalConfirmation.title')}</h3>
                <p className="text-white/60">
                  {t('nextSteps.finalConfirmation.description')}
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-[color-mix(in_oklab,var(--oe-gold)_16%,transparent)] flex items-center justify-center flex-shrink-0">
                <span className="text-[var(--oe-gold)] font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">{t('nextSteps.payment.title')}</h3>
                <p className="text-white/60">
                  {t('nextSteps.payment.description')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[var(--grad-gold)] rounded-xl font-semibold text-[var(--bg-main)] transition-all hover:shadow-[var(--shadow-glow-gold)]"
          >
            {t('actions.home')}
          </Link>
          <Link
            href={`/${locale}/portfolio`}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-white transition-all"
          >
            {t('actions.portfolio')}
          </Link>
        </div>

        {/* Contact Info */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-white/60 mb-4">{t('contact.question')}</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <a href={`mailto:${SITE_CONFIG.business.email}`} className="text-[var(--oe-gold)] hover:underline flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {SITE_CONFIG.business.email}
            </a>
            <a href={`tel:${SITE_CONFIG.business.phone}`} className="text-[var(--oe-gold)] hover:underline flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {SITE_CONFIG.business.phoneDisplay}
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
