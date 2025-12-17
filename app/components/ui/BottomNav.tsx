// app/components/ui/BottomNav.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - BOTTOM NAVIGATION v2.0
// ═══════════════════════════════════════════════════════════════════════════
//
// Navegació inferior per a mòbil:
// - Disseny elegant i minimalista
// - Icones grans i touch-friendly
// - Animacions subtils
// - Safe area support
//
// ═══════════════════════════════════════════════════════════════════════════

'use client';

import { usePathname } from 'next/navigation';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import { Home, Briefcase, Image, MessageCircle, Calculator } from 'lucide-react';
import { motion } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════
// NAVIGATION ITEMS
// ═══════════════════════════════════════════════════════════════════════════

const NAV_ITEMS = [
  {
    href: '/',
    icon: Home,
    labelKey: 'home',
    exactMatch: true,
  },
  {
    href: '/servicios/bodas',
    icon: Briefcase,
    labelKey: 'services',
    exactMatch: false,
  },
  {
    href: '/configurador',
    icon: Calculator,
    labelKey: 'configure',
    exactMatch: true,
    highlight: true,
  },
  {
    href: '/portfolio',
    icon: Image,
    labelKey: 'portfolio',
    exactMatch: true,
  },
  {
    href: '/contacto',
    icon: MessageCircle,
    labelKey: 'contact',
    exactMatch: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations('bottomNav');

  // Comprovar si un link és actiu
  const isActive = (href: string, exactMatch: boolean) => {
    if (exactMatch) {
      return pathname === href || pathname === `/ca${href}` || pathname === `/es${href}`;
    }
    return pathname?.includes(href.replace('/', ''));
  };

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-40
        lg:hidden
        bg-zinc-950/95 backdrop-blur-xl
        border-t border-white/5
        pb-safe
      "
      role="navigation"
      aria-label="Navegació mòbil"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exactMatch);
          const isHighlight = item.highlight;

          if (isHighlight) {
            // Botó central destacat (Configurador)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -mt-4"
              >
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className="
                    flex items-center justify-center
                    w-14 h-14 rounded-full
                    bg-gradient-to-br from-amber-500 to-amber-600
                    shadow-lg shadow-amber-500/30
                    text-black
                  "
                >
                  <Icon className="w-6 h-6" strokeWidth={2.5} />
                </motion.div>
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl -z-10" />
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`
                flex flex-col items-center justify-center
                min-w-[60px] h-full
                transition-colors duration-200
                ${active ? 'text-amber-400' : 'text-white/50'}
              `}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="relative"
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                {/* Indicador actiu */}
                {active && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.div>
              <span className={`text-[10px] mt-1 font-medium ${active ? 'text-amber-400' : ''}`}>
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
