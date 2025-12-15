/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * HERO PORTAL LOGO - VERSIÓ DEFINITIVA CINEMATOGRÀFICA
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * SOLUCIONA:
 * ✅ ZERO FLICKER - Telón negre des del PRIMER FRAME (inline style + CSS)
 * ✅ TEXT VISIBLE - "ÒRBITA EVENTS" prominent i animat
 * ✅ Transicions cinematogràfiques ultra-suaus
 * ✅ Responsive (mòbil optimitzat)
 * ✅ Skip amb tap en mòbil
 * ✅ Performance optimitzada (will-change, GPU acceleration)
 * 
 * IMPORTANT: Aquest component reemplaça HeroPortalLogo.tsx
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPUS I CONFIGURACIÓ
// ═══════════════════════════════════════════════════════════════════════════════

interface HeroPortalLogoProps {
  onFinish?: () => void;
  totalMs?: number;   // Compatibilitat amb l'antic
  duration?: number;  // ms total
  fadeMs?: number;    // Ignorat, mantenim per compatibilitat
}

type AnimationPhase = 'black' | 'glow' | 'logo' | 'text' | 'tagline' | 'complete' | 'fadeout';

// Easing cinematogràfic
const CINEMATIC_EASE = [0.22, 0.61, 0.36, 1] as const;

