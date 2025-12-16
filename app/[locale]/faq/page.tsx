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

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { locale } = params;
  const isEs = locale === 'es';

  return {
    title: isEs
      ? 'Preguntas Frecuentes | FAQ | Òrbita Events'
      : 'Preguntes Freqüents | FAQ | Òrbita Events',
    description: isEs
      ? 'Respuestas a todas tus preguntas sobre DJ, sonido, iluminación, tematización y eventos. Precios, garantías, logística y más.'
      : 'Respostes a totes les teves preguntes sobre DJ, so, il·luminació, tematització i events. Preus, garanties, logística i més.',
    alternates: { canonical: '/faq' },
    openGraph: {
      title: isEs ? 'FAQ - Preguntas Frecuentes' : 'FAQ - Preguntes Freqüents',
      description: isEs
        ? 'Todo lo que necesitas saber sobre nuestros servicios de eventos'
        : 'Tot el que necessites saber sobre els nostres serveis d\'events',
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

  return (
    <FAQClient
      badge={t('badge')}
      title={t('title')}
      titleHighlight={t('titleHighlight')}
      subtitle={t('subtitle')}
      ctaQuestion={t('cta.question')}
      ctaButton={t('cta.button')}
      categories={categoryData}
      locale={locale}
    />
  );
}
