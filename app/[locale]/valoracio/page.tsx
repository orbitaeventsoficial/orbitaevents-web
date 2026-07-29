// app/[locale]/valoracio/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SITE_CONFIG } from '@/app/config/site-config';
import { normalizePublicLocale } from '@/lib/public-locale';
import ValoracioClient from './client';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = normalizePublicLocale(params.locale);
  const t = await getTranslations({ locale, namespace: 'testimonialForm.metadata' });
  const brand = SITE_CONFIG.business.name;

  return {
    title: t('title', { brand }),
    description: t('description', { brand }),
    robots: { index: false, follow: false },
  };
}

export default function ValoracioPage() {
  return <ValoracioClient />;
}
