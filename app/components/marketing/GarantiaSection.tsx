// app/components/marketing/GarantiaSection.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - GARANTÍA SECTION v1.1 - i18n complet
// ═══════════════════════════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { usePublicStats } from '@/hooks/usePublicData';

// ═══════════════════════════════════════════════════════════════════════════
// ICONOS
// ═══════════════════════════════════════════════════════════════════════════

const Icons = {
  Shield: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Backup: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="6" width="20" height="12" rx="2"/>
      <path d="M12 10v4"/>
      <path d="M8 10v4"/>
      <path d="M16 10v4"/>
      <path d="M6 2v4"/>
      <path d="M18 2v4"/>
    </svg>
  ),
  Clock: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Receipt: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/>
      <path d="M8 6h8"/>
      <path d="M8 10h8"/>
      <path d="M8 14h4"/>
    </svg>
  ),
  Headset: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
    </svg>
  ),
  Heart: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════
// GARANTIES CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const guaranteesConfig = [
  { key: 'response', icon: Icons.Clock, highlight: '<2h', color: 'from-amber-500 to-orange-500' },
  { key: 'noSurprises', icon: Icons.Receipt, highlight: '0€', color: 'from-purple-500 to-violet-500' },
  { key: 'support', icon: Icons.Headset, highlight: '24/7', color: 'from-rose-500 to-pink-500' },
  { key: 'passion', icon: Icons.Heart, highlight: '∞', color: 'from-red-500 to-orange-500' },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Guarantee Card
// ═══════════════════════════════════════════════════════════════════════════

function GuaranteeCard({
  config,
  index,
  t
}: {
  config: typeof guaranteesConfig[0];
  index: number;
  t: (key: string) => string;
}) {
  const Icon = config.icon;
  const title = t(`guarantees.${config.key}.title`);
  const description = t(`guarantees.${config.key}.description`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group relative"
    >
      <div className="relative bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl p-6 h-full hover:border-white/20 hover:-translate-y-1 hover:shadow-2xl transition-all duration-500">
        {/* Highlight badge */}
        <div className={`absolute -top-3 -right-3 w-14 h-14 bg-gradient-to-br ${config.color} rounded-2xl flex items-center justify-center transform rotate-12 group-hover:rotate-0 transition-transform shadow-lg shadow-black/30`}>
          <span className="text-white font-black text-sm">{config.highlight}</span>
        </div>

        {/* Icon */}
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center mb-5 text-white group-hover:scale-110 transition-transform duration-300`} style={{ boxShadow: `0 8px 24px rgba(0,0,0,0.3)` }}>
          <Icon />
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-white/60 leading-relaxed">{description}</p>

        {/* Hover glow */}
        <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${config.color} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`} />
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function GarantiaSection() {
  const t = useTranslations('homeSections.garantia');
  const { stats } = usePublicStats();

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-zinc-900" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-6">
            {t('badge')}
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            {t('title1')} <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{t('title2')}</span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Guarantee Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {guaranteesConfig.map((config, index) => (
            <GuaranteeCard key={config.key} config={config} index={index} t={t} />
          ))}
        </div>

        {/* Trust seal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
              <Icons.Shield />
            </div>
            <div className="text-left">
              <div className="text-white font-bold">{t('sealTitle')}</div>
              <div className="text-emerald-400 text-sm">{t('sealSubtitle', { events: stats.totalEvents })}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
