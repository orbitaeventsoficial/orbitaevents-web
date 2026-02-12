'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MOBILE BOTTOM NAV - Òrbita Events
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Navegación inferior premium con:
 * - Glassmorphism design
 * - Indicador animado
 * - FAB central con acciones rápidas
 * - Haptic feedback
 * - Badge de notificaciones
 * - Safe area support
 * 
 * FIXED:
 * - Rutas con locale
 * - Textos usando sistema de traducciones
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { useMobile } from './MobileAppShell';
import { useLocale, useTranslations } from 'next-intl';
import { WHATSAPP_NUMBER, WHATSAPP_URL } from '@/lib/constants';

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-6 h-6 ${active ? 'text-amber-400' : 'text-white/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ServicesIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-6 h-6 ${active ? 'text-amber-400' : 'text-white/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const GalleryIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-6 h-6 ${active ? 'text-amber-400' : 'text-white/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const BlogIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-6 h-6 ${active ? 'text-amber-400' : 'text-white/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h10l6 6v10a2 2 0 01-2 2z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v6h6M8 13h8M8 17h8" />
  </svg>
);

const ContactIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-6 h-6 ${active ? 'text-amber-400' : 'text-white/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// FAB MENU (Botón central con acciones)
// ═══════════════════════════════════════════════════════════════════════════

function QuoteMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { haptic } = useMobile();
  const locale = useLocale();
  const t = useTranslations('mobileNav');
  const reduceMotion = useReducedMotion();

  const actions = useMemo(() => [
    {
      icon: '🧮',
      labelKey: 'fab.configurator',
      href: `/${locale}/configurador`,
      color: 'from-amber-500 to-orange-500'
    },
    {
      icon: '📍',
      labelKey: 'fab.zones',
      href: `/${locale}/servicios/bodas#zonas`,
      color: 'from-purple-500 to-indigo-500'
    },
    {
      icon: '💬',
      labelKey: 'fab.whatsapp',
      href: WHATSAPP_URL,
      color: 'from-green-400 to-green-600'
    },
    {
      icon: '📞',
      labelKey: 'fab.call',
      href: `tel:+${WHATSAPP_NUMBER}`,
      color: 'from-green-500 to-emerald-500'
    },
  ], [locale]);

  const toggleMenu = () => {
    haptic('medium');
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 flex flex-col gap-3 z-50"
          >
            {actions.map((action, i) => (
              <motion.a
                key={action.labelKey}
                href={action.href}
                initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  transition: reduceMotion ? { duration: 0 } : { delay: i * 0.1 }
                }}
                exit={{ 
                  opacity: 0, 
                  y: 20, 
                  scale: 0.8,
                  transition: reduceMotion ? { duration: 0 } : { delay: (actions.length - i) * 0.05 }
                }}
                whileTap={{ scale: 0.95 }}
                onTapStart={() => haptic('light')}
                className={`flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r ${action.color} shadow-xl`}
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="text-white font-semibold whitespace-nowrap">{t(action.labelKey)}</span>
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main orb button */}
      <motion.button
        onClick={toggleMenu}
        whileTap={{ scale: 0.94 }}
        className="relative z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-orange-500 shadow-[0_10px_30px_rgba(251,191,36,0.45)]"
      >
        <motion.span
          animate={reduceMotion ? { rotate: 0 } : { rotate: isOpen ? 45 : 0 }}
          transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 300 }}
          className="inline-flex text-black"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </motion.span>
        <span className="pointer-events-none absolute -inset-2 rounded-full bg-amber-400/30 blur-xl" />
        <span className="pointer-events-none absolute inset-1 rounded-full bg-white/10" />
      </motion.button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NAV ITEM BUTTON
// ═══════════════════════════════════════════════════════════════════════════

interface NavItem {
  id: string;
  labelKey: string;
  href: string;
  icon: React.ComponentType<{ active: boolean }>;
}

interface NavItemProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}

