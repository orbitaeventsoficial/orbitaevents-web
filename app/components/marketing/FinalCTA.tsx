// app/components/marketing/FinalCTA.tsx
// "Invitació càlida" - estil emocional i personal

"use client";
import { SITE_CONFIG } from '@/config/site-config';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, Star, Sparkles } from 'lucide-react';
import { useGoogleReviews } from '@/hooks/useGoogleReviews';
import { useTranslations } from 'next-intl';

import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function FinalCTA() {
  const t = useTranslations('finalCta');
  const { track } = useAnalytics();
  const { data: reviewsData } = useGoogleReviews();
  const hasReviews = reviewsData.user_ratings_total > 0;
  const hasEvents = SITE_CONFIG.stats.eventsCompleted > 0;
  return (
    <section className="py-24 sm:py-36 bg-gradient-to-b from-[#0a0a0b] via-[#0d0d10] to-[#0a0a0b] relative overflow-hidden">
      {/* Background effects - càlid i acollidor */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(215, 184, 110, 0.08), transparent 70%)',
          }}
        />
        {/* Partícules subtils */}
        <div className="absolute w-64 h-64 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-400/10 blur-3xl top-[10%] left-[5%] animate-float" style={{ animationDuration: "10s" }} />
        <div className="absolute w-48 h-48 rounded-full bg-purple-500/15 blur-3xl bottom-[15%] right-[10%] animate-float" style={{ animationDuration: "12s", animationDelay: "2s" }} />
        <div className="absolute w-32 h-32 rounded-full bg-fuchsia-500/10 blur-2xl top-[50%] right-[20%] animate-float" style={{ animationDuration: "8s", animationDelay: "1s" }} />
      </div>

      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Emoji càlid en lloc de badge agressiu */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <motion.span
              className="text-5xl sm:text-6xl"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              ✨
            </motion.span>
          </motion.div>

          {/* Headline emocional */}
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            {t('title')}
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
              {t('titleHighlight')}
            </span>
          </h2>

          {/* Subheadline - to càlid i personal */}
          <p className="text-lg sm:text-xl md:text-2xl text-white/60 mb-12 leading-relaxed max-w-2xl mx-auto">
            {t('subtitle')}{' '}
            <span className="text-white font-medium">{t('subtitleHighlight')}</span>
          </p>

          {/* CTA principal - Càlid i invitador */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <motion.a
              href="/configurador"
              className="btn-primary btn-primary-lg btn-breathing group text-white"
              onClick={() => track('CTA_Final_Configurador')}
              whileHover={{ scale: 1.05, boxShadow: '0 25px 50px -12px rgba(245, 158, 11, 0.35)' }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              {t('configureEvent')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.a>
          </motion.div>

          {/* Alternativa suau */}
          <motion.p
            className="text-white/50 mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            {t('orPrefer')}{' '}
            <a
              href="/contacto"
              className="text-amber-400 hover:text-amber-300 underline underline-offset-4 transition-colors"
              onClick={() => track('CTA_Final_Contact')}
            >
              {t('talkDirectly')}
            </a>
          </motion.p>

          {/* Social proof subtil */}
          {(hasReviews || hasEvents) && (
            <motion.div
              className="flex flex-wrap items-center justify-center gap-8 text-sm text-white/40"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              {hasReviews && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>{reviewsData.rating.toFixed(1)}/5 ({reviewsData.user_ratings_total}+ {t('eventsLabel')})</span>
                </div>
              )}
              {hasEvents && SITE_CONFIG.stats.recommendRate > 0 && (
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-400" />
                  <span>{SITE_CONFIG.stats.recommendRate}% {t('repeatOrRecommend')}</span>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Garanties subtils */}
        <motion.div
          className="mt-16 pt-8 border-t border-white/5"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/30">
            <span>✓ {t('trustBadges.backup')}</span>
            <span className="hidden sm:inline">•</span>
            <span>✓ {t('trustBadges.insurance')}</span>
            <span className="hidden sm:inline">•</span>
            <span>✓ {t('trustBadges.travel')}</span>
          </div>
          <p className="text-center text-xs text-white/20 mt-4">
            {t('responseTime')}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
