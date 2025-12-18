'use client';

/**
 * BottomNavPro.tsx
 * 
 * Navegación bottom BRUTAL para admin móvil
 * - 5 tabs con animaciones fluidas
 * - Indicador de tab activo animado
 * - Badges de notificación en tiempo real
 * - Quick actions menu
 * - Haptic feedback
 * - Safe area handling
 */

import { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface NavItem {
  id: string;
  href: string;
  label: string;
  badge?: number;
  matchPaths?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONOS SVG
// ═══════════════════════════════════════════════════════════════════════════

const NavIcons = {
  dashboard: ({ active }: { active: boolean }) => (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" strokeWidth={active ? 2.5 : 2}>
      <rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0} />
      <rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0} />
      <rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0} />
      <rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0} />
    </svg>
  ),
  leads: ({ active }: { active: boolean }) => (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" strokeWidth={active ? 2.5 : 2}>
      <circle cx="9" cy="7" r="4" stroke="currentColor" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0} />
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  calendar: ({ active }: { active: boolean }) => (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" strokeWidth={active ? 2.5 : 2}>
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0} />
      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeLinecap="round" />
      <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeLinecap="round" />
      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" />
      {active && (
        <>
          <circle cx="8" cy="15" r="1" fill="currentColor" />
          <circle cx="12" cy="15" r="1" fill="currentColor" />
          <circle cx="16" cy="15" r="1" fill="currentColor" />
        </>
      )}
    </svg>
  ),
  bookings: ({ active }: { active: boolean }) => (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" strokeWidth={active ? 2.5 : 2}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0} />
      {active && (
        <path d="M9 10l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  ),
  more: ({ active }: { active: boolean }) => (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" strokeWidth={2}>
      <circle cx="12" cy="5" r="2" fill="currentColor" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <circle cx="12" cy="19" r="2" fill="currentColor" />
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    href: '/admin/dashboard',
    label: 'Dashboard',
    matchPaths: ['/admin', '/admin/dashboard'],
  },
  {
    id: 'leads',
    href: '/admin/leads',
    label: 'Leads',
    badge: 0, // Se actualiza dinámicamente
    matchPaths: ['/admin/leads', '/admin/contactes'],
  },
  {
    id: 'calendar',
    href: '/admin/calendario',
    label: 'Calendari',
    matchPaths: ['/admin/calendario'],
  },
  {
    id: 'bookings',
    href: '/admin/bookings',
    label: 'Reserves',
    matchPaths: ['/admin/bookings', '/admin/events'],
  },
  {
    id: 'more',
    href: '#',
    label: 'Més',
  },
];

const moreMenuItems = [
  { href: '/admin/analytics', label: 'Analítiques', icon: '📊', description: 'Mètriques i rendiment' },
  { href: '/admin/mensajes', label: 'Missatges', icon: '💬', description: 'WhatsApp i email' },
  { href: '/admin/opiniones', label: 'Opinions', icon: '⭐', description: 'Reviews de clients' },
  { href: '/admin/inventory', label: 'Inventari', icon: '📦', description: 'Equips i material' },
  { href: '/admin/packs', label: 'Packs', icon: '🎁', description: 'Gestió de packs' },
  { href: '/admin/pricing', label: 'Preus', icon: '💰', description: 'Tarifes i descomptes' },
  { href: '/admin/text-manager', label: 'Textos', icon: '✏️', description: 'Contingut web' },
  { href: '/admin/settings', label: 'Configuració', icon: '⚙️', description: 'Opcions del sistema' },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTES
// ═══════════════════════════════════════════════════════════════════════════

// More menu overlay
function MoreMenu({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-40 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Menu */}
          <motion.div
            className="absolute bottom-20 left-4 right-4 bg-zinc-900 rounded-2xl p-2 border border-white/10 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-4 gap-2">
              {moreMenuItems.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => {
                      if ('vibrate' in navigator) navigator.vibrate(5);
                      onClose();
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-xs text-white/70 font-medium text-center">{item.label}</span>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Close indicator */}
            <div className="mt-2 pt-2 border-t border-white/5">
              <button
                onClick={onClose}
                className="w-full py-2 text-center text-white/30 text-sm"
              >
                Toca fora per tancar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Badge de notificación
function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <motion.span
      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
    >
      {count > 99 ? '99+' : count}
    </motion.span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function BottomNavPro() {
  const pathname = usePathname();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [newLeadsCount, setNewLeadsCount] = useState(0);

  // Fetch new leads count
  useEffect(() => {
    const fetchNewLeads = async () => {
      try {
        const response = await fetch('/api/admin/leads-new?status=NEW&limit=1');
        const data = await response.json();
        if (data.ok && data.stats) {
          setNewLeadsCount(data.stats.NEW || 0);
        }
      } catch (err) {
        console.error('Error fetching leads count:', err);
      }
    };

    fetchNewLeads();
    const interval = setInterval(fetchNewLeads, 60000); // Refresh cada minuto
    return () => clearInterval(interval);
  }, []);

  // Detectar item activo
  const getActiveItem = useCallback(() => {
    for (const item of navItems) {
      if (item.matchPaths?.some((p) => pathname === p || pathname?.startsWith(p + '/'))) {
        return item.id;
      }
    }
    // Check more menu items
    for (const item of moreMenuItems) {
      if (pathname === item.href || pathname?.startsWith(item.href + '/')) {
        return 'more';
      }
    }
    return 'dashboard';
  }, [pathname]);

  const activeItem = getActiveItem();

  // Haptic feedback
  const triggerHaptic = useCallback((intensity: 'light' | 'medium' = 'light') => {
    if ('vibrate' in navigator) {
      navigator.vibrate(intensity === 'light' ? 5 : 15);
    }
  }, []);

  // Get icon component
  const getIcon = (id: string, active: boolean) => {
    const IconComponent = NavIcons[id as keyof typeof NavIcons];
    return IconComponent ? <IconComponent active={active} /> : null;
  };

  // Update badges
  const getItemWithBadge = (item: NavItem) => {
    if (item.id === 'leads') {
      return { ...item, badge: newLeadsCount };
    }
    return item;
  };

  return (
    <>
      {/* More Menu */}
      <MoreMenu isOpen={moreMenuOpen} onClose={() => setMoreMenuOpen(false)} />

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
      >
        {/* Glass background */}
        <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl border-t border-white/[0.08]" />

        {/* Glow effect for active tab */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent opacity-0 group-hover:opacity-100" />

        {/* Nav items */}
        <div className="relative flex items-center justify-around px-1 pt-1">
          {navItems.map((item) => {
            const itemWithBadge = getItemWithBadge(item);
            const isActive = activeItem === item.id || (item.id === 'more' && moreMenuOpen);

            if (item.id === 'more') {
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    triggerHaptic('medium');
                    setMoreMenuOpen(!moreMenuOpen);
                  }}
                  className="relative flex flex-col items-center py-2 px-3 min-w-[60px]"
                >
                  <motion.div
                    className={`relative ${isActive ? 'text-orange-400' : 'text-white/50'}`}
                    animate={{ rotate: moreMenuOpen ? 90 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    {getIcon(item.id, isActive)}
                  </motion.div>
                  <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-orange-400' : 'text-white/40'}`}>
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => triggerHaptic()}
                className="relative flex flex-col items-center py-2 px-3 min-w-[60px]"
              >
                {/* Active indicator pill */}
                {isActive && (
                  <motion.div
                    layoutId="navActiveIndicator"
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}

                {/* Icon container */}
                <motion.div
                  className={`relative ${isActive ? 'text-orange-400' : 'text-white/50'}`}
                  animate={{
                    y: isActive ? -2 : 0,
                    scale: isActive ? 1.1 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  {getIcon(item.id, isActive)}
                  <NotificationBadge count={itemWithBadge.badge || 0} />
                </motion.div>

                {/* Label */}
                <span className={`text-[10px] mt-1 font-medium transition-colors ${isActive ? 'text-orange-400' : 'text-white/40'}`}>
                  {item.label}
                </span>

                {/* Active glow */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-orange-500/10 rounded-xl -z-10"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden behind nav */}
      <div className="h-20 lg:hidden" />
    </>
  );
}
