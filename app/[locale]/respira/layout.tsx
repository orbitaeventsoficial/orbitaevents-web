import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getSiteUrl } from '@/lib/site';


export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'sensorial' });
  const base = getSiteUrl();

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      canonical: locale === 'ca' ? `${base}/respira` : `${base}/${locale}/respira`,
      languages: { ca: `${base}/respira`, es: `${base}/es/respira`, en: `${base}/en/respira` },
    },
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
    },
  };
}

// Immersive layout without header/footer (same as /sensorial)
export default function RespiraLayout({ children }: { children: React.ReactNode }) {
  return children;
}
