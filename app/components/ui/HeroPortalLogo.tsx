/**
 * HeroPortalLogo.tsx
 *
 * ANIMACIÓN PORTAL ÒRBITA EVENTS - VERSIÓN CINEMATOGRÁFICA ÉPICA v3.0
 * ✨ Entrada espectacular - Logo protagonista - Texto brillante - Magia pura
 * 📱 Optimizado para móvil con misma calidad visual
 */

"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

type GlowColor = "gold" | "fuchsia" | "none";

interface HeroPortalLogoProps {
  endColor?: string;
  glowColor?: GlowColor;
  glowStrength?: number;
  onFinish?: () => void;
  svgUrl?: string;
  totalMs?: number;
  fadeMs?: number;
  speedMultiplier?: number;
}

export default function HeroPortalLogo({
  endColor = "#0a0a0a",
  glowColor = "gold",
  glowStrength = 0.7,
  onFinish,
  svgUrl = "/img/orbita-glyph.svg",
  totalMs = 7500,
  fadeMs = 3000,
  speedMultiplier = 1,
}: HeroPortalLogoProps) {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<'black' | 'text' | 'logo' | 'together' | 'exit'>('black');
  const [isMobile, setIsMobile] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100vh');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      setViewportHeight(`${window.innerHeight}px`);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      const tid = window.setTimeout(() => onFinish?.(), 500);
      timers.current.push(tid);
      return () => clearTimers();
    }

    const SPEED = speedMultiplier;
    const MOBILE_TOTAL = 6000;
    const effectiveTotal = isMobile ? MOBILE_TOTAL : totalMs;
    const effectiveFade = isMobile ? 2200 : fadeMs;

    const phases = isMobile ? {
      text: 100 * SPEED,
      logo: 600 * SPEED,
      together: 3000 * SPEED,
      exit: (effectiveTotal - effectiveFade) * SPEED,
      finish: effectiveTotal * SPEED,
    } : {
      text: 150 * SPEED,
      logo: 800 * SPEED,
      together: 4000 * SPEED,
      exit: (effectiveTotal - effectiveFade) * SPEED,
      finish: effectiveTotal * SPEED,
    };

    timers.current.push(window.setTimeout(() => setPhase('text'), phases.text));
    timers.current.push(window.setTimeout(() => setPhase('logo'), phases.logo));
    timers.current.push(window.setTimeout(() => setPhase('together'), phases.together));
    timers.current.push(window.setTimeout(() => {
      setPhase('exit');
      setVisible(false);
    }, phases.exit));
    timers.current.push(window.setTimeout(() => {
      clearTimers();
      onFinish?.();
    }, phases.finish));

    return () => clearTimers();
  }, [onFinish, totalMs, fadeMs, speedMultiplier, prefersReducedMotion, isMobile, clearTimers]);

  const handleTapToSkip = useCallback(() => {
    if (!isMobile) return;
    if ('vibrate' in navigator) navigator.vibrate(15);
    clearTimers();
    setVisible(false);
    const tid = window.setTimeout(() => onFinish?.(), 400);
    timers.current.push(tid);
  }, [isMobile, clearTimers, onFinish]);

  const showText = phase !== 'black';
  const showLogo = phase === 'logo' || phase === 'together' || phase === 'exit';
  const isTogetherPhase = phase === 'together';

  const config = useMemo(() => ({
    logo: {
      width: isMobile ? '85vw' : '45vw',
      maxWidth: isMobile ? '400px' : '550px',
    },
    glow: {
      width: isMobile ? '100vw' : '55vw',
      maxWidth: isMobile ? '450px' : '650px',
    },
    text: {
      fontSize: isMobile ? 'clamp(1.3rem, 6vw, 2rem)' : 'clamp(2rem, 3.5vw, 3rem)',
      paddingTop: isMobile ? '15vh' : 'clamp(100px, 14vh, 140px)',
      letterSpacing: isMobile ? '0.22em' : '0.28em',
    },
    particles: isMobile ? 25 : 40,
    stars: isMobile ? 50 : 80,
  }), [isMobile]);

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key="hero-portal-epic"
          className="fixed inset-0 touch-none"
          onClick={isMobile ? handleTapToSkip : undefined}
          style={{
            zIndex: 9999,
            height: viewportHeight,
            background: phase === 'exit'
              ? 'transparent'
              : `radial-gradient(ellipse 120% 100% at 50% 35%, #0d0d0d 0%, #000 100%)`,
            cursor: isMobile ? 'pointer' : 'default',
            WebkitTapHighlightColor: 'transparent',
            transition: 'background 1.5s ease-out',
          }}
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.05,
            filter: 'blur(12px)',
            transition: {
              duration: (isMobile ? 2.2 : fadeMs / 1000),
              ease: [0.19, 1, 0.22, 1],
            },
          }}
        >
          {/* CAPA 0: Estrellas */}
          <div className="absolute inset-0 overflow-hidden">
            <StarField count={config.stars} />
          </div>

          {/* CAPA 1: Nebulosa */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: showLogo ? 1 : 0 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
          >
            <motion.div
              className="absolute"
              style={{
                top: isMobile ? '48%' : '45%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: isMobile ? '130vw' : '80vw',
                height: isMobile ? '130vw' : '80vw',
                maxWidth: isMobile ? '600px' : '800px',
                maxHeight: isMobile ? '600px' : '800px',
                background: `radial-gradient(ellipse 100% 80% at 50% 50%,
                  rgba(245, 158, 11, ${isMobile ? 0.18 : 0.14}) 0%,
                  rgba(251, 191, 36, ${isMobile ? 0.1 : 0.07}) 30%,
                  rgba(245, 158, 11, 0.03) 55%,
                  transparent 75%)`,
                filter: `blur(${isMobile ? 50 : 60}px)`,
              }}
              animate={isTogetherPhase ? { scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] } : {}}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute"
              style={{
                top: isMobile ? '35%' : '32%',
                left: isMobile ? '65%' : '62%',
                transform: 'translate(-50%, -50%)',
                width: isMobile ? '45vw' : '35vw',
                height: isMobile ? '45vw' : '35vw',
                maxWidth: '400px',
                maxHeight: '400px',
                background: `radial-gradient(circle,
                  rgba(236, 72, 153, ${isMobile ? 0.1 : 0.08}) 0%,
                  rgba(192, 38, 211, 0.04) 50%,
                  transparent 75%)`,
                filter: `blur(${isMobile ? 60 : 70}px)`,
              }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.85, 0.6] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          {/* CAPA 2: TEXTO "LA MÀGIA COMENÇA" */}
          <motion.div
            className="absolute inset-x-0 top-0 flex items-start justify-center pointer-events-none px-6"
            style={{ paddingTop: config.text.paddingTop, zIndex: 20 }}
            initial={{ opacity: 0, y: isMobile ? 40 : 50, scale: 0.88, filter: 'blur(16px)' }}
            animate={{
              opacity: showText ? 1 : 0,
              y: showText ? 0 : (isMobile ? 40 : 50),
              scale: showText ? 1 : 0.88,
              filter: showText ? 'blur(0px)' : 'blur(16px)',
            }}
            transition={{ duration: isMobile ? 1.4 : 1.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                style={{ filter: 'blur(20px)', opacity: 0.5 }}
                animate={isTogetherPhase ? { opacity: [0.4, 0.7, 0.4] } : {}}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <span
                  className={jakartaSans.className}
                  style={{
                    fontSize: config.text.fontSize,
                    fontWeight: 300,
                    letterSpacing: config.text.letterSpacing,
                    textTransform: 'uppercase',
                    color: '#f59e0b',
                  }}
                >
                  La màgia comença
                </span>
              </motion.div>
              <motion.span
                className={`${jakartaSans.className} relative block text-center`}
                style={{
                  fontSize: config.text.fontSize,
                  fontWeight: 300,
                  letterSpacing: config.text.letterSpacing,
                  textTransform: 'uppercase',
                  background: `linear-gradient(135deg, #fcd34d 0%, #f59e0b 20%, #fbbf24 40%, #fcd34d 60%, #f59e0b 80%, #fbbf24 100%)`,
                  backgroundSize: '300% auto',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
                animate={isTogetherPhase ? { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] } : {}}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              >
                La màgia comença
              </motion.span>
            </div>
          </motion.div>

          {/* CAPA 3: LOGO PLANETA */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 15, marginTop: isMobile ? '5vh' : '2vh' }}
            initial={{ opacity: 0, scale: isMobile ? 0.3 : 0.35, rotateZ: isMobile ? -10 : -12, filter: 'blur(25px) brightness(0.4)' }}
            animate={{
              opacity: showLogo ? 1 : 0,
              scale: showLogo ? (isTogetherPhase ? 1.02 : 1) : (isMobile ? 0.3 : 0.35),
              rotateZ: showLogo ? 0 : (isMobile ? -10 : -12),
              filter: showLogo ? 'blur(0px) brightness(1)' : 'blur(25px) brightness(0.4)',
            }}
            transition={{ duration: isMobile ? 1.8 : 2, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="absolute"
              style={{
                width: config.glow.width,
                height: config.glow.width,
                maxWidth: config.glow.maxWidth,
                maxHeight: config.glow.maxWidth,
                background: `radial-gradient(circle,
                  rgba(245, 158, 11, ${glowStrength * 0.35}) 0%,
                  rgba(251, 191, 36, ${glowStrength * 0.18}) 35%,
                  rgba(245, 158, 11, 0.06) 55%,
                  transparent 75%)`,
                filter: `blur(${isMobile ? 35 : 45}px)`,
              }}
              animate={isTogetherPhase ? { scale: [1, 1.12, 1], opacity: [0.85, 1, 0.85] } : {}}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.img
              src={svgUrl}
              alt="Òrbita Events"
              className="relative"
              style={{
                width: config.logo.width,
                height: 'auto',
                maxWidth: config.logo.maxWidth,
                filter: `drop-shadow(0 0 ${isMobile ? 15 : 20}px rgba(245, 158, 11, 0.45))
                  drop-shadow(0 0 ${isMobile ? 30 : 40}px rgba(251, 191, 36, 0.25))
                  drop-shadow(0 0 ${isMobile ? 50 : 70}px rgba(245, 158, 11, 0.12))`,
              }}
              animate={isTogetherPhase ? { scale: [1, 1.018, 1], rotate: [0, 0.8, -0.8, 0] } : {}}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              draggable={false}
            />
          </motion.div>

          {/* CAPA 4: PARTÍCULAS */}
          <motion.div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ zIndex: 10 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: showLogo ? 1 : 0 }}
            transition={{ duration: 1.2, delay: 0.3 }}
          >
            <FloatingParticles count={config.particles} isMobile={isMobile} />
          </motion.div>

          {/* CAPA 5: LENS FLARES */}
          {showLogo && (
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 25 }}>
              <LensFlare delay={0.8} top={isMobile ? "38%" : "32%"} left={isMobile ? "25%" : "32%"} size={isMobile ? 2.5 : 3.5} />
              <LensFlare delay={1.8} top={isMobile ? "52%" : "48%"} right={isMobile ? "20%" : "28%"} size={isMobile ? 2 : 2.8} />
              {!isMobile && <LensFlare delay={2.5} bottom="38%" left="42%" size={2.2} />}
            </div>
          )}

          {/* CAPA 6: VIGNETTE */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse ${isMobile ? '90% 80%' : '85% 75%'} at 50% ${isMobile ? '48%' : '45%'},
                transparent 0%, transparent 45%, rgba(0, 0, 0, ${isMobile ? 0.5 : 0.45}) 100%)`,
              zIndex: 30,
            }}
          />

          {/* HINT MÓVIL */}
          {isMobile && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none pb-10"
              style={{ zIndex: 40, paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom, 0px) + 1.5rem)' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: phase === 'together' ? 0.7 : 0, y: phase === 'together' ? 0 : 10 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <span className="text-white/50 text-sm font-light tracking-widest uppercase">Toca per saltar</span>
              <motion.div className="flex gap-2" animate={{ y: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-amber-500"
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StarField({ count }: { count: number }) {
  const stars = useMemo(() => Array.from({ length: count }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: 0.8 + Math.random() * 1.8,
    delay: Math.random() * 4,
    duration: 2.5 + Math.random() * 3,
  })), [count]);

  return (
    <>
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{ left: star.left, top: star.top, width: star.size, height: star.size }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.7, 0] }}
          transition={{ duration: star.duration, delay: star.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

function FloatingParticles({ count, isMobile }: { count: number; isMobile: boolean }) {
  const particles = useMemo(() => Array.from({ length: count }).map((_, i) => ({
    id: i,
    initialX: 25 + Math.random() * 50,
    initialY: 20 + Math.random() * 55,
    size: isMobile ? (6 + Math.random() * 16) : (8 + Math.random() * 22),
    blur: isMobile ? (8 + Math.random() * 12) : (10 + Math.random() * 18),
    duration: 4.5 + Math.random() * 4,
    delay: Math.random() * 2.5,
    color: Math.random() > 0.75 ? 'rgba(192, 132, 252, 0.35)' : `rgba(251, 191, 36, ${0.25 + Math.random() * 0.3})`,
  })), [count, isMobile]);

  return (
    <>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.initialX}%`,
            top: `${p.initialY}%`,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, ${p.color} 0%, transparent 70%)`,
            filter: `blur(${p.blur}px)`,
          }}
          animate={{ y: [0, -25 - Math.random() * 15, 0], x: [0, 12 - Math.random() * 24, 0], scale: [0.7, 1.25, 0.7], opacity: [0.25, 0.75, 0.25] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

function LensFlare({ delay, top, left, right, bottom, size }: { delay: number; top?: string; left?: string; right?: string; bottom?: string; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        top, left, right, bottom,
        width: size * 5,
        height: size * 5,
        background: `radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(251, 191, 36, 0.65) 25%, rgba(245, 158, 11, 0.35) 45%, transparent 70%)`,
        boxShadow: `0 0 ${size * 10}px rgba(251, 191, 36, 0.5), 0 0 ${size * 20}px rgba(245, 158, 11, 0.25)`,
      }}
      initial={{ opacity: 0, scale: 0.2 }}
      animate={{ opacity: [0, 1, 0.75, 0], scale: [0.2, 1.4, 1.1, 0.2] }}
      transition={{ duration: 3.5, delay, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
    />
  );
}
