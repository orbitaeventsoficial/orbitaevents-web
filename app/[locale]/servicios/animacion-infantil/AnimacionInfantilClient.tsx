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
import { useTranslations, useLocale } from 'next-intl';

// Serveis d'animacio infantil
const SERVEIS = [
  {
    id: 'jocs',
    icon: Gamepad2,
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
  },
  {
    id: 'pintacares',
    icon: Palette,
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
  {
    id: 'magia',
    icon: Wand2,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  {
    id: 'globoflexia',
    icon: Heart,
    color: 'from-red-500 to-orange-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
  {
    id: 'tallers',
    icon: Scissors,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
  {
    id: 'musica',
    icon: Music,
    color: 'from-amber-500 to-yellow-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
];

// Packs d'animacio
const PACKS = [
  {
    id: 'basic',
    hours: 2,
    price: 150,
    features: ['1 animador/a', 'Jocs i activitats', 'Musica infantil', 'Material basic'],
    recommended: false,
  },
  {
    id: 'complet',
    hours: 3,
    price: 220,
    features: ['1 animador/a', 'Jocs i activitats', 'Pintacares O Globoflexia', 'Musica infantil', 'Material complet'],
    recommended: true,
  },
  {
    id: 'premium',
    hours: 4,
    price: 320,
    features: ['2 animadors', 'Jocs i activitats', 'Pintacares + Globoflexia', 'Espectacle de magia', 'Musica infantil', 'Tot el material'],
    recommended: false,
  },
];

export default function AnimacionInfantilClient() {
  const locale = useLocale();
  const t = useTranslations('animacion');
  const tCommon = useTranslations('common');
  const [selectedPack, setSelectedPack] = useState('complet');

  // Textos en ambdos idiomes
  const texts = {
    ca: {
      hero: {
        badge: 'Animacio Infantil Professional',
        title: 'Festes magiques',
        titleHighlight: 'per als mes petits',
        subtitle: 'Animadors professionals que fan que els nens gaudeixin al maxim. Jocs, magia, pintacares i molt mes!',
      },
      services: {
        title: 'Que oferim?',
        subtitle: 'Activitats adaptades a cada edat per garantir diversio i somriures',
        items: {
          jocs: { title: 'Jocs i Activitats', desc: 'Gimcanes, curses de sacs, jocs d\'aigua, competicions...' },
          pintacares: { title: 'Pintacares', desc: 'Dissenys creatius que encanten els nens.' },
          magia: { title: 'Magia', desc: 'Espectacles de magia adaptats a cada edat.' },
          globoflexia: { title: 'Globoflexia', desc: 'Figures de globus per a tots els gustos.' },
          tallers: { title: 'Tallers Creatius', desc: 'Manualitats, slime, polseres...' },
          musica: { title: 'Musica Infantil', desc: 'DJ amb musica adaptada i cancons de moda.' },
        },
      },
      packs: {
        title: 'Escull el teu pack',
        subtitle: 'Tots els packs inclouen desplacament fins a 25km de Granollers',
        hours: 'hores',
        recommended: 'MES POPULAR',
        features: {
          basic: ['1 animador/a', 'Jocs i activitats', 'Musica infantil', 'Material basic'],
          complet: ['1 animador/a', 'Jocs i activitats', 'Pintacares O Globoflexia', 'Musica infantil', 'Material complet'],
          premium: ['2 animadors', 'Jocs i activitats', 'Pintacares + Globoflexia', 'Espectacle de magia', 'Musica infantil', 'Tot el material'],
        },
        names: {
          basic: 'Pack Basic',
          complet: 'Pack Complet',
          premium: 'Pack Premium',
        },
      },
      cta: {
        button: 'Demana pressupost',
        info: 'Resposta en menys de 2 hores',
      },
      info: {
        title: 'Per que triar-nos?',
        items: [
          { icon: Star, text: 'Animadors amb experiencia i formacio' },
          { icon: Users, text: 'Adaptat a l\'edat dels nens (3-12 anys)' },
          { icon: Clock, text: 'Puntualitat i professionalitat' },
          { icon: MapPin, text: 'Barcelona i Girona - Desplacament inclos' },
        ],
      },
    },
    es: {
      hero: {
        badge: 'Animacion Infantil Profesional',
        title: 'Fiestas magicas',
        titleHighlight: 'para los mas pequenos',
        subtitle: 'Animadores profesionales que hacen que los ninos disfruten al maximo. Juegos, magia, pintacaras y mucho mas!',
      },
      services: {
        title: 'Que ofrecemos?',
        subtitle: 'Actividades adaptadas a cada edad para garantizar diversion y sonrisas',
        items: {
          jocs: { title: 'Juegos y Actividades', desc: 'Gymkanas, carreras de sacos, juegos de agua, competiciones...' },
          pintacares: { title: 'Pintacaras', desc: 'Disenos creativos que encantan a los ninos.' },
          magia: { title: 'Magia', desc: 'Espectaculos de magia adaptados a cada edad.' },
          globoflexia: { title: 'Globoflexia', desc: 'Figuras de globos para todos los gustos.' },
          tallers: { title: 'Talleres Creativos', desc: 'Manualidades, slime, pulseras...' },
          musica: { title: 'Musica Infantil', desc: 'DJ con musica adaptada y canciones de moda.' },
        },
      },
      packs: {
        title: 'Elige tu pack',
        subtitle: 'Todos los packs incluyen desplazamiento hasta 25km de Granollers',
        hours: 'horas',
        recommended: 'MAS POPULAR',
        features: {
          basic: ['1 animador/a', 'Juegos y actividades', 'Musica infantil', 'Material basico'],
          complet: ['1 animador/a', 'Juegos y actividades', 'Pintacaras O Globoflexia', 'Musica infantil', 'Material completo'],
          premium: ['2 animadores', 'Juegos y actividades', 'Pintacaras + Globoflexia', 'Espectaculo de magia', 'Musica infantil', 'Todo el material'],
        },
        names: {
          basic: 'Pack Basico',
          complet: 'Pack Completo',
          premium: 'Pack Premium',
        },
      },
      cta: {
        button: 'Pide presupuesto',
        info: 'Respuesta en menos de 2 horas',
      },
      info: {
        title: 'Por que elegirnos?',
        items: [
          { icon: Star, text: 'Animadores con experiencia y formacion' },
          { icon: Users, text: 'Adaptado a la edad de los ninos (3-12 anos)' },
          { icon: Clock, text: 'Puntualidad y profesionalidad' },
          { icon: MapPin, text: 'Barcelona y Girona - Desplazamiento incluido' },
        ],
      },
    },
  };

  const content = locale === 'ca' ? texts.ca : texts.es;

  // URL de contacte
  const getContactUrl = (packId: string) => {
    const pack = PACKS.find(p => p.id === packId);
    const params = new URLSearchParams({
      servicio: 'animacion-infantil',
      pack: content.packs.names[packId as keyof typeof content.packs.names] || packId,
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
              <span className="text-pink-300 text-sm font-medium">{content.hero.badge}</span>
            </div>

            {/* Titol */}
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              {content.hero.title}
              <br />
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                {content.hero.titleHighlight}
              </span>
            </h1>

            {/* Subtitol */}
            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
              {content.hero.subtitle}
            </p>

            {/* CTA */}
            <Link
              href="/contacto?servicio=animacion-infantil"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-full shadow-lg hover:shadow-pink-500/30 transition-all hover:scale-105"
            >
              <Sparkles className="w-5 h-5" />
              {content.cta.button}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Serveis */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {content.services.title}
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            {content.services.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {SERVEIS.map((servei, idx) => {
            const Icon = servei.icon;
            const item = content.services.items[servei.id as keyof typeof content.services.items];

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
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-white/60">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Packs */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {content.packs.title}
          </h2>
          <p className="text-white/60">
            {content.packs.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PACKS.map((pack) => {
            const isSelected = selectedPack === pack.id;
            const features = content.packs.features[pack.id as keyof typeof content.packs.features];
            const name = content.packs.names[pack.id as keyof typeof content.packs.names];

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
                      {content.packs.recommended}
                    </div>
                  </div>
                )}

                {/* Contingut */}
                <div className="text-center pt-4">
                  <h3 className="text-2xl font-bold text-white mb-2">{name}</h3>

                  {/* Hores */}
                  <div className="flex items-center justify-center gap-2 text-pink-300 mb-4">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">{pack.hours} {content.packs.hours}</span>
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
                    {content.cta.button}
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
            {content.info.title}
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {content.info.items.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-pink-400" />
                  </div>
                  <p className="text-white/80 pt-2">{item.text}</p>
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
              {content.cta.button}
            </Link>
            <p className="text-white/50 text-sm mt-3">{content.cta.info}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
