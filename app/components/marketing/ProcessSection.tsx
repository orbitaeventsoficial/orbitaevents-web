'use client';

// ═══════════════════════════════════════════════════════════════════════════
// PROCESS SECTION (DESKTOP) - Òrbita Events
// "Com funciona?" — 3 passos horitzontals amb connector
// ═══════════════════════════════════════════════════════════════════════════

import { motion, useReducedMotion } from 'framer-motion';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import { PUBLIC_PROCESS_STEP_STYLES, WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';
import WhatsAppIcon from '@/app/components/public/WhatsAppIcon';
import ArrowRightIcon from '@/app/components/public/ArrowRightIcon';


export default function ProcessSection() {
  const t = useTranslations('homePage.process');
  const reduceMotion = useReducedMotion();

  const steps = [
    { number: '01', title: t('step1.title'), desc: t('step1.desc') },
    { number: '02', title: t('step2.title'), desc: t('step2.desc') },
    { number: '03', title: t('step3.title'), desc: t('step3.desc') },
  ] as const;

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Ambient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/50 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-5 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold tracking-wider uppercase mb-4">
            {t('sectionLabel')}
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-3">
            {t('title')}
          </h2>
          <p className="text-white/50 text-lg">{t('subtitle')}</p>
        </motion.div>

        {/* Steps grid + connector */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-12 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px border-t-2 border-dashed border-white/[0.08] z-0" />

          {steps.map((step, i) => {
            const style = PUBLIC_PROCESS_STEP_STYLES[i];
            return (
              <motion.div
                key={step.number}
                initial={reduceMotion ? false : { opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { delay: i * 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
                }
                className="relative z-10 p-7 rounded-3xl bg-white/[0.04] border border-white/[0.08] hover:border-white/20 hover:-translate-y-2 transition-all duration-500 group backdrop-blur-sm hover:shadow-[0_24px_80px_rgba(0,0,0,0.3)]"
                style={{ boxShadow: `0 0 0 0 ${style.glow}` }}
                whileHover={reduceMotion ? undefined : { boxShadow: `0 20px 60px ${style.glow}` }}
              >
                {/* Icon with pulse ring */}
                <div className="relative inline-flex mb-6">
                  <motion.div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${style.gradient}`}
                    initial={{ scale: 1, opacity: 0.5 }}
                    whileInView={{ scale: 1.5, opacity: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.15 }}
                  />
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center relative`}
                    style={{ boxShadow: `0 8px 32px ${style.glow}` }}
                  >
                    <span className="text-3xl">{style.emoji}</span>
                  </div>
                  {/* Number badge */}
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-zinc-950 border border-white/20 flex items-center justify-center">
                    <span className="text-white/70 text-[11px] font-black">{step.number}</span>
                  </div>
                </div>

                <h3 className="text-xl font-black text-white mb-3 leading-snug">
                  {step.title}
                </h3>
                <p className="text-white/60 leading-relaxed">{step.desc}</p>

                {/* Hover glow */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${style.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 pointer-events-none`} />
              </motion.div>
            );
          })}
        </div>

        {/* CTAs */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={reduceMotion ? { duration: 0 } : { delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12"
        >
          <a
            href={WHATSAPP_URL_WITH_MESSAGE(
              "Hola! Vull organitzar un event. M'agradaria saber més!"
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-zinc-900 transition-all hover:scale-[1.03] active:scale-[0.98] bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/35"
          >
            <WhatsAppIcon className="w-5 h-5" />
            {t('ctaStart')}
          </a>
          <Link
            href="/configurador"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-semibold transition-colors"
          >
            {t('ctaCalculate')}
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
