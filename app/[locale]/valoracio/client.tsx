'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import TestimonialForm from '@/app/components/reviews/TestimonialForm';

export function normalizeValoracioParam(value?: string | null) {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

function ValoracioContent() {
  const t = useTranslations('testimonialForm.page');
  const searchParams = useSearchParams();
  const token = normalizeValoracioParam(searchParams?.get('token'));
  const ref = normalizeValoracioParam(searchParams?.get('ref'));

  return (
    <section aria-labelledby="valoracio-title" className="px-4 py-10 sm:py-12 lg:py-16">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,520px)] lg:items-start">
        <section className="mx-auto flex max-w-2xl flex-col items-center text-center lg:items-start lg:text-left">
          <p className="mb-4 inline-flex items-center rounded-full border border-[color-mix(in_oklab,var(--oe-gold)_32%,transparent)] bg-[color-mix(in_oklab,var(--oe-gold)_10%,transparent)] px-4 py-2 text-sm font-bold uppercase tracking-wide text-[var(--oe-gold)]">
            {t('eyebrow')}
          </p>
          <h1 id="valoracio-title" className="text-4xl font-black leading-tight text-[var(--text-primary)] md:text-5xl">
            {t('title')}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--text-secondary)]">
            {t('description')}
          </p>
          <div className="mt-7 grid w-full gap-3 sm:grid-cols-3">
            {(['trust', 'reward', 'memory'] as const).map((key) => (
              <div
                key={key}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-glass)] px-4 py-4"
              >
                <p className="text-sm font-bold text-[var(--text-primary)]">{t(`signals.${key}.title`)}</p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {t(`signals.${key}.text`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div id="contact-form" className="mx-auto w-full max-w-lg">
          <TestimonialForm token={token} bookingRef={ref} />
        </div>
      </div>
    </section>
  );
}

export default function ValoracioClient() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] bg-black" />}>
      <ValoracioContent />
    </Suspense>
  );
}
