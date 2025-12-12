"use client";
/**
 * AnimacionInfantilClient.tsx
 * ==================================
 * Pagina d'Animacio Infantil per a Orbita Events
 *
 * Serveis:
 * - Jocs i Activitats
 * - Pintacares
 * - Magia
 * - Globoflexia
 * - Tallers Creatius
 * - Musica Infantil
 */

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Gamepad2,
  Palette,
  Wand2,
  Heart,
  Scissors,
  Music,
  Star,
  Clock,
  Users,
  MapPin,
  ArrowRight,
  Check,
  PartyPopper,
  Sparkles
} from 'lucide-react';
import { useTranslations } from 'next-intl';

// Serveis d'animacio infantil (solo datos estaticos)
const SERVEIS_DATA = [
  { id: 'jocs', icon: Gamepad2, color: 'from-pink-500 to-rose-500', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/30' },
  { id: 'pintacares', icon: Palette, color: 'from-purple-500 to-violet-500', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30' },
  { id: 'magia', icon: Wand2, color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
  { id: 'globoflexia', icon: Heart, color: 'from-red-500 to-orange-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
  { id: 'tallers', icon: Scissors, color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' },
  { id: 'musica', icon: Music, color: 'from-amber-500 to-yellow-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
];

// Packs d'animacio (solo datos estaticos)
const PACKS_DATA = [
  { id: 'basic', hours: 2, price: 150, recommended: false },
  { id: 'complet', hours: 3, price: 220, recommended: true },
  { id: 'premium', hours: 4, price: 320, recommended: false },
];

// Info items con iconos
const INFO_ITEMS = [
  { id: 'experience', icon: Star },
  { id: 'ages', icon: Users },
  { id: 'punctuality', icon: Clock },
  { id: 'coverage', icon: MapPin },
];

export default function AnimacionInfantilClient() {
  const t = useTranslations('pages.animacion');
  const [selectedPack, setSelectedPack] = useState('complet');

  // URL de contacte
  const getContactUrl = (packId: string) => {
    const pack = PACKS_DATA.find(p => p.id === packId);
    const params = new URLSearchParams({
      servicio: 'animacion-infantil',
      pack: t(`packs.names.${packId}`),
      precio: pack?.price.toString() || '',
    });
    return `/contacto?${params.toString()}`;
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        {/* Background decoratiu */}
        <div className="absolute inset-0 bg-gradient-to-b from-pink-500/10 via-purple-500/5 to-transparent" />
        <div className="absolute top-20 left-10 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full border border-pink-500/30 mb-6">
              <PartyPopper className="w-5 h-5 text-pink-400" />
              <span className="text-pink-300 text-sm font-medium">{t('hero.badge')}</span>
            </div>

            {/* Titol */}
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              {t('hero.title')}
              <br />
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                {t('hero.titleHighlight')}
              </span>
            </h1>

            {/* Subtitol */}
            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
              {t('hero.subtitle')}
            </p>

            {/* CTA */}
            <Link
              href="/contacto?servicio=animacion-infantil"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-full shadow-lg hover:shadow-pink-500/30 transition-all hover:scale-105"
            >
              <Sparkles className="w-5 h-5" />
              {t('cta.button')}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Serveis */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('services.title')}
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            {t('services.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {SERVEIS_DATA.map((servei, idx) => {
            const Icon = servei.icon;

            return (
              <motion.div
                key={servei.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`p-6 rounded-2xl ${servei.bgColor} border ${servei.borderColor} hover:scale-105 transition-transform`}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${servei.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{t(`services.items.${servei.id}.title`)}</h3>
                <p className="text-white/60">{t(`services.items.${servei.id}.desc`)}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Packs */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('packs.title')}
          </h2>
          <p className="text-white/60">
            {t('packs.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PACKS_DATA.map((pack) => {
            const isSelected = selectedPack === pack.id;
            const features = t.raw(`packs.features.${pack.id}`) as string[];

            return (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`
                  relative p-6 rounded-2xl border-2 cursor-pointer transition-all
                  ${isSelected
                    ? 'border-pink-500 bg-pink-500/10 scale-105 shadow-lg shadow-pink-500/20'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                  }
                  ${pack.recommended ? 'ring-2 ring-pink-500/50' : ''}
                `}
                onClick={() => setSelectedPack(pack.id)}
              >
                {/* Badge recomanat */}
                {pack.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="px-4 py-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-xs font-bold text-white flex items-center gap-1">
                      <Star className="w-3 h-3" fill="currentColor" />
                      {t('packs.recommended')}
                    </div>
                  </div>
                )}

                {/* Contingut */}
                <div className="text-center pt-4">
                  <h3 className="text-2xl font-bold text-white mb-2">{t(`packs.names.${pack.id}`)}</h3>

                  {/* Hores */}
                  <div className="flex items-center justify-center gap-2 text-pink-300 mb-4">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">{pack.hours} {t('packs.hours')}</span>
                  </div>

                  {/* Preu */}
                  <div className="text-4xl font-bold text-white mb-6">
                    {pack.price}<span className="text-lg text-white/50">EUR</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6 text-left">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-white/70">
                        <Check className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href={getContactUrl(pack.id)}
                    className={`
                      w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                      ${isSelected
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:shadow-lg hover:shadow-pink-500/30'
                        : 'bg-white/10 text-white hover:bg-white/20'
                      }
                    `}
                  >
                    {t('cta.button')}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Info */}
      <section className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto p-8 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-3xl border border-pink-500/20">
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            {t('info.title')}
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {INFO_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-pink-400" />
                  </div>
                  <p className="text-white/80 pt-2">{t(`info.items.${item.id}`)}</p>
                </div>
              );
            })}
          </div>

          {/* CTA final */}
          <div className="text-center mt-8">
            <Link
              href="/contacto?servicio=animacion-infantil"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-full shadow-lg hover:shadow-pink-500/30 transition-all hover:scale-105"
            >
              <PartyPopper className="w-5 h-5" />
              {t('cta.button')}
            </Link>
            <p className="text-white/50 text-sm mt-3">{t('cta.info')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
