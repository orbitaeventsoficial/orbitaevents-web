'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/lib/navigation';
import { WHATSAPP_NUMBER } from '@/lib/constants';

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
      <section className="relative pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-sm font-medium mb-6">
              <span>❓</span> {badge}
            </span>

            <h1 className="text-4xl md:text-6xl font-black mb-4">
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
      <section className="sticky top-16 z-20 bg-zinc-950/90 backdrop-blur-sm border-b border-white/10 py-4">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-proximity">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap snap-start transition-all
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
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(ctaWhatsappMessage)}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold rounded-2xl transition-all hover:scale-105 hover:shadow-[0_8px_30px_rgba(37,211,102,0.4)]"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
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
