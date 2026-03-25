"use client";

import { useMemo, useState, useRef, useCallback } from 'react';
import { Link } from '@/lib/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Heart, Check, Star, ChevronRight, MapPin
} from 'lucide-react';
import Image from 'next/image';
import { getPacksByService, type PackDefinition } from '@/config/packs-config';
import { useLocale, useMessages, useTranslations } from 'next-intl';
import { usePacks } from '@/lib/hooks/usePacks';
import { getWeddingCoverageZones } from '@/lib/services/weddingCoverage';
import { SITE_CONFIG } from '@/app/config/site-config';
import GuestRecommender from '@/app/components/ui/GuestRecommender';
import { TRUST_POINTS } from '@/lib/constants/services';

type AnalyticsValue = string | number | boolean | undefined;
type AnalyticsParams = Record<string, AnalyticsValue>;
type GtagWindow = Window & { gtag?: (command: 'event', action: string, params?: AnalyticsParams) => void };

function trackServiceEvent(action: string, params: AnalyticsParams) {
  if (typeof window === 'undefined') return;
  const gtag = (window as GtagWindow).gtag;
  if (!gtag) return;
  gtag('event', action, params);
}

export default function BodasClient() {
  const t = useTranslations('pages.weddings');
  const messages = useMessages();
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const fallbackPacks = useMemo(() => getPacksByService('bodas'), []);
  const { packs: weddingPacks } = usePacks({
    service: 'bodas',
    locale,
    fallback: fallbackPacks,
  });
  const coverageZones = useMemo(() => getWeddingCoverageZones(messages, t), [messages, t]);
  const minPrice = useMemo(
    () => weddingPacks.length ? Math.min(...weddingPacks.map(p => p.priceValue ?? 0)) : 0,
    [weddingPacks]
  );

  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const packRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handlePackClick = useCallback((packId: string) => {
    setSelectedPackId(packId);
    requestAnimationFrame(() => {
      packRefs.current[packId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, []);

  const handlePackCTA = (pack: PackDefinition) => {
    trackServiceEvent('bodas_pack_cta', {
      pack_id: pack.id,
      pack_name: pack.name,
      price: pack.priceValue,
    });
  };

  return (
    <div className="min-h-screen bg-bg-main">
      {/* ═══ HERO ═══ */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-bg-main z-10" />
          <Image
            src="/img/portfolio/bodas/bodas-01.avif"
            alt="DJ para bodas Òrbita Events"
            fill
            priority
            sizes="100vw"
            quality={70}
            className="object-cover"
          />
        </div>

        <div className="relative z-20 mx-auto max-w-4xl px-4 py-24 text-center">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-oe-gold/10 border border-oe-gold/30 mb-6 backdrop-blur-sm">
              <Heart className="w-4 h-4 text-oe-gold" fill="currentColor" />
              <span className="text-sm font-bold text-oe-gold">{t('badgeYears')}</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-display font-black text-white mb-5 leading-tight">
              {t('heroTitle')}
            </h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto mb-10">
              {t('heroSubtitle')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/configurador?service=bodas"
                onClick={() => trackServiceEvent('bodas_hero_cta', { position: 'hero' })}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-2xl hover:scale-105 transition-transform shadow-lg shadow-orange-500/25 text-lg"
              >
                {t('configure')}
                <ChevronRight className="w-5 h-5" />
              </Link>
              <span className="text-white/50 text-sm">
                {t('from')} {minPrice}€
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ TRUST BAR ═══ */}
      <section className="border-y border-white/[0.06] bg-bg-surface/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {TRUST_POINTS.map(({ icon: Icon, key }) => (
              <div key={key} className="flex items-center gap-3 text-white/60">
                <Icon className="w-5 h-5 text-oe-gold" />
                <span className="text-sm font-medium">{t(`trust.${key}`)}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 text-white/60">
              <Star className="w-5 h-5 text-amber-400" fill="currentColor" />
              <span className="text-sm font-medium">
                {SITE_CONFIG.stats.avgRating}/5 · {SITE_CONFIG.stats.reviewCount}+ reviews
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SELECTOR CONVIDATS ═══ */}
      <div className="py-12">
        <GuestRecommender
          packs={weddingPacks}
          service="bodas"
          labels={{
            question: t('guestsQuestion'),
            people: t('people'),
            recommended: t('recommended'),
            configure: t('configure'),
            from: t('from'),
          }}
        />
      </div>

      {/* ═══ PACKS — Showcase ═══ */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            {t('choosePack')}
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">{t('heroSubtitle')}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {weddingPacks.map((pack, i) => {
            const isSelected = selectedPackId === pack.id;
            return (
            <motion.div
              key={pack.id}
              ref={(el) => { packRefs.current[pack.id] = el; }}
              initial={reduceMotion ? false : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => handlePackClick(pack.id)}
              className={`
                relative p-7 rounded-2xl border transition-all duration-300 flex flex-col cursor-pointer
                ${isSelected
                  ? 'bg-gradient-to-b from-amber-500/15 to-transparent border-amber-500/60 ring-2 ring-amber-500/40 scale-[1.02]'
                  : pack.popular
                  ? 'bg-gradient-to-b from-amber-500/10 to-transparent border-amber-500/40 ring-1 ring-amber-500/20 md:scale-[1.03]'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                }
              `}
            >
              {/* Badge */}
              {pack.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold bg-amber-500 text-black whitespace-nowrap">
                  <Star className="w-3 h-3 inline mr-1" fill="currentColor" />
                  {t('mostChosen')}
                </div>
              )}

              {/* Nom + tagline */}
              <div className="text-center mb-5 mt-2">
                <h3 className="text-2xl font-bold text-white mb-1">{pack.name}</h3>
                {pack.tagline && (
                  <p className="text-white/50 text-sm">{pack.tagline}</p>
                )}
              </div>

              {/* Preu */}
              <div className="text-center mb-6">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{t('from')}</p>
                <p className="text-4xl font-black text-oe-gold">{pack.price}</p>
              </div>

              {/* Ideal for */}
              {pack.ideal && (
                <p className="text-xs text-white/40 mb-4 text-center">
                  <span className="font-medium text-white/50">👥</span> {pack.ideal}
                </p>
              )}

              {/* Features */}
              <ul className="space-y-2 mb-6 flex-1">
                {(pack.features || []).slice(0, 5).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-white/70">
                    <Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA → Configurador */}
              <Link
                href={`/configurador?service=bodas&packId=${pack.id}`}
                onClick={() => handlePackCTA(pack)}
                className={`block text-center py-3.5 rounded-xl font-semibold transition-all mt-auto ${
                  pack.popular
                    ? 'bg-amber-500 text-black hover:bg-amber-400'
                    : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                {t('configure')} →
              </Link>
            </motion.div>
            );
          })}
        </div>
      </section>

      {/* ═══ QUÈ INCLOU ═══ */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="p-8 md:p-12 rounded-3xl bg-white/[0.03] border border-white/10">
          <h3 className="text-2xl font-bold text-white text-center mb-8">💍 {t('importantInfo')}</h3>
          <div className="grid md:grid-cols-2 gap-8 text-white/70">
            <div>
              <strong className="text-white block mb-3">✅ {t('allPacksInclude')}</strong>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />{t('packFeatures.dj')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />{t('packFeatures.sound')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />{t('packFeatures.setup')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />{t('packFeatures.soundcheck')}</li>
              </ul>
            </div>
            <div>
              <strong className="text-white block mb-3">💰 {t('paymentFacilities')}</strong>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />{t('paymentInfo.deposit')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />{t('paymentInfo.rest')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />{t('paymentInfo.noFees')}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA INTERMEDI ═══ */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <div className="p-10 rounded-3xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-center">
          <h3 className="text-3xl font-bold text-white mb-3">
            {t('heroTitle')}
          </h3>
          <p className="text-white/60 mb-8 max-w-md mx-auto">
            {t('heroSubtitle')}
          </p>
          <Link
            href="/configurador?service=bodas"
            onClick={() => trackServiceEvent('bodas_mid_cta', { position: 'mid' })}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-2xl hover:scale-105 transition-transform shadow-lg shadow-orange-500/25"
          >
            {t('configure')}
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ═══ ZONES DE COBERTURA ═══ */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-oe-gold/10 border border-oe-gold/30 mb-4">
            <MapPin className="w-4 h-4 text-oe-gold" />
            <span className="text-sm font-medium text-oe-gold">{t('coverage.badge')}</span>
          </div>
          <h3 className="text-2xl font-bold text-white">{t('coverage.title')}</h3>
          <p className="text-white/50 mt-2">{t('coverage.subtitle')}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {coverageZones.map((zone) => (
            <Link
              key={zone.href}
              href={zone.href}
              className="group p-4 rounded-xl bg-bg-surface border border-white/10 hover:border-oe-gold/50 transition-all text-center"
            >
              <div className="text-2xl mb-2">{zone.icon}</div>
              <div className="font-semibold text-white group-hover:text-oe-gold transition-colors">{zone.name}</div>
              <div className="text-xs text-white/50">{zone.desc}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
