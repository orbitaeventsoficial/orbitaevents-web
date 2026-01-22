/**
 * HeroPortalLogo.tsx
 * ANIMACIÓN PORTAL ÒRBITA EVENTS - v4.0 ULTRA RÁPIDA
 * Animación cinematográfica optimizada: 1.2s móvil / 1.8s desktop
 */

"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface HeroPortalLogoProps {
  onFinish?: () => void;
  totalMs?: number;
  fadeMs?: number;
  speedMultiplier?: number;
}

export default function HeroPortalLogo({
  onFinish,
  totalMs = 1800,
  fadeMs = 400,
  speedMultiplier = 1,
}: HeroPortalLogoProps) {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<'initial' | 'logo' | 'text' | 'exit'>('initial');
  const [isMobile, setIsMobile] = useState(false);
  const timers = useRef<number[]>([]);

  // Detectar móvil y preferencias de movimiento reducido
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();

    // Respetar preferencias de accesibilidad
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onFinish?.();
      return;
    }

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [onFinish]);

  // Bloquear scroll durante la animación
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach(id => window.clearTimeout(id));
    timers.current = [];
  }, []);

  // Secuencia de animación ultra rápida
  useEffect(() => {
    const MOBILE_TOTAL = 1200;
    const total = isMobile ? MOBILE_TOTAL : totalMs;
    const speed = speedMultiplier;

    const timeline = {
      logo: 0.05,      // Logo aparece casi inmediatamente
      text: 0.35,      // Texto aparece
      exit: 0.75,      // Empieza fade out
      finish: 1,       // Termina
    };

    const ms = (ratio: number) => Math.round(total * ratio / speed);

    timers.current.push(window.setTimeout(() => setPhase('logo'), ms(timeline.logo)));
    timers.current.push(window.setTimeout(() => setPhase('text'), ms(timeline.text)));
    timers.current.push(window.setTimeout(() => {
      setPhase('exit');
      setVisible(false);
    }, ms(timeline.exit)));
    timers.current.push(window.setTimeout(() => {
      clearTimers();
      onFinish?.();
    }, ms(timeline.finish)));

    return clearTimers;
  }, [onFinish, totalMs, speedMultiplier, isMobile, clearTimers]);

  // Skip en móvil con tap
  const handleSkip = useCallback(() => {
    if ('vibrate' in navigator) navigator.vibrate(10);
    clearTimers();
    setVisible(false);
    window.setTimeout(() => onFinish?.(), 300);
  }, [clearTimers, onFinish]);

  const showLogo = phase !== 'initial';
  const showText = phase === 'text' || phase === 'exit';

  // Configuración responsive - logo más grande
  const config = useMemo(() => ({
    logoSize: isMobile ? 280 : 520,
    textSize: isMobile ? '1rem' : '1.5rem',
    wordmarkWidth: isMobile ? 200 : 320,
  }), [isMobile]);

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key="hero-portal"
          className="fixed inset-0 flex flex-col items-center justify-center touch-none select-none"
          onClick={isMobile ? handleSkip : undefined}
          style={{
            zIndex: 9999,
            background: 'radial-gradient(ellipse 100% 100% at 50% 40%, #0f0f0f 0%, #000 100%)',
            cursor: isMobile ? 'pointer' : 'default',
          }}
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.1,
            filter: 'blur(20px)',
            transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
          }}
        >
          {/* Glow de fondo */}
          <motion.div
            className="absolute"
            style={{
              width: isMobile ? 350 : 500,
              height: isMobile ? 350 : 500,
              background: 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, rgba(245,158,11,0.05) 50%, transparent 70%)',
              filter: 'blur(60px)',
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: showLogo ? 1 : 0,
              scale: showLogo ? 1 : 0.5,
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />

          {/* Logo SVG - Planeta Òrbita */}
          <motion.div
            className="relative translate-y-6"
            initial={{ opacity: 0, scale: 0.3, rotate: -15 }}
            animate={{
              opacity: showLogo ? 1 : 0,
              scale: showLogo ? 1 : 0.3,
              rotate: showLogo ? 0 : -15,
            }}
            transition={{
              duration: 0.7,
              ease: [0.16, 1, 0.3, 1],
              scale: { type: 'spring', stiffness: 200, damping: 20 }
            }}
          >
            <svg
              width={config.logoSize}
              height={config.logoSize}
              viewBox="0 0 1024 1024"
              role="img"
              aria-label="Òrbita Events"
              style={{
                filter: 'drop-shadow(0 0 30px rgba(251,191,36,0.4)) drop-shadow(0 0 60px rgba(245,158,11,0.2))',
              }}
            >
              <defs>
                <radialGradient id="planet-grad" cx="42%" cy="30%" r="52%">
                  <stop offset="0%" stopColor="#FFF1C4" />
                  <stop offset="30%" stopColor="#FFC069" />
                  <stop offset="60%" stopColor="#FF7A2E" />
                  <stop offset="100%" stopColor="#5E0022" />
                </radialGradient>
                <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FFC24D" />
                  <stop offset="50%" stopColor="#E27600" />
                  <stop offset="100%" stopColor="#A34700" />
                </linearGradient>
                <radialGradient id="satellite-grad" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#FFE2F1" />
                  <stop offset="40%" stopColor="#E83D7A" />
                  <stop offset="100%" stopColor="#5E0022" />
                </radialGradient>
              </defs>

              {/* Sombra */}
              <ellipse cx="512" cy="720" rx="180" ry="35" fill="#000" opacity="0.3" />

              {/* Planeta */}
              <motion.circle
                cx="512" cy="400" r="260"
                fill="url(#planet-grad)"
                initial={{ scale: 0 }}
                animate={{ scale: showLogo ? 1 : 0 }}
                transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              />

              {/* Anillo */}
              <motion.path
                d="M694.688 182.251c.448.442.894.885 1.338 1.33 20.426 6.556 37.188 2.806 61.852 6.313 34.946 4.968 110.162 26.3 73.771 83.732-14.574 23.001-37.28 46.722-60.116 65.534-38.699 31.881-84.617 55.921-115.698 71.618-124.536 61.878-272.372 94.2-374.076 77.256-25.727-4.286-48.502-11.725-67.201-22.635-44.242-21.963-50.403-70.274 2.998-124.578 11.512-12.971 25.751-25.423 42.367-37.262.441-1.746.9-3.487 1.377-5.223-24.946 13.526-46.008 27.091-61.51 39.955-58.158 48.263-109.643 126.543-23.766 177.955 37.326 22.346 91.35 34.074 153.068 35.787 105.292 2.923 232.981-23.301 338.371-75.668 33.856-16.823 67.833-35.895 99.459-57.977 42.191-29.458 80.199-64.273 108.162-106.244 41.191-61.825 11.476-111.074-69.537-121.809-41.519-5.502-74.875-7.934-106.01-8.082-1.622-.008-3.238-.009-4.849-.004z"
                fill="url(#ring-grad)"
                opacity="0.9"
                initial={{ scale: 0.5, rotate: -30, opacity: 0 }}
                animate={{
                  scale: showLogo ? 1 : 0.5,
                  rotate: showLogo ? 0 : -30,
                  opacity: showLogo ? 0.9 : 0
                }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
              />

              {/* Satélite */}
              <motion.circle
                cx="795" cy="190" r="43"
                fill="url(#satellite-grad)"
                initial={{ scale: 0, x: 30, y: -30 }}
                animate={{
                  scale: showLogo ? 1 : 0,
                  x: showLogo ? 0 : 30,
                  y: showLogo ? 0 : -30
                }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
              />

            </svg>
            <motion.span
              className="mx-auto -mt-2 block text-white font-semibold tracking-[0.08em]"
              style={{ fontSize: isMobile ? '0.95rem' : '1.1rem' }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: showText ? 1 : 0, y: showText ? 0 : 12 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              Òrbita Events
            </motion.span>
          </motion.div>

          {/* Texto "LA MÀGIA COMENÇA" */}
          <motion.p
            className="absolute font-light tracking-[0.3em] uppercase text-center"
            style={{
              fontSize: config.textSize,
              top: isMobile ? '10%' : '15%',
              background: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 50%, #fbbf24 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(251,191,36,0.3)',
            }}
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{
              opacity: showText ? 1 : 0,
              y: showText ? 0 : 30,
              filter: showText ? 'blur(0px)' : 'blur(10px)',
            }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            La màgia comença
          </motion.p>

          {/* Indicador de skip en móvil */}
          {isMobile && phase === 'text' && (
            <motion.p
              className="absolute bottom-8 text-white/40 text-xs tracking-widest uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.3 }}
            >
              Toca per saltar
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
