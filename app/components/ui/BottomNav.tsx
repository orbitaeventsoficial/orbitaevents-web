'use client';

import { Link, usePathname } from '@/lib/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

/**
 * BottomNav - Navegació inferior estil app
 *
 * Només visible en mòbil (md:hidden)
 * Respecta safe areas iPhone
 * 5 items amb el central destacat
 * USA TRADUCCIONS per català/espanyol
 */

interface NavItem {
  href: string;
  labelKey: string;
  icon: string;
  isSpecial?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    labelKey: 'home',
    icon: '🏠',
  },
  {
    href: '/servicios',
    labelKey: 'services',
    icon: '🎵',
  },
  {
    href: '/configurador',
    labelKey: 'create',
    icon: '✨',
    isSpecial: true, // Botó central destacat
  },
  {
    href: '/portfolio',
    labelKey: 'portfolio',
    icon: '📸',
  },
  {
    href: '/contacto',
    labelKey: 'contact',
    icon: '💬',
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations('bottomNav');

  // Determinar si un link està actiu
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' || pathname === '/ca' || pathname === '/es';
    return pathname?.includes(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-lg border-t border-white/10 md:hidden"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-end justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);

          if (item.isSpecial) {
            // Botó central especial (més gran, destacat)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -mt-4 flex flex-col items-center"
              >
                <motion.div
                  className="w-14 h-14 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30"
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <span className="text-2xl">{item.icon}</span>
                </motion.div>
                <span className="text-[10px] text-white/70 mt-1">{t(item.labelKey)}</span>
              </Link>
            );
          }

          // Items normals
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center py-2 px-3 min-w-[60px] relative"
              style={{ minHeight: '56px' }}
            >
              {/* Indicador actiu */}
              {active && (
                <motion.div
                  layoutId="bottomNavActive"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-amber-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              {/* Icona */}
              <motion.span
                className="text-xl"
                animate={{
                  scale: active ? 1.1 : 1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                {item.icon}
              </motion.span>

              {/* Label */}
              <span
                className={`text-[10px] mt-0.5 transition-colors ${
                  active ? 'text-white' : 'text-white/50'
                }`}
              >
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
