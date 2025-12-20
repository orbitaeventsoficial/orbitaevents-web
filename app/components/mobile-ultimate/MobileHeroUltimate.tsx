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
 */

import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useMobile } from './MobileAppShell';
import { useTranslations } from 'next-intl';

// ═══════════════════════════════════════════════════════════════════════════
// PARTICLES BACKGROUND
// ═══════════════════════════════════════════════════════════════════════════

function ParticlesBackground() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-amber-500/30"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            filter: 'blur(1px)',
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0, 0.6, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED BADGE
// ═══════════════════════════════════════════════════════════════════════════

function AnimatedBadge() {
  const badges = [
    { emoji: '🎃', text: 'Halloween 2025' },
    { emoji: '🪄', text: 'Món Màgic' },
    { emoji: '⭐', text: '4.9/5 · 48+ events' },
  ];
  
  const [currentBadge, setCurrentBadge] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBadge((prev) => (prev + 1) % badges.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-10 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBadge}
          initial={{ y: 30, opacity: 0, filter: 'blur(10px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: -30, opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
            <span className="text-xl">{badges[currentBadge].emoji}</span>
            <span className="text-white/90 text-sm font-medium">{badges[currentBadge].text}</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MORPHING TEXT
// ═══════════════════════════════════════════════════════════════════════════

function MorphingText() {
  const texts = ['ÚNICS.', 'MÀGICS.', 'BRUTALS.', 'TEUS.'];
  const [currentText, setCurrentText] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentText((prev) => (prev + 1) % texts.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="relative inline-block min-w-[200px]">
      <AnimatePresence mode="wait">
        <motion.span
          key={currentText}
          initial={{ 
            opacity: 0, 
            y: 40,
            rotateX: -90,
            filter: 'blur(20px)'
          }}
          animate={{ 
            opacity: 1, 
            y: 0,
            rotateX: 0,
            filter: 'blur(0px)'
          }}
          exit={{ 
            opacity: 0, 
            y: -40,
            rotateX: 90,
            filter: 'blur(20px)'
          }}
          transition={{ 
            duration: 0.6, 
            ease: [0.22, 1, 0.36, 1]
          }}
          className="inline-block bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent"
          style={{
            textShadow: '0 0 80px rgba(251, 191, 36, 0.5)',
          }}
        >
          {texts[currentText]}
        </motion.span>
      </AnimatePresence>
      
      {/* Underline glow */}
      <motion.div
        className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full"
        animate={{
          opacity: [0.3, 1, 0.3],
          scaleX: [0.8, 1, 0.8],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCROLL INDICATOR
// ═══════════════════════════════════════════════════════════════════════════

function ScrollIndicator() {
  const { haptic } = useMobile();
  
  const handleClick = () => {
    haptic('light');
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    <motion.button
      onClick={handleClick}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2 }}
    >
      <motion.span 
        className="text-white/50 text-xs font-medium tracking-wider"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        DESCOBREIX
      </motion.span>
      
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2"
      >
        <motion.div
          animate={{ 
            y: [0, 12, 0],
            opacity: [1, 0, 1]
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-1.5 h-1.5 rounded-full bg-amber-500"
        />
      </motion.div>
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FLOATING CTAS
// ═══════════════════════════════════════════════════════════════════════════

function FloatingCTAs() {
  const { haptic } = useMobile();
  const t = useTranslations('common');

  return (
    <div className="flex flex-col gap-3 w-full px-6">
      {/* Primary CTA */}
      <motion.a
        href="/contacto"
        whileTap={{ scale: 0.97 }}
        onTapStart={() => haptic('light')}
        className="relative group w-full"
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur-xl opacity-50 group-active:opacity-70 transition-opacity" />
        
        <div className="relative flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl font-bold text-black text-lg shadow-2xl">
          <span>{t('buttons.requestQuote')}</span>
          <motion.svg 
            className="w-5 h-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </motion.svg>
        </div>
      </motion.a>

      {/* Secondary CTA - WhatsApp */}
      <motion.a
        href="https://wa.me/34699121023?text=Hola!%20Vull%20info%20sobre%20events%20temàtics"
        whileTap={{ scale: 0.97 }}
        onTapStart={() => haptic('light')}
        className="flex items-center justify-center gap-3 py-4 px-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 font-semibold text-white"
      >
        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span>WhatsApp directe</span>
      </motion.a>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function MobileHeroUltimate() {
  const t = useTranslations('common');
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
          poster="/img/hero-poster.webp"
          className="w-full h-full object-cover"
        >
          <source src="/videos/hero-orbita.mp4" type="video/mp4" />
        </video>
        
        {/* Dynamic overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/70 via-zinc-950/50 to-zinc-950" />
        
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

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-[2.75rem] leading-[1.05] font-black text-white mt-6 mb-4"
          >
            EVENTS TEMÀTICS
            <br />
            <MorphingText />
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="text-lg text-white/60 mb-8 max-w-sm"
          >
            Halloween · Món Màgic · El que imaginis.
            <br />
            <span className="text-white/80">Barcelona i Girona.</span>
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8 }}
          >
            <FloatingCTAs />
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="flex items-center justify-center gap-4 mt-6"
          >
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-white/60 text-sm">4.9 · Bodas.net</span>
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
