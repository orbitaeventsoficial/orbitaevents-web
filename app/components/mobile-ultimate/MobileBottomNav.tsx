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
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMobile } from './MobileAppShell';

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

const ContactIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-6 h-6 ${active ? 'text-amber-400' : 'text-white/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// NAV ITEMS
// ═══════════════════════════════════════════════════════════════════════════

const NAV_ITEMS = [
  { id: 'home', label: 'Inici', href: '/', icon: HomeIcon },
  { id: 'services', label: 'Serveis', href: '/servicios', icon: ServicesIcon },
  // FAB va aquí (espacio)
  { id: 'gallery', label: 'Portfolio', href: '/portfolio', icon: GalleryIcon },
  { id: 'contact', label: 'Contacte', href: '/contacto', icon: ContactIcon },
];

// ═══════════════════════════════════════════════════════════════════════════
// FAB MENU (Botón central con acciones)
// ═══════════════════════════════════════════════════════════════════════════

function FABMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { haptic } = useMobile();

  const actions = [
    {
      icon: '📞',
      label: 'Trucar',
      href: 'tel:+34699121023',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: '💬',
      label: 'WhatsApp',
      href: 'https://wa.me/34699121023',
      color: 'from-green-400 to-green-600'
    },
    { 
      icon: '📝', 
      label: 'Pressupost', 
      href: '/contacto',
      color: 'from-amber-500 to-orange-500'
    },
  ];

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
            initial={{ opacity: 0 }}
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col gap-3 z-50"
          >
            {actions.map((action, i) => (
              <motion.a
                key={action.label}
                href={action.href}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  transition: { delay: i * 0.1 }
                }}
                exit={{ 
                  opacity: 0, 
                  y: 20, 
                  scale: 0.8,
                  transition: { delay: (actions.length - i) * 0.05 }
                }}
                whileTap={{ scale: 0.95 }}
                onTapStart={() => haptic('light')}
                className={`flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r ${action.color} shadow-xl`}
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="text-white font-semibold whitespace-nowrap">{action.label}</span>
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.button
        onClick={toggleMenu}
        whileTap={{ scale: 0.9 }}
        className="relative -top-6 w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-2xl flex items-center justify-center z-50"
        style={{
          boxShadow: '0 10px 40px rgba(251, 191, 36, 0.4)',
        }}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <svg className="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </motion.div>

        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-amber-400"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NAV ITEM BUTTON
// ═══════════════════════════════════════════════════════════════════════════

interface NavItemProps {
  item: typeof NAV_ITEMS[0];
  isActive: boolean;
  onClick: () => void;
}

function NavItem({ item, isActive, onClick }: NavItemProps) {
  const { haptic } = useMobile();
  const Icon = item.icon;

  return (
    <motion.a
      href={item.href}
      onClick={(e) => {
        e.preventDefault();
        haptic('light');
        onClick();
        // Navigate
        window.location.href = item.href;
      }}
      whileTap={{ scale: 0.9 }}
      className="relative flex flex-col items-center gap-1 py-2 px-4"
    >
      {/* Icon */}
      <div className="relative">
        <Icon active={isActive} />
        
        {/* Active indicator glow */}
        {isActive && (
          <motion.div
            layoutId="navGlow"
            className="absolute inset-0 bg-amber-400/30 rounded-full blur-md"
            initial={false}
          />
        )}
      </div>

      {/* Label */}
      <span className={`text-[10px] font-medium ${isActive ? 'text-amber-400' : 'text-white/50'}`}>
        {item.label}
      </span>

      {/* Active dot */}
      {isActive && (
        <motion.div
          layoutId="navDot"
          className="absolute -top-1 w-1 h-1 rounded-full bg-amber-400"
          initial={false}
        />
      )}
    </motion.a>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function MobileBottomNav() {
  const [activeId, setActiveId] = useState('home');

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 25, delay: 0.5 }}
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
    >
      {/* Background with blur */}
      <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-xl border-t border-white/10" />

      {/* Nav items */}
      <div className="relative flex items-end justify-around px-2 py-2">
        {/* Left items */}
        {NAV_ITEMS.slice(0, 2).map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isActive={activeId === item.id}
            onClick={() => setActiveId(item.id)}
          />
        ))}

        {/* Center FAB */}
        <FABMenu />

        {/* Right items */}
        {NAV_ITEMS.slice(2).map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isActive={activeId === item.id}
            onClick={() => setActiveId(item.id)}
          />
        ))}
      </div>
    </motion.nav>
  );
}
