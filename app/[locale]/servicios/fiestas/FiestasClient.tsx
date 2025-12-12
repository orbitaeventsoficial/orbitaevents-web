"use client";
/**
 * FiestasClient.tsx - VERSIÓN LIMPIA
 * ==================================
 * 
 * REGLAS:
 * - TODO sale de packs-config.ts
 * - CTAs llevan al formulario de contacto (NO WhatsApp)
 * - Oferta Flash configurada en packs-config
 * 
 * @author Manolo - Arquitecto Digital
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Zap, FileText, Star, TrendingUp, ArrowRight, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  getPacksByService,
  getRecommendedPack,
  getOfertaFlash,
  OFERTA_FLASH,
  type PackDefinition
} from '@/config/packs-config';

export default function FiestasClient() {
  const t = useTranslations('pages.parties');
  const [numGuests, setNumGuests] = useState(60);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [showRecommendation, setShowRecommendation] = useState(false);

  // Obtener packs desde config
  const allPacks = getPacksByService('fiestas');
  const flashPack = getOfertaFlash();
  const regularPacks = allPacks.filter(p => !p.isFlash);

  // Obtener pack recomendado
  const recommendedPack = getRecommendedPack(numGuests, 'fiestas');

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
    
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'guests_slider_change', {
        num_guests: value,
      });
    }
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
  const canUseFlashOffer = numGuests <= OFERTA_FLASH.maxInvitados;

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold">
          {t('heroTitle')}
        </h1>
        <p className="text-xl text-text-muted max-w-2xl mx-auto">
          {t('heroSubtitle')}
        </p>
      </div>

      {/* Configurador de invitados */}
      <div className="max-w-3xl mx-auto p-8 bg-gradient-to-br from-bg-surface to-bg-card rounded-3xl border border-oe-gold/30">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-oe-gold" />
          <h3 className="text-2xl font-bold">{t('guestsQuestion')}</h3>
        </div>

        {/* Número grande */}
        <div className="text-center mb-8">
          <div className="text-7xl font-bold bg-gradient-to-r from-oe-gold to-oe-gold-light bg-clip-text text-transparent">
            {numGuests}
          </div>
          <div className="text-text-muted mt-2">{t('people')}</div>
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
          <div className="flex justify-between text-sm text-text-muted">
            <span>20 {t('people')}</span>
            <span>200 {t('people')}</span>
          </div>
        </div>

        {/* Indicador de oferta flash disponible */}
        {canUseFlashOffer && flashPack && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-oe-gold/20 rounded-xl border border-oe-gold/50"
          >
            <div className="flex items-center gap-2 text-oe-gold-light font-bold">
              <Zap className="w-5 h-5" fill="currentColor" />
              {t('flashAccess')} {OFERTA_FLASH.nombre}!
            </div>
            <p className="text-sm text-text-muted mt-1">
              {t('upToGuests', { max: OFERTA_FLASH.maxInvitados })} {OFERTA_FLASH.descuentoPorcentaje}% {t('discount')}
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
            className="relative p-8 rounded-3xl border-4 border-oe-gold bg-gradient-to-br from-oe-gold/10 to-oe-gold-dark/20 shadow-2xl shadow-oe-gold/30"
          >
            {/* Badge Flash */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="px-6 py-2 bg-gradient-to-r from-oe-gold to-oe-gold-light text-black rounded-full font-bold flex items-center gap-2 shadow-lg animate-pulse">
                <Zap className="w-5 h-5" fill="currentColor" />
                {flashPack.badge}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mt-4">
              {/* Info */}
              <div className="space-y-4">
                <h3 className="text-4xl font-bold">{flashPack.name}</h3>
                <p className="text-xl text-text-muted">{flashPack.tagline}</p>

                {/* Precio */}
                <div className="flex items-baseline gap-4">
                  <div className="text-5xl font-bold text-oe-gold-light">
                    {flashPack.price}
                  </div>
                  {flashPack.priceOriginal && (
                    <div className="text-2xl text-gray-500 line-through">
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
                <div className="text-text-muted">
                  📊 {t('idealFor')} {flashPack.capacidadMinima}-{flashPack.capacidadMaxima} {t('people')}
                </div>
              </div>

              {/* Features + CTA */}
              <div className="space-y-6">
                <ul className="space-y-3">
                  {flashPack.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-oe-gold/20 border border-oe-gold flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-oe-gold-light" />
                      </div>
                      <span className="text-text-muted">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={getContactUrl(flashPack)}
                  className="w-full py-4 bg-gradient-to-r from-oe-gold to-oe-gold-light text-black rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-amber-500/40 transition-all hover:scale-105"
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
                    ? 'border-oe-gold bg-oe-gold/5'
                    : 'border-border bg-bg-surface hover:border-white/20 hover:bg-bg-card'
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
                    <div className="px-3 py-1 bg-oe-gold text-black rounded-full text-xs font-bold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {t('recommended')}
                    </div>
                  </div>
                )}

                {/* Contenido */}
                <div className="space-y-4 mt-4">
                  <div>
                    <h3 className="text-2xl font-bold">{pack.name}</h3>
                    <p className="text-sm text-text-muted">{pack.tagline}</p>
                  </div>

                  {/* Precio */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-oe-gold">
                      {pack.price}
                    </span>
                  </div>

                  {/* Duración */}
                  <div className="text-sm text-oe-gold-light font-medium">
                    ⏱️ {pack.duration}
                  </div>

                  {/* Rango */}
                  {pack.capacidadMinima && pack.capacidadMaxima && (
                    <div className="text-sm text-text-muted">
                      📊 {pack.capacidadMinima}-{pack.capacidadMaxima} {t('people')}
                    </div>
                  )}

                  {/* Features */}
                  <ul className="space-y-2 pt-4 border-t border-border">
                    {pack.features.slice(0, 5).map((feature, idx) => (
                      <li key={idx} className="text-sm text-text-muted flex items-start gap-2">
                        <span className="text-oe-gold flex-shrink-0">✓</span>
                        {feature}
                      </li>
                    ))}
                    {pack.features.length > 5 && (
                      <li className="text-sm text-oe-gold">
                        +{pack.features.length - 5} {t('more')}
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
                        : 'bg-bg-card text-white hover:bg-white/20'
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
      <div className="mt-16 p-8 bg-bg-surface rounded-2xl border border-border max-w-4xl mx-auto">
        <h3 className="text-2xl font-bold mb-4">💡 {t('importantInfo')}</h3>
        <div className="grid md:grid-cols-2 gap-6 text-text-muted">
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
    </div>
  );
}
