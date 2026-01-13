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
  totalMs?: number;
  fadeMs?: number;
  speedMultiplier?: number;
}

export default function HeroPortalLogo({
  endColor = "#0a0a0a",
  glowColor = "gold",
  glowStrength = 0.7,
  onFinish,
  totalMs = 2000,
  fadeMs = 500,
  speedMultiplier = 2,
}: HeroPortalLogoProps) {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<
    'black' |
    'text' |
    'planet' |
    'ring' |
    'satellite' |
    'wordmark' |
    'together' |
    'exit'
  >('black');
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
    const MOBILE_TOTAL = 1500;
    const effectiveTotal = isMobile ? MOBILE_TOTAL : totalMs;
    const effectiveFade = isMobile ? 400 : fadeMs;

    const phases = isMobile ? {
      text: 0.08,
      planet: 0.24,
      ring: 0.36,
      satellite: 0.48,
      wordmark: 0.6,
      together: 0.66,
      exit: (effectiveTotal - effectiveFade) / effectiveTotal,
      finish: 1,
    } : {
      text: 0.06,
      planet: 0.22,
      ring: 0.34,
      satellite: 0.46,
      wordmark: 0.58,
      together: 0.68,
      exit: (effectiveTotal - effectiveFade) / effectiveTotal,
      finish: 1,
    };

    const toMs = (ratio: number) => Math.round(effectiveTotal * ratio * SPEED);

    timers.current.push(window.setTimeout(() => setPhase('text'), toMs(phases.text)));
    timers.current.push(window.setTimeout(() => setPhase('planet'), toMs(phases.planet)));
    timers.current.push(window.setTimeout(() => setPhase('ring'), toMs(phases.ring)));
    timers.current.push(window.setTimeout(() => setPhase('satellite'), toMs(phases.satellite)));
    timers.current.push(window.setTimeout(() => setPhase('wordmark'), toMs(phases.wordmark)));
    timers.current.push(window.setTimeout(() => setPhase('together'), toMs(phases.together)));
    timers.current.push(window.setTimeout(() => {
      setPhase('exit');
      setVisible(false);
    }, toMs(phases.exit)));
    timers.current.push(window.setTimeout(() => {
      clearTimers();
      onFinish?.();
    }, toMs(phases.finish)));

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
  const showPlanet = phase === 'planet' || phase === 'ring' || phase === 'satellite' || phase === 'wordmark' || phase === 'together' || phase === 'exit';
  const showRing = phase === 'ring' || phase === 'satellite' || phase === 'wordmark' || phase === 'together' || phase === 'exit';
  const showSatellite = phase === 'satellite' || phase === 'wordmark' || phase === 'together' || phase === 'exit';
  const showWordmark = phase === 'wordmark' || phase === 'together' || phase === 'exit';
  const showLogo = showPlanet;
  const isTogetherPhase = phase === 'together' || phase === 'exit';

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
    particles: isMobile ? 8 : 15,
    stars: isMobile ? 15 : 25,
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
              duration: (isMobile ? 2.6 : fadeMs / 1000),
              ease: [0.12, 0.8, 0.2, 1],
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
            <motion.svg
              viewBox="0 0 1024 1024"
              role="img"
              aria-label="Orbita Events"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              className="relative"
              style={{
                width: config.logo.width,
                height: 'auto',
                maxWidth: config.logo.maxWidth,
                filter: `drop-shadow(0 0 ${isMobile ? 15 : 20}px rgba(245, 158, 11, 0.45))
                  drop-shadow(0 0 ${isMobile ? 30 : 40}px rgba(251, 191, 36, 0.225))
                  drop-shadow(0 0 ${isMobile ? 50 : 70}px rgba(245, 158, 11, 0.112))`,
              }}
              animate={isTogetherPhase ? { scale: [1, 1.018, 1], rotate: [0, 0.8, -0.8, 0] } : {}}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <defs>
                <radialGradient id="g-planet-core" cx="440" cy="300" r="268" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFF1C4" />
                  <stop offset="26%" stopColor="#FFC069" />
                  <stop offset="56%" stopColor="#FF7A2E" />
                  <stop offset="100%" stopColor="#5E0022" />
                </radialGradient>
                <radialGradient id="g-terminator" cx="612" cy="468" r="300" gradientUnits="userSpaceOnUse" gradientTransform="matrix(0.845,0,0,0.845,-5,-18)">
                  <stop offset="52%" stopColor="#000" stopOpacity="0" />
                  <stop offset="100%" stopColor="#200015" stopOpacity="0.58" />
                </radialGradient>
                <radialGradient id="g-planet-spec" cx="390" cy="252" r="205" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFF" stopOpacity="0.2" />
                  <stop offset="55%" stopColor="#FFF" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#FFF" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="grad_ring_fill" x1="90.84" y1="261.72" x2="622.2" y2="261.72" gradientTransform="scale(1.4360915,0.69633445)" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFC24D" />
                  <stop offset="32%" stopColor="#FFA33A" />
                  <stop offset="66%" stopColor="#E27600" />
                  <stop offset="100%" stopColor="#A34700" />
                </linearGradient>
                <linearGradient id="g-ring-bevel" x1="0%" y1="0%" x2="0%" y2="100%" gradientUnits="userSpaceOnUse" gradientTransform="rotate(-28,512,420)">
                  <stop offset="0%" stopColor="#FFF6CA" stopOpacity="0.65" />
                  <stop offset="22%" stopColor="#FFE189" stopOpacity="0.42" />
                  <stop offset="55%" stopColor="#F3B350" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#552100" stopOpacity="0.25" />
                </linearGradient>
                <linearGradient id="g-edge-top" x1="90.21" y1="259.74" x2="90.21" y2="793.44" gradientTransform="scale(1.43,0.697)" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFE9A6" />
                  <stop offset="60%" stopColor="#FFE9A6" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="g-edge-bottom" x1="90.1" y1="259.38" x2="90.1" y2="793.51" gradientTransform="scale(1.43,0.6976)" gradientUnits="userSpaceOnUse">
                  <stop offset="42%" stopColor="#000" stopOpacity="0" />
                  <stop offset="100%" stopColor="#421400" stopOpacity="0.45" />
                </linearGradient>
                <linearGradient id="g-inner-shade" x1="90.84" y1="261.72" x2="90.84" y2="793.08" gradientTransform="scale(1.4360915,0.69633445)" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#000" stopOpacity="0" />
                  <stop offset="100%" stopColor="#732700" stopOpacity="0.25" />
                </linearGradient>
                <path
                  id="ring-shape"
                  d="M694.688 182.251c.448.442.894.885 1.338 1.33 20.426 6.556 37.188 2.806 61.852 6.313 34.946 4.968 110.162 26.3 73.771 83.732-14.574 23.001-37.28 46.722-60.116 65.534-38.699 31.881-84.617 55.921-115.698 71.618-124.536 61.878-272.372 94.2-374.076 77.256-25.727-4.286-48.502-11.725-67.201-22.635-44.242-21.963-50.403-70.274 2.998-124.578 11.512-12.971 25.751-25.423 42.367-37.262.441-1.746.9-3.487 1.377-5.223-24.946 13.526-46.008 27.091-61.51 39.955-58.158 48.263-109.643 126.543-23.766 177.955 37.326 22.346 91.35 34.074 153.068 35.787 105.292 2.923 232.981-23.301 338.371-75.668 33.856-16.823 67.833-35.895 99.459-57.977 42.191-29.458 80.199-64.273 108.162-106.244 41.191-61.825 11.476-111.074-69.537-121.809-41.519-5.502-74.875-7.934-106.01-8.082-1.622-.008-3.238-.009-4.849-.004z"
                />
                <mask id="mask_outside_planet" maskUnits="userSpaceOnUse">
                  <rect width="1024" height="1024" fill="#fff" />
                  <circle cx="512" cy="380" r="260" fill="#000" />
                </mask>
                <filter id="f-under-blur" x="-0.0071226183" y="-0.014702413" width="1.0142237" height="1.0294056">
                  <feGaussianBlur stdDeviation="1.6" />
                </filter>
                <radialGradient id="g-sat-metal" cx="-17.2" cy="-17.2" r="77.4" gradientUnits="userSpaceOnUse" gradientTransform="translate(795,190)">
                  <stop offset="0%" stopColor="#FFE2F1" stopOpacity="0.92" />
                  <stop offset="22%" stopColor="#E83D7A" />
                  <stop offset="68%" stopColor="#8C1047" />
                  <stop offset="100%" stopColor="#2A021B" />
                </radialGradient>
                <radialGradient id="g-sat-spec" cx="790" cy="158" r="36" gradientUnits="userSpaceOnUse" gradientTransform="matrix(2.4050659,0,0,2.4050659,-1148.173,-233.00677)">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
                  <stop offset="65%" stopColor="#FFFFFF" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </radialGradient>
                <filter id="f-soft-shadow" x="-0.065934066" y="-0.33333333" width="1.1318681" height="1.6666667">
                  <feGaussianBlur stdDeviation="10" />
                </filter>
              </defs>

              <ellipse cx="512" cy="705" rx="182" ry="36" fill="#000" opacity="0.25" filter="url(#f-soft-shadow)" />

              <motion.g
                style={{ transformOrigin: '512px 380px' }}
                initial={{ opacity: 0, scale: 0.6, y: 30 }}
                animate={showPlanet ? {
                  opacity: 1,
                  scale: isTogetherPhase ? [1, 1.02, 1] : 1,
                  y: 0,
                } : { opacity: 0, scale: 0.6, y: 30 }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <circle cx="512" cy="380" r="260" fill="url(#g-planet-core)" />
                <circle cx="512" cy="379.093" r="259.551" fill="url(#g-terminator)" opacity="0.28" />
                <circle cx="512" cy="380" r="260" fill="url(#g-planet-spec)" opacity="0.22" />
              </motion.g>

              <motion.g
                style={{ transformOrigin: '512px 420px' }}
                initial={{ opacity: 0, scale: 0.55, rotate: -35 }}
                animate={showRing ? {
                  opacity: 1,
                  scale: [0.5, 1.12, 0.98, 1],
                  rotate: [-32, 16, -8, 0],
                } : { opacity: 0, scale: 0.55, rotate: -35 }}
                transition={{ type: 'spring', stiffness: 140, damping: 14, mass: 0.8 }}
              >
                <use xlinkHref="#ring-shape" mask="url(#mask_outside_planet)" fill="url(#grad_ring_fill)" opacity="0.12" />
                <use xlinkHref="#ring-shape" fill="url(#grad_ring_fill)" opacity="0.35" stroke="#000" strokeOpacity="0.03" strokeWidth="0.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                <use xlinkHref="#ring-shape" fill="url(#g-inner-shade)" opacity="0.15" />
                <use xlinkHref="#ring-shape" fill="url(#g-ring-bevel)" opacity="0.22" style={{ mixBlendMode: 'overlay' }} />
                <use xlinkHref="#ring-shape" fill="none" stroke="url(#g-edge-top)" strokeWidth="1.8" opacity="0.25" />
                <use xlinkHref="#ring-shape" fill="none" stroke="url(#g-edge-bottom)" strokeWidth="2.0" opacity="0.18" />
                <use xlinkHref="#ring-shape" fill="none" stroke="#000" strokeWidth="2.8" opacity="0.05" filter="url(#f-under-blur)" />
              </motion.g>

              <motion.g
                style={{ transformOrigin: '795px 190px' }}
                initial={{ opacity: 0, scale: 0.3, x: 20, y: -20 }}
                animate={showSatellite ? {
                  opacity: 1,
                  scale: [0.3, 1.1, 1],
                  x: [20, 0],
                  y: [-20, 0],
                } : { opacity: 0, scale: 0.3, x: 20, y: -20 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              >
                <circle r="43" cx="795" cy="190" fill="url(#g-sat-metal)" />
                <circle r="43.291" cx="795.12" cy="190.285" fill="url(#g-sat-spec)" />
              </motion.g>

              <motion.g
                initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
                animate={showWordmark ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 18, filter: 'blur(8px)' }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                fill="#F8F3EE"
                stroke="none"
              >
                <path
                  d="m 692.77325,947.19017 c -3.90474,-0.82851 -6.96237,-2.38408 -11.84335,-6.02532 l -3.89607,-2.90648 4.11218,-2.8806 c 2.26171,-1.58432 4.2423,-2.88059 4.40132,-2.88059 0.15902,0 1.38309,0.99978 2.72014,2.22173 5.38507,4.92146 14.870011,5.63889 19.06682,1.44218 4.66395,-4.66395 1.67144,-11.38652 -6.35889,-14.285001 -13.31738,-4.80681 -18.65242,-8.93562 -20.04682,-15.51435 -1.40009,-6.60557 0.80541,-12.78671 5.87202,-16.45695 4.09761,-2.96829 7.9378,-3.87121 14.91796,-3.50755 6.09354,0.31748 10.28256,1.96725 15.26639,6.0124 l 2.06232,1.67389 -4.01361,3.0303 c -3.52332,2.66013 -4.12793,2.89256 -4.94947,1.90266 -1.93018,-2.32573 -6.40592,-3.95661 -10.85839,-3.95661 -3.63825,0 -4.75863,0.32087 -6.63582,1.900422 -1.8805,1.58233 -2.25852,2.43146 -2.25852,5.0732 0,4.17815 2.1435,5.98363 11.322953,9.54292 11.75448,4.55449 15.46266,7.80081 17.31153,15.15536 1.92808,7.66964 -2.09345,15.69854 -9.44774,18.86228 -4.14258,1.78209 -12.23918,2.55355 -16.751533,1.59612 z m -373.87843,-30.29187 -1.4e-4,-29.91314 h 18.35162 18.35162 v 4.77142 4.77142 h -13.21317 -13.21316 v 8.07472 8.07471 h 11.378 11.37801 v 4.40439 4.40439 h -11.37801 -11.378 v 8.07471 8.07471 h 13.61523 13.61522 l -0.21854,4.461146 -0.21855,4.46145 -18.53499,0.12645 -18.535,0.12645 z m 89.25798,29.54611 -5.06922,-0.36703 -10.88834,-28.99556 c -5.98859,-15.94756 -10.8921,-29.25778 -10.889669,-29.57827 -0.004,-0.32048 2.33793,-0.48565 5.20562,-0.36703 l 5.21398,0.215567 8.49052,23.38413 8.49052,23.38412 8.50096,-23.56628 8.50096,-23.56628 5.32197,-10e-4 c 2.92708,-7.4e-4 5.32197,0.1024 5.32197,0.22922 0,0.80922 -22.16714,58.90481 -22.59349,59.21296 -0.29126,0.2105 -2.8107,0.21757 -5.59876,0.0157 z m 55.110777,0.24518 c -0.0672,-0.067 -0.0323,-13.52792 0.0776,-29.91314 l 0.19971,-29.79129 h 18.27023 18.27022 l 0.24872,4.46792 c 0.13679,2.45736 0.11108,4.6045 -0.0572,4.77142 -0.16821,0.16693 -6.19672,0.3035 -13.39668,0.3035 h -13.09078 v 8.07472 8.07471 h 11.378 11.37801 v 4.40439 4.40439 h -11.37801 -11.378 v 8.07471 8.07471 h 13.5802 13.5802 l -1.1e-4,4.58791 -10e-5,4.5879 h -18.77991 c -10.328944,0 -18.83487,-0.0548 -18.90206,-0.12185 z m 74.2019,-0.0952 -4.95494,-0.21706 v -29.69608 -29.69609 l 4.95494,0.0214 4.95494,0.0214 3.0072,4.19947 c 1.65396,2.300971 7.80612,10.97122 13.67147,19.2478 5.86535,8.27658 11.37621,15.87416 12.24636,16.88349 l 1.58208,1.83517 -0.0995,-2.2022 c -0.0548,-1.2112 -0.0645,-10.70817 -0.0217,-21.10436 l 0.0778,-18.90217 h 4.77143 4.77142 l 6.5e-4,29.91314 6.6e-4,29.91314 -4.95478,-0.36703 -4.95478,-0.36703 -14.68211,-20.41838 -14.68211,-20.41836 -0.36703,20.7854 -0.36703,20.7854 z m 91.51341,-0.0888 c -0.16823,-0.16822 -0.30586,-11.48199 -0.30586,-25.14172 v -24.83586 h -9.17581 -9.17581 v -4.771422 -4.77142 h 23.49007 23.49007 v 4.77142 4.77142 h -9.17581 -9.17581 v 25.14172 25.14172 h -4.83259 c -2.65793,0 -4.97023,-0.13764 -5.13845,-0.30586 z M 510.852662,842.93732 c -9.31823,-1.29353 -16.33044,-4.78534 -23.30656,-11.60579 l -4.220887,-4.12669 v 6.40009 6.40009 h -12.11207 -12.11207 v -69.18561 -69.1856 h 12.863373 12.86373 l -0.20111,26.24312 c -0.11062,14.43371 -0.0801,26.24298 0.0678,26.24282 0.1479,-1.7e-4 2.14808,-1.74008 4.44482,-3.86646 7.81507,-7.23537 18.22584,-11.02964 30.15434,-10.98994 12.34413,0.0411 22.603,3.98915 31.15626,11.99031 10.92509,10.21987 15.79339,24.5749 14.88025,43.87696 -0.71677,15.15128 -5.06187,25.92668 -14.12722,35.03404 -5.59557,5.62153 -12.65539,9.6738 -20.16426,11.57411 -5.47503,1.3856 -14.83572,1.94137 -20.18678,1.19855 z m 9.88926,-23.18097 c 13.600437,-4.04006 21.51857,-18.08125 19.15995,-33.99315 -2.06607,-13.93836 -10.355144,-22.82917 -23.43154,-25.13254 -11.25918,-1.98326 -23.60309,3.97202 -28.62113,13.80819 -4.45884,8.74006 -5.05436,21.54308 -1.38274,29.72779 2.07519,4.62599 6.827773,10.19509 10.89702,12.76928 6.09276,3.85423 15.90931,5.03853 23.37844,2.82043 z m -230.10869,22.70218 c -26.47179,-4.20682 -46.05681,-21.15695 -54.16957,-46.8818 -2.78113,-8.81871 -3.69216,-16.67626 -3.25971,-28.11479 1.04028,-27.51615 14.38285,-48.82187 37.60953,-60.05568 10.95769,-5.29981 16.2812,-6.41127 30.83072,-6.437 13.71441,-0.0242 19.96296,1.12063 29.35232,5.37797 25.81163,11.70354 41.66017,39.47339 39.78938,69.71905 -1.2602,20.37414 -8.50251,36.3375 -22.37347,49.31511 -8.78236,8.21674 -17.58649,12.90381 -29.54588,15.72938 -5.36957,1.26863 -23.33477,2.12623 -28.23332,1.34776 z m 21.58659,-24.13763 c 14.34312,-3.38092 25.51867,-15.2788 29.96577,-31.90261 1.77176,-6.62307 1.76971,-22.75258 -0.004,-29.36259 -5.39461,-20.1066 -20.55832,-32.29885 -40.17069,-32.29885 -11.51924,0 -20.72563,3.76986 -28.62852,11.72289 -8.48803,8.54187 -12.3976,18.37307 -13.01824,32.73627 -0.72236,16.7172 3.50939,29.1687 13.18523,38.79628 8.06628,8.02604 16.067225,11.30975 27.72747,11.37975 3.43175,0.0206 8.35594,-0.46141 10.94265,-1.07114 z m 417.38414,24.18361 c -0.80747,-0.17146 -3.28494,-0.67861 -5.50548,-1.127 -5.09713,-1.02925 -11.6675,-4.3134 -15.42997,-7.71257 -1.59909,-1.44468 -3.97108,-4.78726 -5.27108,-7.42796 -2.02411,-4.11153 -2.40631,-5.77649 -2.66058,-11.59004 -0.34091,-7.79468 0.79788,-12.29986 4.3478,-17.20038 4.43083,-6.11659 15.24212,-11.25268 27.72952,-13.17341 5.33339,-0.82035 28.16557,-2.98246 31.57089,-2.98963 1.71403,-0.004 1.74142,-0.10903 1.40213,-5.39583 -0.57931,-9.02701 -4.27147,-13.80279 -12.57799,-16.26956 -8.27785,-2.45826 -17.22246,-0.69664 -22.31374,4.394644 -1.7697,1.7697 -3.32368,4.12142 -3.58424,5.42424 l -0.46,2.29998 h -11.35077 -11.35077 l 0.51533,-3.11977 c 2.95858,-17.91136 16.64838,-28.45638 38.51915,-29.67067 25.0102,-1.38858 42.51879,9.49989 46.65499,29.01443 0.80158,3.78183 1.036599,12.41916 1.04648,38.46057 l 0.0128,33.58347 h -11.74503 -11.74504 v -5.56242 -5.5624 l -3.85384,3.3908 c -4.55864,4.01091 -10.96377,7.30127 -17.06701,8.76743 -4.71382,1.13239 -14.46671,1.97929 -16.88349,1.46608 z m 22.26873,-21.22326 c 8.71583,-3.91144 14.06748,-11.95895 14.06748,-21.15391 v -3.64202 l -7.52416,0.498885 c -18.73544,1.24214 -26.39748,2.99109 -30.09816,6.87027 -6.70143,7.02466 -3.17729,16.71697 7.04136,19.34153 4.36173,1.12075 11.62655,0.2784 16.51348,-1.91472 z m -90.88599,19.05406 c -8.06343,-2.24495 -13.93372,-7.24066 -17.53612,-14.923499 l -1.93439,-4.12546 -0.22152,-29.91314 -0.22153,-29.91314 h -8.40374 -8.40373 v -10.2769 -10.27691 h 8.47337 8.47337 l -0.10001,-11.78367 -0.1,-11.78367 h 12.24883 12.24883 l -0.10001,11.78367 -0.10001,11.78367 h 11.77667 11.77666 v 10.276691 10.2769 h -11.81786 -11.81785 l 0.28978,24.77469 c 0.30837,26.36379 0.53349,28.08248 4.09362,31.25242 2.21989,1.97659 10.11239,3.13664 15.14019,2.22531 l 4.111212,-0.74535 v 10.4404 c 0,9.23848 -0.14789,10.50548 -1.28461,11.00576 -0.706544,0.31095 -6.07439,0.6724 -11.92856,0.80323 -7.89932,0.17653 -11.68041,-0.0507 -14.6635,-0.88123 z M 387.89677,790.82268 v -49.18234 h 12.17471 12.1747 l -0.246115,4.77296 c -0.13538,2.62512 -0.17038,4.77226 -0.0778,4.77142 0.0926,-7.3e-4 1.53861,-1.48805 3.21332,-3.30489 5.70342,-6.18748 16.2711,-9.70242 26.16439,-8.70226 l 4.58791,0.46365 v 12.45627 c 0,11.57872 -0.0905,12.41835 -1.28462,11.91816 -2.54228,-1.06491 -12.63356,-1.28603 -15.97649,-0.35007 -4.50293,1.26075 -9.498155,5.85085 -12.20695,11.21693 -3.00248,5.94788 -3.52023,12.00164 -3.54496,41.449266 l -0.0199,23.67359 h -12.4791 -12.4791 z m 195.9953,0 v -49.18234 h 12.4791 12.4791 v 49.18234 49.18234 h -12.4791 -12.4791 z m 6.20918,-64.50937 c -10.17997,-4.62412 -11.29436,-18.69259 -1.98589,-25.07086 3.01492,-2.06585 9.71,-2.78085 13.70215,-1.46333 12.59709,4.15742 13.24428,21.65781 0.99028,26.77785 -3.62684,1.51539 -9.06352,1.41114 -12.70654,-0.24366 z m -288.10608,-34.53668 -6.98964,-0.441973 -10.62792,-7.65897 c -9.16536,-6.60498 -15.29885,-11.19135 -17.93186,-13.408868 -0.38355,-0.32299 6.30378,-0.58726 14.86074,-0.58726 h 15.55809 l 7.78098,9.35932 c 4.27953,5.14763 8.43297,10.26773 9.22987,11.37801 l 1.4489,2.01868 -3.169977,-0.13082 c -1.74336,-0.0719 -6.31509,-0.3197 -10.15939,-0.55055 z"
                />
              </motion.g>
            </motion.svg>
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

          {/* CAPA 5: LENS FLARES - NOMÉS DESKTOP */}
          {showLogo && !isMobile && (
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 25 }}>
              <LensFlare delay={0.8} top="32%" left="32%" size={3.5} />
              <LensFlare delay={1.8} top="48%" right="28%" size={2.8} />
              <LensFlare delay={2.5} bottom="38%" left="42%" size={2.2} />
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
