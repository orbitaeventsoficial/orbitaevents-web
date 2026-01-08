import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import Client from './client';
import { getTranslations } from 'next-intl/server';


export const metadata: Metadata = {
  title: 'Recursos i Descàrregues | Òrbita Events',
  description: 'Descarrega catàlegs de serveis, pressupostos i imatges del portfolio. Tot el que necessites per planificar el teu event.',
  alternates: { canonical: '/recursos' },
  robots: { index: true, follow: true },
};

export default async function RecursosPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'resources' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  return (
    <>
      <Breadcrumbs
        items={[
          { name: tCommon('breadcrumbs.home'), url: '/' },
          { name: t('breadcrumb'), url: '/recursos' },
        ]}
      />
      <Client />
    </>
  );
}
