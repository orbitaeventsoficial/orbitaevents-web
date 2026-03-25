'use client';

// ═══════════════════════════════════════════════════════════════════════════
// FAQ SECTION - Òrbita Events
// Accordion elegant amb JSON-LD schema per SEO
// Funciona tant en desktop com en mobile
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import { PUBLIC_FAQ_KEYS, WHATSAPP_NUMBER } from '@/lib/constants';
import { trackCTAClick, trackWhatsAppClick } from '@/app/lib/analytics';

export default function FAQSection() {
  const t = useTranslations('faq');
  const reduceMotion = useReducedMotion();
  const [openId, setOpenId] = useState<string | null>('1');

  const items = PUBLIC_FAQ_KEYS.map((key) => ({
    key,
    question: t(`items.${key}.question`),
    answer: t(`items.${key}.answer`),
  }));

  // JSON-LD FAQ Schema for Google rich snippets
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };

  return (
    <section className="relative py-16 md:py-24 overflow-hidden oe-grid-pattern">
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(251,191,36,0.05),transparent_70%)] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-3xl relative z-[1]">
        {/* Header */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-14"
        >
          <span className="inline-block px-5 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold tracking-wider uppercase mb-4">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
            {t('title')}
          </h2>
          <p className="text-white/50 text-lg">{t('subtitle')}</p>
        </motion.div>

        {/* Accordion items */}
        <div className="space-y-3">
          {items.map((item, i) => {
            const isOpen = openId === item.key;
            return (
              <motion.div
                key={item.key}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={reduceMotion ? { duration: 0 } : { delay: i * 0.05 }}
              >
                <div
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isOpen
                      ? 'border-amber-500/30 bg-[#141210] border-l-2 border-l-amber-500'
                      : 'border-white/[0.08] bg-[#111111] hover:border-white/[0.14] hover:bg-[#161616] hover:shadow-lg hover:shadow-amber-500/5'
                  }`}
                >
                  {/* Question row */}
                  <button
                    onClick={() => setOpenId(isOpen ? null : item.key)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <span
                      className={`font-semibold text-sm md:text-base leading-snug transition-colors ${
                        isOpen ? 'text-white' : 'text-white/80'
                      }`}
                    >
                      {item.question}
                    </span>

                    {/* Chevron icon */}
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={reduceMotion ? { duration: 0 } : { duration: 0.25 }}
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                        isOpen ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white/60'
                      }`}
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.div>
                  </button>

                  {/* Answer */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5">
                          <div className="h-px bg-amber-500/15 mb-4" />
                          <motion.p
                            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={reduceMotion ? { duration: 0 } : { duration: 0.3, delay: 0.1 }}
                            className="text-white/65 text-sm md:text-base leading-relaxed"
                          >
                            {item.answer}
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

        {/* CTA */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <p className="text-white/60 text-sm mb-4">{t('cta.title')}</p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola! Tinc un dubte sobre el vostre servei d'esdeveniments")}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackWhatsAppClick('faq_section');
              trackCTAClick('faq_whatsapp_cta', 'faq_section');
            }}
            className="group relative inline-flex items-center gap-2 px-8 py-4 bg-[#1a1408] border border-amber-500/25 hover:bg-[#231b0e] hover:shadow-lg hover:shadow-amber-500/10 rounded-full text-amber-400 text-base font-semibold transition-all"
          >
            {t('cta.button')}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
