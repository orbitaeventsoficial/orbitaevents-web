"use client";

import { Link } from '@/lib/navigation';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useTranslations } from 'next-intl';

function BuscarContent() {
  const searchParams = useSearchParams();
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const t = useTranslations('pages.search');

  const allSuggestions = [
    { href: '/servicios/bodas', labelKey: 'weddings' },
    { href: '/servicios/discomovil', labelKey: 'dj' },
    { href: '/servicios/empresas', labelKey: 'corporate' },
    { href: '/opiniones', labelKey: 'reviews' },
    { href: '/servicios', labelKey: 'services' },
    { href: '/portfolio', labelKey: 'portfolio' },
    { href: '/contacto', labelKey: 'contact' },
    { href: '/servicios/fiestas', labelKey: 'parties' },
  ];

  const suggestions = allSuggestions.filter((s) => {
    const label = t(`suggestions.${s.labelKey}`).toLowerCase();
    return label.includes(q) || q.includes(label.substring(0, 3)) || q === '';
  });

  return (
    <>
      <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
      <p className="mt-2 text-white/70">
        {t('term')}: <strong className="text-gold">{q || '—'}</strong>
      </p>

      {suggestions.length > 0 ? (
        <ul className="mt-6 space-y-3">
          {suggestions.map((s) => (
            <li key={s.href}>
              <Link href={s.href} className="oe-btn block text-left w-full">
                {t(`suggestions.${s.labelKey}`)}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-white/70">
          {t('noResults')} <strong>&quot;bodas&quot;</strong>, <strong>&quot;dj&quot;</strong> o <strong>&quot;empresa&quot;</strong>.
        </p>
      )}

      <div className="mt-8 text-center">
        <Link href="/contacto" className="oe-btn oe-btn-gold inline-block">
          {t('askUs')}
        </Link>
      </div>
    </>
  );
}

export default function BuscarClient() {
  const t = useTranslations('pages.search');
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Suspense fallback={<div className="text-white">{t('loading')}</div>}>
        <BuscarContent />
      </Suspense>
    </main>
  );
}
