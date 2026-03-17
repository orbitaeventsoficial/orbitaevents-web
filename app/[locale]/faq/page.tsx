/**
 * Pàgina FAQ - PREGUNTES FREQÜENTS COMPLETES
 * ===========================================
 *
 * - Categories organitzades
 * - Preguntes expandibles
 * - SEO optimitzat
 * - Traduccions completes CA/ES
 */

import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import FAQClient from './client';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'faqAmpliat' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    alternates: { canonical: '/faq' },
    openGraph: {
      title: t('meta.ogTitle'),
      description: t('meta.ogDescription'),
    },
  };
}

export default async function FAQPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'faqAmpliat' });

  // Get all category data
  const categories = [
    'general',
    'preus',
    'equip',
    'musica',
    'tematiques',
    'logistica',
    'garanties'
  ];

  const categoryData = categories.map(catKey => {
    const faqs = t.raw(`categories.${catKey}.faqs`) as Array<{ question: string; answer: string }>;
    return {
      key: catKey,
      title: t(`categories.${catKey}.title`),
      faqs: faqs || []
    };
  });

  // Build FAQ schema for SEO
  const allFaqs = categoryData.flatMap(cat => cat.faqs);
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: allFaqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <FAQClient
        badge={t('badge')}
        title={t('title')}
        titleHighlight={t('titleHighlight')}
        subtitle={t('subtitle')}
        ctaQuestion={t('cta.question')}
        ctaButton={t('cta.button')}
        ctaWhatsappMessage={t('cta.whatsappMessage')}
        ctaResponseTime={t('cta.responseTime')}
        categories={categoryData}
      />
    </>
  );
}
