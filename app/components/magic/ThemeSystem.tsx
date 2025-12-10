// ============================================================
// ÒRBITA EVENTS - SISTEMA DE TEMES MÀGICS
// ============================================================
// Arxiu: app/components/magic/ThemeSystem.tsx
// ============================================================

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

// ════════════════════════════════════════════════════════════
// TIPUS I CONFIGURACIÓ
// ════════════════════════════════════════════════════════════

export type MagicTheme = 'elegant' | 'halloween' | 'monmagic' | 'disco' | 'tropical';

interface ThemeConfig {
  id: MagicTheme;
  name: string;
  icon: string;
  colors: {
    bg: string;
    bgGradient: string;
    accent: string;
    secondary: string;
    glow: string;
  };
  particles: {
    type: 'bubbles' | 'bats' | 'stars' | 'confetti' | 'leaves' | 'tropical-leaves';
    count: number;
    color: string;
  };
  cursor: {
    emoji: string;
    trail: boolean;
    trailColor?: string;
  };
  elements: string[];
  sounds?: {
    ambient?: string;
    click?: string;
  };
}

export const THEME_CONFIGS: Record<MagicTheme, ThemeConfig> = {
  elegant: {
    id: 'elegant',
    name: 'Elegant',
    icon: '✨',
    colors: {
      bg: '#0a0a0a',
      bgGradient: 'linear-gradient(to bottom, #0a0a0a, #0f0f12)',
      accent: '#d7b86e',
      secondary: '#9333ea',
      glow: 'rgba(215, 184, 110, 0.4)',
    },
    particles: { type: 'bubbles', count: 80, color: 'rgba(215, 184, 110, 0.6)' },
    cursor: { emoji: '✨', trail: false },
    elements: [],
  },
  halloween: {
    id: 'halloween',
    name: 'Halloween',
    icon: '🎃',
    colors: {
      bg: '#0a0505',
      bgGradient: 'linear-gradient(to bottom, #1a0a0a, #0a0505)',
      accent: '#ff6b00',
      secondary: '#00ff00',
      glow: 'rgba(255, 107, 0, 0.5)',
    },
    particles: { type: 'bats', count: 25, color: '#000' },
    cursor: { emoji: '🎃', trail: false },
    elements: ['ghost', 'spider', 'pumpkins', 'candles'],
  },
  monmagic: {
    id: 'monmagic',
    name: 'Món Màgic',
    icon: '🧙‍♂️',
    colors: {
      bg: '#0a0a14',
      bgGradient: 'linear-gradient(to bottom, #0a0a14, #14141e)',
      accent: '#ffd700',
      secondary: '#740001',
      glow: 'rgba(255, 215, 0, 0.5)',
    },
    particles: { type: 'stars', count: 100, color: 'rgba(255, 215, 0, 0.8)' },
    cursor: { emoji: '🪄', trail: true, trailColor: '#ffd700' },
    elements: ['owl', 'lightning', 'magicShield'],
  },
  disco: {
    id: 'disco',
    name: 'Disco',
    icon: '🪩',
    colors: {
      bg: '#0a0a0a',
      bgGradient: 'linear-gradient(45deg, #0a0a14, #140a14, #0a140a)',
      accent: '#ff00ff',
      secondary: '#00ffff',
      glow: 'rgba(255, 0, 255, 0.5)',
    },
    particles: { type: 'confetti', count: 100, color: 'rainbow' },
    cursor: { emoji: '💫', trail: true, trailColor: 'rainbow' },
    elements: ['discoball', 'lights'],
  },
  tropical: {
    id: 'tropical',
    name: 'Tropical',
    icon: '🌴',
    colors: {
      bg: '#0a1414',
      bgGradient: 'linear-gradient(to bottom, #0a1414, #001a1a)',
      accent: '#ff6b35',
      secondary: '#00d4aa',
      glow: 'rgba(0, 212, 170, 0.4)',
    },
    particles: { type: 'tropical-leaves', count: 20, color: 'rgba(0, 180, 100, 0.6)' },
    cursor: { emoji: '🌺', trail: false },
    elements: ['palmtrees', 'sun'],
  },
};

// ════════════════════════════════════════════════════════════
// CONTEXT
// ════════════════════════════════════════════════════════════

interface ThemeContextType {
  theme: MagicTheme;
  setTheme: (_theme: MagicTheme) => void;
  config: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'elegant',
  setTheme: () => {},
  config: THEME_CONFIGS.elegant,
});

export const useTheme = () => useContext(ThemeContext);

// ════════════════════════════════════════════════════════════
// PROVIDER PRINCIPAL
// ════════════════════════════════════════════════════════════

export function MagicThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<MagicTheme>('elegant');
  const [hasMounted, setHasMounted] = useState(false);
  const config = THEME_CONFIGS[theme];

  // Marcar com a muntat al client
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Aplicar CSS variables quan canvia el tema (només al client)
  useEffect(() => {
    if (!hasMounted) return;
    const root = document.documentElement;
    root.style.setProperty('--theme-bg', config.colors.bg);
    root.style.setProperty('--theme-accent', config.colors.accent);
    root.style.setProperty('--theme-secondary', config.colors.secondary);
    root.style.setProperty('--theme-glow', config.colors.glow);
    root.setAttribute('data-theme', theme);
  }, [theme, config, hasMounted]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, config }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ════════════════════════════════════════════════════════════
