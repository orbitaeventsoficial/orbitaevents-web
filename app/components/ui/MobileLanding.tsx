'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Link } from '@/lib/navigation';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

// ═══════════════════════════════════════════════════════════════════════════
// DADES - Les fotos reals d'Òrbita
// ═══════════════════════════════════════════════════════════════════════════

const HERO_SLIDES = [
  {
    image: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.jpg',
    tagKey: 'halloween',
    emoji: '🎃',
  },
  {
    image: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-01.webp',
    tagKey: 'monMagic',
    emoji: '🧙‍♂️',
  },
  {
    image: '/img/portfolio/bodas/bodas-01.webp',
    tagKey: 'bodes',
    emoji: '💒',
  },
];

const GALERIA_IMPACTE = [
  // Halloween
  { src: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-02.webp', cat: 'halloween' },
  { src: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-03.webp', cat: 'halloween' },
  { src: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-04.webp', cat: 'halloween' },
  { src: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-05.webp', cat: 'halloween' },
  // Món Màgic
  { src: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-02.webp', cat: 'monmagic' },
  { src: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-03.webp', cat: 'monmagic' },
  { src: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-04.webp', cat: 'monmagic' },
  { src: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-05.webp', cat: 'monmagic' },
  // Bodes
  { src: '/img/portfolio/bodas/bodas-02.webp', cat: 'bodes' },
  { src: '/img/portfolio/bodas/bodas-03.webp', cat: 'bodes' },
  { src: '/img/portfolio/bodas/bodas-04.webp', cat: 'bodes' },
  // Festes
  { src: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.webp', cat: 'festes' },
  { src: '/img/portfolio/fiestas-privadas/fiestas-privadas-02.webp', cat: 'festes' },
];

const TESTIMONIS_IMAGES = [
  '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-06.webp',
  '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-06.webp',
  '/img/portfolio/eventos-empresa/eventos-empresa-01.webp',
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function MobileLanding() {
  const t = useTranslations('mobileLanding');

  return (
    <main className="bg-black min-h-screen overflow-x-hidden">
      {/* CAPÍTOL 1: L'IMPACTE */}
      <HeroImpacte t={t} />

      {/* CAPÍTOL 2: LA PROMESA */}
      <LaPromesa t={t} />

      {/* CAPÍTOL 3: ELS MONS (Tematitzacions) */}
      <ElsMons t={t} />

      {/* CAPÍTOL 4: LES PROVES (Galeria) */}
      <LesProves t={t} />

      {/* CAPÍTOL 5: LES VEUS (Testimonis) */}
      <LesVeus t={t} />

      {/* CAPÍTOL 6: EL MOMENT (CTA) */}
      <ElMoment t={t} />

      {/* Botó WhatsApp flotant */}
      <WhatsAppFlotant />
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CAPÍTOL 1: L'IMPACTE
// Una imatge que para el món. Sense paraules innecessàries.
// ═══════════════════════════════════════════════════════════════════════════

function HeroImpacte({ t }: { t: (key: string) => string }) {
  const [current, setCurrent] = useState(0);
  const [touchStart, setTouchStart] = useState(0);

  // Auto-avança cada 4 segons
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Swipe per canviar
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setCurrent((prev) => (prev + 1) % HERO_SLIDES.length);
      } else {
        setCurrent((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
      }
    }
  };

  return (
    <section
      className="relative h-[100svh] w-full"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Imatge de fons */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <Image
            src={HERO_SLIDES[current].image}
            alt={t(`heroSlides.${HERO_SLIDES[current].tagKey}`)}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

      {/* Contingut - A BAIX, com Instagram Stories */}
      <div className="absolute inset-x-0 bottom-0 p-6 pb-12 safe-area-inset-bottom">
        {/* Tag */}
        <motion.div
          key={`tag-${current}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white">
            <span className="text-xl">{HERO_SLIDES[current].emoji}</span>
            <span className="font-medium">{t(`heroSlides.${HERO_SLIDES[current].tagKey}`)}</span>
          </span>
        </motion.div>

        {/* Títol */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4"
        >
          {t('hero.title1')}
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
            {t('hero.title2')}
          </span>
        </motion.h1>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link
            href="#mons"
            className="inline-flex items-center gap-2 text-white/80 font-medium"
          >
            <span>{t('hero.cta')}</span>
            <motion.span
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ↓
            </motion.span>
          </Link>
        </motion.div>
      </div>

      {/* Indicadors de slide - Estil Stories */}
      <div className="absolute top-4 inset-x-4 flex gap-1 safe-area-inset-top">
        {HERO_SLIDES.map((_, idx) => (
          <div key={idx} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
            {idx === current && (
              <motion.div
                className="h-full bg-white"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 4, ease: 'linear' }}
              />
            )}
            {idx < current && <div className="h-full w-full bg-white" />}
          </div>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CAPÍTOL 2: LA PROMESA
// Què fem diferent? En una frase. Sense rotllo.
// ═══════════════════════════════════════════════════════════════════════════

function LaPromesa({ t }: { t: (key: string) => string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.3], [50, 0]);

  return (
    <section ref={ref} className="py-20 px-6 bg-black">
      <motion.div style={{ opacity, y }} className="max-w-lg mx-auto text-center">
        <p className="text-white/60 text-sm uppercase tracking-widest mb-4">
          {t('promesa.sectionTitle')}
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-6">
          {t('promesa.title1')}
          <br />
          <span className="text-amber-400">{t('promesa.title2')}</span>
        </h2>
        <p className="text-white/60 text-lg">
          {t('promesa.description')}
        </p>
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CAPÍTOL 3: ELS MONS
// Les tematitzacions - El diferencial visual
// ═══════════════════════════════════════════════════════════════════════════

function ElsMons({ t }: { t: (key: string) => string }) {
  const [activeMon, setActiveMon] = useState<'halloween' | 'monmagic'>('halloween');

  const mons = {
    halloween: {
      emoji: '🎃',
      color: 'from-orange-600 to-red-900',
      images: [
        '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.jpg',
        '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-02.webp',
        '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-03.webp',
        '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-04.webp',
      ],
    },
    monmagic: {
      emoji: '🧙‍♂️',
      color: 'from-amber-600 to-red-800',
      images: [
        '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-01.webp',
        '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-02.webp',
        '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-03.webp',
        '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-04.webp',
      ],
    },
  };

  const mon = mons[activeMon];

  return (
    <section id="mons" className="py-16 bg-neutral-950">
      <div className="px-6 mb-8">
        <p className="text-white/60 text-sm uppercase tracking-widest mb-2">
          {t('elsMons.sectionTitle')}
        </p>
        <h2 className="text-3xl font-black text-white">
          {t('elsMons.title')} <span className="text-amber-400">{t('elsMons.titleHighlight')}</span>
        </h2>
      </div>

      {/* Selector de món */}
      <div className="flex gap-3 px-6 mb-6 overflow-x-auto pb-2">
        {(Object.keys(mons) as Array<keyof typeof mons>).map((key) => (
          <button
            key={key}
            onClick={() => setActiveMon(key)}
            className={`flex-shrink-0 px-5 py-3 rounded-full font-bold transition-all ${
              activeMon === key
                ? `bg-gradient-to-r ${mons[key].color} text-white`
                : 'bg-white/10 text-white/60'
            }`}
          >
            {mons[key].emoji} {t(`elsMons.${key}.nom`)}
          </button>
        ))}
      </div>

      {/* Galeria horitzontal swipeable */}
      <div className="overflow-x-auto snap-x snap-mandatory scrollbar-hide">
        <div className="flex gap-4 px-6 pb-4" style={{ width: 'max-content' }}>
          {mon.images.map((img, idx) => (
            <motion.div
              key={`${activeMon}-${idx}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="snap-center flex-shrink-0"
            >
              <div className="relative w-[280px] sm:w-[320px] aspect-[3/4] rounded-3xl overflow-hidden">
                <Image
                  src={img}
                  alt={`${t(`elsMons.${activeMon}.nom`)} - ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="320px"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${mon.color} opacity-20`} />
              </div>
            </motion.div>
          ))}

          {/* Card CTA al final */}
          <div className="snap-center flex-shrink-0">
            <Link
              href="/contacto"
              className={`flex items-center justify-center w-[280px] sm:w-[320px] aspect-[3/4] rounded-3xl bg-gradient-to-br ${mon.color}`}
            >
              <div className="text-center p-8">
                <span className="text-6xl mb-4 block">{mon.emoji}</span>
                <p className="text-white font-bold text-xl mb-2">
                  {t('elsMons.wantParty')}
                  <br />
                  {t(`elsMons.${activeMon}.nom`)}!
                </p>
                <span className="inline-block mt-4 px-6 py-2 bg-white/20 rounded-full text-white font-medium">
                  {t('elsMons.contact')}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Descripció */}
      <div className="px-6 mt-6">
        <p className="text-white/60">{t(`elsMons.${activeMon}.desc`)}</p>
        <p className="text-amber-400 text-sm mt-2">
          {t('elsMons.swipeHint')}
        </p>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CAPÍTOL 4: LES PROVES
// Galeria massissa - Que vegin que tenim MOLT material real
// ═══════════════════════════════════════════════════════════════════════════

function LesProves({ t }: { t: (key: string) => string }) {
  return (
    <section className="py-16 bg-black">
      <div className="px-6 mb-8">
        <p className="text-white/60 text-sm uppercase tracking-widest mb-2">
          {t('gallery.sectionTitle')}
        </p>
        <h2 className="text-3xl font-black text-white">
          {t('gallery.title')} <span className="text-amber-400">{t('gallery.titleHighlight')}</span>
        </h2>
      </div>

      {/* Grid de fotos estil Pinterest/Instagram */}
      <div className="columns-2 gap-3 px-4">
        {GALERIA_IMPACTE.map((foto, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: idx * 0.05 }}
            className="mb-3 break-inside-avoid"
          >
            <div className="relative rounded-2xl overflow-hidden">
              <Image
                src={foto.src}
                alt={`Event ${idx + 1}`}
                width={400}
                height={idx % 3 === 0 ? 500 : 350}
                className="w-full object-cover"
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA veure més */}
      <div className="px-6 mt-8 text-center">
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 rounded-full text-white font-medium"
        >
          {t('gallery.viewAll')}
          <span>→</span>
        </Link>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CAPÍTOL 5: LES VEUS
// Testimonis amb les FOTOS dels events - No text genèric
// ═══════════════════════════════════════════════════════════════════════════

function LesVeus({ t }: { t: (key: string) => string }) {
  const [current, setCurrent] = useState(0);

  return (
    <section className="py-16 bg-neutral-950">
      <div className="px-6 mb-8">
        <p className="text-white/60 text-sm uppercase tracking-widest mb-2">
          {t('testimonials.sectionTitle')}
        </p>
        <h2 className="text-3xl font-black text-white">
          {t('testimonials.title')} <span className="text-amber-400">{t('testimonials.titleHighlight')}</span>
        </h2>
      </div>

      {/* Testimoni actual */}
      <div className="px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="relative"
          >
            {/* Imatge de l'event */}
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden mb-6">
              <Image
                src={TESTIMONIS_IMAGES[current]}
                alt={t(`testimonis.${current}.event`)}
                fill
                className="object-cover"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              {/* Badge de l'event */}
              <div className="absolute bottom-4 left-4">
                <span className="px-3 py-1 bg-amber-500 rounded-full text-black text-sm font-bold">
                  {t(`testimonis.${current}.event`)}
                </span>
              </div>
            </div>

            {/* Text del testimoni */}
            <blockquote className="text-xl text-white italic leading-relaxed mb-4">
              &ldquo;{t(`testimonis.${current}.text`)}&rdquo;
            </blockquote>

            {/* Autor */}
            <p className="text-amber-400 font-bold">
              — {t(`testimonis.${current}.nom`)}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Navegació */}
        <div className="flex items-center justify-center gap-3 mt-8">
          {TESTIMONIS_IMAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`w-3 h-3 rounded-full transition-all ${
                idx === current ? 'bg-amber-500 w-8' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CAPÍTOL 6: EL MOMENT
// CTA Final - Ara o mai
// ═══════════════════════════════════════════════════════════════════════════

function ElMoment({ t }: { t: (key: string) => string }) {
  return (
    <section className="py-20 px-6 bg-gradient-to-b from-neutral-950 to-black">
      <div className="max-w-lg mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-6xl mb-6">✨</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            {t('cta.title')}
            <br />
            <span className="text-amber-400">{t('cta.titleHighlight')}</span>
          </h2>
          <p className="text-white/60 mb-8">
            {t('cta.description')}
          </p>

          {/* Botons d'acció */}
          <div className="flex flex-col gap-4">
            <Link
              href="https://wa.me/34699121023"
              className="flex items-center justify-center gap-3 w-full py-4 bg-[#25D366] rounded-2xl text-white font-bold text-lg"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t('cta.whatsapp')}
            </Link>

            <Link
              href="/contacto"
              className="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl text-black font-bold text-lg"
            >
              {t('cta.budget')}
            </Link>

            <a
              href="tel:+34699121023"
              className="flex items-center justify-center gap-3 w-full py-4 bg-white/10 border border-white/20 rounded-2xl text-white font-medium"
            >
              📞 {t('cta.call')}
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex justify-center gap-6 mt-8 text-white/60 text-sm">
            <span>{t('cta.trustYears')}</span>
            <span>•</span>
            <span>{t('cta.trustLocation')}</span>
            <span>•</span>
            <span>{t('cta.trustResponse')}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// WHATSAPP FLOTANT
// Sempre visible, sempre accessible
// ═══════════════════════════════════════════════════════════════════════════

function WhatsAppFlotant() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.a
          href="https://wa.me/34666666666"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/30"
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
