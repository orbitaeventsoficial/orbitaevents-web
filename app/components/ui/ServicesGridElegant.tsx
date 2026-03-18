'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';

// ─── Pillar icons (inline SVG for zero deps) ────────────────────────────────

function IconDJ() {
  return (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 32 32" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="16" cy="16" r="12" />
      <circle cx="16" cy="16" r="5" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" />
      <path d="M16 4v3M16 25v3M4 16h3M25 16h3" strokeLinecap="round" />
    </svg>
  );
}

function IconTheme() {
  return (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 32 32" stroke="currentColor" strokeWidth={1.5}>
      <path d="M16 3l3 7h7l-5.5 4.5 2 7L16 17l-6.5 4.5 2-7L6 10h7l3-7z" strokeLinejoin="round" />
    </svg>
  );
}

function IconProduction() {
  return (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 32 32" stroke="currentColor" strokeWidth={1.5}>
      <rect x="4" y="8" width="24" height="16" rx="2" />
      <path d="M13 14l6 3-6 3V14z" fill="currentColor" stroke="none" />
      <path d="M8 27h16M12 24h8" strokeLinecap="round" />
    </svg>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function ServicesGridElegant() {
  const t = useTranslations('servicesGrid');
  const reduceMotion = useReducedMotion();

  const pillars = [
    {
      key: 'dj',
      Icon: IconDJ,
      accent: 'from-amber-500 to-orange-500',
      accentLight: 'text-amber-400',
      glowColor: 'rgba(251, 191, 36, 0.08)',
      href: '/servicios/fiestas',
    },
    {
      key: 'theming',
      Icon: IconTheme,
      accent: 'from-purple-500 to-pink-500',
      accentLight: 'text-purple-400',
      glowColor: 'rgba(168, 85, 247, 0.08)',
      href: '/portfolio',
    },
    {
      key: 'production',
      Icon: IconProduction,
      accent: 'from-cyan-500 to-blue-500',
      accentLight: 'text-cyan-400',
      glowColor: 'rgba(6, 182, 212, 0.08)',
      href: '/servicios/empresas',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#0A0A0A] relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full bg-amber-500/[0.02] blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-5xl">
        {/* Header — direct, no fluff */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14 md:mb-20"
        >
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            {t('title')}
          </h2>
          <p className="text-white/50 text-base md:text-lg mt-4 max-w-2xl mx-auto leading-relaxed">
            {t('description')}
          </p>
        </motion.div>

        {/* 3 pillars — icon-driven, no images */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {pillars.map(({ key, Icon, accent, accentLight, glowColor, href }, i) => (
            <motion.div
              key={key}
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={reduceMotion ? { duration: 0 } : { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={href} className="group block">
                <div
                  className="relative p-7 md:p-8 rounded-2xl border border-white/[0.08] hover:border-white/[0.18] transition-all duration-500 h-full"
                  style={{ background: `radial-gradient(ellipse at top left, ${glowColor}, transparent 70%)` }}
                >
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${accent} text-white mb-5`}>
                    <Icon />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-white/90 transition-colors">
                    {t(`pillars.${key}.title`)}
                  </h3>

                  {/* Description — benefit-focused, not feature list */}
                  <p className="text-white/50 text-sm leading-relaxed mb-5">
                    {t(`pillars.${key}.desc`)}
                  </p>

                  {/* Highlights */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {(t.raw(`pillars.${key}.highlights`) as string[]).map((h, j) => (
                      <span key={j} className={`text-xs font-medium px-2.5 py-1 rounded-full border border-white/[0.08] ${accentLight} bg-white/[0.03]`}>
                        {h}
                      </span>
                    ))}
                  </div>

                  {/* Link */}
                  <div className={`flex items-center gap-1.5 text-sm font-semibold ${accentLight} group-hover:gap-2.5 transition-all`}>
                    <span>{t('viewMore')}</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom — types of events, compact */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 md:mt-16 flex flex-wrap items-center justify-center gap-3 md:gap-4"
        >
          <span className="text-white/30 text-sm">{t('weDoIt')}</span>
          {(t.raw('eventTypes') as string[]).map((type, i) => (
            <span key={i} className="text-white/60 text-sm font-medium px-3 py-1.5 rounded-full border border-white/[0.08] hover:border-white/20 transition-colors">
              {type}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
