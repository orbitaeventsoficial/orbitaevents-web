'use client';

import type { FC } from 'react';
import { useTranslations } from 'next-intl';

type QA = { q: string; a: string };

interface FAQProps {
  items?: QA[];
  title?: string;
}

const FAQ: FC<FAQProps> = ({ items, title }) => {
  const t = useTranslations('faq');

  // Use provided items or get from translations
  const faqItems: QA[] = items || [
    { q: t('items.1.question'), a: t('items.1.answer') },
    { q: t('items.2.question'), a: t('items.2.answer') },
    { q: t('items.3.question'), a: t('items.3.answer') },
    { q: t('items.4.question'), a: t('items.4.answer') },
    { q: t('items.5.question'), a: t('items.5.answer') },
    { q: t('items.6.question'), a: t('items.6.answer') },
    { q: t('items.7.question'), a: t('items.7.answer') },
  ];

  const faqTitle = title || t('title');

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      <h2 className="text-2xl font-semibold">{faqTitle}</h2>
      <div className="mt-8 space-y-6">
        {faqItems.map((item) => (
          <div key={item.q} className="rounded-xl border border-white/10 p-4">
            <h3 className="font-medium">{item.q}</h3>
            <p className="mt-2 text-white/70">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FAQ;
