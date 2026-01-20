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

  // Configuración responsive
  const config = useMemo(() => ({
    logoSize: isMobile ? 280 : 420,
    textSize: isMobile ? '1.1rem' : '1.5rem',
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
            className="relative"
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

              {/* Wordmark ORBITA EVENTS */}
              <motion.g
                fill="#F8F3EE"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: showLogo ? 1 : 0, y: showLogo ? 0 : 20 }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                <path d="m 692.77325,947.19017 c -3.90474,-0.82851 -6.96237,-2.38408 -11.84335,-6.02532 l -3.89607,-2.90648 4.11218,-2.8806 c 2.26171,-1.58432 4.2423,-2.88059 4.40132,-2.88059 0.15902,0 1.38309,0.99978 2.72014,2.22173 5.38507,4.92146 14.870011,5.63889 19.06682,1.44218 4.66395,-4.66395 1.67144,-11.38652 -6.35889,-14.285001 -13.31738,-4.80681 -18.65242,-8.93562 -20.04682,-15.51435 -1.40009,-6.60557 0.80541,-12.78671 5.87202,-16.45695 4.09761,-2.96829 7.9378,-3.87121 14.91796,-3.50755 6.09354,0.31748 10.28256,1.96725 15.26639,6.0124 l 2.06232,1.67389 -4.01361,3.0303 c -3.52332,2.66013 -4.12793,2.89256 -4.94947,1.90266 -1.93018,-2.32573 -6.40592,-3.95661 -10.85839,-3.95661 -3.63825,0 -4.75863,0.32087 -6.63582,1.900422 -1.8805,1.58233 -2.25852,2.43146 -2.25852,5.0732 0,4.17815 2.1435,5.98363 11.322953,9.54292 11.75448,4.55449 15.46266,7.80081 17.31153,15.15536 1.92808,7.66964 -2.09345,15.69854 -9.44774,18.86228 -4.14258,1.78209 -12.23918,2.55355 -16.751533,1.59612 z" />
                <path d="m 318.89482,916.89830 v -29.91314 h 18.35162 18.35162 v 4.77142 4.77142 h -13.21317 -13.21316 v 8.07472 8.07471 h 11.378 11.37801 v 4.40439 4.40439 h -11.37801 -11.378 v 8.07471 8.07471 h 13.61523 13.61522 l -0.21854,4.461146 -0.21855,4.46145 -18.53499,0.12645 -18.535,0.12645 z" />
                <path d="m 408.15280,946.44741 -5.06922,-0.36703 -10.88834,-28.99556 c -5.98859,-15.94756 -10.8921,-29.25778 -10.889669,-29.57827 -0.004,-0.32048 2.33793,-0.48565 5.20562,-0.36703 l 5.21398,0.215567 8.49052,23.38413 8.49052,23.38412 8.50096,-23.56628 8.50096,-23.56628 5.32197,-10e-4 c 2.92708,-7.4e-4 5.32197,0.1024 5.32197,0.22922 0,0.80922 -22.16714,58.90481 -22.59349,59.21296 -0.29126,0.2105 -2.8107,0.21757 -5.59876,0.0157 z" />
                <path d="m 463.26358,946.69259 c -0.0672,-0.067 -0.0323,-13.52792 0.0776,-29.91314 l 0.19971,-29.79129 h 18.27023 18.27022 l 0.24872,4.46792 c 0.13679,2.45736 0.11108,4.6045 -0.0572,4.77142 -0.16821,0.16693 -6.19672,0.3035 -13.39668,0.3035 h -13.09078 v 8.07472 8.07471 h 11.378 11.37801 v 4.40439 4.40439 h -11.37801 -11.378 v 8.07471 8.07471 h 13.5802 13.5802 l -1.1e-4,4.58791 -10e-5,4.5879 h -18.77991 c -10.328944,0 -18.83487,-0.0548 -18.90206,-0.12185 z" />
                <path d="m 537.46548,946.59739 -4.95494,-0.21706 v -29.69608 -29.69609 l 4.95494,0.0214 4.95494,0.0214 3.0072,4.19947 c 1.65396,2.300971 7.80612,10.97122 13.67147,19.2478 5.86535,8.27658 11.37621,15.87416 12.24636,16.88349 l 1.58208,1.83517 -0.0995,-2.2022 c -0.0548,-1.2112 -0.0645,-10.70817 -0.0217,-21.10436 l 0.0778,-18.90217 h 4.77143 4.77142 l 6.5e-4,29.91314 6.6e-4,29.91314 -4.95478,-0.36703 -4.95478,-0.36703 -14.68211,-20.41838 -14.68211,-20.41836 -0.36703,20.7854 -0.36703,20.7854 z" />
                <path d="m 628.97889,946.50859 c -0.16823,-0.16822 -0.30586,-11.48199 -0.30586,-25.14172 v -24.83586 h -9.17581 -9.17581 v -4.771422 -4.77142 h 23.49007 23.49007 v 4.77142 4.77142 h -9.17581 -9.17581 v 25.14172 25.14172 h -4.83259 c -2.65793,0 -4.97023,-0.13764 -5.13845,-0.30586 z" />
              </motion.g>
            </svg>
          </motion.div>

          {/* Texto "LA MÀGIA COMENÇA" */}
          <motion.p
            className="absolute font-light tracking-[0.3em] uppercase text-center"
            style={{
              fontSize: config.textSize,
              top: isMobile ? '18%' : '15%',
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