function NavItemComponent({ item, isActive, onClick, locale, t }: NavItemProps) {
  const { haptic } = useMobile();
  const router = useRouter();
  const Icon = item.icon;
  const reduceMotion = useReducedMotion();

  // Build href with locale
  const href = item.href === '/' ? `/${locale}` : `/${locale}${item.href}`;

  return (
    <motion.a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        haptic('light');
        onClick();
        // Navigate using Next.js router (SPA navigation)
        router.push(href);
      }}
      whileTap={{ scale: 0.9 }}
      className="relative flex flex-col items-center gap-1 py-2 px-4"
    >
      {/* Icon */}
      <div className="relative">
        <Icon active={isActive} />
        
        {/* Active indicator glow */}
        {isActive && (
          reduceMotion ? (
            <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-md" />
          ) : (
            <motion.div
              layoutId="navGlow"
              className="absolute inset-0 bg-amber-400/30 rounded-full blur-md"
              initial={false}
            />
          )
        )}
      </div>

      {/* Label */}
      <span className={`text-[10px] font-medium ${isActive ? 'text-amber-400' : 'text-white/50'}`}>
        {t(item.labelKey)}
      </span>

      {/* Active dot */}
      {isActive && (
        reduceMotion ? (
          <div className="absolute -top-1 w-1 h-1 rounded-full bg-amber-400" />
        ) : (
          <motion.div
            layoutId="navDot"
            className="absolute -top-1 w-1 h-1 rounded-full bg-amber-400"
            initial={false}
          />
        )
      )}
    </motion.a>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function MobileBottomNav() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('mobileNav');
  const reduceMotion = useReducedMotion();

  const NAV_ITEMS: NavItem[] = useMemo(() => [
    { id: 'home', labelKey: 'items.home', href: '/', icon: HomeIcon },
    { id: 'services', labelKey: 'items.services', href: '/servicios', icon: ServicesIcon },
    // FAB va aquí (espacio)
    { id: 'blog', labelKey: 'items.blog', href: '/blog', icon: BlogIcon },
    { id: 'gallery', labelKey: 'items.portfolio', href: '/portfolio', icon: GalleryIcon },
    { id: 'contact', labelKey: 'items.contact', href: '/contacto', icon: ContactIcon },
  ], []);

  // Determine active tab from current pathname
  const activeId = useMemo(() => {
    const path = pathname.replace(`/${locale}`, '') || '/';
    if (path === '/' || path === '') return 'home';
    if (path.startsWith('/servicios') || path.startsWith('/tematica') || path.startsWith('/boda-halloween') || path.startsWith('/experiencias')) return 'services';
    if (path.startsWith('/blog')) return 'blog';
    if (path.startsWith('/portfolio')) return 'gallery';
    if (path.startsWith('/contacto') || path.startsWith('/configurador')) return 'contact';
    return 'home';
  }, [pathname, locale]);

  return (
    <motion.nav
      initial={reduceMotion ? false : { y: 100 }}
      animate={{ y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { type: 'spring', damping: 25, delay: 0.5 }}
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
    >
      {/* Background with blur */}
      <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-xl border-t border-white/10" />

      {/* Nav items */}
      <div className="relative flex items-end justify-around px-2 py-2">
        {/* Left items */}
        {NAV_ITEMS.slice(0, 2).map((item) => (
          <NavItemComponent
            key={item.id}
            item={item}
            isActive={activeId === item.id}
            onClick={() => {}}
            locale={locale}
            t={t}
          />
        ))}

        {/* Center CTA */}
        <QuoteMenu />

        {/* Right items */}
        {NAV_ITEMS.slice(2).map((item) => (
          <NavItemComponent
            key={item.id}
            item={item}
            isActive={activeId === item.id}
            onClick={() => {}}
            locale={locale}
            t={t}
          />
        ))}
      </div>
    </motion.nav>
  );
}
