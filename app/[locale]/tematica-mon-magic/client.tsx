'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/lib/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  PUBLIC_MON_MAGIC_CANDLE_DATA,
  PUBLIC_MON_MAGIC_DEFAULT_QUANTITY,
  PUBLIC_MON_MAGIC_FAQ_KEYS,
  PUBLIC_MON_MAGIC_HOUSES,
  PUBLIC_MON_MAGIC_IMAGES,
  PUBLIC_MON_MAGIC_PACKS,
  PUBLIC_MON_MAGIC_PRODUCTS,
  PUBLIC_MON_MAGIC_QUANTITIES,
  getMonMagicPackPrice,
  getMonMagicStampPrice,
} from '@/lib/constants/index';
import { SITE_CONFIG } from '@/app/config/site-config';

// ═══════════════════════════════════════════════════════════════
// ATMOSPHERIC SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function ClientOnlyStars() {
  const [stars, setStars] = useState<Array<{ left: number; top: number; duration: number; delay: number; warm: boolean }>>([]);

  useEffect(() => {
    const shouldReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;
    const count = shouldReduce ? 8 : isMobile ? 10 : 25;
    setStars(Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 2 + Math.random() * 3,
      delay: Math.random() * 3,
      warm: Math.random() > 0.4,
    })));
  }, []);

  if (stars.length === 0) return null;

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className={`absolute w-1 h-1 rounded-full ${star.warm ? 'bg-amber-300' : 'bg-white'}`}
          style={{ left: `${star.left}%`, top: `${star.top}%` }}
          animate={{ opacity: [0.15, 0.9, 0.15], scale: [1, 1.4, 1] }}
          transition={{ duration: star.duration, repeat: Infinity, delay: star.delay }}
        />
      ))}
    </div>
  );
}

function FloatingCandles() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {PUBLIC_MON_MAGIC_CANDLE_DATA.map((candle) => (
        <motion.div
          key={candle.id}
          className="absolute"
          style={{ left: candle.left, top: '-50px' }}
          animate={{ y: ['0%', '130vh'], opacity: [0, 1, 1, 0] }}
          transition={{ duration: candle.duration * 3, delay: candle.delay, repeat: Infinity, ease: 'linear' }}
        >
          <motion.div
            className="relative"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            <div
              className="rounded-full bg-gradient-to-t from-amber-500 via-yellow-400 to-yellow-200"
              style={{
                width: candle.size * 0.4,
                height: candle.size * 0.6,
                filter: 'blur(1px)',
                boxShadow: '0 0 25px rgba(255,200,100,0.9)',
              }}
            />
          </motion.div>
          <div
            className="bg-gradient-to-b from-amber-100 to-amber-200 rounded-sm mx-auto"
            style={{ width: candle.size * 0.2, height: candle.size, marginTop: -2 }}
          />
        </motion.div>
      ))}
    </div>
  );
}