export default function HeroPortalLogo({ 
  onFinish, 
  totalMs,
  duration: durationProp,
  fadeMs: _fadeMs, // Ignorat
}: HeroPortalLogoProps) {
  // Usar totalMs si existeix (compatibilitat), sinó duration
  const duration = totalMs || durationProp || 5500;
  
  const [phase, setPhase] = useState<AnimationPhase>('black');
  const [mounted, setMounted] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const hasStarted = useRef(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  // Detectar mòbil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Seqüència d'animació - MÒBIL MÉS RÀPID I IMPACTANT
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    // MÒBIL: 3 segons màxim, tot més ràpid
    // DESKTOP: 5.5 segons, més cinematogràfic
    
    if (isMobile) {
      // Timeline MÒBIL - RÀPID I IMPACTANT
      // Total: 3000ms
      timersRef.current.push(setTimeout(() => setPhase('glow'), 100));
      timersRef.current.push(setTimeout(() => setPhase('logo'), 200));
      timersRef.current.push(setTimeout(() => setPhase('text'), 500));
      timersRef.current.push(setTimeout(() => setPhase('tagline'), 800));
      timersRef.current.push(setTimeout(() => setPhase('complete'), 1000));
      timersRef.current.push(setTimeout(() => setPhase('fadeout'), 2200));
      
      timersRef.current.push(setTimeout(() => {
        setMounted(false);
        onFinish?.();
      }, 3000));
    } else {
      // Timeline DESKTOP - Cinematogràfic
      const actualDuration = duration;
      
      timersRef.current.push(setTimeout(() => setPhase('glow'), 300));
      timersRef.current.push(setTimeout(() => setPhase('logo'), 600));
      timersRef.current.push(setTimeout(() => setPhase('text'), 1400));
      timersRef.current.push(setTimeout(() => setPhase('tagline'), 2400));
      timersRef.current.push(setTimeout(() => setPhase('complete'), 3000));
      timersRef.current.push(setTimeout(() => setPhase('fadeout'), actualDuration - 1200));
      
      timersRef.current.push(setTimeout(() => {
        setMounted(false);
        onFinish?.();
      }, actualDuration));
    }

    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
    };
  }, [duration, isMobile, onFinish]);

  // Skip amb tap (mòbil) - AMB HAPTIC FEEDBACK
  const handleSkip = useCallback(() => {
    if (!isMobile) return;
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }

    timersRef.current.forEach(t => clearTimeout(t));
    setPhase('fadeout');
    
    setTimeout(() => {
      setMounted(false);
      onFinish?.();
    }, 300); // Més ràpid en skip
  }, [isMobile, onFinish]);

  if (!mounted) return null;

  // Helper per determinar visibilitat
  const isVisible = (fromPhase: AnimationPhase) => {
    const order: AnimationPhase[] = ['black', 'glow', 'logo', 'text', 'tagline', 'complete', 'fadeout'];
    const currentIndex = order.indexOf(phase);
    const fromIndex = order.indexOf(fromPhase);
    return currentIndex >= fromIndex;
  };

  return (
    <AnimatePresence>
      {mounted && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === 'fadeout' ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: CINEMATIC_EASE }}
          onClick={handleSkip}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          // 🔥 CRÍTICO: Background negre INLINE per evitar qualsevol flash
          style={{ 
            backgroundColor: '#000000',
            cursor: isMobile ? 'pointer' : 'default',
            // Optimitzacions de renderització
            contain: 'paint layout',
            willChange: 'opacity',
          }}
        >
          {/* Capa base negra - SEMPRE PRESENT */}
          <div 
            className="absolute inset-0" 
            style={{ 
              backgroundColor: '#000000',
              zIndex: 0 
            }}
            aria-hidden="true"
          />

          {/* Glow central - apareix primer */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: isVisible('glow') && phase !== 'fadeout' ? 1 : 0 }}
            transition={{ duration: 1.5, ease: CINEMATIC_EASE }}
            style={{ zIndex: 1 }}
          >
            <div
              style={{
                width: '80vmin',
                height: '80vmin',
                maxWidth: '600px',
                maxHeight: '600px',
                background: 'radial-gradient(circle, rgba(251,191,36,0.12) 0%, rgba(251,191,36,0.04) 40%, transparent 70%)',
              }}
            />
          </motion.div>

          {/* Partícules - apareixen amb el glow */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: isVisible('glow') ? 0.7 : 0 }}
            transition={{ duration: 2, ease: 'easeOut' }}
            style={{ zIndex: 2 }}
          >
            <ParticleField />
          </motion.div>

          {/* Contingut central */}
          <motion.div
            className="relative flex flex-col items-center px-4"
            style={{ zIndex: 10 }}
          >
            {/* LOGO - Planeta amb anell */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ 
                opacity: isVisible('logo') ? 1 : 0,
                scale: isVisible('logo') ? 1 : 0.85,
                y: isVisible('logo') ? 0 : 30
              }}
              transition={{ 
                duration: 1.2, 
                ease: CINEMATIC_EASE,
              }}
              className="relative"
            >
              {/* SVG del planeta */}
              <svg 
                viewBox="0 0 200 200" 
                className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44"
                style={{
                  filter: 'drop-shadow(0 0 40px rgba(251,191,36,0.5))',
                }}
              >
                <defs>
                  <radialGradient id="planetGradient" cx="30%" cy="30%">
                    <stop offset="0%" stopColor="#fde68a" />
                    <stop offset="40%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#b45309" />
                  </radialGradient>
                  <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#92400e" />
                    <stop offset="50%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#92400e" />
                  </linearGradient>
                </defs>
                
                {/* Anell posterior */}
                <ellipse 
                  cx="100" cy="100" rx="85" ry="22"
                  fill="none" 
                  stroke="url(#ringGradient)" 
                  strokeWidth="5"
                  opacity="0.4"
                />
                
                {/* Planeta */}
                <circle cx="100" cy="100" r="42" fill="url(#planetGradient)" />
                
                {/* Ombra del planeta */}
                <circle 
                  cx="100" cy="100" r="42" 
                  fill="url(#planetGradient)"
                  style={{ filter: 'brightness(0.6)' }}
                  clipPath="inset(0 0 0 50%)"
                />
                
                {/* Anell frontal */}
                <path
                  d="M 15,100 Q 100,125 185,100"
                  fill="none"
                  stroke="url(#ringGradient)"
                  strokeWidth="5"
                  strokeLinecap="round"
                />

                {/* Satèl·lit amb glow */}
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isVisible('text') ? 1 : 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <circle cx="165" cy="82" r="12" fill="rgba(251,191,36,0.3)" />
                  <circle cx="165" cy="82" r="7" fill="#fbbf24" />
                </motion.g>
              </svg>
            </motion.div>

            {/* TEXT: ÒRBITA */}
            <motion.h1
              className="mt-4 sm:mt-6 text-center select-none"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ 
                opacity: isVisible('text') ? 1 : 0,
                y: isVisible('text') ? 0 : 20,
                scale: isVisible('text') ? 1 : 0.95
              }}
              transition={{ duration: 1, ease: CINEMATIC_EASE }}
              style={{
                fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 40%, #f59e0b 70%, #fbbf24 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                textShadow: '0 0 60px rgba(251,191,36,0.6)',
              }}
            >
              ÒRBITA
            </motion.h1>
            
            {/* TEXT: EVENTS */}
            <motion.p
              className="text-center select-none"
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: isVisible('tagline') ? 1 : 0,
                y: isVisible('tagline') ? 0 : 10
              }}
              transition={{ duration: 0.8, ease: CINEMATIC_EASE }}
              style={{
                fontSize: 'clamp(1.2rem, 4vw, 2rem)',
                fontWeight: 300,
                letterSpacing: '0.35em',
                color: 'rgba(255,255,255,0.85)',
                marginTop: '0.25rem',
              }}
            >
              EVENTS
            </motion.p>

            {/* Tagline */}
            <motion.p
              className="mt-8 sm:mt-10 text-center select-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: isVisible('complete') ? 1 : 0 }}
              transition={{ duration: 1.2 }}
              style={{
                fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
                fontWeight: 400,
                letterSpacing: '0.2em',
                color: 'rgba(251,191,36,0.6)',
                textTransform: 'uppercase',
              }}
            >
              La màgia comença
            </motion.p>
          </motion.div>

          {/* Indicador skip (mòbil) */}
          {isMobile && (
            <motion.div
              className="absolute bottom-8 left-0 right-0 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: isVisible('complete') ? 0.6 : 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <p className="text-white/40 text-xs tracking-widest uppercase">
                Toca per continuar
              </p>
            </motion.div>
          )}

          {/* Vignette elegant */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 80% 80% at center, transparent 20%, rgba(0,0,0,0.6) 100%)',
              zIndex: 20,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Partícules de fons
// ═══════════════════════════════════════════════════════════════════════════════

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Partícules
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      opacity: number;
      pulse: number;
    }> = [];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 1 + Math.random() * 3,
        speedY: 0.1 + Math.random() * 0.3,
        opacity: 0.1 + Math.random() * 0.4,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.y -= p.speedY;
        p.pulse += 0.02;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        const alpha = p.opacity * (0.5 + Math.sin(p.pulse) * 0.5);
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251, 191, 36, ${alpha})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{ opacity: 0.6 }}
    />
  );
}

export { HeroPortalLogo };
