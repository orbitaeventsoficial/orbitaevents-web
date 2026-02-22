import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'sensorial' });
  const base = 'https://orbitaevents.com';

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      canonical: locale === 'ca' ? `${base}/sensorial` : `${base}/${locale}/sensorial`,
      languages: { ca: `${base}/sensorial`, es: `${base}/es/sensorial`, en: `${base}/en/sensorial` },
    },
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
    },
  };
}

export default function SensorialLayout({ children }: { children: React.ReactNode }) {
  return children;
}
