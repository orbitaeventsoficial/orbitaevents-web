"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Link } from '@/lib/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Star, FileText, Zap,
  Users, Clock, TrendingUp, ChevronRight, Flame
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { getPacksByService, EXTRAS, type ExtraDefinition, type PackDefinition } from '@/config/packs-config';
import { usePacks } from '@/lib/hooks/usePacks';
import { filterCompatibleExtras } from '@/lib/extrasCompatibility';

interface ConfigState {
  selectedPack: PackDefinition | null;
  selectedExtras: Set<string>;
  numGuests: number;
  extraHours: number;
}

type AnalyticsValue = string | number | boolean | undefined;
type AnalyticsParams = Record<string, AnalyticsValue>;
type GtagWindow = Window & { gtag?: (command: 'event', action: string, params?: AnalyticsParams) => void };

function trackServiceEvent(action: string, params: AnalyticsParams) {
  if (typeof window === 'undefined') return;
  const gtag = (window as GtagWindow).gtag;
  if (!gtag) return;
  gtag('event', action, params);
}


export default function DiscomovilClientV2() {

  const t = useTranslations('pages.mobile');
  const locale = useLocale();
  const fallbackPacks = useMemo(() => getPacksByService('discomovil'), []);
  const { packs: discoPacks } = usePacks({
    service: 'discomovil',
    locale,
    fallback: fallbackPacks,
  });
  const [config, setConfig] = useState<ConfigState>({
    selectedPack: null,
    selectedExtras: new Set(),
    numGuests: 80,
    extraHours: 0,
  });
  const [extrasCatalog, setExtrasCatalog] = useState<ExtraDefinition[]>(EXTRAS);

  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadExtras() {
      try {
        const res = await fetch(`/api/public/extras?locale=${locale}`, { cache: 'no-store' });
        const data = await res.json();
        if (!active) return;
        if (Array.isArray(data?.extras)) {
          setExtrasCatalog(data.extras as ExtraDefinition[]);
        }
      } catch {
        // Fallback a EXTRAS del config
      }
    }

    loadExtras();
    return () => {
      active = false;
    };
  }, [locale]);

  const discoExtras = useMemo(() => filterCompatibleExtras(extrasCatalog, 'discomovil'), [extrasCatalog]);

  // Calcular total
  const packPrice = config.selectedPack?.priceValue || 0;
  const extrasPrice = Array.from(config.selectedExtras).reduce((sum, id) => {
    const extra = discoExtras.find(e => e.id === id);
    return sum + (extra?.price || 0);
  }, 0);
  const selectedPackAny = config.selectedPack as (PackDefinition & { extraHourPrice?: number }) | null;
  const extraHourUnitPrice = Number(selectedPackAny?.extraHourPrice || 100);
  const extraHoursPrice = config.extraHours * extraHourUnitPrice;
  const totalPrice = packPrice + extrasPrice + extraHoursPrice;

  // Descuento por 3+ extras (15%)
  const hasComboDiscount = config.selectedExtras.size >= 3;
  const discount = hasComboDiscount ? Math.round(extrasPrice * 0.15) : 0;
  const finalPrice = totalPrice - discount;

  // Mostrar summary cuando hay algo seleccionado
  useEffect(() => {
    setShowSummary(config.selectedPack !== null);
  }, [config.selectedPack]);

  // Recomendación según personas
  const getRecommendedPack = (): PackDefinition | null => {
    if (!discoPacks.length) return null;
    if (config.numGuests <= 80) return discoPacks[0] || null; // Básica
    if (config.numGuests <= 150) return discoPacks[1] || discoPacks[0] || null; // Premium
    return discoPacks[2] || discoPacks[discoPacks.length - 1] || null; // VIP
  };

  const recommendedPack = getRecommendedPack();

  // Seleccionar pack
  const selectPack = (pack: PackDefinition) => {
    setConfig(prev => ({ ...prev, selectedPack: pack }));
    
    trackServiceEvent('discomovil_pack_select', {
      pack_id: pack.id,
      pack_name: pack.name,
      price: pack.priceValue,
    });
  };

  // Toggle extra
  const toggleExtra = (extraId: string) => {
    setConfig(prev => {
      const newExtras = new Set(prev.selectedExtras);
      if (newExtras.has(extraId)) {
        newExtras.delete(extraId);
      } else {
        newExtras.add(extraId);
      }
      return { ...prev, selectedExtras: newExtras };
    });

    const extra = discoExtras.find(e => e.id === extraId);
    trackServiceEvent('discomovil_extra_toggle', {
      extra_id: extraId,
      extra_name: extra?.name,
      action: config.selectedExtras.has(extraId) ? 'remove' : 'add',
    });
  };

  // Ir al configurador con pack pre-seleccionado
  const goToConfigurator = () => {
    if (!config.selectedPack) return;

    const selectedExtrasIds = Array.from(config.selectedExtras).join(',');

    const params = new URLSearchParams({
      service: 'discomovil',
      packId: config.selectedPack.id,
      guests: config.numGuests.toString(),
      extras: selectedExtrasIds,
    });

    trackServiceEvent('discomovil_pack_to_configurator', {
      pack_id: config.selectedPack.id,
      num_extras: config.selectedExtras.size,
      num_guests: config.numGuests,
    });

    window.location.href = `/configurador?${params.toString()}`;
  };
  return (
    <div className="min-h-screen bg-bg-main">
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-bg-main z-10" />
          <Image
            src="/img/portfolio/discomovil/discomovil-01.avif"
            alt="Discomòvil Òrbita Events"
            fill
            priority
            sizes="100vw"
            quality={70}
            className="object-cover"
          />
        </div>

        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-oe-gold/10 border border-oe-gold/30 mb-6 backdrop-blur-sm">
            <Flame className="w-4 h-4 text-oe-gold" />
            <span className="text-sm font-bold text-oe-gold">{t('badgeYears')}</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-display font-black text-white mb-4">
            {t('heroTitle')}
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            {t('heroSubtitle')}
          </p>
        </div>
      </section>

      {/* Configurador de invitados */}
      <section className="max-w-5xl mx-auto px-4 mb-16">
        <div className="p-8 rounded-3xl bg-gradient-to-br from-bg-surface to-bg-card border border-oe-gold/30">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-oe-gold" />
            <h3 className="text-2xl font-bold text-text-primary">{t('guestsQuestion')}</h3>
          </div>

          <div className="text-center mb-8">
            <div className="text-7xl font-bold bg-gradient-to-r from-oe-gold to-red-400 bg-clip-text text-transparent">
              {config.numGuests}
            </div>
            <div className="text-text-muted mt-2">{t('people')}</div>
          </div>

          <input
            type="range"
            min="20"
            max="300"
            step="10"
            value={config.numGuests}
            onChange={(e) => setConfig(prev => ({ ...prev, numGuests: parseInt(e.target.value) }))}
            className="w-full h-3 rounded-full appearance-none cursor-pointer slider-custom"
          />
          <div className="flex justify-between text-sm text-text-muted mt-4">
            <span>20 {t('people')}</span>
            <span>300 {t('people')}</span>
          </div>

          {/* Recomendación */}
          {recommendedPack && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-oe-gold/20 rounded-xl border border-oe-gold/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-oe-gold" />
                <span className="font-bold text-oe-gold">{t('recommended')}</span>
              </div>
              <div className="text-lg text-text-primary">
                <strong>{recommendedPack.name}</strong> - {recommendedPack.priceValue}€
              </div>
              <p className="text-sm text-text-muted mt-1">{recommendedPack.tagline}</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Selector de packs */}
      <section className="max-w-7xl mx-auto px-4 mb-16">
        <h2 className="text-3xl font-bold text-text-primary text-center mb-12">
          {t('choosePack')}
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {discoPacks.map(pack => {
            const isSelected = config.selectedPack?.id === pack.id;
            const isRecommended = recommendedPack?.id === pack.id;

            return (
              <motion.div
                key={pack.id}
                layout
                className={`
                  relative p-6 rounded-2xl border-2 cursor-pointer transition-all
                  ${isSelected
                    ? 'border-oe-gold bg-oe-gold/10 shadow-lg shadow-oe-gold scale-105'
                    : pack.popular
                    ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20 scale-105'
                    : isRecommended
                    ? 'border-oe-gold bg-oe-gold/5'
                    : 'border bg-bg-surface hover:border-white/20 hover:bg-bg-card'
                  }
                `}
                onClick={() => selectPack(pack)}
              >
                {/* Badge Popular con glow fucsia */}
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="px-4 py-1 bg-gradient-to-r from-fuchsia-500 to-purple-500 rounded-full text-xs font-bold flex items-center gap-1 shadow-[0_0_20px_rgba(217,70,239,0.6)] animate-pulse">
                      <Star className="w-4 h-4" fill="currentColor" />
                      {t('mostPopular')}
                    </div>
                  </div>
                )}

                {/* Badge Recomendado */}
                {isRecommended && !pack.popular && (
                  <div className="absolute -top-3 right-4">
                    <div className="px-3 py-1 bg-oe-gold rounded-full text-xs font-bold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {t('recommendedBadge')}
                    </div>
                  </div>
                )}

                <div className="space-y-4 mt-4">
                  <div>
                    <h3 className="text-2xl font-bold text-text-primary">{pack.name}</h3>
                    <p className="text-sm text-text-muted">{pack.tagline}</p>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-oe-gold">
                      {pack.priceValue}€
                    </span>
                  </div>

                  <div className="text-sm text-text-muted">
                    👥 {pack.ideal || ''} · ⏰ {pack.duration}
                  </div>

                  <ul className="space-y-2 pt-4 border-t border-white/10">
                    {(pack.features || []).slice(0, 6).map((feature, idx) => (
                      <li key={idx} className="text-sm text-text-muted flex items-start gap-2">
                        <Check className="w-4 h-4 text-oe-gold flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className={`
                    w-full py-3 rounded-xl font-bold text-center transition-all
                    ${isSelected
                      ? 'bg-oe-gold text-text-primary'
                      : 'bg-bg-card text-text-primary hover:bg-white/20'
                    }
                  `}>
                    {isSelected ? `✓ ${t('selected')}` : t('select')}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Horas extra */}
      {config.selectedPack && (
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto px-4 mb-16"
        >
          <div className="p-8 rounded-3xl bg-gradient-to-br from-oe-gold/20 to-oe-gold/20 border border-oe-gold/30">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-oe-gold" />
              <h3 className="text-2xl font-bold text-text-primary">{t('extendParty')}</h3>
            </div>

            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={() => setConfig(prev => ({ ...prev, extraHours: Math.max(0, prev.extraHours - 1) }))}
                className="w-12 h-12 rounded-full bg-bg-card hover:bg-white/20 text-text-primary text-2xl font-bold transition-all disabled:opacity-30"
                disabled={config.extraHours === 0}
              >
                -
              </button>

              <div className="text-center min-w-[200px]">
                <div className="text-6xl font-bold text-oe-gold">
                  +{config.extraHours}h
                </div>
                <div className="text-sm text-text-muted mt-2">
                  {config.extraHours > 0 ? `+${extraHoursPrice}€` : t('noExtraHours')}
                </div>
              </div>

              <button
                onClick={() => setConfig(prev => ({ ...prev, extraHours: Math.min(3, prev.extraHours + 1) }))}
                className="w-12 h-12 rounded-full bg-bg-card hover:bg-white/20 text-text-primary text-2xl font-bold transition-all disabled:opacity-30"
                disabled={config.extraHours === 3}
              >
                +
              </button>
            </div>

            <div className="text-center text-sm text-text-muted">
              {extraHourUnitPrice}€ {t('perHour')} · {t('maxHours')}
            </div>
          </div>
        </motion.section>
      )}

      {/* Efectos especiales */}
      {config.selectedPack && (
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto px-4 mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              {t('addEffects')}
            </h2>
            <p className="text-text-muted">
              {t('extrasDiscount')} <span className="text-oe-gold font-bold">15%</span>
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {discoExtras.map(extra => {
              const isSelected = config.selectedExtras.has(extra.id);

              return (
                <motion.div
                  key={extra.id}
                  layout
                  className={`
                    relative p-6 rounded-2xl border-2 cursor-pointer transition-all
                    ${isSelected
                      ? 'border-oe-gold bg-oe-gold/10 shadow-lg shadow-oe-gold/20'
                      : 'border bg-bg-surface hover:border-white/20 hover:bg-bg-card'
                    }
                  `}
                  onClick={() => toggleExtra(extra.id)}
                >
                  {/* Checkbox */}
                  <div className="absolute top-4 right-4">
                    <div className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                      ${isSelected
                        ? 'border-oe-gold bg-oe-gold'
                        : 'border-oe-gold bg-transparent'
                      }
                    `}>
                      {isSelected && (
                        <Check className="w-4 h-4 text-text-primary" strokeWidth={3} />
                      )}
                    </div>
                  </div>

                  {/* Badge */}
                  {extra.popular && (
                    <div className="absolute -top-3 left-4">
                      <div className="px-2 py-1 bg-oe-gold rounded-full text-xs font-bold">
                        TOP
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 mt-4">
                    <div className="text-4xl mb-2">{extra.icon}</div>
                    <h4 className="text-lg font-bold text-text-primary pr-8">
                      {extra.name}
                    </h4>
                    <p className="text-sm text-text-muted">
                      {extra.description}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <span className="text-2xl font-bold text-oe-gold">
                        +{extra.price}€
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Descuento combo */}
          {hasComboDiscount && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-8 p-6 bg-gradient-to-r from-green-900/30 to-oe-gold/30 rounded-2xl border-2 border-green-500/50 text-center"
            >
              <Zap className="w-12 h-12 text-green-400 mx-auto mb-3" fill="currentColor" />
              <h3 className="text-2xl font-bold text-text-primary mb-2">
                {t('comboDiscount')}
              </h3>
              <p className="text-green-400 text-lg">
                {t('youSave')} <strong>{discount}€</strong> (15% {t('inEffects')})
              </p>
            </motion.div>
          )}
        </motion.section>
      )}

      {/* Sticky Summary */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-[100]
                     bg-black/95 backdrop-blur-xl
                     border-t-2 border-amber-500/40
                     shadow-[0_-10px_40px_rgba(0,0,0,0.8)]"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Info */}
                <div className="flex items-center gap-4 sm:gap-6 flex-wrap text-white">
                  <div>
                    <div className="text-xs sm:text-sm text-amber-500 font-semibold">
                      {config.selectedPack?.name || ''}
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-white/70 mt-1">
                      <span>{config.numGuests} {t('people')}</span>
                      {config.extraHours > 0 && (
                        <>
                          <span>•</span>
                          <span>+{config.extraHours}h</span>
                        </>
                      )}
                      {config.selectedExtras.size > 0 && (
                        <>
                          <span>•</span>
                          <span>{config.selectedExtras.size} {config.selectedExtras.size !== 1 ? t('effectsPlural') : t('effects')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="hidden sm:block h-12 w-px bg-white/20" />
                  <div>
                    {discount > 0 && (
                      <div className="text-xs sm:text-sm line-through text-white/60">{totalPrice}€</div>
                    )}
                    <div className="text-2xl sm:text-3xl font-bold text-amber-500">
                      {finalPrice}€
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={goToConfigurator}
                  className="
                    px-6 sm:px-8 py-3 sm:py-4
                    bg-amber-500 text-black rounded-full
                    font-bold text-sm sm:text-base flex items-center gap-2
                    hover:bg-amber-300 hover:shadow-2xl hover:shadow-amber-500/20
                    transition-all duration-300 hover:scale-105 active:scale-95
                    shadow-lg
                  "
                >
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">{t('continueToConfig')}</span>
                  <span className="sm:hidden">{t('configure')}</span>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info adicional */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="p-8 bg-bg-surface rounded-2xl border border-white/10">
          <h3 className="text-2xl font-bold text-text-primary mb-4">🎉 {t('partyIncludes')}</h3>
          <div className="grid md:grid-cols-2 gap-6 text-text-muted">
            <div>
              <strong className="text-text-primary">✅ {t('allPacksInclude')}</strong>
              <ul className="mt-2 space-y-1 ml-4 text-sm">
                <li>• {t('packFeatures.dj')}</li>
                <li>• {t('packFeatures.setup')}</li>
                <li>• {t('packFeatures.backup')}</li>
                <li>• {t('packFeatures.playlist')}</li>
              </ul>
            </div>
            <div>
              <strong className="text-text-primary">💰 {t('flexiblePayment')}</strong>
              <ul className="mt-2 space-y-1 ml-4 text-sm">
                <li>• {t('paymentFeatures.deposit')}</li>
                <li>• {t('paymentFeatures.rest')}</li>
                <li>• {t('paymentFeatures.cancel')}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Zonas de cobertura */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-text-primary text-center mb-8">
          Discomóvil por zonas de Catalunya
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/servicios/discomovil-barcelona"
            className="group p-4 rounded-xl bg-bg-surface border border-white/10 hover:border-oe-gold/50 transition-all text-center"
          >
            <div className="text-2xl mb-2">🏙️</div>
            <div className="font-semibold text-text-primary text-sm">Discomóvil Barcelona</div>
            <div className="text-xs text-text-muted mt-1">Ciudad y área metropolitana</div>
          </Link>
          <Link
            href="/servicios/discomovil-maresme"
            className="group p-4 rounded-xl bg-bg-surface border border-white/10 hover:border-oe-gold/50 transition-all text-center"
          >
            <div className="text-2xl mb-2">🏖️</div>
            <div className="font-semibold text-text-primary text-sm">Discomóvil Maresme</div>
            <div className="text-xs text-text-muted mt-1">Mataró, Calella, Pineda</div>
          </Link>
          <Link
            href="/servicios/discomovil-girona"
            className="group p-4 rounded-xl bg-bg-surface border border-white/10 hover:border-oe-gold/50 transition-all text-center"
          >
            <div className="text-2xl mb-2">🏛️</div>
            <div className="font-semibold text-text-primary text-sm">Discomóvil Girona</div>
            <div className="text-xs text-text-muted mt-1">Girona, Empordà, Costa Brava</div>
          </Link>
          <Link
            href="/servicios/discomovil-valles"
            className="group p-4 rounded-xl bg-bg-surface border border-white/10 hover:border-oe-gold/50 transition-all text-center"
          >
            <div className="text-2xl mb-2">🏡</div>
            <div className="font-semibold text-text-primary text-sm">Discomóvil Vallès</div>
            <div className="text-xs text-text-muted mt-1">Granollers, Sabadell, Terrassa</div>
          </Link>
        </div>
      </section>
    </div>
  );
}






