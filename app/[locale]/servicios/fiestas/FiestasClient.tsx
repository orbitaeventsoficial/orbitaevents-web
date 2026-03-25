'use client';


import { useState, useEffect, useMemo } from 'react';
import { Link } from '@/lib/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Zap, FileText, Star, TrendingUp, ArrowRight, Check, PartyPopper } from 'lucide-react';
import { useLocale, useMessages, useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  getPacksByService,
  OFERTA_FLASH,
  type PackDefinition
} from '@/config/packs-config';
import { usePacks } from '@/lib/hooks/usePacks';

type AnalyticsValue = string | number | boolean | undefined;
type AnalyticsParams = Record<string, AnalyticsValue>;
type GtagWindow = Window & { gtag?: (command: 'event', action: string, params?: AnalyticsParams) => void };

function trackServiceEvent(action: string, params: AnalyticsParams) {
  if (typeof window === 'undefined') return;
  const gtag = (window as GtagWindow).gtag;
  if (!gtag) return;
  gtag('event', action, params);
}


export default function FiestasClient() {
  const t = useTranslations('pages.parties');
  const messages = useMessages();
  const locale = useLocale();
  const fallbackPacks = useMemo(() => getPacksByService('fiestas'), []);
  const fallbackDiscoPacks = useMemo(() => getPacksByService('discomovil'), []);
  const { packs: fiestaPacks } = usePacks({
    service: 'fiestas',
    locale,
    fallback: fallbackPacks,
  });
  const { packs: discomovilPacks } = usePacks({
    service: 'discomovil',
    locale,
    fallback: fallbackDiscoPacks,
  });
  const [numGuests, setNumGuests] = useState(60);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [showRecommendation, setShowRecommendation] = useState(false);

  const allPacks = useMemo(() => {
    const merged = [...fiestaPacks, ...discomovilPacks];
    const deduped = new Map<string, PackDefinition>();
    for (const pack of merged) {
      if (!deduped.has(pack.id)) deduped.set(pack.id, pack);
    }
    return Array.from(deduped.values());
  }, [fiestaPacks, discomovilPacks]);



  const flashPack = allPacks.find((pack) => pack.isFlash);
  const regularPacks = allPacks.filter(p => !p.isFlash);

  const recommendedPack = (() => {
    const eligible = regularPacks.filter((pack) => {
      const min = pack.capacidadMinima ?? 0;
      const max = pack.capacidadMaxima ?? Infinity;
      return numGuests >= min && numGuests <= max;
    });
    return eligible.find((pack) => pack.popular) || eligible[0] || regularPacks[0] || null;
  })();

  // Actualizar recomendación cuando cambian los invitados
  useEffect(() => {
    if (recommendedPack) {
      setShowRecommendation(true);
      const timer = setTimeout(() => {
        if (!selectedPack) {
          setSelectedPack(recommendedPack.id);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [numGuests, recommendedPack, selectedPack]);

  // Analytics al cambiar número de invitados
  const handleGuestsChange = (value: number) => {
    setNumGuests(value);
    trackServiceEvent('guests_slider_change', {
      num_guests: value,
    });
  };

  // Generar URL del formulario con parámetros
  const getContactUrl = (pack: PackDefinition) => {
    const params = new URLSearchParams({
      servicio: 'fiestas',
      pack: pack.name,
      precio: pack.priceValue.toString(),
      invitados: numGuests.toString(),
    });
    return `/contacto?${params.toString()}`;
  };

  // ¿El usuario puede acceder a la oferta flash?
  const flashMaxGuests = flashPack?.capacidadMaxima ?? OFERTA_FLASH.maxInvitados;
  const canUseFlashOffer = numGuests <= flashMaxGuests;

  return (
    <div className="min-h-screen bg-bg-main">
      {/* HERO with background image */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-bg-main z-10" />
          <Image
            src="/img/portfolio/fiestas-privadas/fiestas-privadas-01.avif"
            alt="DJ para fiestas privadas Òrbita Events"
            fill
            priority
            sizes="100vw"
            quality={70}
            className="object-cover"
          />
        </div>

        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 mb-6 backdrop-blur-sm">
            <PartyPopper className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-amber-400">{t('badge')}</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-display font-black text-white mb-4">
            {t('heroTitle')}
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            {t('heroSubtitle')}
          </p>
        </div>
      </section>

      <div className="space-y-12 max-w-6xl mx-auto">
      {/* Configurador de invitados */}
      <div className="max-w-3xl mx-auto p-8 bg-gradient-to-br from-[#111111] to-[#161616] rounded-3xl border border-amber-500/30">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-amber-400" />
          <h3 className="text-2xl font-bold">{t('guestsQuestion')}</h3>
        </div>

        {/* Número grande */}
        <div className="text-center mb-8">
          <div className="text-7xl font-bold bg-gradient-to-r from-amber-500 to-amber-300 bg-clip-text text-transparent">
            {numGuests}
          </div>
          <div className="text-white/65 mt-2">{t('people')}</div>
        </div>

        {/* Slider */}
        <div className="space-y-4">
          <input
            type="range"
            min="20"
            max="200"
            step="5"
            value={numGuests}
            onChange={(e) => handleGuestsChange(parseInt(e.target.value))}
            className="w-full h-3 rounded-full appearance-none cursor-pointer slider-custom"
          />
          <div className="flex justify-between text-sm text-white/65">
            <span>20 {t('people')}</span>
            <span>200 {t('people')}</span>
          </div>
        </div>

        {/* Indicador de oferta flash disponible */}
        {canUseFlashOffer && flashPack && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-amber-500/20 rounded-xl border border-amber-500/50"
          >
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Zap className="w-5 h-5" fill="currentColor" />
              {t('flashAccess')} {(flashPack ? flashPack.name : OFERTA_FLASH.nombre)}!
            </div>
            <p className="text-sm text-white/65 mt-1">
              {t('upToGuests', { max: flashMaxGuests })} {flashPack?.flashDiscount ?? OFERTA_FLASH.descuentoPorcentaje}% {t('discount')}
            </p>
          </motion.div>
        )}

        {/* Recomendación de pack regular */}
        <AnimatePresence>
          {showRecommendation && recommendedPack && !canUseFlashOffer && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 p-4 bg-purple-500/20 rounded-xl border border-purple-500/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <span className="font-bold text-purple-300">{t('recommendedFor', { guests: numGuests })}</span>
              </div>
              <div className="text-lg">
                <strong>{recommendedPack.name}</strong> - {recommendedPack.price}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Oferta Flash - DESTACADA (Solo si es elegible) */}
      {flashPack && canUseFlashOffer && (
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="relative p-8 rounded-3xl border-4 border-amber-500 bg-gradient-to-br from-amber-500/10 to-amber-600/20 shadow-2xl shadow-amber-500/30"
          >
            {/* Badge Flash */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-300 text-black rounded-full font-bold flex items-center gap-2 shadow-lg animate-pulse">
                <Zap className="w-5 h-5" fill="currentColor" />
                {flashPack.badge}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mt-4">
              {/* Info */}
              <div className="space-y-4">
                <h3 className="text-4xl font-bold">{flashPack.name}</h3>
                <p className="text-xl text-white/65">{flashPack.tagline}</p>

                {/* Precio */}
                <div className="flex items-baseline gap-4">
                  <div className="text-5xl font-bold text-amber-300">
                    {flashPack.price}
                  </div>
                  {flashPack.priceOriginal && (
                    <div className="text-2xl text-gray-300 line-through">
                      {flashPack.priceOriginal}
                    </div>
                  )}
                </div>

                {/* Ahorro */}
                {flashPack.priceOriginalValue && (
                  <div className="inline-block px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg">
                    <span className="text-green-400 font-bold">
                      {t('youSave')} {flashPack.priceOriginalValue - flashPack.priceValue}€ ({flashPack.flashDiscount}% OFF)
                    </span>
                  </div>
                )}

                {/* Rango */}
                <div className="text-white/65">
                  📊 {t('idealFor')} {flashPack.capacidadMinima}-{flashPack.capacidadMaxima} {t('people')}
                </div>
              </div>

              {/* Features + CTA */}
              <div className="space-y-6">
                <ul className="space-y-3">
                  {(flashPack.features || []).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-amber-300" />
                      </div>
                      <span className="text-white/65">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={getContactUrl(flashPack)}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-300 text-black rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-amber-500/40 transition-all hover:scale-105"
                >
                  <FileText className="w-5 h-5" />
                  {t('checkAvailability')}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Resto de packs */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-center mb-8">{t('allPacks')}</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regularPacks.map(pack => {
            const isSelected = selectedPack === pack.id;
            const isRecommended = recommendedPack?.id === pack.id;
            const isInRange = numGuests >= (pack.capacidadMinima || 0) &&
                             numGuests <= (pack.capacidadMaxima || Infinity);

            return (
              <motion.div
                key={pack.id}
                layout
                className={`
                  relative p-6 rounded-2xl border-2 cursor-pointer
                  transition-all duration-300
                  ${isSelected
                    ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20 scale-105'
                    : isRecommended
                    ? 'border-amber-500 bg-amber-500/5'
                    : 'border-white/10 bg-[#111111] hover:border-white/20 hover:bg-[#161616]'
                  }
                  ${!isInRange ? 'opacity-50' : ''}
                `}
                onClick={() => setSelectedPack(pack.id)}
              >
                {/* Badge Popular */}
                {pack.popular && (
                  <div className="absolute -top-3 right-4">
                    <div className="px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-xs font-bold flex items-center gap-1">
                      <Star className="w-3 h-3" fill="currentColor" />
                      {t('mostSold')}
                    </div>
                  </div>
                )}

                {/* Badge Recomendado */}
                {isRecommended && isInRange && (
                  <div className="absolute -top-3 left-4">
                    <div className="px-3 py-1 bg-amber-500 text-black rounded-full text-xs font-bold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {t('recommended')}
                    </div>
                  </div>
                )}

                {/* Contenido */}
                <div className="space-y-4 mt-4">
                  <div>
                    <h3 className="text-2xl font-bold">{pack.name}</h3>
                    <p className="text-sm text-white/65">{pack.tagline}</p>
                  </div>

                  {/* Precio */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-amber-400">
                      {pack.price}
                    </span>
                  </div>

                  {/* Duración */}
                  <div className="text-sm text-amber-300 font-medium">
                    ⏱️ {pack.duration}
                  </div>

                  {/* Rango */}
                  {pack.capacidadMinima && pack.capacidadMaxima && (
                    <div className="text-sm text-white/65">
                      📊 {pack.capacidadMinima}-{pack.capacidadMaxima} {t('people')}
                    </div>
                  )}

                  {/* Features */}
                  <ul className="space-y-2 pt-4 border-t border-white/10">
                    {(pack.features || []).slice(0, 5).map((feature, idx) => (
                      <li key={idx} className="text-sm text-white/65 flex items-start gap-2">
                        <span className="text-amber-400 flex-shrink-0">✓</span>
                        {feature}
                      </li>
                    ))}
                    {(pack.features || []).length > 5 && (
                      <li className="text-sm text-amber-400">
                        +{(pack.features || []).length - 5} {t('more')}
                      </li>
                    )}
                  </ul>

                  {/* CTA - Formulario */}
                  <Link
                    href={getContactUrl(pack)}
                    onClick={(e) => e.stopPropagation()}
                    className={`
                      w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2
                      transition-all
                      ${isSelected
                        ? 'bg-purple-500 text-white hover:bg-purple-600'
                        : 'bg-[#161616] text-white hover:bg-white/20'
                      }
                    `}
                  >
                    <FileText className="w-4 h-4" />
                    {t('requestInfo')}
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Info adicional */}
      <div className="mt-16 p-8 bg-[#111111] rounded-2xl border border-white/10 max-w-4xl mx-auto">
        <h3 className="text-2xl font-bold mb-4">💡 {t('importantInfo')}</h3>
        <div className="grid md:grid-cols-2 gap-6 text-white/65">
          <div>
            <strong className="text-white">✅ {t('allPacksInclude')}</strong>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• {t('packFeatures.transport')}</li>
              <li>• {t('packFeatures.techDj')}</li>
              <li>• {t('packFeatures.setup')}</li>
              <li>• {t('packFeatures.insurance')}</li>
            </ul>
          </div>
          <div>
            <strong className="text-white">🎨 {t('customization')}</strong>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• {t('customFeatures.theming')}</li>
              <li>• {t('customFeatures.decoration')}</li>
              <li>• {t('customFeatures.lightShow')}</li>
              <li>• {t('customFeatures.consultation')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Zonas de cobertura */}
      <div className="max-w-5xl mx-auto px-4 pb-8">
        <h2 className="text-2xl font-bold text-center mb-8">
          {t('zones.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/servicios/dj-fiestas-barcelona"
            className="group p-4 rounded-xl bg-[#111111] border border-white/10 hover:border-amber-500/50 transition-all text-center"
          >
            <div className="text-2xl mb-2">🏙️</div>
            <div className="font-semibold text-white text-sm">{t('zones.barcelona.name')}</div>
            <div className="text-xs text-white/65 mt-1">{t('zones.barcelona.desc')}</div>
          </Link>
          <Link
            href="/servicios/dj-fiestas-maresme"
            className="group p-4 rounded-xl bg-[#111111] border border-white/10 hover:border-amber-500/50 transition-all text-center"
          >
            <div className="text-2xl mb-2">🏖️</div>
            <div className="font-semibold text-white text-sm">{t('zones.maresme.name')}</div>
            <div className="text-xs text-white/65 mt-1">{t('zones.maresme.desc')}</div>
          </Link>
          <Link
            href="/servicios/dj-fiestas-costa-brava"
            className="group p-4 rounded-xl bg-[#111111] border border-white/10 hover:border-amber-500/50 transition-all text-center"
          >
            <div className="text-2xl mb-2">🌊</div>
            <div className="font-semibold text-white text-sm">{t('zones.costaBrava.name')}</div>
            <div className="text-xs text-white/65 mt-1">{t('zones.costaBrava.desc')}</div>
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
}

