'use client';

// ═══════════════════════════════════════════════════════════════════════
// ESPAI SENSORIAL - Client Component
// ═══════════════════════════════════════════════════════════════════════
// Experiència visual interactiva per a persones amb autisme o
// sensibilitat sensorial. Tot és personalitzable.
// Inclou temes temàtics: Halloween, Món Màgic, Disco, Tropical...
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import {
  Sparkles,
  Settings2,
  X,
  Play,
  Pause,
  Moon,
  Sun,
  Heart,
  Home,
  Info,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════
// TIPUS
// ═══════════════════════════════════════════════════════════════════════

type ThemeType = 'calm' | 'elegant' | 'halloween' | 'monmagic' | 'disco' | 'tropical';

interface ThemeConfig {
  id: ThemeType;
  emoji: string;
  particles: string[];
  colors: {
    primary: string;
    background: string;
  };
  specialElement?: 'magicShield' | 'discoBall' | 'pumpkins' | 'palms';
}

// ═══════════════════════════════════════════════════════════════════════
// CONFIGURACIÓ DE TEMES
// ═══════════════════════════════════════════════════════════════════════

const THEMES: ThemeConfig[] = [
  {
    id: 'calm',
    emoji: '🌙',
    particles: ['✨', '🌙', '💫', '⭐'],
    colors: {
      primary: '#a78bfa',
      background: 'from-slate-900 via-purple-950 to-slate-900',
    },
  },
  {
    id: 'elegant',
    emoji: '✨',
    particles: ['✨', '⭐', '💫', '🌟'],
    colors: {
      primary: '#fbbf24',
      background: 'from-black via-amber-950/20 to-black',
    },
  },
  {
    id: 'halloween',
    emoji: '🎃',
    particles: ['🎃', '🦇', '👻', '🕷️', '💀', '🕸️', '🌙'],
    colors: {
      primary: '#f97316',
      background: 'from-black via-orange-950/30 to-black',
    },
    specialElement: 'pumpkins',
  },
  {
    id: 'monmagic',
    emoji: '🧙‍♂️',
    particles: ['⚡', '🧙‍♂️', '🦉', '🪄', '⭐', '✨', '🏰'],
    colors: {
      primary: '#fbbf24',
      background: 'from-slate-900 via-amber-950/20 to-slate-900',
    },
    specialElement: 'magicShield',
  },
  {
    id: 'disco',
    emoji: '🪩',
    particles: ['🪩', '💿', '🎵', '🎶', '✨', '🌟', '💜'],
    colors: {
      primary: '#ec4899',
      background: 'from-black via-fuchsia-950/30 to-black',
    },
    specialElement: 'discoBall',
  },
  {
    id: 'tropical',
    emoji: '🌴',
    particles: ['🌿', '🍃', '🌴', '🌺', '🦜', '🌸', '🌱'],
    colors: {
      primary: '#10b981',
      background: 'from-emerald-950 via-teal-950 to-emerald-950',
    },
    specialElement: 'palms',
  },
];

const PRESET_KEYS = ['relaxed', 'normal', 'party'] as const;
const PRESET_CONFIGS = [
  { key: 'relaxed', speed: 0.3, density: 25 },
  { key: 'normal', speed: 0.6, density: 40 },
  { key: 'party', speed: 1.2, density: 70 },
];

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTS ESPECIALS
// ═══════════════════════════════════════════════════════════════════════

function MagicShield() {
  return (
    <motion.div
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      style={{ zIndex: 0 }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 0.15, scale: 1 }}
      transition={{ duration: 1 }}
    >
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          rotate: [0, 2, -2, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="relative w-64 h-80 sm:w-80 sm:h-96"
      >
        <svg viewBox="0 0 200 250" className="w-full h-full">
          <defs>
            <linearGradient id="magicRed" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#740001" />
              <stop offset="100%" stopColor="#ae0001" />
            </linearGradient>
            <linearGradient id="magicGreen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a472a" />
              <stop offset="100%" stopColor="#2a623d" />
            </linearGradient>
            <linearGradient id="magicBlue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0d6efd" />
              <stop offset="100%" stopColor="#0a58ca" />
            </linearGradient>
            <linearGradient id="magicGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f0c75e" />
              <stop offset="100%" stopColor="#d4a84b" />
            </linearGradient>
          </defs>
          <path
            d="M100 10 L190 50 L190 150 Q190 220 100 245 Q10 220 10 150 L10 50 Z"
            fill="url(#magicRed)"
            stroke="#fbbf24"
            strokeWidth="3"
          />
          <path d="M100 10 L100 245" stroke="#fbbf24" strokeWidth="2" />
          <path d="M10 127 L190 127" stroke="#fbbf24" strokeWidth="2" />
          <path d="M100 10 L190 50 L190 127 L100 127 Z" fill="url(#magicBlue)" opacity="0.8" />
          <path d="M10 50 L100 10 L100 127 L10 127 Z" fill="url(#magicRed)" opacity="0.8" />
          <path d="M10 127 L100 127 L100 245 Q10 220 10 150 Z" fill="url(#magicGold)" opacity="0.8" />
          <path d="M100 127 L190 127 L190 150 Q190 220 100 245 Z" fill="url(#magicGreen)" opacity="0.8" />
          <text x="100" y="145" textAnchor="middle" fontSize="60" fill="#fbbf24" fontFamily="serif" fontWeight="bold">
            H
          </text>
        </svg>
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: [
              '0 0 40px rgba(251, 191, 36, 0.2)',
              '0 0 80px rgba(251, 191, 36, 0.4)',
              '0 0 40px rgba(251, 191, 36, 0.2)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </motion.div>
    </motion.div>
  );
}

function DiscoBall() {
  return (
    <motion.div
      className="fixed top-20 left-1/2 -translate-x-1/2 pointer-events-none"
      style={{ zIndex: 2 }}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, type: 'spring' }}
    >
      <motion.div
        animate={{ rotateY: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="relative w-24 h-24 sm:w-32 sm:h-32"
      >
        <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-300 via-white to-gray-400 relative overflow-hidden shadow-2xl">
          {Array.from({ length: 64 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-white/90 rounded-sm"
              style={{
                left: `${(i % 8) * 12.5}%`,
                top: `${Math.floor(i / 8) * 12.5}%`,
                transform: 'rotate(45deg)',
              }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
            />
          ))}
        </div>
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <motion.div
              key={angle}
              className="absolute top-1/2 left-1/2 w-40 sm:w-60 h-1 origin-left"
              style={{
                transform: `rotate(${angle}deg)`,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.8) 0%, transparent 100%)',
              }}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: angle * 0.01 }}
            />
          ))}
        </motion.div>
      </motion.div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-20 bg-gradient-to-b from-gray-400 to-transparent -translate-y-full" />
    </motion.div>
  );
}

