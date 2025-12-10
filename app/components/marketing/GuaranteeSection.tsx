// app/components/marketing/GuaranteeSection.tsx
"use client";

import { SITE_CONFIG } from '@/config/site-config';
import { motion } from "framer-motion";
import { Shield, Heart, TrendingUp, Users, CheckCircle2 } from "lucide-react";
import { useTranslations } from 'next-intl';

export default function GuaranteeSection() {
  const t = useTranslations('guarantee');
  const tStats = useTranslations('stats');

  const stats = [
    {
      icon: TrendingUp,
      value: String(SITE_CONFIG.stats.eventsCompleted),
      label: tStats('noIncidents'),
    },
    {
      icon: CheckCircle2,
      value: "100%",
      label: tStats('backupEquipment'),
    },
    {
      icon: Users,
      value: `${SITE_CONFIG.stats.recommendRate}%`,
      label: tStats('repeatRecommend'),
    },
  ];

  const commitments = [
    t('commitments.team'),
    t('commitments.supervision'),
    t('commitments.backup'),
    t('commitments.contract'),
    t('commitments.communication'),
  ];
  return (
    <section className="py-20 sm:py-32 bg-gradient-to-b from-bg-surface to-bg-main relative overflow-hidden">
      {/* 🔥 PARTÍCULAS */}
      <div className="absolute inset-0 pointer-events-none opacity-12">
        <div className="absolute w-28 h-28 rounded-full bg-gradient-to-br from-oe-gold/40 to-yellow-400/20 blur-3xl top-[20%] right-[8%] animate-float" style={{ animationDuration: "6s" }} />
        <div className="absolute w-24 h-24 rounded-full bg-purple-500/25 blur-2xl bottom-[30%] left-[10%] animate-scale-pulse" style={{ animationDuration: "5s", animationDelay: "1s" }} />
      </div>

      <div className="mx-auto max-w-6xl px-4 relative z-10">
        {/* Hero */}
        <div className="text-center mb-16">
          <motion.div
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-oe-gold/10 flex items-center justify-center
                     hover:scale-125 transition-transform"
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", duration: 0.8 }}
          >
            <Heart className="w-10 h-10 text-oe-gold animate-scale-pulse" />
          </motion.div>

          <h2 className="text-h2 text-white mb-4">
            {t('title')}
            <br />
            <span className="text-oe-gold">{t('titleHighlight')}</span>
          </h2>

          <p className="text-xl text-text-muted max-w-3xl mx-auto">
            {t('subtitle')}
            <span className="text-oe-gold font-bold">{t('subtitleHighlight')}</span>.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                className="oe-card text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Icon className="w-10 h-10 text-oe-gold mx-auto mb-4" />
                <div className="text-4xl font-black text-white mb-2">{stat.value}</div>
                <p className="text-sm text-text-muted">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Commitments List */}
        <motion.div
          className="oe-card p-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-oe-gold" />
            <h3 className="text-2xl font-bold text-white">{t('ourCommitment')}</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {commitments.map((item, idx) => (
              <motion.div
                key={idx}
                className="flex items-start gap-3 text-white"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <CheckCircle2 className="w-5 h-5 text-oe-gold flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
            <p className="text-sm text-green-400 text-center">
              ✅ {t('successMessage')}
            </p>
          </div>
        </motion.div>

        <p className="text-sm text-text-muted text-center mt-8">
          * {t('disclaimer')}
        </p>
      </div>
    </section>
  );
}
