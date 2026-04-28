'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/lib/navigation';
import { WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';
import WhatsAppIcon from '@/app/components/public/WhatsAppIcon';

interface FAQ {
  question: string;
  answer: string;
}

interface Category {
  key: string;
  title: string;
  faqs: FAQ[];
}

interface FAQClientProps {
  badge: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  ctaQuestion: string;
  ctaButton: string;
  ctaWhatsappMessage: string;
  ctaResponseTime: string;
  categories: Category[];
}

const categoryIcons: Record<string, string> = {
  general: '📋',
  preus: '💰',
  equip: '🎛️',
  musica: '🎵',
  tematiques: '🎃',
  logistica: '🚚',
  garanties: '✅'
};

export default function FAQClient({
  badge,
  title,
  titleHighlight,
  subtitle,
  ctaQuestion,
  ctaButton,
  ctaWhatsappMessage,
  ctaResponseTime,
  categories
}: FAQClientProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.key || 'general');
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());
  const faqRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const toggleQuestion = (id: string) => {
    setOpenQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
        requestAnimationFrame(() => {
          faqRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      }
      return newSet;
    });
  };

  const activeData = categories.find(c => c.key === activeCategory);

  return (
    <main className="relative text-white">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.08),transparent_50%)] -z-10" />

      {/* Hero */}
      <section className="relative px-4 pb-16 pt-28 sm:pt-32">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-sm font-medium mb-6">
              <span>❓</span> {badge}
            </span>

            <h1 className="mb-4 text-3xl font-black sm:text-4xl md:text-6xl">
              {title}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                {titleHighlight}
              </span>
            </h1>

            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              {subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categories Tabs */}
      <section className="sticky top-16 z-20 border-b border-white/10 bg-zinc-950/90 py-3 backdrop-blur-sm sm:py-4">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-proximity md:flex-wrap md:justify-center md:overflow-visible">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`
                  flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium whitespace-nowrap snap-start transition-all sm:px-4 sm:text-sm
                  ${activeCategory === cat.key
                    ? 'bg-amber-500 text-black'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }
                `}
              >
                <span>{categoryIcons[cat.key] || '📌'}</span>
                {cat.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {activeData?.faqs.map((faq, index) => {
                const id = `${activeCategory}-${index}`;
                const isOpen = openQuestions.has(id);

                return (
                  <motion.div
                    key={id}
                    ref={(el) => { faqRefs.current[id] = el; }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-amber-500/30 transition-colors"
                  >
                    <button
                      onClick={() => toggleQuestion(id)}
                      className="w-full flex items-center justify-between p-6 text-left"
                    >
                      <h3 className="font-semibold text-white pr-4">{faq.question}</h3>
                      <span
                        className={`text-amber-500 transition-transform duration-300 flex-shrink-0 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="px-6 pb-6 text-white/70 leading-relaxed border-t border-white/5 pt-4">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xl text-white/80 mb-6">{ctaQuestion}</p>

            <a
              href={WHATSAPP_URL_WITH_MESSAGE(ctaWhatsappMessage)}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-8 py-4 font-bold text-white transition-all hover:scale-105 hover:bg-[#20BD5A] hover:shadow-[0_8px_30px_rgba(37,211,102,0.4)] sm:w-auto"
            >
              <WhatsAppIcon className="w-6 h-6" />
              {ctaButton}
            </a>

            <p className="mt-6 text-white/50 text-sm">
              {ctaResponseTime}
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

