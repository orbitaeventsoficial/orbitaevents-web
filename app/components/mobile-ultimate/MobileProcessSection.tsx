'use client';

// ═══════════════════════════════════════════════════════════════════════════
// MOBILE PROCESS SECTION - Òrbita Events
// "Com funciona?" — 3 passos amb línia connectora i CTA final
// ═══════════════════════════════════════════════════════════════════════════

import { motion, useReducedMotion } from 'framer-motion';
import { WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';

// ── Dades dels passos ──────────────────────────────────────────────────────

const STEPS = [
  {
    number: '01',
    emoji: '💬',
    title: "Explica'ns el teu event",
    desc: "Contacta'ns per WhatsApp o configura el teu pressupost online. T'escoltem sense cap compromís.",
    gradient: 'from-amber-500 to-orange-500',
    glow: 'rgba(245,158,11,0.25)',
  },
  {
    number: '02',
    emoji: '✨',
    title: 'Ho dissenyem junts',
    desc: 'Rebràs un pressupost personalitzat en menys de 2h. Sense sorpreses, sense costos ocults.',
    gradient: 'from-purple-500 to-pink-500',
    glow: 'rgba(168,85,247,0.2)',
  },
  {
    number: '03',
    emoji: '🎊',
    title: 'Tu gaudeixes, nosaltres ho cuidem tot',
    desc: "El dia B, l'equip d'Òrbita s'encarrega de cada detall. Tu, a gaudir del moment.",
    gradient: 'from-emerald-500 to-teal-400',
    glow: 'rgba(16,185,129,0.2)',
  },
] as const;

// ── Component principal ────────────────────────────────────────────────────

export default function MobileProcessSection() {
  const reduceMotion = useReducedMotion();

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
          El procés
        </span>
        <h2 className="text-3xl font-black text-white">
          Com funciona?
        </h2>
        <p className="text-white/45 text-sm mt-2">3 passos · 0 complicacions</p>
      </motion.div>

      {/* Steps */}
      <div className="relative">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.number}
            initial={reduceMotion ? false : { opacity: 0, x: i % 2 === 0 ? -24 : 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { delay: i * 0.14, type: 'spring', damping: 20 }
            }
            className="relative flex gap-4 pb-7 last:pb-0"
          >
            {/* Connecting line */}
            {i < STEPS.length - 1 && (
              <div className="absolute left-7 top-14 bottom-0 w-px bg-gradient-to-b from-white/20 to-transparent" />
            )}

            {/* Icon + number */}
            <div className="relative flex-shrink-0">
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center`}
                style={{ boxShadow: `0 8px 28px ${step.glow}` }}
              >
                <span className="text-2xl">{step.emoji}</span>
              </div>
              {/* Number badge */}
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-950 border border-white/20 flex items-center justify-center">
                <span className="text-white/70 text-[9px] font-black leading-none">
                  {step.number}
                </span>
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 pt-1.5">
              <h3 className="text-white font-black text-base mb-1.5 leading-snug">
                {step.title}
              </h3>
              <p className="text-white/55 text-sm leading-relaxed">{step.desc}</p>
            </div>
          </motion.div>
        ))}
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
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          <span>Comencem ara!</span>
        </a>
      </motion.div>
    </section>
  );
}
