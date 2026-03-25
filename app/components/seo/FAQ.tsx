'use client';

import { useState } from 'react';
import type { FC } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';

type QA = { q: string; a: string };

interface FAQProps {
  items: QA[];
  title?: string;
}

const FAQ: FC<FAQProps> = ({ items, title }) => {
  const t = useTranslations('faq');
  const reduceMotion = useReducedMotion();
  const faqItems = items;
  const faqTitle = title || t('title');
  const [openIdx, setOpenIdx] = useState<number | null>(0);

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
    <section className="relative py-16 md:py-24 overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(251,191,36,0.04),transparent_60%)] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-3xl relative z-[1]">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-14"
        >
          <span className="inline-block px-5 py-2 rounded-full bg-oe-gold/10 border border-oe-gold/20 text-oe-gold text-sm font-bold tracking-wider uppercase mb-4">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
            {faqTitle}
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqItems.map((item, i) => {
            const isOpen = openIdx === i;
            return (
              <motion.div
                key={item.q}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={reduceMotion ? { duration: 0 } : { delay: i * 0.05 }}
              >
                <div
                  className={`rounded-2xl border transition-all duration-300 ${
                    isOpen
                      ? 'border-oe-gold/30 bg-bg-card border-l-2 border-l-oe-gold shadow-lg shadow-oe-gold/5'
                      : 'border-white/[0.08] bg-bg-surface hover:border-white/[0.14] hover:bg-bg-card hover:shadow-lg hover:shadow-oe-gold/5'
                  }`}
                >
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <span
                      className={`font-semibold text-sm md:text-base leading-snug transition-colors ${
                        isOpen ? 'text-white' : 'text-white/80'
                      }`}
                    >
                      {item.q}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={reduceMotion ? { duration: 0 } : { duration: 0.25 }}
                      className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                        isOpen ? 'bg-oe-gold/20 text-oe-gold' : 'bg-white/10 text-white/50'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: 'easeInOut' }}
                        className="overflow-hidden bg-bg-card rounded-b-2xl"
                      >
                        <div className="px-5 pb-5">
                          <div className="h-px bg-oe-gold/10 mb-4" />
                          <motion.p
                            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={reduceMotion ? { duration: 0 } : { duration: 0.3, delay: 0.1 }}
                            className="text-white/65 text-sm md:text-base leading-relaxed"
                          >
                            {item.a}
                          </motion.p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
