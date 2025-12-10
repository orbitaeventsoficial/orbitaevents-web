"use client";

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import ContactFormComplete from '@/app/components/forms/ContactFormComplete';

export default function ContactClient() {
  const searchParams = useSearchParams();
  const t = useTranslations('contact');

  // Llegir parametres del configurador si existeixen
  const preselectedService = searchParams.get('servicio') || undefined;
  const preselectedDate = searchParams.get('fecha') || undefined;

  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white text-center mb-3">
        {t('title')}
      </h1>
      <p className="text-base sm:text-lg text-center text-white/70 mb-8">
        {t('subtitle')}
      </p>

      {/* Formulari complet amb RGPD i captcha */}
      <ContactFormComplete
        preselectedService={preselectedService}
        preselectedDate={preselectedDate}
      />
    </section>
  );
}

