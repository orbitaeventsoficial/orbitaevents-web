'use client';

import { useTranslations } from 'next-intl';

export default function ContactCTA() {
  const t = useTranslations('contactCta');
  const tCommon = useTranslations('common.buttons');

  return (
    <div className="mx-auto max-w-3xl text-center">
      <h2 className="text-h2">{t('title')}</h2>
      <p className="mt-4 text-white/70">{t('subtitle')}</p>
      <div className="mt-8 flex justify-center gap-4">
        <a className="oe-btn-gold" href="/contacto">{tCommon('contact')}</a>
        <a className="rounded-xl border border-[var(--border)] px-5 py-3" href="/configurador">{t('configurator')}</a>
      </div>
    </div>
  );
}
