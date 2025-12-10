'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

const SERVICE_KEYS = ['weddings', 'corporate', 'rental'] as const;
const SERVICE_HREFS: Record<string, string> = {
  weddings: '/servicios/bodas',
  corporate: '/servicios/empresas',
  rental: '/servicios/alquiler',
};

export default function ServicesGrid() {
  const t = useTranslations('servicesGrid');

  return (
    <div>
      <h2 className="text-h2 text-center">{t('title')}</h2>
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {SERVICE_KEYS.map((key) => {
          const points = t.raw(`items.${key}.points`) as string[];
          return (
            <Link
              key={key}
              href={SERVICE_HREFS[key]}
              className="oe-card hover:no-underline"
            >
              <p className="text-lg font-semibold">{t(`items.${key}.title`)}</p>
              <ul className="mt-4 space-y-2 text-white/75">
                {points.map((point: string) => (
                  <li key={point}>• {point}</li>
                ))}
              </ul>
              <span className="mt-6 inline-block text-[var(--oe-gold)]">
                {t('learnMore')}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
