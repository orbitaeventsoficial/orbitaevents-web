'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MOBILE HERO ULTIMATE - Òrbita Events
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Hero inmersivo fullscreen con:
 * - Video background con overlay dinámico
 * - Texto animado con morphing
 * - Partículas flotantes
 * - Parallax en scroll
 * - CTAs flotantes con glow
 * - Badge de urgencia animado
 * - Scroll indicator interactivo
 * 
 * FIXED:
 * - Rutas con locale
 * - Textos usando sistema de traducciones
 * - Scroll usando container ref
 * - Animaciones optimizadas para evitar parpadeos
 */

import { useRef, useMemo } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useMobile } from './MobileAppShell';
import { useTranslations } from 'next-intl';

// ═══════════════════════════════════════════════════════════════════════════
// PARTICLES BACKGROUND - ULTRA ENHANCED
// ═══════════════════════════════════════════════════════════════════════════

function ParticlesBackground() {
  const reduceMotion = useReducedMotion();
  const particles = useMemo(() =>
    Array.from({ length: reduceMotion ? 6 : 10 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 10 + 8,
      delay: Math.random() * 2,
      xOffset: Math.random() * 30 - 15,
      color: i % 3 === 0 ? 'bg-amber-400/40' : i % 3 === 1 ? 'bg-orange-500/40' : 'bg-yellow-400/40',
    })), [reduceMotion]
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={`absolute rounded-full ${p.color}`}
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: 0.35,
          }}
        />
      ))}

      {/* Glow effect overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-amber-500/10 via-transparent to-transparent" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED BADGE - ENHANCED
// ═══════════════════════════════════════════════════════════════════════════

function AnimatedBadge() {
  const t = useTranslations('mobileHero');

  const badges = useMemo(() => [
    { emoji: '🎃', text: t('badges.halloween'), gradient: 'from-orange-500 to-red-500' },
    { emoji: '🪄', text: t('badges.monMagic'), gradient: 'from-purple-500 to-pink-500' },
    { emoji: '⭐', text: t('badges.rating'), gradient: 'from-amber-400 to-yellow-500' },
  ], [t]);

  const badge = badges[0];

  return (
    <div className="relative h-12 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r ${badge.gradient} shadow-2xl`}>
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-r ${badge.gradient} opacity-40 blur-lg`}
          />
          <span className="relative text-2xl drop-shadow-lg">{badge.emoji}</span>
          <span className="relative text-white text-sm font-bold tracking-wide drop-shadow-md">
            {badge.text}
          </span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MORPHING TEXT - ULTRA SPECTACULAR
// ═══════════════════════════════════════════════════════════════════════════

function MorphingText() {
  const t = useTranslations('mobileHero');

  const texts = useMemo(() => [
    t('morphingTexts.unique'),
    t('morphingTexts.magical'),
    t('morphingTexts.brutal'),
    t('morphingTexts.yours'),
  ], [t]);

  const text = texts[0];

  return (
    <span className="relative inline-block min-w-[200px]">
      <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 rounded-2xl blur-3xl" />

      <span
        className="relative inline-block bg-gradient-to-r from-amber-200 via-orange-400 to-amber-400 bg-clip-text text-transparent font-black"
        style={{
          filter: 'drop-shadow(0 0 30px rgba(251, 191, 36, 0.7)) drop-shadow(0 0 60px rgba(251, 146, 60, 0.35))',
        }}
      >
        {text}

        <span className="absolute -left-3 top-0 w-2 h-2 bg-amber-400/60 rounded-full" />
        <span className="absolute -right-3 bottom-0 w-2 h-2 bg-orange-400/60 rounded-full" />
      </span>

      {/* Animated underline with shimmer effect */}
      <div
        className="absolute -bottom-3 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full"
        style={{ opacity: 0.75 }}
      />

      {/* Shimmer effect moving across */}
      <div
        className="absolute -bottom-3 left-0 h-[3px] w-1/3 bg-gradient-to-r from-transparent via-white to-transparent rounded-full"
        style={{ opacity: 0 }}
      />
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCROLL INDICATOR
// ═══════════════════════════════════════════════════════════════════════════

