'use client';

// ═══════════════════════════════════════════════════════════════════════════
// PROCESS SECTION (DESKTOP) - Òrbita Events
// "Com funciona?" — 3 passos horitzontals amb connector
// ═══════════════════════════════════════════════════════════════════════════

import { motion, useReducedMotion } from 'framer-motion';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import { PUBLIC_PROCESS_STEP_STYLES, WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';


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
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {t('ctaStart')}
          </a>
          <Link
            href="/configurador"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-semibold transition-colors"
          >
            {t('ctaCalculate')}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
