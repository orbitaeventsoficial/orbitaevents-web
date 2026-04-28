'use client';

// ═══════════════════════════════════════════════════════════════════════════
// MOBILE PROCESS SECTION - Òrbita Events
// "Com funciona?" — 3 passos amb línia connectora i CTA final
// ═══════════════════════════════════════════════════════════════════════════

import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { PUBLIC_PROCESS_STEP_STYLES, WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';
import WhatsAppIcon from '@/app/components/public/WhatsAppIcon';


// ── Component principal ────────────────────────────────────────────────────

export default function MobileProcessSection() {
  const t = useTranslations('homePage.process');
  const tCommon = useTranslations('common');
  const reduceMotion = useReducedMotion();

  const steps = [
    { number: '01', title: t('step1.title'), desc: t('step1.desc') },
    { number: '02', title: t('step2.title'), desc: t('step2.desc') },
    { number: '03', title: t('step3.title'), desc: t('step3.desc') },
  ] as const;

  return (
    <section className="py-14 px-6 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute top-0 right-0 w-56 h-56 bg-purple-500/5 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-amber-500/5 rounded-full blur-[90px] pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-10"
      >
        <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold tracking-wider uppercase mb-3">
          {t('sectionLabel')}
        </span>
        <h2 className="text-3xl font-black text-white">
          {t('title')}
        </h2>
        <p className="text-white/45 text-sm mt-2">{t('subtitle')}</p>
      </motion.div>

      {/* Steps */}
      <div className="relative p-5 rounded-3xl bg-white/[0.03] border border-white/[0.06]">
        {steps.map((step, i) => {
          const style = PUBLIC_PROCESS_STEP_STYLES[i];
          return (
            <motion.div
              key={step.number}
              initial={reduceMotion ? false : { opacity: 0, x: i % 2 === 0 ? -24 : 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { delay: i * 0.1, duration: 0.32, ease: [0.22, 1, 0.36, 1] }
              }
              className="relative flex gap-4 pb-8 last:pb-0"
            >
              {/* Icon + number + connecting line */}
              <div className="relative flex-shrink-0">
                <div
                  className={`relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center`}
                  style={{ boxShadow: `0 8px 28px ${style.glow}` }}
                >
                  <span className="text-2xl">{style.emoji}</span>
                </div>
                {/* Number badge */}
                <div className="absolute -top-1.5 -right-1.5 z-20 w-5 h-5 rounded-full bg-zinc-950 border border-white/20 flex items-center justify-center">
                  <span className="text-amber-400 text-[9px] font-black leading-none">
                    {step.number}
                  </span>
                </div>
                {/* Connecting line to next step */}
                {i < steps.length - 1 && (
                  <div className="absolute top-14 left-1/2 -translate-x-1/2 w-px h-8 bg-gradient-to-b from-white/15 to-transparent" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 pt-1.5">
                <h3 className="text-white font-black text-base mb-1.5 leading-snug">
                  {step.title}
                </h3>
                <p className="text-white/55 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* CTA */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={reduceMotion ? { duration: 0 } : { delay: 0.5 }}
        className="mt-10"
      >
        <a
          href={WHATSAPP_URL_WITH_MESSAGE(
            "Hola! Vull organitzar un event. M'agradaria saber més!"
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-black text-base text-zinc-900 active:scale-95 transition-transform"
          style={{
            background: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)',
            boxShadow: '0 12px 32px rgba(245,158,11,0.35)',
          }}
        >
          {/* WhatsApp icon */}
          <WhatsAppIcon className="w-5 h-5" />
          <span>{t('ctaStart')}</span>
        </a>
      </motion.div>
    </section>
  );
}