function AnimatedPumpkins() {
  const pumpkins = [
    { x: '10%', y: '20%', size: 60, delay: 0 },
    { x: '85%', y: '30%', size: 50, delay: 0.5 },
    { x: '15%', y: '70%', size: 45, delay: 1 },
    { x: '80%', y: '75%', size: 55, delay: 1.5 },
  ];

  return (
    <>
      {pumpkins.map((p, i) => (
        <motion.div
          key={i}
          className="fixed pointer-events-none"
          style={{ left: p.x, top: p.y, fontSize: p.size, zIndex: 0 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: 0.6,
            scale: 1,
            y: [0, -10, 0],
            rotate: [-5, 5, -5],
          }}
          transition={{
            opacity: { duration: 0.5, delay: p.delay },
            scale: { duration: 0.5, delay: p.delay },
            y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
            rotate: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          🎃
        </motion.div>
      ))}
    </>
  );
}

function TropicalPalms() {
  return (
    <>
      <motion.div
        className="fixed bottom-0 left-0 text-8xl pointer-events-none opacity-30"
        style={{ zIndex: 0 }}
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        🌴
      </motion.div>
      <motion.div
        className="fixed bottom-0 right-0 text-8xl pointer-events-none opacity-30 scale-x-[-1]"
        style={{ zIndex: 0 }}
        animate={{ rotate: [5, -5, 5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        🌴
      </motion.div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════

export default function SensorialClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<any[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const t = useTranslations('sensorial');

  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(THEMES[0]);
  const [speed, setSpeed] = useState(0.5);
  const [density, setDensity] = useState(35);
  const [touchEnabled, setTouchEnabled] = useState(true);
  const [showPanel, setShowPanel] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Canvas animation amb partícules emoji
  useEffect(() => {
    if (!mounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    const createParticles = () => {
      const count = Math.floor(density * (window.innerWidth / 1920));
      const particles: Array<{ x: number; y: number; vx: number; vy: number; size: number; emoji: string; rotation: number; rotationSpeed: number; opacity: number }> = [];

      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          size: 20 + Math.random() * 30,
          emoji: currentTheme.particles[Math.floor(Math.random() * currentTheme.particles.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 2,
          opacity: 0.6 + Math.random() * 0.4,
        });
      }
      return particles;
    };

    particlesRef.current = createParticles();

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    // Animation loop
    const animate = () => {
      if (isPaused) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        // Movement
        p.x += p.vx * speed;
        p.y += p.vy * speed;
        p.rotation += p.rotationSpeed * speed;

        // Bouncing
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Mouse attraction
        if (touchEnabled) {
          const dx = mouseRef.current.x - p.x;
          const dy = mouseRef.current.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            p.vx += dx * 0.0005;
            p.vy += dy * 0.0005;
          }
        }

        // Draw emoji
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.font = `${p.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.emoji, 0, 0);
        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, [currentTheme, speed, density, touchEnabled, isPaused, mounted]);

  // Recreate particles when theme/density changes
  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const count = Math.floor(density * (window.innerWidth / 1920));
    const particles: Array<{ x: number; y: number; vx: number; vy: number; size: number; emoji: string; rotation: number; rotationSpeed: number; opacity: number }> = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        size: 20 + Math.random() * 30,
        emoji: currentTheme.particles[Math.floor(Math.random() * currentTheme.particles.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 2,
        opacity: 0.6 + Math.random() * 0.4,
      });
    }
    particlesRef.current = particles;
  }, [currentTheme, density, speed, mounted]);

  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-6xl"
        >
          ✨
        </motion.div>
      </div>
    );
  }

  return (
    <main className={`fixed inset-0 bg-gradient-to-br ${currentTheme.colors.background} overflow-hidden transition-all duration-1000`}>
      {/* Canvas de partícules */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }} />

      {/* Elements especials segons tema */}
      {currentTheme.specialElement === 'magicShield' && <MagicShield />}
      {currentTheme.specialElement === 'discoBall' && <DiscoBall />}
      {currentTheme.specialElement === 'pumpkins' && <AnimatedPumpkins />}
      {currentTheme.specialElement === 'palms' && <TropicalPalms />}

      {/* Missatge central (només en mode calm) */}
      {currentTheme.id === 'calm' && (
        <motion.div
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.p
            className="text-3xl sm:text-5xl font-normal text-white/50"
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            {t('breathe')}
          </motion.p>
        </motion.div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 sm:p-6">
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 hover:bg-black/80 transition-colors"
          >
            <span className="text-xl">🪐</span>
            <span className="text-white/80 text-sm font-medium hidden sm:inline">{t('brandName')}</span>
          </Link>

          <motion.h1
            className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Sparkles className="w-6 h-6" style={{ color: currentTheme.colors.primary }} />
            <span className="hidden sm:inline">{t('title')}</span>
          </motion.h1>

          <div className="flex gap-2">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
              aria-label={t('ariaInfo')}
            >
              <Info className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowPanel(!showPanel)}
              className="p-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
              aria-label={t('ariaSettings')}
            >
              <Settings2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Panel d'informació */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-50 p-6 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10"
          >
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-400" />
              {t('infoTitle')}
            </h3>
            <p className="text-white/70 text-sm leading-relaxed">
              {t('infoP1')}
            </p>
            <p className="text-white/70 text-sm leading-relaxed mt-3">
              {t('infoP2')}
            </p>
            <button
              onClick={() => setShowInfo(false)}
              className="mt-4 w-full py-2 bg-white/10 rounded-lg text-white/80 hover:bg-white/20 transition-colors"
            >
              {t('understood')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel de controls */}
      <AnimatePresence>
        {showPanel && (
          <motion.aside
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-50 p-4 sm:p-6
                     bg-black/80 backdrop-blur-xl rounded-l-3xl border border-white/10
                     max-h-[80vh] overflow-y-auto w-72 sm:w-80"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5" style={{ color: currentTheme.colors.primary }} />
                {t('controls')}
              </h2>
              <button
                onClick={() => setShowPanel(false)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Selector de tema */}
            <fieldset className="mb-6">
              <legend className="text-white/60 text-sm uppercase tracking-wider mb-3 font-medium">
                {t('chooseTheme')}
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {THEMES.map((theme) => (
                  <motion.button
                    key={theme.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentTheme(theme)}
                    className={`p-3 rounded-xl text-left transition-all ${
                      currentTheme.id === theme.id
                        ? 'bg-white/20 ring-2 ring-white/50'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-2xl">{theme.emoji}</span>
                    <p className="text-white text-sm font-medium mt-1">{t(`themes.${theme.id}.name`)}</p>
                    <p className="text-white/60 text-xs">{t(`themes.${theme.id}.description`)}</p>
                  </motion.button>
                ))}
              </div>
            </fieldset>

            {/* Presets ràpids */}
            <div className="mb-6">
              <label className="text-white/60 text-sm uppercase tracking-wider mb-3 font-medium block">
                {t('presets')}
              </label>
              <div className="flex gap-2">
                {PRESET_CONFIGS.map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => {
                      setSpeed(preset.speed);
                      setDensity(preset.density);
                    }}
                    className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 rounded-lg text-white text-sm transition-colors"
                  >
                    {t(`presetNames.${preset.key}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider velocitat */}
            <div className="mb-6">
              <label className="text-white/60 text-sm mb-2 flex justify-between">
                <span>{t('speed')}</span>
                <span className="text-white/80 font-mono">{speed.toFixed(1)}x</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-xs text-white/60 mt-1">
                <span>{t('slow')}</span>
                <span>{t('fast')}</span>
              </div>
            </div>

            {/* Slider densitat */}
            <div className="mb-6">
              <label className="text-white/60 text-sm mb-2 flex justify-between">
                <span>{t('density')}</span>
                <span className="text-white/80 font-mono">{density}</span>
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={density}
                onChange={(e) => setDensity(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-xs text-white/60 mt-1">
                <span>{t('few')}</span>
                <span>{t('many')}</span>
              </div>
            </div>

            {/* Toggle interacció */}
            <div className="mb-6">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-white/60 text-sm">{t('touchInteraction')}</span>
                <div
                  onClick={() => setTouchEnabled(!touchEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    touchEnabled ? 'bg-green-500' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      touchEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </div>
              </label>
              <p className="text-white/60 text-xs mt-1">
                {t('touchDescription')}
              </p>
            </div>

            {/* Controls play/pause */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
              >
                {isPaused ? <Play className="w-4 h-4 text-white" /> : <Pause className="w-4 h-4 text-white" />}
                <span className="text-sm text-white">{isPaused ? t('play') : t('pause')}</span>
              </button>
            </div>

            {/* Info accessibilitat */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white/80 text-sm font-medium mb-1">{t('madeWithLove')}</p>
                  <p className="text-white/50 text-xs">
                    {t('forSpecialPeople')}
                  </p>
                </div>
              </div>
            </div>

            {/* Tornar a l'inici */}
            <Link
              href="/"
              className="flex items-center justify-center gap-2 mt-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            >
              <Home className="w-4 h-4" />
              <span className="text-sm">{t('backHome')}</span>
            </Link>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Botó flotant per mostrar panel (quan està amagat) */}
      {!showPanel && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setShowPanel(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 flex items-center justify-center z-50 hover:bg-black/90 transition-colors"
        >
          <Settings2 className="w-6 h-6" style={{ color: currentTheme.colors.primary }} />
        </motion.button>
      )}
    </main>
  );
}