function ScrollIndicator() {
  const { haptic, scrollToSection } = useMobile();
  const t = useTranslations('mobileHero');
  const reduceMotion = useReducedMotion();
  
  const handleClick = () => {
    haptic('light');
    scrollToSection('services-section');
  };

  return (
    <motion.button
      onClick={handleClick}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={reduceMotion ? undefined : { delay: 2 }}
    >
      <span 
        className="text-white/60 text-xs font-medium tracking-wider"
      >
        {t('scroll')}
      </span>
      
      <div
        className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 opacity-80" />
      </div>
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FLOATING CTAS
// ═══════════════════════════════════════════════════════════════════════════

function FloatingCTAs() {
  const { haptic, locale } = useMobile();
  const t = useTranslations('common');
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col gap-3 w-full px-5">
      {/* Primary CTA - ULTRA ENHANCED */}
      <motion.a
        href={`/${locale}/contacto`}
        whileTap={{ scale: 0.96 }}
        onTapStart={() => haptic('medium')}
        className="relative group w-full overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        {/* Animated glow effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-2xl blur-2xl opacity-60"
          animate={{ opacity: reduceMotion ? 0.65 : 0.7, scale: 1 }}
        />

        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: 0, opacity: 0 }}
        />

        <div className="relative flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl font-black text-black text-sm shadow-2xl">
          <span className="relative z-10">{t('buttons.requestQuote')}</span>
          <motion.svg
            className="w-4 h-4 relative z-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </motion.svg>
        </div>
      </motion.a>

      {/* Secondary CTA - WhatsApp ENHANCED */}
      <motion.a
        href="https://wa.me/34699121023?text=Hola!%20Vull%20info%20sobre%20events%20temàtics"
        whileTap={{ scale: 0.96 }}
        onTapStart={() => haptic('light')}
        className="relative group flex items-center justify-center gap-2.5 py-4 px-5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-md rounded-2xl border-2 border-green-500/30 font-bold text-white text-sm shadow-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.8 }}
      >
        {/* Hover glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 to-green-500/20 opacity-0 group-active:opacity-100 transition-opacity" />

        <motion.svg
          className="w-6 h-6 text-green-400 relative z-10"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </motion.svg>
        <span className="relative z-10">{t('buttons.whatsapp')} directe</span>
      </motion.a>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function MobileHeroUltimate() {
  const t = useTranslations('mobileHero');
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Parallax transforms
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const videoOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  return (
    <section 
      ref={containerRef}
      className="relative h-[100dvh] w-full overflow-hidden"
    >
      {/* Video Background with Parallax */}
      <motion.div
        className="absolute inset-0"
        style={{ scale: videoScale, opacity: videoOpacity }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          disablePictureInPicture
          poster="/img/hero-poster-mobile.webp"
          className="w-full h-full object-cover"
        >
          <source src="/videos/hero-orbita-mobile.mp4" type="video/mp4" />
        </video>

        {/* Enhanced gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/60 to-zinc-950" />
        <div className="absolute inset-0 bg-gradient-to-t from-amber-950/20 via-transparent to-transparent" />

        {/* Vignette effect */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/60" />

        {/* Particles */}
        <ParticlesBackground />
      </motion.div>

      {/* Content with Parallax */}
      <motion.div 
        className="relative z-10 h-full flex flex-col justify-end pb-32"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <div className="px-6">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <AnimatedBadge />
          </motion.div>

          {/* Main Title - ENHANCED */}
          <motion.h1
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="text-[3rem] leading-[1.05] font-black text-white mt-6 mb-6"
            style={{
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.8), 0 0 40px rgba(251, 191, 36, 0.2)',
            }}
          >
            {t('title')}
            <br />
            <MorphingText />
          </motion.h1>

          {/* Subtitle - ENHANCED */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mb-8 max-w-sm"
          >
            <p className="text-lg text-white/80 mb-2 font-medium">
              {t('subtitle')}
            </p>
            <div className="flex items-center justify-center gap-2 text-amber-400/90">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-semibold">{t('location')}</span>
            </div>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8 }}
          >
            <FloatingCTAs />
          </motion.div>

          {/* Social Proof - ENHANCED */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.8 }}
            className="mt-6"
          >
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <motion.svg
                    key={`star-${i}`}
                    className="w-5 h-5 text-amber-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.7 + i * 0.1, type: 'spring' }}
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </motion.svg>
                ))}
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm">5.0</span>
                <span className="text-white/60 text-xs">{t('socialProof')}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <ScrollIndicator />

      {/* Gradient fade at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
    </section>
  );
}
