'use client';

/**
 * BottomNavPremium.tsx
 *
 * Navegación inferior BRUTAL para móvil
 * - Animaciones fluidas con Framer Motion
 * - Haptic feedback
 * - Gestos: long press, double tap
 * - Tab central destacado (CTA)
 * - Ripple effects
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════
// ICONOS SVG INLINE (para mejor performance)
// ═══════════════════════════════════════════════════════════════════════════

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" strokeWidth={active ? 2.5 : 2}>
    <motion.path
      d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={false}
      animate={{
        fill: active ? 'currentColor' : 'transparent',
        fillOpacity: active ? 0.2 : 0
      }}
    />
    <motion.path
      d="M9 22V12h6v10"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ServicesIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" strokeWidth={active ? 2.5 : 2}>
    <motion.rect
      x="3" y="3" width="7" height="7" rx="1"
      stroke="currentColor"
      initial={false}
      animate={{ fill: active ? 'currentColor' : 'transparent', fillOpacity: active ? 0.2 : 0 }}
    />
    <motion.rect
      x="14" y="3" width="7" height="7" rx="1"
      stroke="currentColor"
      initial={false}
      animate={{ fill: active ? 'currentColor' : 'transparent', fillOpacity: active ? 0.2 : 0 }}
    />
    <motion.rect
      x="3" y="14" width="7" height="7" rx="1"
      stroke="currentColor"
      initial={false}
      animate={{ fill: active ? 'currentColor' : 'transparent', fillOpacity: active ? 0.2 : 0 }}
    />
    <motion.rect
      x="14" y="14" width="7" height="7" rx="1"
      stroke="currentColor"
      initial={false}
      animate={{ fill: active ? 'currentColor' : 'transparent', fillOpacity: active ? 0.2 : 0 }}
    />
  </svg>
);

const PortfolioIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" strokeWidth={active ? 2.5 : 2}>
    <motion.rect
      x="3" y="3" width="18" height="18" rx="2"
      stroke="currentColor"
      initial={false}
      animate={{ fill: active ? 'currentColor' : 'transparent', fillOpacity: active ? 0.2 : 0 }}
    />
    <motion.circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
    <motion.path
      d="M21 15l-5-5L5 21"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ContactIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" strokeWidth={active ? 2.5 : 2}>
    <motion.path
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={false}
      animate={{ fill: active ? 'currentColor' : 'transparent', fillOpacity: active ? 0.2 : 0 }}
    />
  </svg>
);

const MenuIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" strokeWidth={active ? 2.5 : 2}>
    <motion.line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeLinecap="round" />
    <motion.line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeLinecap="round" />
    <motion.line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeLinecap="round" />
  </svg>
);

// Icono especial para CTA central
const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
    <motion.path
      d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z"
      fill="currentColor"
      initial={{ scale: 0.8, rotate: 0 }}
      animate={{ scale: 1, rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE NAVEGACIÓN
// ═══════════════════════════════════════════════════════════════════════════

interface NavItem {
  id: string;
  href: string;
  label: string;
  icon: typeof HomeIcon;
  matchPaths?: string[];
}

const navItems: NavItem[] = [
  {
    id: 'home',
    href: '/',
    label: 'Inici',
    icon: HomeIcon,
    matchPaths: ['/', '/ca', '/es']
  },
  {
    id: 'services',
    href: '/servicios/bodas',
    label: 'Serveis',
    icon: ServicesIcon,
    matchPaths: ['/servicios', '/serveis']
  },
  {
    id: 'cta',
    href: '/contacto',
    label: 'Pressupost',
    icon: SparkleIcon as any
  },
  {
    id: 'portfolio',
    href: '/portfolio',
    label: 'Portfolio',
    icon: PortfolioIcon,
    matchPaths: ['/portfolio']
  },
  {
    id: 'contact',
    href: '/contacto',
    label: 'Contacte',
    icon: ContactIcon,
    matchPaths: ['/contacto', '/contacte']
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE RIPPLE EFFECT
// ═══════════════════════════════════════════════════════════════════════════

function RippleEffect({ x, y }: { x: number; y: number }) {
  return (
    <motion.span
      className="absolute bg-white/30 rounded-full pointer-events-none"
      style={{ left: x - 20, top: y - 20, width: 40, height: 40 }}
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 4, opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function BottomNavPremium() {
  const pathname = usePathname();
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const rippleIdRef = useRef(0);

  // Detectar item activo
  const getActiveItem = useCallback(() => {
    for (const item of navItems) {
      if (item.matchPaths?.some(p => pathname === p || pathname?.startsWith(p + '/'))) {
        return item.id;
      }
    }
    return 'home';
  }, [pathname]);

  const activeItem = getActiveItem();

  // Haptic feedback
  const triggerHaptic = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const durations = { light: 10, medium: 20, heavy: 30 };
      navigator.vibrate(durations[intensity]);
    }
  }, []);

  // Crear ripple
  const createRipple = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const id = rippleIdRef.current++;
    setRipples(prev => [...prev, { id, x, y }]);

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);
  }, []);

  // Long press handler para quick menu
  const longPressTimerRef = useRef<NodeJS.Timeout>();

  const handleLongPressStart = useCallback(() => {
    triggerHaptic('light');
    longPressTimerRef.current = setTimeout(() => {
      triggerHaptic('heavy');
      setQuickMenuOpen(true);
    }, 500);
  }, [triggerHaptic]);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  }, []);

  // Double tap handler para scroll to top
  const handleDoubleClick = useCallback((itemId: string) => {
    if (itemId === activeItem) {
      triggerHaptic('medium');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeItem, triggerHaptic]);

  return (
    <>
      {/* Quick Menu Overlay */}
      <AnimatePresence>
        {quickMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQuickMenuOpen(false)}
          >
            <motion.div
              className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-zinc-900 rounded-2xl p-4 border border-white/10"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
            >
              <p className="text-white/60 text-xs mb-3 text-center">Accés ràpid</p>
              <div className="flex gap-4">
                <a href="https://wa.me/34699121023" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 p-3 rounded-xl bg-green-500/20 text-green-400">
                  <span className="text-2xl">💬</span>
                  <span className="text-xs">WhatsApp</span>
                </a>
                <a href="tel:+34699121023" className="flex flex-col items-center gap-1 p-3 rounded-xl bg-blue-500/20 text-blue-400">
                  <span className="text-2xl">📞</span>
                  <span className="text-xs">Trucar</span>
                </a>
                <Link href="/contacto" className="flex flex-col items-center gap-1 p-3 rounded-xl bg-amber-500/20 text-amber-400">
                  <span className="text-2xl">📝</span>
                  <span className="text-xs">Form</span>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        role="navigation"
        aria-label="Navegació principal mòbil"
      >
        {/* Blur background */}
        <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl border-t border-white/5" />

        {/* Nav items */}
        <div className="relative flex items-end justify-around px-2 pt-2">
          {navItems.map((item, index) => {
            const isActive = activeItem === item.id;
            const isCTA = item.id === 'cta';
            const Icon = item.icon;

            if (isCTA) {
              // CTA Central destacado
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="relative -mt-6"
                  onClick={(e) => {
                    createRipple(e);
                    triggerHaptic('medium');
                  }}
                >
                  <motion.div
                    className="relative flex flex-col items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-lg shadow-amber-500/30"
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    {/* Glow ring */}
                    <motion.div
                      className="absolute inset-0 rounded-full bg-amber-500/50"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <Icon active={true} />
                    <AnimatePresence>
                      {ripples.map(ripple => (
                        <RippleEffect key={ripple.id} x={ripple.x} y={ripple.y} />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                  <span className="text-[10px] font-medium text-amber-400 mt-1 block text-center">
                    {item.label}
                  </span>
                </Link>
              );
            }

            // Items normales
            return (
              <Link
                key={item.id}
                href={item.href}
                className="relative flex flex-col items-center py-2 px-4 min-w-[64px] min-h-[44px] overflow-hidden"
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                onClick={(e) => {
                  createRipple(e);
                  triggerHaptic('light');
                }}
                onDoubleClick={() => handleDoubleClick(item.id)}
                onTouchStart={handleLongPressStart}
                onTouchEnd={handleLongPressEnd}
                onMouseDown={handleLongPressStart}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-amber-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <motion.div
                  className={`relative ${isActive ? 'text-amber-400' : 'text-white/60'}`}
                  animate={{
                    y: isActive ? -2 : 0,
                    scale: isActive ? 1.1 : 1
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <Icon active={isActive} />
                </motion.div>

                {/* Label */}
                <motion.span
                  className={`text-[10px] mt-1 font-medium ${isActive ? 'text-amber-400' : 'text-white/50'}`}
                  animate={{ opacity: isActive ? 1 : 0.7 }}
                >
                  {item.label}
                </motion.span>

                {/* Ripple container */}
                <AnimatePresence>
                  {ripples.map(ripple => (
                    <RippleEffect key={ripple.id} x={ripple.x} y={ripple.y} />
                  ))}
                </AnimatePresence>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer para que el contenido no quede tapado */}
      <div className="h-20 lg:hidden" />
    </>
  );
}
