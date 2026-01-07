'use client';

/**
 * MobileNav.tsx
 *
 * Navegación bottom para admin móvil
 * - 5 tabs principales
 * - Badge de notificaciones
 * - Quick actions
 */

import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════
// ICONOS
// ═══════════════════════════════════════════════════════════════════════════

const DashboardIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" strokeWidth={active ? 2.5 : 2}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0} />
    <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0} />
    <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0} />
    <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0} />
  </svg>
);

const LeadsIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" strokeWidth={active ? 2.5 : 2}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="7" r="4" stroke="currentColor" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0} />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CalendarIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" strokeWidth={active ? 2.5 : 2}>
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0} />
    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeLinecap="round" />
    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeLinecap="round" />
    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" />
  </svg>
);

const BookingsIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" strokeWidth={active ? 2.5 : 2}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0} />
  </svg>
);

const MoreIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" strokeWidth={active ? 2.5 : 2}>
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="5" r="1" fill="currentColor" />
    <circle cx="12" cy="19" r="1" fill="currentColor" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════

interface NavItem {
  id: string;
  href: string;
  label: string;
  icon: typeof DashboardIcon;
  badge?: number;
  matchPaths?: string[];
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: DashboardIcon,
    matchPaths: ['/admin', '/admin/dashboard'],
  },
  {
    id: 'leads',
    href: '/admin/leads',
    label: 'Leads',
    icon: LeadsIcon,
    badge: 3,
    matchPaths: ['/admin/leads', '/admin/contactes'],
  },
  {
    id: 'calendario',
    href: '/admin/calendario',
    label: 'Calendari',
    icon: CalendarIcon,
    matchPaths: ['/admin/calendario'],
  },
  {
    id: 'bookings',
    href: '/admin/bookings',
    label: 'Reserves',
    icon: BookingsIcon,
    matchPaths: ['/admin/bookings', '/admin/events'],
  },
  {
    id: 'more',
    href: '#',
    label: 'Més',
    icon: MoreIcon,
  },
];

const moreMenuItems = [
  { href: '/admin/analytics', label: 'Analítiques', icon: '📊' },
  { href: '/admin/mensajes', label: 'Missatges', icon: '💬' },
  { href: '/admin/opiniones', label: 'Opinions', icon: '⭐' },
  { href: '/admin/inventory', label: 'Inventari', icon: '📦' },
  { href: '/admin/packs', label: 'Packs', icon: '🎁' },
  { href: '/admin/pricing', label: 'Preus', icon: '💰' },
  { href: '/admin/settings', label: 'Configuració', icon: '⚙️' },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function AdminMobileNav() {
  const pathname = usePathname();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // Detectar item activo
  const getActiveItem = useCallback(() => {
    for (const item of navItems) {
      if (item.matchPaths?.some((p) => pathname === p || pathname?.startsWith(p + '/'))) {
        return item.id;
      }
    }
    return 'dashboard';
  }, [pathname]);

  const activeItem = getActiveItem();

  // Haptic feedback
  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  return (
    <>
      {/* More Menu Overlay */}
      <AnimatePresence>
        {moreMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-stone-200/70 backdrop-blur-sm z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMoreMenuOpen(false)}
          >
            <motion.div
              className="absolute bottom-20 right-4 bg-stone-50 rounded-2xl p-2 border border-stone-200 shadow-2xl min-w-[200px]"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {moreMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    triggerHaptic();
                    setMoreMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-stone-100 transition-colors"
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-stone-50/95 backdrop-blur-xl border-t border-stone-200" />

        {/* Nav items */}
        <div className="relative flex items-center justify-around px-2 pt-2">
          {navItems.map((item) => {
            const isActive = activeItem === item.id;
            const Icon = item.icon;

            if (item.id === 'more') {
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    triggerHaptic();
                    setMoreMenuOpen(!moreMenuOpen);
                  }}
                  className="relative flex flex-col items-center py-2 px-4 min-w-[64px]"
                >
                  <motion.div
                    className={`relative ${moreMenuOpen ? 'text-orange-400' : 'text-slate-600'}`}
                    animate={{ rotate: moreMenuOpen ? 90 : 0 }}
                  >
                    <Icon active={moreMenuOpen} />
                  </motion.div>
                  <span className={`text-[10px] mt-1 font-medium ${moreMenuOpen ? 'text-orange-400' : 'text-slate-500'}`}>
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={triggerHaptic}
                className="relative flex flex-col items-center py-2 px-4 min-w-[64px]"
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="adminNavIndicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-orange-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}

                {/* Icon with badge */}
                <motion.div
                  className={`relative ${isActive ? 'text-orange-400' : 'text-slate-600'}`}
                  animate={{
                    y: isActive ? -2 : 0,
                    scale: isActive ? 1.1 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <Icon active={isActive} />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </motion.div>

                {/* Label */}
                <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-orange-400' : 'text-slate-500'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer */}
      <div className="h-20 lg:hidden" />
    </>
  );
}