function GoldenSparkles() {
  const [sparkles, setSparkles] = useState<Array<{ left: number; top: number; size: number; duration: number; delay: number; color: string }>>([]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const isMobile = window.innerWidth < 768;
    const colors = ['rgba(212,175,55,0.5)', 'rgba(245,158,11,0.4)', 'rgba(255,215,0,0.45)', 'rgba(240,214,128,0.35)'];
    setSparkles(Array.from({ length: isMobile ? 10 : 25 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 2 + Math.random() * 3,
      duration: 3 + Math.random() * 5,
      delay: Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
    })));
  }, []);

  if (sparkles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[1]" aria-hidden="true">
      {sparkles.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${s.left}%`, top: `${s.top}%`,
            width: s.size, height: s.size,
            backgroundColor: s.color,
            filter: s.size > 3 ? 'blur(1px)' : undefined,
          }}
          animate={{ opacity: [0, 0.7, 0], scale: [0.5, 1.5, 0.5], y: [0, -25, 0] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}


function GoldenDivider({ className = '' }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className={`relative py-10 ${className}`} aria-hidden="true">
      <div className="flex items-center justify-center">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/10 to-amber-500/30" />
        {mounted && (
          <svg
            viewBox="0 0 320 48"
            className="w-64 md:w-80 h-12 flex-shrink-0 mx-3"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse cx="160" cy="24" rx="80" ry="20" fill="rgb(212,175,55)" fillOpacity="0.06" />
            <path d="M160,6 L168,24 L160,42 L152,24 Z" fill="rgb(212,175,55)" fillOpacity="0.25" stroke="rgb(212,175,55)" strokeWidth="0.8" strokeOpacity="0.6" />
            <path d="M160,12 L165,24 L160,36 L155,24 Z" fill="rgb(212,175,55)" fillOpacity="0.1" stroke="rgb(212,175,55)" strokeWidth="0.5" strokeOpacity="0.4" />
            <circle cx="160" cy="24" r="1.5" fill="rgb(245,158,11)" fillOpacity="0.8" />
            <path d="M148,24 C138,8 118,6 100,14 C88,20 82,18 76,24" stroke="rgb(212,175,55)" strokeWidth="1" strokeOpacity="0.5" strokeLinecap="round" />
            <path d="M148,24 C138,40 118,42 100,34 C88,28 82,30 76,24" stroke="rgb(212,175,55)" strokeWidth="1" strokeOpacity="0.5" strokeLinecap="round" />
            <path d="M76,24 C70,18 62,18 58,22 C54,26 58,30 62,28 C66,26 64,22 60,22" stroke="rgb(212,175,55)" strokeWidth="0.8" strokeOpacity="0.4" strokeLinecap="round" />
            <path d="M100,14 C96,10 90,10 88,14" stroke="rgb(212,175,55)" strokeWidth="0.6" strokeOpacity="0.35" strokeLinecap="round" />
            <path d="M100,34 C96,38 90,38 88,34" stroke="rgb(212,175,55)" strokeWidth="0.6" strokeOpacity="0.35" strokeLinecap="round" />
            <path d="M56,24 L28,24" stroke="rgb(212,175,55)" strokeWidth="0.5" strokeOpacity="0.2" strokeLinecap="round" />
            <circle cx="28" cy="24" r="1" fill="rgb(212,175,55)" fillOpacity="0.3" />
            <path d="M172,24 C182,8 202,6 220,14 C232,20 238,18 244,24" stroke="rgb(212,175,55)" strokeWidth="1" strokeOpacity="0.5" strokeLinecap="round" />
            <path d="M172,24 C182,40 202,42 220,34 C232,28 238,30 244,24" stroke="rgb(212,175,55)" strokeWidth="1" strokeOpacity="0.5" strokeLinecap="round" />
            <path d="M244,24 C250,18 258,18 262,22 C266,26 262,30 258,28 C254,26 256,22 260,22" stroke="rgb(212,175,55)" strokeWidth="0.8" strokeOpacity="0.4" strokeLinecap="round" />
            <path d="M220,14 C224,10 230,10 232,14" stroke="rgb(212,175,55)" strokeWidth="0.6" strokeOpacity="0.35" strokeLinecap="round" />
            <path d="M220,34 C224,38 230,38 232,34" stroke="rgb(212,175,55)" strokeWidth="0.6" strokeOpacity="0.35" strokeLinecap="round" />
            <path d="M264,24 L292,24" stroke="rgb(212,175,55)" strokeWidth="0.5" strokeOpacity="0.2" strokeLinecap="round" />
            <circle cx="292" cy="24" r="1" fill="rgb(212,175,55)" fillOpacity="0.3" />
            <circle cx="145" cy="24" r="1" fill="rgb(212,175,55)" fillOpacity="0.4" />
            <circle cx="175" cy="24" r="1" fill="rgb(212,175,55)" fillOpacity="0.4" />
          </svg>
        )}
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-amber-500/10 to-amber-500/30" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

type MonMagicImageSet = {
  hero: string;
  featured: string;
  cartell: string;
  mussolDecoratiu: string;
  taulaCompleta: string;
  gabiaPerga: string;
  llegintCarta: string;
};

export default function ProductesMonMagic({ imageSet = PUBLIC_MON_MAGIC_IMAGES }: { imageSet?: MonMagicImageSet }) {
  const t = useTranslations('monMagic');

  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [quantitat, setQuantitat] = useState<(typeof PUBLIC_MON_MAGIC_QUANTITIES)[number]>(PUBLIC_MON_MAGIC_DEFAULT_QUANTITY);
  const [casaSeleccionada, setCasaSeleccionada] = useState<(typeof PUBLIC_MON_MAGIC_HOUSES)[number]['id']>(PUBLIC_MON_MAGIC_HOUSES[0].id);
  const [multiSegell, setMultiSegell] = useState(false);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [hoveredCasa, setHoveredCasa] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToCenter = useCallback((id: string) => {
    requestAnimationFrame(() => {
      const el = cardRefs.current[id];
      if (!el) return;
      const rect = el.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + rect.top - window.innerHeight / 2 + rect.height / 2, behavior: 'smooth' });
    });
  }, []);

  const handlePackSelect = useCallback((packId: string) => {
    setSelectedPack(prev => prev === packId ? null : packId);
    scrollToCenter(packId);
  }, [scrollToCenter]);

  useEffect(() => {
    if (!lightboxSrc) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxSrc(null); };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handleEsc); document.body.style.overflow = ''; };
  }, [lightboxSrc]);

  const casaActual = PUBLIC_MON_MAGIC_HOUSES.find(c => c.id === casaSeleccionada) || PUBLIC_MON_MAGIC_HOUSES[0];

  const preuMultiSegell = getMonMagicStampPrice(quantitat);

  return (
    <div className="min-h-screen bg-[#110f0b] relative overflow-hidden font-serif">
      <GoldenSparkles />

      {/* ═══════════════════════════════════════════════════════════════
          HERO — CINEMATIC FULL-SCREEN
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-x-0 inset-y-[-3%]">
          <Image
            src={imageSet.hero}
            alt={t('heroTitle')}
            fill
            priority
            sizes="100vw"
            quality={75}
            className="object-cover object-bottom scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/44 via-black/18 to-[#16110b]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/14 via-transparent to-black/14" />
          <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 120px 40px rgba(0,0,0,0.4)' }} />
        </div>

        <FloatingCandles />
        <ClientOnlyStars />

        <div className="relative z-10 w-full px-6 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl mx-auto pt-24 md:pt-28 text-center relative"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="relative z-10 inline-flex items-center gap-2.5 px-6 py-2.5 bg-gradient-to-r from-amber-500/16 via-violet-500/10 to-cyan-400/12 border border-amber-300/25 rounded-full mb-10 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-300/90 font-sans text-sm font-medium tracking-widest uppercase">
                {t('badge')}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="relative z-10 text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-[1.05] tracking-tight"
              style={{ textShadow: '0 12px 38px rgba(0,0,0,0.76)' }}
            >
              {t('heroTitle')}{' '}
              <span className="text-amber-300">
                {t('heroTitleHighlight')}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="relative z-10 text-xl md:text-2xl text-white mb-4 max-w-3xl mx-auto font-sans font-light leading-relaxed text-center"
            >
              {t('heroSubtitle')}
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="relative z-10 text-lg text-amber-200 mb-10 font-sans font-semibold tracking-[0.01em]"
            >
              {t('heroPrice')}
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="relative z-10 flex justify-center gap-8 md:gap-16 flex-wrap mb-12"
            >
              {[
                { val: `${PUBLIC_MON_MAGIC_PRODUCTS[0].preuUnitat}€`, label: t('priceUnit') },
                { val: `${PUBLIC_MON_MAGIC_PRODUCTS[0].preuPack}€`, label: t('pricePackLabel') },
                { val: String(PUBLIC_MON_MAGIC_HOUSES.length), label: t('housesLabel') },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + i * 0.15, type: 'spring' }}
                  className="text-center"
                >
                  <div
                    className="text-4xl md:text-5xl font-mono font-bold text-amber-400"
                    style={{ textShadow: '0 0 30px rgba(212,175,55,0.25)' }}
                  >
                    {stat.val}
                  </div>
                  <div className="text-white/65 text-sm font-sans mt-1.5 tracking-wide">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="#calculadora"
                className="group px-10 py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-black font-sans font-semibold tracking-[0.01em] text-lg rounded-full transition-all hover:scale-105 border border-amber-200/35"
                style={{ boxShadow: '0 10px 34px rgba(212,175,55,0.28), 0 0 72px rgba(168,85,247,0.12)' }}
              >
                {t('calculateBudget')}
              </Link>
              <Link
                href="#casas"
                className="px-10 py-4 bg-gradient-to-r from-white/[0.08] via-violet-500/[0.08] to-cyan-400/[0.08] text-amber-50 font-sans font-semibold tracking-[0.01em] text-lg rounded-full hover:bg-white/[0.12] transition-all border border-violet-300/20 backdrop-blur-sm hover:border-amber-200/35"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
              >
                {t('seeHouses')}
              </Link>
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#151008] via-[#151008]/70 to-transparent pointer-events-none" />
      </section>

      <GoldenDivider />

      {/* ═══════════════════════════════════════════════════════════════
          GALLERY — ENCHANTED FRAMES
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-20 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.11),transparent_58%),radial-gradient(ellipse_at_bottom_left,rgba(168,85,247,0.10),transparent_54%),radial-gradient(ellipse_at_center,rgba(255,244,214,0.03),transparent_62%)] pointer-events-none" />
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-block text-amber-500/50 text-xs font-sans font-medium tracking-[0.4em] uppercase mb-4">
              {t('galleryLabel')}
            </span>
            <h2 className="text-3xl md:text-5xl font-semibold text-white mb-4 font-[family:var(--font-display)]">
              {t('realPhotos')}
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto font-sans text-base leading-relaxed">
              {t('realPhotosDesc')}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 max-w-6xl mx-auto">
            {/* Featured photo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="col-span-2 row-span-2 relative rounded-xl overflow-hidden group cursor-pointer border border-amber-600/20 min-h-[18rem] sm:min-h-[24rem] md:min-h-[32rem]"
              style={{ boxShadow: '0 0 30px rgba(200,165,55,0.08)' }}
              onClick={() => setLightboxSrc(imageSet.featured)}
            >
              <div className="absolute inset-0 rounded-xl border border-amber-500/20 group-hover:border-amber-500/40 transition-all duration-500 z-10 pointer-events-none" />
              <div className="absolute inset-[3px] rounded-xl border border-amber-500/10 group-hover:border-amber-500/20 transition-all duration-500 z-10 pointer-events-none" />
              <Image
                src={imageSet.featured}
                alt={t('altSobreObert')}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                quality={85}
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/44 via-black/0 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-br from-amber-200/14 via-transparent to-violet-300/12" />
              <div className="absolute bottom-4 left-4 right-4 z-10">
                <span className="inline-block bg-gradient-to-r from-amber-600 to-amber-700 text-black px-3 py-1 rounded-full text-sm font-sans font-bold">
                  ⭐ {t('mostSold')}
                </span>
                <p className="text-white font-sans font-medium mt-2 text-sm">
                  {t('completeLetter')}
                </p>
              </div>
            </motion.div>

            {/* Gallery photos */}
            {([
              { src: imageSet.cartell, alt: t('altCartell') },
              { src: imageSet.taulaCompleta, alt: t('altSobreObert') },
              { src: imageSet.gabiaPerga, alt: t('altSobrePergami') },
              { src: imageSet.llegintCarta, alt: t('altConvidada'), label: t('realReaction') },
            ] as const).map((photo, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="relative rounded-xl overflow-hidden aspect-square group cursor-pointer"
                onClick={() => setLightboxSrc(photo.src)}
              >
                <div className="absolute inset-0 rounded-xl border border-amber-500/15 group-hover:border-amber-300/40 transition-all duration-500 z-10 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-br from-amber-200/12 via-transparent to-violet-300/12 opacity-70 group-hover:opacity-100 transition-opacity duration-500 z-[1] pointer-events-none" />
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  quality={80}
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                {'label' in photo && photo.label && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 z-10">
                      <span className="text-white/90 text-xs font-sans">{photo.label}</span>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500/5 border border-amber-500/15 rounded-full text-amber-400/60 text-sm font-sans">
              ✨ {t('allPhotosReal')}
            </span>
          </div>
        </div>
      </section>

      <GoldenDivider />

      {/* ═══════════════════════════════════════════════════════════════
          HOUSES — HERALDIC SELECTOR
          ═══════════════════════════════════════════════════════════════ */}
      <section id="casas" className="py-20 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.06),transparent_70%)] pointer-events-none" />
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-5xl font-semibold text-white mb-4 font-[family:var(--font-display)]">
              {t('chooseCasa')}
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto font-sans text-base leading-relaxed">
              {t('chooseCasaDesc')}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 max-w-4xl mx-auto mb-12">
            {PUBLIC_MON_MAGIC_HOUSES.map((casa, index) => {
              const isActive = casaSeleccionada === casa.id;
              const isHovered = hoveredCasa === casa.id;
              return (
                <motion.button
                  key={casa.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  onClick={() => setCasaSeleccionada(casa.id)}
                  onHoverStart={() => setHoveredCasa(casa.id)}
                  onHoverEnd={() => setHoveredCasa(null)}
                  className="relative p-5 rounded-xl transition-all duration-300"
                  style={{
                    background: isActive
                      ? `linear-gradient(to bottom, ${casa.colorLacre}30, ${casa.colorLacre}12)`
                      : isHovered
                        ? `linear-gradient(to bottom, ${casa.colorLacre}18, ${casa.colorLacre}08)`
                        : 'rgba(255,255,255,0.02)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: isActive
                      ? `${casa.colorLacre}90`
                      : isHovered
                        ? `${casa.colorLacre}50`
                        : 'rgba(255,255,255,0.06)',
                    boxShadow: isActive
                      ? `0 0 35px ${casa.colorLacre}35, 0 0 70px ${casa.colorLacre}15, inset 0 0 20px ${casa.colorLacre}10`
                      : isHovered
                        ? `0 0 25px ${casa.colorLacre}20, inset 0 0 12px ${casa.colorLacre}08`
                        : undefined,
                  }}
                >
                  <div className="relative z-10 text-center">
                    <div
                      className="text-4xl mb-3 transition-all duration-300"
                      style={{
                        filter: isActive
                          ? `drop-shadow(0 0 12px ${casa.colorLacre})`
                          : isHovered
                            ? `drop-shadow(0 0 8px ${casa.colorLacre}90)`
                            : undefined,
                        transform: isActive ? 'scale(1.15)' : isHovered ? 'scale(1.08)' : undefined,
                      }}
                    >
                      {casa.animal}
                    </div>
                    <div
                      className="font-sans font-bold text-sm transition-colors duration-300"
                      style={{ color: isActive ? casa.colorLacre : isHovered ? `${casa.colorLacre}cc` : 'rgba(255,255,255,0.9)' }}
                    >
                      {t(`houses.${casa.id}.nom`)}
                    </div>
                    <div className="text-white/65 text-xs font-sans mt-1 italic">
                      {t(`houses.${casa.id}.descripcio`)}
                    </div>
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="casa-glow"
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold z-20"
                      style={{
                        background: casa.colorLacre,
                        boxShadow: `0 0 15px ${casa.colorLacre}60`,
                      }}
                    >
                      ✓
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Wax seal preview */}
          <motion.div
            key={casaSeleccionada}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 20 }}
            className="max-w-sm mx-auto bg-gradient-to-b from-white/[0.05] to-amber-500/[0.03] rounded-2xl p-8 text-center border border-white/10"
          >
            <div
              className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center text-5xl transition-all duration-500"
              style={{
                background: `radial-gradient(circle at 35% 35%, ${casaActual.colorLacre}, ${casaActual.colorLacre}90 70%)`,
                boxShadow: `0 0 40px ${casaActual.colorLacre}30, inset 0 2px 6px rgba(255,255,255,0.2), inset 0 -2px 6px rgba(0,0,0,0.3)`,
              }}
            >
              {casaActual.animal}
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 font-[family:var(--font-display)]">
              {t('lacreTitle')} {t(`houses.${casaActual.id}.nom`)}
            </h3>
            <p className="text-white/70 text-sm font-sans leading-relaxed">
              {t(`houses.${casaActual.id}.descripcio`)}
            </p>
          </motion.div>
        </div>
      </section>

      <GoldenDivider />

      {/* ═══════════════════════════════════════════════════════════════
          PACKS + CALCULATOR — UNIFIED
          ═══════════════════════════════════════════════════════════════ */}
      <section id="calculadora" className="py-20 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.10),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(168,85,247,0.06),transparent_62%)] pointer-events-none" />
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-semibold text-white text-center mb-4 font-[family:var(--font-display)]" style={{ textShadow: '0 2px 20px rgba(212,175,55,0.15)' }}>
            {t('packsDiscount')}
          </h2>
          <p className="text-white/70 text-center mb-12 max-w-2xl mx-auto font-sans text-base leading-relaxed">
            {t('packsDiscountDesc')}
          </p>

          {/* Quantity selector */}
          <div className="flex justify-center gap-3 mb-10">
            {PUBLIC_MON_MAGIC_QUANTITIES.map((q) => (
              <button
                key={q}
                onClick={() => setQuantitat(q)}
                className={`px-7 py-3.5 rounded-xl font-sans font-semibold tracking-[0.01em] transition-all duration-300 ${
                  quantitat === q
                    ? 'bg-gradient-to-b from-amber-700/40 to-amber-900/30 text-amber-200 border border-amber-500/40'
                    : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.07] hover:text-white/80 border border-white/10 hover:border-amber-600/20'
                }`}
                style={{ boxShadow: quantitat === q ? '0 0 20px rgba(200,165,55,0.1)' : 'none' }}
              >
                {q} {t('guests')}
              </button>
            ))}
          </div>

          {/* Pack cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 max-w-4xl mx-auto">
            {PUBLIC_MON_MAGIC_PACKS.map((pack, index) => {
              const isSelected = selectedPack === pack.id;
              const preuBase = getMonMagicPackPrice(pack, quantitat);
              const preuTotal = preuBase + (multiSegell ? preuMultiSegell : 0);
              return (
                <motion.div
                  key={pack.id}
                  ref={(el) => { cardRefs.current[pack.id] = el; }}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  onClick={() => handlePackSelect(pack.id)}
                  whileHover={{ y: -6 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative cursor-pointer transition-all duration-500"
                >
                  <div
                    className={`relative rounded-2xl overflow-hidden transition-all duration-500 ${
                      isSelected
                        ? 'bg-gradient-to-b from-amber-700/28 via-amber-900/10 to-amber-900/16'
                        : 'bg-gradient-to-b from-amber-800/16 via-amber-950/6 to-amber-900/12 hover:from-amber-800/22'
                    }`}
                    style={{
                      border: isSelected
                        ? `1px solid ${casaActual.colorLacre}60`
                        : '1px solid rgba(212,175,55,0.18)',
                      boxShadow: isSelected
                        ? `0 0 60px ${casaActual.colorLacre}25, 0 0 120px ${casaActual.colorLacre}10, inset 0 1px 0 rgba(255,255,255,0.08)`
                        : '0 4px 30px rgba(200,165,55,0.06), inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                  >
                    {pack.destacat && (
                      <div className="bg-gradient-to-r from-transparent via-amber-500/[0.08] to-transparent text-amber-200/70 text-center py-2.5 font-serif text-xs tracking-[0.3em] uppercase border-b border-amber-500/10">
                        ✦ {t('recommended')} — {pack.estalviPercent}% {t('saving')} ✦
                      </div>
                    )}

                    <div className="p-8 md:p-10">
                      {/* Pack icon & title */}
                      <div className="text-center mb-5">
                        <span className="text-4xl block mb-3">{pack.emoji}</span>
                        <h3 className="text-3xl font-bold text-white tracking-wide mb-1 font-[family:var(--font-display)]">
                          {t(`packs.${pack.key}.nom`)}
                        </h3>
                        <span className="text-sm text-amber-300/80 tracking-widest uppercase italic font-[family:var(--font-display)]">
                          {pack.estalviPercent}% {t('saving')}
                        </span>
                      </div>

                      {/* Price — elegant serif */}
                      <div className="text-center mb-6">
                        <span
                          className="text-5xl font-bold tracking-tight transition-colors duration-500 font-[family:var(--font-display)]"
                          style={{ color: isSelected ? casaActual.colorLacre : 'rgba(212,175,55,0.85)' }}
                        >
                          {preuTotal}€
                        </span>
                        <p className="text-white/65 text-sm mt-1.5 italic font-[family:var(--font-display)]">
                          {(preuTotal / quantitat).toFixed(1)}€ / inv. · {quantitat} {t('guests')}
                        </p>
                      </div>

                      {/* Subtle divider */}
                      <div className="h-px mx-6 mb-6" style={{
                        background: isSelected
                          ? `linear-gradient(90deg, transparent, ${casaActual.colorLacre}30, transparent)`
                          : 'linear-gradient(90deg, transparent, rgba(212,175,55,0.12), transparent)',
                      }} />

                      <p className="text-white/78 text-base mb-7 leading-relaxed text-center font-sans">
                        {t(`packs.${pack.key}.descripcio`)}
                      </p>

                      <ul className="space-y-3.5 mb-8">
                        {Array.from({ length: pack.numCaracteristiques }).map((_, i) => (
                          <li key={i} className="text-white/80 text-[15px] font-sans flex items-start gap-3 leading-relaxed">
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors duration-500"
                              style={{ background: isSelected ? `${casaActual.colorLacre}20` : 'rgba(212,175,55,0.08)' }}
                            >
                              <span className="text-xs" style={{ color: isSelected ? `${casaActual.colorLacre}dd` : 'rgba(212,175,55,0.6)' }}>✓</span>
                            </span>
                            <span>{t(`packs.${pack.key}.caracteristiques.${i}`)}</span>
                          </li>
                        ))}
                      </ul>

                      <Link
                        href={`/contacto?pack=${pack.id}&quantitat=${quantitat}&casa=${casaSeleccionada}${multiSegell ? '&multisegell=true' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                        className={`block w-full py-4 rounded-xl text-center font-sans font-semibold tracking-[0.01em] text-base transition-all duration-500 ${
                          isSelected
                            ? 'text-white'
                            : 'bg-white/[0.06] text-white/80 hover:bg-white/[0.10] border border-white/10 hover:border-amber-500/25'
                        }`}
                        style={isSelected ? {
                          background: `linear-gradient(135deg, ${casaActual.colorLacre}80, ${casaActual.colorLacre}55)`,
                          border: `1px solid ${casaActual.colorLacre}40`,
                          boxShadow: `0 4px 25px ${casaActual.colorLacre}25`,
                        } : undefined}
                      >
                        {t('requestPack')}
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Multi-Segell option */}
          <div className="max-w-4xl mx-auto mt-8 mb-2">
            <label className="flex items-center gap-3 cursor-pointer bg-gradient-to-r from-white/[0.06] via-amber-500/[0.04] to-violet-400/[0.04] p-4 rounded-xl border border-amber-500/16 hover:border-amber-300/28 transition-colors">
              <input
                type="checkbox"
                checked={multiSegell}
                onChange={(e) => setMultiSegell(e.target.checked)}
                className="w-5 h-5 accent-amber-500 rounded"
              />
              <div className="flex-1">
                <span className="text-white font-sans font-medium">
                  🎨 {t('multiSegell.nom')}
                </span>
                <span className="text-amber-400 font-mono ml-2">(+{preuMultiSegell}€)</span>
                <p className="text-white/40 text-sm font-sans mt-1">
                  {t('multiSegell.descripcio')}
                </p>
              </div>
            </label>
          </div>
        </div>
      </section>

      <GoldenDivider />

      {/* ═══════════════════════════════════════════════════════════════
          FAQ — SPELLBOOK ACCORDION
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.03),transparent_50%)] pointer-events-none" />
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block text-amber-500/50 text-xs font-sans font-medium tracking-[0.4em] uppercase mb-4">
              ✦ FAQ ✦
            </span>
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-3 font-[family:var(--font-display)]">
              {t('faq')}
            </h2>
            <p className="text-amber-200/70 text-sm font-sans max-w-xl mx-auto leading-relaxed">
              {t('heroSubtitle')}
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-3 border-l-2 border-amber-500/15 pl-6">
            {PUBLIC_MON_MAGIC_FAQ_KEYS.map((faqKey, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-xl overflow-hidden transition-all duration-300 border-l-2 ${
                  faqOpen === index
                    ? 'bg-amber-500/[0.06] ring-1 ring-amber-500/20 shadow-[0_0_25px_rgba(212,175,55,0.08)] border-l-amber-500/60'
                    : 'bg-white/[0.02] hover:bg-amber-500/[0.02] border-l-transparent hover:border-l-amber-500/20'
                }`}
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4"
                >
                  <span className={`font-sans font-medium text-[15px] transition-colors duration-200 ${
                    faqOpen === index ? 'text-amber-200' : 'text-white'
                  }`}>
                    {t(`faqs.${faqKey}.pregunta`)}
                  </span>
                  <motion.span
                    animate={{ rotate: faqOpen === index ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={`text-xl flex-shrink-0 transition-colors duration-200 ${
                      faqOpen === index ? 'text-amber-400' : 'text-amber-500/40'
                    }`}
                  >
                    +
                  </motion.span>
                </button>
                <AnimatePresence>
                  {faqOpen === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-6 pb-5"
                    >
                      <p className="text-white/75 font-sans leading-relaxed text-sm">
                        {t(`faqs.${faqKey}.resposta`)}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <GoldenDivider />

      {/* ═══════════════════════════════════════════════════════════════
          CTA FINAL — DRAMATIC CLOSE
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.06),transparent_60%)] pointer-events-none" />
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-5xl mb-6">✨</div>
            <h2 className="text-3xl md:text-5xl font-semibold text-white mb-5 font-[family:var(--font-display)]">
              {t('wantCompletePack')}
            </h2>
            <p className="text-white/72 mb-10 max-w-xl mx-auto font-sans text-base leading-relaxed">
              {t('wantCompletePackDesc')}
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link
                href="/configurador?tema=monmagic"
                className="px-10 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-black font-sans font-semibold tracking-[0.01em] text-lg rounded-full transition-all hover:scale-105 border border-amber-400/30"
                style={{ boxShadow: '0 8px 30px rgba(212,175,55,0.25), 0 0 60px rgba(212,175,55,0.1)' }}
              >
                {t('configureComplete')}
              </Link>
              <Link
                href="/contacto"
                className="px-10 py-4 bg-white/[0.06] text-amber-100/90 font-sans font-semibold tracking-[0.01em] text-lg rounded-full hover:bg-white/[0.12] transition-all border border-amber-500/20 hover:border-amber-400/35"
              >
                {t('talkToUs')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setLightboxSrc(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative max-w-5xl max-h-[90vh] w-full h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={lightboxSrc}
                alt=""
                fill
                sizes="100vw"
                quality={75}
                className="object-contain"
              />
              <button
                onClick={() => setLightboxSrc(null)}
                className="absolute top-3 right-3 w-10 h-10 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors text-2xl font-light backdrop-blur-sm border border-white/10"
                aria-label="Close"
              >
                &times;
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schema.org — Product */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": t('schemaName'),
            "description": t('schemaDescription'),
            "brand": { "@type": "Brand", "name": SITE_CONFIG.business.name },
            "offers": {
              "@type": "AggregateOffer",
              "lowPrice": String(Math.min(...PUBLIC_MON_MAGIC_PACKS.map(p => p.preuPack50))),
              "highPrice": String(Math.max(...PUBLIC_MON_MAGIC_PACKS.map(p => p.preuPack100))),
              "priceCurrency": "EUR",
            },
          }),
        }}
      />

      {/* Schema.org — FAQ */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": PUBLIC_MON_MAGIC_FAQ_KEYS.map((key) => ({
              "@type": "Question",
              "name": t(`faqs.${key}.pregunta`),
              "acceptedAnswer": {
                "@type": "Answer",
                "text": t(`faqs.${key}.resposta`),
              },
            })),
          }),
        }}
      />
    </div>
  );
}