// SELECTOR DE TEMES (Desktop)
// ════════════════════════════════════════════════════════════

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    const handleResize = () => setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // No renderitzar res fins que estem al client
  if (!mounted) return null;
  // En mòbil, no mostrar aquest component (usar MobileThemeSwitcher)
  if (isMobile) return null;

  const themes = Object.values(THEME_CONFIGS);

  return (
    <div className="fixed bottom-6 left-6 z-[100]">
      {/* Botó principal */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-black/80 backdrop-blur-xl border-2 border-white/20 flex items-center justify-center text-3xl shadow-2xl"
        whileHover={{ scale: 1.1, borderColor: 'rgba(215, 184, 110, 0.5)' }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 180 : 0 }}
      >
        🎭
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="absolute left-20 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-black/90 backdrop-blur-xl border border-white/20 whitespace-nowrap"
          >
            <span className="text-white/80 text-sm">Prova la nostra màgia! ✨</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel de temes */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 left-0 p-4 rounded-3xl bg-black/95 backdrop-blur-2xl border border-white/20 shadow-2xl min-w-[280px]"
          >
            <p className="text-white/60 text-sm mb-4 text-center">
              Transforma la web. Imagina el teu event.
            </p>

            <div className="grid grid-cols-1 gap-2">
              {themes.map((t) => (
                <motion.button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setTimeout(() => setIsOpen(false), 300);
                  }}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${
                    theme === t.id
                      ? 'bg-gradient-to-r from-white/20 to-white/10 border border-white/30'
                      : 'hover:bg-white/10 border border-transparent'
                  }`}
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-3xl">{t.icon}</span>
                  <span className="text-white font-medium">{t.name}</span>
                  {theme === t.id && (
                    <motion.div
                      layoutId="active-indicator"
                      className="ml-auto w-3 h-3 rounded-full"
                      style={{ backgroundColor: t.colors.accent }}
                    />
                  )}
                </motion.button>
              ))}
            </div>

            <p className="text-white/40 text-xs mt-4 text-center">
              🎃 Escriu "BOO" | 🪄 Escriu "LUMOS"
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SELECTOR DE TEMES (Mòbil)
// ════════════════════════════════════════════════════════════

export function MobileThemeSwitcher() {
  const { theme, setTheme, config } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  const currentTheme = THEME_CONFIGS[theme];

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    const handleResize = () => setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelect = (themeId: MagicTheme) => {
    setTheme(themeId);
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
    // Delay close for animation
    setTimeout(() => setIsOpen(false), 200);
  };

  const togglePanel = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
    setIsOpen(!isOpen);
  };

  // No renderitzar res fins que estem al client
  if (!mounted) return null;
  if (!isMobile) return null;

  return (
    <>
      {/* Botó flotant amb pulsació */}
      <motion.button
        onClick={togglePanel}
        className="fixed bottom-4 left-4 z-[9999] w-16 h-16 rounded-full bg-black/80 backdrop-blur-md border-2 shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        whileTap={{ scale: 0.9 }}
        animate={{
          scale: [1, 1.05, 1],
          boxShadow: [
            `0 0 20px ${currentTheme.colors.glow}`,
            `0 0 30px ${currentTheme.colors.glow}`,
            `0 0 20px ${currentTheme.colors.glow}`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          borderColor: currentTheme.colors.accent,
        }}
      >
        <span className="text-3xl">{currentTheme.icon}</span>
      </motion.button>

      {/* Panel Fullscreen amb grid 2x3 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex flex-col"
            style={{
              background: `linear-gradient(135deg, ${config.colors.bg} 0%, #0a0a0a 100%)`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 pt-safe">
              <div>
                <h2 className="text-2xl font-bold text-white">🎭 Tria el teu món</h2>
                <p className="text-sm text-white/50 mt-1">Transforma l'experiència</p>
              </div>
              <motion.button
                onClick={() => setIsOpen(false)}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"
                whileTap={{ scale: 0.9 }}
              >
                <span className="text-2xl text-white/70">✕</span>
              </motion.button>
            </div>

            {/* Grid de temes 2x3 */}
            <div className="flex-1 p-4 grid grid-cols-2 gap-4 content-center">
              {Object.values(THEME_CONFIGS).map((t, index) => (
                <motion.button
                  key={t.id}
                  onClick={() => handleSelect(t.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className={`relative aspect-square rounded-3xl flex flex-col items-center justify-center gap-3 transition-all duration-300 overflow-hidden ${
                    theme === t.id
                      ? 'bg-white/15 scale-[1.02]'
                      : 'bg-white/5 active:bg-white/10 active:scale-[0.98]'
                  }`}
                  style={{
                    border: theme === t.id ? `3px solid ${t.colors.accent}` : '3px solid transparent',
                    boxShadow: theme === t.id ? `0 0 30px ${t.colors.glow}` : 'none',
                  }}
                >
                  {/* Fons gradient del tema */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: `radial-gradient(circle at center, ${t.colors.accent}40 0%, transparent 70%)`,
                    }}
                  />

                  {/* Icona gran */}
                  <motion.span
                    className="text-6xl relative z-10"
                    animate={theme === t.id ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {t.icon}
                  </motion.span>

                  {/* Nom */}
                  <span className="text-white font-bold text-lg relative z-10">{t.name}</span>

                  {/* Badge actiu */}
                  {theme === t.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white flex items-center justify-center"
                    >
                      <span className="text-sm">✓</span>
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Footer amb hint */}
            <div className="p-4 pb-safe text-center">
              <p className="text-white/40 text-sm">
                📱 2x sacseja = efecte màgic · 4x sacseja = canvi tema
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ════════════════════════════════════════════════════════════
// PARTÍCULES TEMÀTIQUES
// ════════════════════════════════════════════════════════════

export function ThemeParticles() {
  const { theme, config } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
  }, []);

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

    const createParticles = () => {
      const { type, count } = config.particles;

      // Detectar dispositius de gama baixa
      const isLowEnd = typeof navigator !== 'undefined' && (
        (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
        // @ts-ignore - deviceMemory no està en tots els navegadors
        (navigator.deviceMemory && navigator.deviceMemory <= 4)
      );

      // Reduir partícules segons dispositiu
      // - Mòbil gama baixa: 20%
      // - Mòbil normal: 35%
      // - Desktop: 60%
      const actualCount = isMobile
        ? Math.floor(count * (isLowEnd ? 0.2 : 0.35))
        : Math.floor(count * 0.6);

      return Array.from({ length: actualCount }, () => {
        const base = {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: 0,
          speed: 0,
          angle: 0,
          opacity: 0,
        };

        switch (type) {
          case 'bubbles':
            return {
              ...base,
              y: canvas.height + Math.random() * 100,
              size: 3 + Math.random() * 8,
              speed: 0.3 + Math.random() * 0.7,
              wobble: Math.random() * Math.PI * 2,
              opacity: 0.3 + Math.random() * 0.4,
            };
          case 'bats':
            return {
              ...base,
              x: -50,
              y: Math.random() * canvas.height * 0.7,
              size: 20 + Math.random() * 20,
              speed: 1 + Math.random() * 2,
              wingPhase: Math.random() * Math.PI * 2,
              opacity: 0.8,
            };
          case 'stars':
            return {
              ...base,
              size: 1 + Math.random() * 3,
              twinkle: Math.random() * Math.PI * 2,
              twinkleSpeed: 0.02 + Math.random() * 0.03,
              opacity: 0.5 + Math.random() * 0.5,
            };
          case 'confetti':
            return {
              ...base,
              y: -20,
              size: 8 + Math.random() * 8,
              speed: 1 + Math.random() * 2,
              rotation: Math.random() * 360,
              rotationSpeed: (Math.random() - 0.5) * 10,
              color: `hsl(${Math.random() * 360}, 100%, 50%)`,
              opacity: 0.9,
            };
          case 'leaves':
            return {
              ...base,
              y: -20,
              size: 15 + Math.random() * 15,
              speed: 0.5 + Math.random() * 1,
              rotation: Math.random() * 360,
              rotationSpeed: (Math.random() - 0.5) * 3,
              wobble: Math.random() * Math.PI * 2,
              opacity: 0.6,
            };
          case 'tropical-leaves':
            // Fulles VERDES tropicals (no seques!)
            return {
              ...base,
              y: -20,
              size: 20 + Math.random() * 15,
              speed: 0.3 + Math.random() * 0.5, // Més lent, més relaxat
              rotation: Math.random() * 360,
              rotationSpeed: (Math.random() - 0.5) * 2,
              wobble: Math.random() * Math.PI * 2,
              opacity: 0.5,
              emoji: ['🌿', '🍃', '🌱', '🪻'][Math.floor(Math.random() * 4)], // Fulles VERDES
            };
          default:
            return base;
        }
      });
    };

    particlesRef.current = createParticles();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        ctx.save();

        switch (config.particles.type) {
          case 'bubbles':
            p.y -= p.speed;
            p.x += Math.sin(p.wobble) * 0.5;
            p.wobble += 0.02;

            if (p.y < -p.size) {
              p.y = canvas.height + p.size;
              p.x = Math.random() * canvas.width;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(215, 184, 110, ${p.opacity})`;
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(215, 184, 110, 0.5)';
            ctx.fill();
            break;

          case 'bats':
            p.x += p.speed;
            p.y += Math.sin(p.wingPhase) * 2;
            p.wingPhase += 0.15;

            if (p.x > canvas.width + 50) {
              p.x = -50;
              p.y = Math.random() * canvas.height * 0.7;
            }

            ctx.translate(p.x, p.y);
            ctx.fillStyle = '#000';
            ctx.font = `${p.size}px Arial`;
            ctx.fillText('🦇', 0, 0);
            break;

          case 'stars':
            p.twinkle += p.twinkleSpeed;
            const starOpacity = 0.3 + Math.abs(Math.sin(p.twinkle)) * 0.7;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 215, 0, ${starOpacity})`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
            ctx.fill();
            break;

          case 'confetti':
            p.y += p.speed;
            p.x += Math.sin(p.rotation * 0.1) * 0.5;
            p.rotation += p.rotationSpeed;

            if (p.y > canvas.height + 20) {
              p.y = -20;
              p.x = Math.random() * canvas.width;
            }

            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
            break;

          case 'leaves':
            p.y += p.speed;
            p.x += Math.sin(p.wobble) * 1;
            p.wobble += 0.02;
            p.rotation += p.rotationSpeed;

            if (p.y > canvas.height + 20) {
              p.y = -20;
              p.x = Math.random() * canvas.width;
            }

            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.font = `${p.size}px Arial`;
            // Hojas tropicales verdes en lugar de hojas secas
            const tropicalLeaves = ['🌿', '🍃', '🌱', '🪴'];
            ctx.fillText(tropicalLeaves[Math.floor(p.x) % 4], 0, 0);
            break;

          case 'tropical-leaves':
            // Fulles VERDES tropicals - moviment més suau i relaxat
            p.y += p.speed;
            p.x += Math.sin(p.wobble) * 0.8;
            p.wobble += 0.015; // Moviment més lent
            p.rotation += p.rotationSpeed;

            if (p.y > canvas.height + 20) {
              p.y = -20;
              p.x = Math.random() * canvas.width;
            }

            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.font = `${p.size}px Arial`;
            ctx.fillText(p.emoji || '🌿', 0, 0);
            break;
        }

        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [theme, config, isMobile, mounted]);

  // No renderitzar canvas fins que estem al client
  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ opacity: 0.4, zIndex: -1 }}
    />
  );
}

// ════════════════════════════════════════════════════════════
// ELEMENTS TEMÀTICS
// ════════════════════════════════════════════════════════════

export function ThemeElements() {
  const { theme } = useTheme();
  const pathname = usePathname();
  const [ghostVisible, setGhostVisible] = useState(false);
  const [ghostY, setGhostY] = useState(100);
  const [windowWidth, setWindowWidth] = useState(1500);
  const [owlDirection, setOwlDirection] = useState<'left' | 'right'>('left');
  const [mounted, setMounted] = useState(false);

  // Només mostrar elements temàtics en pàgines específiques
  // Això redueix la intensitat de la tematització a la resta de la web
  const showThemeElements = pathname?.includes('/sensorial') ||
    pathname?.includes('/boda-halloween') ||
    pathname?.includes('/tematizacion') ||
    pathname?.includes('/servicios');

  // Get window width safely
  useEffect(() => {
    setMounted(true);
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Halloween ghost animation
  useEffect(() => {
    if (theme !== 'halloween' || !showThemeElements) return;

    const interval = setInterval(() => {
      if (Math.random() > 0.5) {
        setGhostY(Math.random() * 400 + 100);
        setGhostVisible(true);
        setTimeout(() => setGhostVisible(false), 5000);
      }
    }, 8000);

    // Show ghost on theme activation
    setTimeout(() => {
      setGhostY(200);
      setGhostVisible(true);
      setTimeout(() => setGhostVisible(false), 5000);
    }, 2000);

    return () => clearInterval(interval);
  }, [theme, showThemeElements]);

  // Món Màgic owl direction change
  useEffect(() => {
    if (theme !== 'monmagic' || !showThemeElements) return;
    const interval = setInterval(() => {
      setOwlDirection(prev => prev === 'left' ? 'right' : 'left');
    }, 20000);
    return () => clearInterval(interval);
  }, [theme, showThemeElements]);

  // No renderitzar res fins que estem al client o si no estem a pàgines temàtiques
  if (!mounted || !showThemeElements) return null;

  return (
    <>
      {/* ══════════════════════════════════════════════════════════
          HALLOWEEN - Elements complets
          ══════════════════════════════════════════════════════════ */}
      {theme === 'halloween' && (
        <>
          {/* Fantasma que creua la pantalla */}
          <AnimatePresence>
            {ghostVisible && (
              <motion.div
                className="fixed pointer-events-none z-30"
                initial={{ x: -100, opacity: 0.9 }}
                animate={{ x: windowWidth + 100, y: [ghostY, ghostY + 30, ghostY - 20, ghostY + 10, ghostY] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 5, ease: 'linear' }}
                style={{ top: 0 }}
              >
                <motion.span
                  className="text-7xl block"
                  animate={{ scale: [1, 1.1, 1], rotate: [-5, 5, -5] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  👻
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Aranya que penja del header */}
          <div className="fixed top-0 left-[20%] z-40 pointer-events-none hidden md:block">
            <motion.div
              animate={{ y: [0, 50, 30, 60, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="w-px h-28 bg-white/40 mx-auto" />
              <motion.span
                className="text-3xl block text-center"
                animate={{ rotate: [-10, 10, -10] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                🕷️
              </motion.span>
            </motion.div>
          </div>

          {/* Segona aranya */}
          <div className="fixed top-0 right-[15%] z-40 pointer-events-none hidden lg:block">
            <motion.div
              animate={{ y: [0, 80, 40, 70, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            >
              <div className="w-px h-20 bg-white/30 mx-auto" />
              <motion.span
                className="text-2xl block text-center"
                animate={{ rotate: [10, -10, 10] }}
                transition={{ duration: 0.4, repeat: Infinity }}
              >
                🕷️
              </motion.span>
            </motion.div>
          </div>

          {/* Carbasses decoratives - grup esquerra */}
          <div className="fixed bottom-8 left-8 pointer-events-none z-20 hidden md:flex items-end gap-2">
            <motion.span
              className="text-5xl"
              animate={{ rotate: [-5, 5, -5], scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              🎃
            </motion.span>
            <motion.span
              className="text-3xl"
              animate={{ rotate: [5, -5, 5], scale: [1, 1.08, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
            >
              🎃
            </motion.span>
            <motion.span
              className="text-4xl"
              animate={{ rotate: [-3, 3, -3], scale: [1, 1.06, 1] }}
              transition={{ duration: 2.8, repeat: Infinity, delay: 1 }}
            >
              🎃
            </motion.span>
          </div>

          {/* Calavera amb rialla (hover effect via CSS) */}
          <motion.div
            className="fixed bottom-10 right-10 text-4xl pointer-events-none z-20 hidden md:block"
            animate={{ y: [0, -5, 0], rotate: [-3, 3, -3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            💀
          </motion.div>

          {/* Espelmes amb flama animada */}
          <div className="fixed left-4 top-1/3 pointer-events-none z-20 hidden md:block">
            <motion.div
              animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.15, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              <span className="text-4xl">🕯️</span>
            </motion.div>
          </div>
          <div className="fixed right-4 top-1/2 pointer-events-none z-20 hidden md:block">
            <motion.div
              animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
            >
              <span className="text-4xl">🕯️</span>
            </motion.div>
          </div>
          <div className="fixed left-8 top-2/3 pointer-events-none z-20 hidden lg:block">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
              transition={{ duration: 0.7, repeat: Infinity, delay: 0.4 }}
            >
              <span className="text-3xl">🕯️</span>
            </motion.div>
          </div>

          {/* Ratpenats que apareixen amb scroll */}
          <HalloweenScrollBats />

          {/* Boira de fons */}
          <div className="fixed bottom-0 left-0 right-0 h-40 pointer-events-none z-10 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-t from-orange-900/20 via-transparent to-transparent" />
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          MÓN MÀGIC - Elements complets
          ══════════════════════════════════════════════════════════ */}
      {theme === 'monmagic' && (
        <>
          {/* Mussol que vola */}
          <motion.div
            className="fixed pointer-events-none z-30 text-5xl"
            key={owlDirection}
            initial={{
              x: owlDirection === 'left' ? windowWidth + 50 : -100,
              y: 80
            }}
            animate={{
              x: owlDirection === 'left' ? -100 : windowWidth + 50,
              y: [80, 150, 100, 180, 120, 80],
            }}
            transition={{ duration: 18, ease: 'linear' }}
            style={{ scaleX: owlDirection === 'left' ? -1 : 1 }}
          >
            🦉
          </motion.div>

          {/* Cartes màgiques que cauen ocasionalment */}
          <FallingLetters />

          {/* Silueta del castell màgic al fons */}
          <div className="fixed bottom-0 left-0 right-0 h-40 pointer-events-none z-0 opacity-[0.06] hidden md:block">
            <svg viewBox="0 0 1200 200" className="w-full h-full" preserveAspectRatio="xMidYMax slice">
              <path
                d="M0,200 L0,150 L30,150 L30,120 L50,120 L50,80 L60,60 L70,80 L70,120 L100,120 L100,90 L120,50 L140,90 L140,130 L180,130 L180,100 L200,70 L220,100 L220,140 L280,140 L280,100 L300,60 L310,40 L320,60 L320,100 L360,100 L360,70 L380,40 L400,70 L400,110 L450,110 L450,80 L470,50 L480,30 L490,50 L490,80 L530,80 L530,120 L580,120 L580,90 L600,55 L620,90 L620,130 L680,130 L680,100 L700,60 L720,100 L720,140 L780,140 L780,110 L800,70 L810,50 L820,70 L820,110 L860,110 L860,80 L880,45 L900,80 L900,120 L950,120 L950,90 L970,55 L990,90 L990,130 L1050,130 L1050,100 L1070,60 L1090,100 L1090,140 L1150,140 L1150,110 L1170,75 L1190,110 L1190,150 L1200,150 L1200,200 Z"
                fill="#ffd700"
              />
            </svg>
          </div>

          {/* Llampecs aleatoris */}
          <RandomLightning />

          {/* Espurnes daurades flotants */}
          <FloatingSparkles />

          {/* Vareta decorativa */}
          <motion.div
            className="fixed bottom-20 right-8 text-4xl pointer-events-none z-20 hidden md:block"
            animate={{ rotate: [0, 15, 0, -15, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            🪄
          </motion.div>

          {/* Escut màgic */}
          <MagicSchoolShield />
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          DISCO - Elements complets
          ══════════════════════════════════════════════════════════ */}
      {theme === 'disco' && (
        <>
          {/* Bola disco que gira */}
          <motion.div
            className="fixed top-16 left-1/2 -translate-x-1/2 pointer-events-none z-30"
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          >
            <motion.span
              className="text-7xl block"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🪩
            </motion.span>
          </motion.div>

          {/* Reflexos de llum des de la bola */}
          <DiscoBallReflections />

          {/* Raigs de llum des de la bola */}
          <div className="fixed inset-0 pointer-events-none z-5 overflow-hidden opacity-20">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-16 left-1/2 w-2 origin-top"
                style={{
                  height: '200vh',
                  background: `linear-gradient(to bottom, ${
                    ['#ff0080', '#00ff80', '#8000ff', '#ff8000', '#00ffff', '#ffff00', '#ff00ff', '#00ff00', '#ff6600', '#0066ff', '#ff0066', '#66ff00'][i]
                  }, transparent 60%)`,
                  transform: `rotate(${i * 30}deg)`,
                }}
                animate={{
                  opacity: [0.1, 0.4, 0.1],
                  rotate: [i * 30, i * 30 + 10, i * 30]
                }}
                transition={{ duration: 1 + (i * 0.1), repeat: Infinity, delay: i * 0.08 }}
              />
            ))}
          </div>

          {/* Siluetes ballant */}
          <div className="fixed bottom-0 left-8 pointer-events-none z-20 hidden md:flex items-end gap-4 opacity-40">
            <motion.span
              className="text-5xl"
              animate={{ y: [0, -20, 0], rotate: [-5, 5, -5] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              💃
            </motion.span>
            <motion.span
              className="text-5xl"
              animate={{ y: [0, -15, 0], rotate: [5, -5, 5] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: 0.25 }}
            >
              🕺
            </motion.span>
          </div>
          <div className="fixed bottom-0 right-8 pointer-events-none z-20 hidden md:flex items-end gap-4 opacity-40">
            <motion.span
              className="text-5xl"
              animate={{ y: [0, -18, 0], rotate: [5, -5, 5] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
            >
              🕺
            </motion.span>
            <motion.span
              className="text-5xl"
              animate={{ y: [0, -22, 0], rotate: [-5, 5, -5] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: 0.35 }}
            >
              💃
            </motion.span>
          </div>

          {/* Notes musicals flotants */}
          <FloatingMusicNotes />

          {/* Flash de llum al fer clic */}
          <DiscoClickFlash />
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          TROPICAL - Elements complets
          ══════════════════════════════════════════════════════════ */}
      {theme === 'tropical' && (
        <>
          {/* Palmeres als costats */}
          <div className="fixed bottom-0 left-0 text-[100px] pointer-events-none z-20 opacity-50 hidden md:block">
            🌴
          </div>
          <div className="fixed bottom-0 right-0 text-[100px] pointer-events-none z-20 opacity-50 scale-x-[-1] hidden md:block">
            🌴
          </div>
          <div className="fixed bottom-0 left-20 text-[70px] pointer-events-none z-19 opacity-30 hidden lg:block">
            🌴
          </div>
          <div className="fixed bottom-0 right-20 text-[70px] pointer-events-none z-19 opacity-30 scale-x-[-1] hidden lg:block">
            🌴
          </div>

          {/* Sol animat */}
          <motion.div
            className="fixed top-10 right-10 pointer-events-none z-20 opacity-70"
            animate={{ scale: [1, 1.1, 1], rotate: 360 }}
            transition={{
              scale: { duration: 4, repeat: Infinity },
              rotate: { duration: 120, repeat: Infinity, ease: 'linear' }
            }}
          >
            <span className="text-7xl">☀️</span>
          </motion.div>

          {/* Raigs de sol */}
          <div className="fixed top-0 right-0 w-60 h-60 pointer-events-none z-10 opacity-20">
            <div className="absolute inset-0 bg-gradient-radial from-yellow-400/50 via-orange-400/20 to-transparent rounded-full blur-3xl" />
          </div>

          {/* Ones al footer */}
          <div className="fixed bottom-0 left-0 right-0 h-20 pointer-events-none z-15 overflow-hidden opacity-40">
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-16"
              animate={{ x: [0, -100, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <svg viewBox="0 0 1440 100" className="w-[200%] h-full" preserveAspectRatio="none">
                <path
                  d="M0,50 C150,80 350,20 500,50 C650,80 850,20 1000,50 C1150,80 1350,20 1440,50 L1440,100 L0,100 Z"
                  fill="#00d4aa"
                  opacity="0.5"
                />
                <path
                  d="M0,60 C200,90 400,30 600,60 C800,90 1000,30 1200,60 C1400,90 1440,60 1440,60 L1440,100 L0,100 Z"
                  fill="#00b4d8"
                  opacity="0.3"
                />
              </svg>
            </motion.div>
          </div>

          {/* Flamencs */}
          <motion.div
            className="fixed bottom-24 left-16 text-5xl pointer-events-none z-21 opacity-60 hidden lg:block"
            animate={{ y: [0, -5, 0], rotate: [-2, 2, -2] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🦩
          </motion.div>
          <motion.div
            className="fixed bottom-20 right-24 text-4xl pointer-events-none z-21 opacity-50 hidden lg:block"
            animate={{ y: [0, -8, 0], rotate: [2, -2, 2] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          >
            🦩
          </motion.div>

          {/* Cocos i flors decoratives */}
          <motion.div
            className="fixed top-1/3 left-6 text-3xl pointer-events-none z-20 opacity-50 hidden md:block"
            animate={{ rotate: [0, 10, 0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            🥥
          </motion.div>
          <motion.div
            className="fixed top-1/2 right-6 text-3xl pointer-events-none z-20 opacity-60 hidden md:block"
            animate={{ scale: [1, 1.1, 1], rotate: [-5, 5, -5] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            🌺
          </motion.div>
          <motion.div
            className="fixed top-2/3 left-10 text-2xl pointer-events-none z-20 opacity-50 hidden lg:block"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          >
            🌸
          </motion.div>

          {/* Fulles verdes flotants */}
          <FloatingLeaves />

          {/* Gradient de cel tropical */}
          <div className="fixed top-0 left-0 right-0 h-40 pointer-events-none z-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-b from-orange-400/30 via-pink-400/20 to-transparent" />
          </div>
        </>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════
// COMPONENTS AUXILIARS PER ELEMENTS
// ════════════════════════════════════════════════════════════

// Halloween: Ratpenats que apareixen amb scroll
function HalloweenScrollBats() {
  const [bats, setBats] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    let lastScrollY = 0;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY + 100) {
        // Scrolling down
        if (Math.random() > 0.7) {
          const newBat = {
            id: Date.now(),
            x: Math.random() * window.innerWidth,
            y: currentScrollY + Math.random() * 200,
          };
          setBats(prev => [...prev.slice(-5), newBat]);
          setTimeout(() => {
            setBats(prev => prev.filter(b => b.id !== newBat.id));
          }, 3000);
        }
        lastScrollY = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {bats.map(bat => (
        <motion.div
          key={bat.id}
          className="fixed pointer-events-none z-25 text-4xl"
          style={{ left: bat.x, top: bat.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1, 1, 0.5],
            x: [0, Math.random() > 0.5 ? 200 : -200],
            y: [0, -100]
          }}
          transition={{ duration: 3 }}
        >
          🦇
        </motion.div>
      ))}
    </>
  );
}

// Món Màgic: Cartes que cauen
function FallingLetters() {
  const [letters, setLetters] = useState<Array<{ id: number; x: number }>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.85) {
        const newLetter = {
          id: Date.now(),
          x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth - 50 : 1000),
        };
        setLetters(prev => [...prev.slice(-3), newLetter]);
        setTimeout(() => {
          setLetters(prev => prev.filter(l => l.id !== newLetter.id));
        }, 6000);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {letters.map(letter => (
        <motion.div
          key={letter.id}
          className="fixed pointer-events-none z-25 text-4xl"
          style={{ left: letter.x }}
          initial={{ top: -50, rotate: 0, opacity: 0.8 }}
          animate={{
            top: typeof window !== 'undefined' ? window.innerHeight + 50 : 1000,
            rotate: [0, 20, -20, 10, -10, 0],
            x: [0, 30, -30, 20, -20, 0]
          }}
          transition={{ duration: 6, ease: 'linear' }}
        >
          📜
        </motion.div>
      ))}
    </>
  );
}

// Món Màgic: Espurnes flotants
function FloatingSparkles() {
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);

  useEffect(() => {
    // Create initial sparkles
    const initial = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
      y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
      size: 12 + Math.random() * 10,
    }));
    setSparkles(initial);
  }, []);

  return (
    <>
      {sparkles.map(sparkle => (
        <motion.div
          key={sparkle.id}
          className="fixed pointer-events-none z-15"
          style={{ left: sparkle.x, top: sparkle.y, fontSize: sparkle.size }}
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scale: [0.8, 1.2, 0.8],
            y: [sparkle.y, sparkle.y - 20, sparkle.y],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        >
          ✨
        </motion.div>
      ))}
    </>
  );
}

function RandomLightning() {
  const [lightning, setLightning] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setLightning({
          x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
          y: Math.random() * 300,
        });
        setTimeout(() => setLightning(null), 200);
      }
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  if (!lightning) return null;

  return (
    <motion.div
      className="fixed text-7xl pointer-events-none z-50"
      style={{ left: lightning.x, top: lightning.y }}
      initial={{ opacity: 1, scale: 1.5 }}
      animate={{ opacity: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      ⚡
    </motion.div>
  );
}

// Disco: Reflexos de llum des de la bola
function DiscoBallReflections() {
  const [reflections, setReflections] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);

  useEffect(() => {
    const colors = ['#ff0080', '#00ff80', '#8000ff', '#ff8000', '#00ffff', '#ffff00', '#ff00ff'];

    const interval = setInterval(() => {
      const newReflections = Array.from({ length: 3 }, () => ({
        id: Date.now() + Math.random(),
        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
        y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
        color: colors[Math.floor(Math.random() * colors.length)],
      }));

      setReflections(prev => [...prev.slice(-20), ...newReflections]);

      setTimeout(() => {
        setReflections(prev => prev.filter(r => !newReflections.find(nr => nr.id === r.id)));
      }, 1500);
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {reflections.map(ref => (
        <motion.div
          key={ref.id}
          className="fixed pointer-events-none z-10 rounded-full"
          style={{
            left: ref.x,
            top: ref.y,
            width: 8 + Math.random() * 12,
            height: 8 + Math.random() * 12,
            backgroundColor: ref.color,
            boxShadow: `0 0 20px ${ref.color}, 0 0 40px ${ref.color}`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5 }}
        />
      ))}
    </>
  );
}

// Disco: Notes musicals flotants
function FloatingMusicNotes() {
  const [notes, setNotes] = useState<Array<{ id: number; x: number; emoji: string }>>([]);

  useEffect(() => {
    const musicEmojis = ['🎵', '🎶', '🎤', '🎧'];

    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        const newNote = {
          id: Date.now(),
          x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth - 50 : 1000),
          emoji: musicEmojis[Math.floor(Math.random() * musicEmojis.length)],
        };

        setNotes(prev => [...prev.slice(-8), newNote]);

        setTimeout(() => {
          setNotes(prev => prev.filter(n => n.id !== newNote.id));
        }, 4000);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {notes.map(note => (
        <motion.div
          key={note.id}
          className="fixed pointer-events-none z-25 text-3xl"
          style={{ left: note.x }}
          initial={{ bottom: -50, opacity: 0.9 }}
          animate={{
            bottom: typeof window !== 'undefined' ? window.innerHeight + 50 : 1000,
            x: [0, 20, -20, 15, -15, 0],
            rotate: [0, 10, -10, 5, -5, 0],
          }}
          transition={{ duration: 4, ease: 'linear' }}
        >
          {note.emoji}
        </motion.div>
      ))}
    </>
  );
}

// Disco: Flash de llum al clicar
function DiscoClickFlash() {
  const [flashes, setFlashes] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const newFlash = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY,
      };

      setFlashes(prev => [...prev.slice(-5), newFlash]);

      setTimeout(() => {
        setFlashes(prev => prev.filter(f => f.id !== newFlash.id));
      }, 500);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      {flashes.map(flash => (
        <motion.div
          key={flash.id}
          className="fixed pointer-events-none z-[9999]"
          style={{ left: flash.x, top: flash.y }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="w-20 h-20 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,0,255,0.5) 40%, transparent 70%)',
            }}
          />
        </motion.div>
      ))}
    </>
  );
}

// Tropical: Fulles verdes flotants
function FloatingLeaves() {
  const [leaves, setLeaves] = useState<Array<{ id: number; x: number; emoji: string; delay: number }>>([]);

  useEffect(() => {
    const leafEmojis = ['🍃', '🌿', '🌱', '☘️'];

    const interval = setInterval(() => {
      if (Math.random() > 0.5) {
        const newLeaf = {
          id: Date.now(),
          x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth - 30 : 1000),
          emoji: leafEmojis[Math.floor(Math.random() * leafEmojis.length)],
          delay: Math.random() * 0.5,
        };

        setLeaves(prev => [...prev.slice(-10), newLeaf]);

        setTimeout(() => {
          setLeaves(prev => prev.filter(l => l.id !== newLeaf.id));
        }, 6000);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {leaves.map(leaf => (
        <motion.div
          key={leaf.id}
          className="fixed pointer-events-none z-15 text-3xl"
          style={{ left: leaf.x }}
          initial={{ top: -50, opacity: 0.8, rotate: 0 }}
          animate={{
            top: typeof window !== 'undefined' ? window.innerHeight + 50 : 1000,
            x: [0, 30, -20, 25, -15, 10, 0],
            rotate: [0, 45, -30, 60, -45, 30, 0],
            opacity: [0.8, 0.9, 0.7, 0.8, 0.6, 0.4, 0],
          }}
          transition={{ duration: 6, ease: 'easeInOut', delay: leaf.delay }}
        >
          {leaf.emoji}
        </motion.div>
      ))}
    </>
  );
}

// Món Màgic: Escut màgic
function MagicSchoolShield() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <motion.div
      className="fixed top-24 left-6 pointer-events-none z-20 hidden lg:block"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 0.4, x: 0 }}
      transition={{ duration: 1, delay: 0.5 }}
    >
      <motion.div
        animate={{
          scale: [1, 1.02, 1],
          rotate: [-1, 1, -1],
        }}
        transition={{ duration: 4, repeat: Infinity }}
        className="relative"
      >
        {/* Forma de l'escut */}
        <svg width="80" height="100" viewBox="0 0 80 100" className="drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]">
          <defs>
            <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#740001" />
              <stop offset="25%" stopColor="#1a472a" />
              <stop offset="50%" stopColor="#0e1a40" />
              <stop offset="75%" stopColor="#ecb939" />
              <stop offset="100%" stopColor="#740001" />
            </linearGradient>
          </defs>
          {/* Escut */}
          <path
            d="M40 5 L75 20 L75 55 Q75 85 40 95 Q5 85 5 55 L5 20 Z"
            fill="url(#shieldGradient)"
            stroke="#ffd700"
            strokeWidth="2"
          />
          {/* Divisió en 4 */}
          <line x1="40" y1="20" x2="40" y2="90" stroke="#ffd700" strokeWidth="1" opacity="0.5" />
          <line x1="10" y1="55" x2="70" y2="55" stroke="#ffd700" strokeWidth="1" opacity="0.5" />
          {/* H central */}
          <text x="40" y="60" textAnchor="middle" fill="#ffd700" fontSize="24" fontWeight="bold" fontFamily="serif">
            H
          </text>
        </svg>
        {/* Resplendor màgic */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: [
              '0 0 10px rgba(255, 215, 0, 0.2)',
              '0 0 20px rgba(255, 215, 0, 0.4)',
              '0 0 10px rgba(255, 215, 0, 0.2)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
// CURSOR TEMÀTIC
// ════════════════════════════════════════════════════════════

export function ThemeCursor() {
  const { config, theme } = useTheme();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState<Array<{ x: number; y: number; id: number; color: string }>>([]);
  const [isMobile, setIsMobile] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 1024 || 'ontouchstart' in window);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });

      if (config.cursor.trail) {
        const color = config.cursor.trailColor === 'rainbow'
          ? `hsl(${Date.now() % 360}, 100%, 50%)`
          : config.cursor.trailColor || config.colors.accent;

        setTrail(prev => [
          ...prev.slice(-15),
          { x: e.clientX, y: e.clientY, id: Date.now(), color }
        ]);
      }

      if (theme === 'monmagic' && Math.random() > 0.7) {
        createSparkle(e.clientX, e.clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMobile, config, theme]);

  // No renderitzar res fins que estem al client
  if (!mounted) return null;
  if (isMobile) return null;

  return (
    <>
      <motion.div
        className="fixed pointer-events-none z-[9999] text-2xl"
        animate={{ x: position.x - 12, y: position.y - 12 }}
        transition={{ type: 'spring', damping: 30, stiffness: 500 }}
      >
        {config.cursor.emoji}
      </motion.div>

      {trail.map((point) => (
        <motion.div
          key={point.id}
          className="fixed w-2 h-2 rounded-full pointer-events-none z-[9998]"
          style={{
            left: point.x - 4,
            top: point.y - 4,
            backgroundColor: point.color,
            boxShadow: `0 0 10px ${point.color}`,
          }}
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.4 }}
        />
      ))}
    </>
  );
}

function createSparkle(x: number, y: number) {
  if (typeof document === 'undefined') return;
  const sparkle = document.createElement('div');
  const offsetX = (Math.random() - 0.5) * 40;
  const offsetY = (Math.random() - 0.5) * 40;
  sparkle.innerHTML = '✨';
  sparkle.style.cssText = `
    position: fixed;
    left: ${x + offsetX}px;
    top: ${y + offsetY}px;
    pointer-events: none;
    z-index: 9997;
    font-size: ${8 + Math.random() * 8}px;
    opacity: 0.8;
    animation: sparkle-fade 0.5s forwards;
  `;
  document.body.appendChild(sparkle);
  setTimeout(() => sparkle.remove(), 500);
}

// ════════════════════════════════════════════════════════════
// TOUCH MAGIC LAYER (Mòbil) - El dit és la vareta màgica
// ════════════════════════════════════════════════════════════

interface TouchParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  emoji: string;
  rotation: number;
  rotationSpeed: number;
}

interface TouchRipple {
  id: number;
  x: number;
  y: number;
  life: number;
  color: string;
}

const TOUCH_EMOJIS: Record<MagicTheme, string[]> = {
  elegant: ['✨', '💫', '⭐'],
  halloween: ['🎃', '👻', '🦇', '💀', '🕷️', '🕸️'],
  monmagic: ['⭐', '✨', '🌟', '💫', '⚡'],
  disco: ['🪩', '💃', '🕺', '🎵', '🎶', '💜', '💙', '💚', '💛'],
  tropical: ['🌺', '🌴', '🍍', '🦩', '🌊', '☀️', '🥥'],
};

const TOUCH_COLORS: Record<MagicTheme, string> = {
  elegant: '#d7b86e',
  halloween: '#ff6b00',
  monmagic: '#ffd700',
  disco: '#ff00ff',
  tropical: '#00d4aa',
};

export function TouchMagicLayer() {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<TouchParticle[]>([]);
  const ripplesRef = useRef<TouchRipple[]>([]);
  const animationRef = useRef<number>();
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 768);
  }, []);

  const createTouchParticles = useCallback((x: number, y: number) => {
    const emojis = TOUCH_EMOJIS[theme];
    const count = 10; // Més partícules per explosió
    const newParticles: TouchParticle[] = [];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 4 * (0.5 + Math.random() * 0.5); // Més velocitat

      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3, // Més impuls cap amunt
        life: 1,
        size: 24 * (0.8 + Math.random() * 0.4), // Més grans
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
      });
    }

    particlesRef.current = [...particlesRef.current, ...newParticles].slice(-120);

    // Afegir ripple visual
    ripplesRef.current = [...ripplesRef.current, {
      id: Date.now(),
      x,
      y,
      life: 1,
      color: TOUCH_COLORS[theme],
    }].slice(-10);
  }, [theme]);

  useEffect(() => {
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

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dibuixar ripples
      ripplesRef.current = ripplesRef.current.filter(r => {
        r.life -= 0.04;
        if (r.life <= 0) return false;

        const radius = (1 - r.life) * 80;
        ctx.beginPath();
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 3 * r.life;
        ctx.globalAlpha = r.life * 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1;

        return true;
      });

      // Dibuixar partícules
      particlesRef.current = particlesRef.current.filter(p => {
        p.vy += 0.08; // Més gravetat
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.025;
        p.rotation += p.rotationSpeed;

        if (p.life <= 0) return false;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.life;
        ctx.font = `${p.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.emoji, 0, 0);
        ctx.restore();

        return true;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [theme]);

  useEffect(() => {
    if (!isMobile) return;

    const handleTouch = (e: TouchEvent) => {
      // Vibració hàptica subtil (15ms)
      if ('vibrate' in navigator) {
        navigator.vibrate(15);
      }

      const touches = e.touches;
      for (let i = 0; i < touches.length; i++) {
        createTouchParticles(touches[i].clientX, touches[i].clientY);
      }
    };

    // També per touchmove per crear trail màgic
    const handleTouchMove = (e: TouchEvent) => {
      const touches = e.touches;
      for (let i = 0; i < touches.length; i++) {
        // Crear menys partícules en moviment per no saturar
        if (Math.random() > 0.6) {
          const emojis = TOUCH_EMOJIS[theme];
          particlesRef.current = [...particlesRef.current, {
            x: touches[i].clientX,
            y: touches[i].clientY,
            vx: (Math.random() - 0.5) * 2,
            vy: -2 + Math.random() * -2,
            life: 0.8,
            size: 16 + Math.random() * 8,
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
          }].slice(-120);
        }
      }
    };

    window.addEventListener('touchstart', handleTouch, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isMobile, createTouchParticles, theme]);

  // No renderitzar res fins que estem al client
  if (!mounted) return null;
  if (!isMobile) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ opacity: 0.4, zIndex: -1 }}
    />
  );
}

// ════════════════════════════════════════════════════════════
// SHAKE DETECTOR (Mòbil) - Sacsejades temàtiques
// ════════════════════════════════════════════════════════════

export function ShakeDetector() {
  const { theme, setTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationText, setNotificationText] = useState('');
  const [giantEffect, setGiantEffect] = useState<{ type: string; emoji: string } | null>(null);
  const [permissionRequested, setPermissionRequested] = useState(false);

  const lastShakeRef = useRef<number>(0);
  const shakeCountRef = useRef<number>(0);
  const lastAccelRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    setMounted(true);
    setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 768);
  }, []);

  // iOS 13+ requereix permís per DeviceMotion
  useEffect(() => {
    if (!isMobile || permissionRequested) return;

    const requestPermission = async () => {
      // Using any for iOS DeviceMotionEvent permission API
      if (typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function') {
        try {
          const permission = await (DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
          if (permission === 'granted') {
            setPermissionRequested(true);
          }
        } catch {
          // Permission denied or not available
        }
      } else {
        setPermissionRequested(true);
      }
    };

    // Request on first touch
    const handleFirstTouch = () => {
      requestPermission();
      window.removeEventListener('touchstart', handleFirstTouch);
    };

    window.addEventListener('touchstart', handleFirstTouch, { once: true });
    return () => window.removeEventListener('touchstart', handleFirstTouch);
  }, [isMobile, permissionRequested]);

  // Efectes temàtics específics per sacsejada
  const triggerThemeShakeEffect = useCallback(() => {
    switch (theme) {
      case 'halloween':
        // Fantasma gegant que creua la pantalla
        setGiantEffect({ type: 'ghost', emoji: '👻' });
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
        setTimeout(() => setGiantEffect(null), 2000);
        break;

      case 'monmagic':
        // Llampec gegant
        setGiantEffect({ type: 'lightning', emoji: '⚡' });
        if ('vibrate' in navigator) navigator.vibrate([50, 30, 50, 30, 50]);
        setTimeout(() => setGiantEffect(null), 1500);
        break;

      case 'disco':
        // Mega confetti explosion
        triggerMegaConfetti();
        if ('vibrate' in navigator) navigator.vibrate([30, 20, 30, 20, 30, 20, 30]);
        break;

      case 'tropical':
        // Onada gegant
        setGiantEffect({ type: 'wave', emoji: '🌊' });
        if ('vibrate' in navigator) navigator.vibrate([100, 100, 100]);
        setTimeout(() => setGiantEffect(null), 2000);
        break;

      default:
        // Elegant: espurnes daurades
        setGiantEffect({ type: 'sparkles', emoji: '✨' });
        if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]);
        setTimeout(() => setGiantEffect(null), 1500);
    }
  }, [theme]);

  const cycleTheme = useCallback(() => {
    const themeIds = Object.keys(THEME_CONFIGS) as MagicTheme[];
    const currentIndex = themeIds.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeIds.length;
    const nextTheme = THEME_CONFIGS[themeIds[nextIndex]];

    setTheme(themeIds[nextIndex]);

    setNotificationText(`${nextTheme.icon} ${nextTheme.name}!`);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);

    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
    }
  }, [theme, setTheme]);

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration) return;

    const { x, y, z } = acceleration;
    if (x === null || y === null || z === null) return;

    const deltaX = Math.abs(x - lastAccelRef.current.x);
    const deltaY = Math.abs(y - lastAccelRef.current.y);
    const deltaZ = Math.abs(z - lastAccelRef.current.z);

    lastAccelRef.current = { x, y, z };

    const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

    if (magnitude > 15) {
      const now = Date.now();

      if (now - lastShakeRef.current > 200) {
        shakeCountRef.current++;
        lastShakeRef.current = now;

        // 2 sacsejades: efecte temàtic
        if (shakeCountRef.current === 2) {
          triggerThemeShakeEffect();
        }

        // 4 sacsejades: canviar tema
        if (shakeCountRef.current >= 4) {
          cycleTheme();
          shakeCountRef.current = 0;
        }
      }
    }

    setTimeout(() => {
      if (Date.now() - lastShakeRef.current > 1000) {
        shakeCountRef.current = 0;
      }
    }, 1000);
  }, [cycleTheme, triggerThemeShakeEffect]);

  useEffect(() => {
    if (!isMobile) return;

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [isMobile, handleMotion]);

  // No renderitzar res fins que estem al client
  if (!mounted) return null;
  if (!isMobile) return null;

  return (
    <>
      {/* Notificació de canvi de tema */}
      {showNotification && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[99999] bg-black/80 text-white px-6 py-3 rounded-full text-lg font-bold shadow-2xl"
          style={{ animation: 'shake-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
        >
          {notificationText}
        </div>
      )}

      {/* Efectes gegants temàtics */}
      {giantEffect && (
        <div
          className="fixed inset-0 z-[99998] pointer-events-none flex items-center justify-center overflow-hidden"
          style={{ animation: 'giant-effect-fade 2s forwards' }}
        >
          {giantEffect.type === 'ghost' && (
            <div
              className="text-[200px] opacity-90"
              style={{ animation: 'giant-ghost-cross 2s ease-in-out forwards' }}
            >
              👻
            </div>
          )}
          {giantEffect.type === 'lightning' && (
            <>
              <div
                className="absolute inset-0 bg-white/30"
                style={{ animation: 'lightning-flash 0.3s ease-out' }}
              />
              <div
                className="text-[250px]"
                style={{ animation: 'giant-lightning-strike 0.5s ease-out forwards' }}
              >
                ⚡
              </div>
            </>
          )}
          {giantEffect.type === 'wave' && (
            <div
              className="absolute bottom-0 left-0 right-0 text-[150px] text-center"
              style={{ animation: 'giant-wave-rise 2s ease-in-out forwards' }}
            >
              🌊🌊🌊🌊🌊
            </div>
          )}
          {giantEffect.type === 'sparkles' && (
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute text-4xl"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `sparkle-burst 1s ease-out ${i * 0.05}s forwards`,
                    opacity: 0,
                  }}
                >
                  ✨
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// Mega confetti per Disco shake
function triggerMegaConfetti() {
  if (typeof document === 'undefined') return;
  for (let i = 0; i < 100; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      const colors = ['#ff0080', '#00ff80', '#8000ff', '#ff8000', '#00ffff', '#ffff00'];
      const size = 10 + Math.random() * 15;
      confetti.style.cssText = `
        position: fixed;
        left: 50%;
        top: 50%;
        width: ${size}px;
        height: ${size}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        pointer-events: none;
        z-index: 99997;
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        animation: mega-confetti-burst 1.5s ease-out forwards;
        --angle: ${Math.random() * 360}deg;
        --distance: ${100 + Math.random() * 200}px;
      `;
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 1500);
    }, i * 10);
  }
}

// ════════════════════════════════════════════════════════════
// EASTER EGGS
// ════════════════════════════════════════════════════════════

// Konami code sequence
const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

export function EasterEggs() {
  const { theme, setTheme } = useTheme();
  const [typedWord, setTypedWord] = useState('');
  const [konamiIndex, setKonamiIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Track typed words for text-based easter eggs
      if (e.key.length === 1) {
        setTypedWord(prev => (prev + e.key.toLowerCase()).slice(-15));
      }

      // Track Konami code
      if (e.key === KONAMI_CODE[konamiIndex]) {
        const newIndex = konamiIndex + 1;
        if (newIndex === KONAMI_CODE.length) {
          triggerKonamiEffect(setTheme);
          setKonamiIndex(0);
        } else {
          setKonamiIndex(newIndex);
        }
      } else if (e.key === KONAMI_CODE[0]) {
        setKonamiIndex(1);
      } else {
        setKonamiIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [konamiIndex, setTheme, mounted]);

  useEffect(() => {
    // Halloween: BOO
    if (theme === 'halloween' && typedWord.includes('boo')) {
      triggerBooEffect();
      setTypedWord('');
    }

    // Món Màgic: LUMOS
    if (theme === 'monmagic' && typedWord.includes('lumos')) {
      triggerLumosEffect();
      setTypedWord('');
    }

    // Món Màgic: NOX
    if (theme === 'monmagic' && typedWord.includes('nox')) {
      triggerNoxEffect();
      setTypedWord('');
    }

    // Món Màgic: EXPECTO (shows patronus)
    if (theme === 'monmagic' && typedWord.includes('expecto')) {
      triggerExpectoEffect();
      setTypedWord('');
    }

    // Disco: PARTY
    if (theme === 'disco' && typedWord.includes('party')) {
      triggerPartyEffect();
      setTypedWord('');
    }

    // Universal: MAGIC
    if (typedWord.includes('magic')) {
      triggerMagicConfetti();
      setTypedWord('');
    }

    // Universal: ORBITA
    if (typedWord.includes('orbita')) {
      triggerOrbitaEffect();
      setTypedWord('');
    }

    // Universal: FESTA
    if (typedWord.includes('festa')) {
      triggerFestaEffect();
      setTypedWord('');
    }

  }, [typedWord, theme]);

  return null;
}

function triggerBooEffect() {
  if (typeof document === 'undefined') return;
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: black;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: boo-fade 1.5s forwards;
  `;
  overlay.innerHTML = '<span style="font-size: min(200px, 50vw); animation: boo-bounce 0.5s infinite">👻</span>';
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 1500);
}

function triggerLumosEffect() {
  if (typeof document === 'undefined') return;
  document.body.style.transition = 'filter 0.3s';
  document.body.style.filter = 'brightness(2.5) contrast(1.2)';
  setTimeout(() => {
    document.body.style.filter = '';
  }, 2000);
}

function triggerNoxEffect() {
  if (typeof document === 'undefined') return;
  document.body.style.transition = 'filter 0.3s';
  document.body.style.filter = 'brightness(0.1)';
  setTimeout(() => {
    document.body.style.filter = '';
  }, 2000);
}

function triggerMagicConfetti() {
  if (typeof document === 'undefined') return;
  for (let i = 0; i < 150; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      const colors = ['#ff0080', '#00ff80', '#8000ff', '#ff8000', '#00ffff', '#ffff00', '#ff0000', '#00ff00'];
      confetti.style.cssText = `
        position: fixed;
        left: ${Math.random() * 100}vw;
        top: -20px;
        width: ${5 + Math.random() * 10}px;
        height: ${5 + Math.random() * 10}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        pointer-events: none;
        z-index: 99999;
        animation: confetti-fall ${2 + Math.random() * 2}s linear forwards;
        transform: rotate(${Math.random() * 360}deg);
      `;
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 4000);
    }, i * 15);
  }
}

function triggerOrbitaEffect() {
  if (typeof document === 'undefined') return;
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    z-index: 99999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    animation: orbita-fade 3s forwards;
  `;
  overlay.innerHTML = `
    <div style="font-size: min(100px, 25vw); animation: orbita-spin 2s ease-out">🌍</div>
    <p style="color: #d7b86e; font-size: 24px; margin-top: 20px; font-weight: bold; animation: orbita-text 1s ease-out 0.5s both">
      ÒRBITA EVENTS ✨
    </p>
    <p style="color: white; opacity: 0.6; font-size: 16px; margin-top: 10px; animation: orbita-text 1s ease-out 1s both">
      La màgia comença aquí
    </p>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 3000);
}

// Konami code: massive confetti + cycles through all themes
function triggerKonamiEffect(setTheme: (_theme: MagicTheme) => void) {
  if (typeof document === 'undefined') return;

  // Show "KONAMI!" notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: min(60px, 15vw);
    font-weight: bold;
    color: #ffd700;
    text-shadow: 0 0 20px #ffd700, 0 0 40px #ff00ff, 0 0 60px #00ffff;
    z-index: 99999;
    pointer-events: none;
    animation: konami-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  `;
  notification.textContent = '✨ KONAMI! ✨';
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 2000);

  // Massive confetti explosion
  for (let i = 0; i < 300; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      const colors = ['#ff0080', '#00ff80', '#8000ff', '#ff8000', '#00ffff', '#ffff00', '#ff0000', '#00ff00', '#ffd700', '#ff00ff'];
      const size = 8 + Math.random() * 15;
      confetti.style.cssText = `
        position: fixed;
        left: ${Math.random() * 100}vw;
        top: -30px;
        width: ${size}px;
        height: ${size}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        pointer-events: none;
        z-index: 99998;
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        animation: confetti-fall ${3 + Math.random() * 3}s linear forwards;
        transform: rotate(${Math.random() * 360}deg);
      `;
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 6000);
    }, i * 10);
  }

  // Cycle through themes
  const themes: MagicTheme[] = ['elegant', 'halloween', 'monmagic', 'disco', 'tropical'];
  let index = 0;
  const cycleInterval = setInterval(() => {
    setTheme(themes[index % themes.length]);
    index++;
    if (index >= themes.length * 2) {
      clearInterval(cycleInterval);
      setTheme('disco'); // End on disco for the party vibe
    }
  }, 400);
}

// Món Màgic: Expecto Patronum - shows a glowing stag
function triggerExpectoEffect() {
  if (typeof document === 'undefined') return;

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: radial-gradient(circle at center, rgba(100, 150, 255, 0.3) 0%, transparent 70%);
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: patronus-fade 3s forwards;
    pointer-events: none;
  `;
  overlay.innerHTML = `
    <div style="
      font-size: min(150px, 40vw);
      filter: brightness(2) drop-shadow(0 0 30px #87CEEB) drop-shadow(0 0 60px #4169E1);
      animation: patronus-appear 1s ease-out forwards;
      opacity: 0;
    ">🦌</div>
  `;
  document.body.appendChild(overlay);

  // Add sparkles around
  for (let i = 0; i < 50; i++) {
    setTimeout(() => {
      const sparkle = document.createElement('div');
      const x = 30 + Math.random() * 40;
      const y = 30 + Math.random() * 40;
      sparkle.style.cssText = `
        position: fixed;
        left: ${x}%;
        top: ${y}%;
        font-size: ${10 + Math.random() * 20}px;
        pointer-events: none;
        z-index: 99998;
        filter: brightness(1.5) drop-shadow(0 0 10px #87CEEB);
        animation: sparkle-fade 1s forwards;
      `;
      sparkle.textContent = '✨';
      document.body.appendChild(sparkle);
      setTimeout(() => sparkle.remove(), 1000);
    }, i * 50);
  }

  setTimeout(() => overlay.remove(), 3000);
}

// Disco: Party mode - strobe effect
function triggerPartyEffect() {
  if (typeof document === 'undefined') return;

  const colors = ['#ff0080', '#00ff80', '#8000ff', '#ff8000', '#00ffff', '#ffff00'];
  let colorIndex = 0;

  const strobe = document.createElement('div');
  strobe.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 99998;
    pointer-events: none;
    opacity: 0.3;
  `;
  document.body.appendChild(strobe);

  const interval = setInterval(() => {
    strobe.style.background = colors[colorIndex % colors.length];
    colorIndex++;
  }, 100);

  // Add floating emojis
  for (let i = 0; i < 30; i++) {
    setTimeout(() => {
      const emoji = document.createElement('div');
      const emojis = ['💃', '🕺', '🪩', '🎵', '🎶', '🎉', '🔥', '💥'];
      emoji.style.cssText = `
        position: fixed;
        left: ${Math.random() * 100}vw;
        bottom: -50px;
        font-size: ${30 + Math.random() * 30}px;
        pointer-events: none;
        z-index: 99999;
        animation: party-float 2s ease-out forwards;
      `;
      emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      document.body.appendChild(emoji);
      setTimeout(() => emoji.remove(), 2000);
    }, i * 80);
  }

  setTimeout(() => {
    clearInterval(interval);
    strobe.remove();
  }, 3000);
}

// Universal: Festa - celebration with fireworks
function triggerFestaEffect() {
  if (typeof document === 'undefined') return;

  // Show "FESTA!" text
  const text = document.createElement('div');
  text.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: min(80px, 20vw);
    font-weight: bold;
    color: white;
    text-shadow: 0 0 20px #ff0080, 0 0 40px #00ffff;
    z-index: 99999;
    pointer-events: none;
    animation: festa-text 2s ease-out forwards;
  `;
  text.textContent = '🎉 FESTA! 🎉';
  document.body.appendChild(text);
  setTimeout(() => text.remove(), 2000);

  // Firework bursts
  const createFirework = (x: number, y: number) => {
    const colors = ['#ff0080', '#00ff80', '#8000ff', '#ff8000', '#00ffff', '#ffff00'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      const angle = (Math.PI * 2 * i) / 20;
      const distance = 100 + Math.random() * 100;
      const endX = x + Math.cos(angle) * distance;
      const endY = y + Math.sin(angle) * distance;

      particle.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 8px;
        height: 8px;
        background: ${color};
        border-radius: 50%;
        pointer-events: none;
        z-index: 99998;
        box-shadow: 0 0 10px ${color};
        animation: firework-particle 1s ease-out forwards;
        --end-x: ${endX}px;
        --end-y: ${endY}px;
      `;
      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 1000);
    }
  };

  // Launch multiple fireworks
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const x = Math.random() * window.innerWidth;
      const y = 100 + Math.random() * (window.innerHeight * 0.5);
      createFirework(x, y);
    }, i * 400);
  }
}

// ════════════════════════════════════════════════════════════
// WRAPPER COMPLET
// ════════════════════════════════════════════════════════════

export function MagicThemeSystem({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <MagicThemeProvider>
      {children}
      {mounted && (
        <>
          <ThemeParticles />
          <ThemeElements />
          <ThemeCursor />
          <ThemeSwitcher />
          <MobileThemeSwitcher />
          <TouchMagicLayer />
          <ShakeDetector />
          <EasterEggs />
        </>
      )}
    </MagicThemeProvider>
  );
}
