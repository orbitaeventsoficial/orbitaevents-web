"use client";

import { useMemo, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Link } from '@/lib/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Check, Star, ChevronRight, PartyPopper
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { getPacksByService, type PackDefinition } from '@/config/packs-config';
import { usePacks } from '@/lib/hooks/usePacks';
import { SITE_CONFIG } from '@/app/config/site-config';
import GuestRecommender from '@/app/components/ui/GuestRecommender';
import { TRUST_POINTS } from '@/lib/constants/services';
import { PUBLIC_SERVICE_ZONE_LINKS } from '@/lib/publicServiceZones';
import PublicServiceZonesSection from '@/app/components/public/PublicServiceZonesSection';
import PublicServiceMidCta from '@/app/components/public/PublicServiceMidCta';
import { trackPublicServiceEvent } from '@/app/lib/analytics';

export default function FiestasClient({ heroImage }: { heroImage: string }) {
  const t = useTranslations('pages.parties');
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const fallbackPacks = useMemo(() => getPacksByService('fiestas'), []);
  const { packs: fiestaPacks } = usePacks({
    service: 'fiestas',
    locale,
    fallback: fallbackPacks,
  });
  const minPrice = useMemo(
    () => fiestaPacks.length ? Math.min(...fiestaPacks.map(p => p.priceValue ?? 0)) : 0,
    [fiestaPacks]
  );
  const zoneCards = useMemo(
    () => PUBLIC_SERVICE_ZONE_LINKS.fiestas.map((zone) => ({
      id: zone.id,
      href: zone.href,
      icon: zone.icon,
      label: t(`zones.${zone.labelKey}`),
      description: t(`zones.${zone.descKey}`),
    })),
    [t]
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
    trackPublicServiceEvent('fiestas_pack_cta', {
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
            src={heroImage}
            alt="DJ Festes Privades Òrbita Events"
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
              <PartyPopper className="w-4 h-4 text-oe-gold" />
              <span className="text-sm font-bold text-oe-gold">{t('badge')}</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-display font-black text-white mb-5 leading-tight">
              {t('heroTitle')}
            </h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto mb-10">
              {t('heroSubtitle')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/configurador?service=fiestas"
                onClick={() => trackPublicServiceEvent('fiestas_hero_cta', { position: 'hero' })}
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
          packs={fiestaPacks}
          service="fiestas"
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
      <section className="max-w-6xl mx-auto px-4 pt-6 pb-16">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            {t('allPacks')}
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">{t('heroSubtitle')}</p>
        </motion.div>

        <div className={`grid gap-6 md:gap-8 ${fiestaPacks.length <= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
          {fiestaPacks.map((pack, i) => {
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
                relative p-7 rounded-2xl border transition-all duration-300 flex flex-col cursor-pointer group
                ${isSelected
                  ? 'bg-gradient-to-b from-amber-500/15 to-transparent border-amber-500/60 ring-2 ring-amber-500/40 scale-[1.02]'
                  : pack.popular
                  ? 'bg-gradient-to-b from-amber-500/10 to-transparent border-amber-500/40 ring-1 ring-amber-500/20 md:scale-[1.03] hover:shadow-lg hover:shadow-amber-500/10'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-lg hover:shadow-white/5'
                }
              `}
            >
              {/* Badge */}
              {pack.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                  pack.popular
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                    : 'bg-white/10 text-white/80 border border-white/15 backdrop-blur-sm'
                }`}>
                  {pack.badge}
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
              <div className="text-center mb-5">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{t('from')}</p>
                {pack.priceOriginal && (
                  <p className="text-white/30 text-lg line-through mb-0.5">{pack.priceOriginal}</p>
                )}
                <p className="text-4xl font-black text-oe-gold">{pack.price}</p>
              </div>

              {/* Quick specs */}
              <div className="space-y-2 text-sm text-white/50 mb-5 pb-5 border-b border-white/10">
                <div className="flex justify-between">
                  <span>⏰</span>
                  <span className="text-white/70 font-medium">{pack.duration}</span>
                </div>
                {pack.ideal && (
                  <div className="flex justify-between">
                    <span>👥</span>
                    <span className="text-white/70 font-medium">{pack.ideal}</span>
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-6 flex-1">
                {(pack.features || []).slice(0, 5).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-white/70">
                    <span className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-amber-400" />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA → Configurador */}
              <Link
                href={`/configurador?service=fiestas&packId=${pack.id}`}
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
          <h3 className="text-2xl font-bold text-white text-center mb-8">🎉 {t('importantInfo')}</h3>
          <div className="grid md:grid-cols-2 gap-8 text-white/70">
            <div>
              <strong className="text-white block mb-3">✅ {t('allPacksInclude')}</strong>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />{t('packFeatures.transport')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />{t('packFeatures.techDj')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />{t('packFeatures.setup')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />{t('packFeatures.insurance')}</li>
              </ul>
            </div>
            <div>
              <strong className="text-white block mb-3">🎨 {t('customization')}</strong>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />{t('customFeatures.theming')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />{t('customFeatures.decoration')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />{t('customFeatures.lightShow')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />{t('customFeatures.consultation')}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA INTERMEDI ═══ */}
      <PublicServiceMidCta
        title={t('heroTitle')}
        subtitle={t('heroSubtitle')}
        href="/configurador?service=fiestas"
        ctaLabel={t('configure')}
        onClick={() => trackPublicServiceEvent('fiestas_mid_cta', { position: 'mid' })}
      />

      {/* ═══ ZONES DE COBERTURA ═══ */}
      <PublicServiceZonesSection
        title={t('zones.title')}
        zones={zoneCards}
        columnsClassName="grid-cols-1 md:grid-cols-3"
      />
    </div>
  );
}

