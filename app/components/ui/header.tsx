"use client";


import { Link } from '@/lib/navigation';
import Image from 'next/image';
import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Menu, X, ChevronDown, Calculator, Accessibility } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSelector from './LanguageSelector';
import { useTranslations } from 'next-intl';

// ========================================
// TYPES & CONSTANTS
// ========================================

interface ServiceItem {
  nameKey: string;
  href: string;
  iconKey: string;
}

interface NavItem {
  nameKey: string;
  href?: string;
  submenu?: ServiceItem[];
  highlight?: boolean;
  external?: boolean;
}

const SERVICIOS: ServiceItem[] = [
  { nameKey: 'services.weddings.name', href: '/servicios/bodas', iconKey: 'services.weddings.icon' },
  { nameKey: 'services.parties.name', href: '/servicios/fiestas', iconKey: 'services.parties.icon' },
  { nameKey: 'services.mobile.name', href: '/servicios/discomovil', iconKey: 'services.mobile.icon' },
  { nameKey: 'services.corporate.name', href: '/servicios/empresas', iconKey: 'services.corporate.icon' },
  { nameKey: 'services.kids.name', href: '/servicios/animacion-infantil', iconKey: 'services.kids.icon' },
];

const NAV_ITEMS: NavItem[] = [
  { nameKey: 'common.nav.home', href: '/' },
  { nameKey: 'common.nav.services', submenu: SERVICIOS },
  { nameKey: 'common.nav.portfolio', href: '/portfolio' },
  { nameKey: 'common.nav.reviews', href: '/opiniones' },
  { nameKey: 'common.nav.sensorial', href: '/sensorial' },
  { nameKey: 'common.nav.configurator', href: '/configurador', highlight: true },
];

import { trackEvent } from '@/lib/hooks/useAnalytics';

// ========================================
// DROPDOWN COMPONENT (Memoized)
// ========================================

interface DropdownMenuProps {
  items: ServiceItem[];
  isOpen: boolean;
  onClose: () => void;
  t: (_key: string) => string;
}

const DropdownMenu = memo(function DropdownMenu({ items, isOpen, onClose, t }: DropdownMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute left-0 mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-lg
                     shadow-xl backdrop-blur-xl overflow-hidden"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          style={{ zIndex: 99999 }}
        >
          <ul className="py-1" role="menu">
            {items.map((item) => (
              <li key={item.nameKey} role="none">
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-2.5 text-white/80 hover:text-[var(--oe-gold)]
                           hover:bg-white/5 transition-colors duration-150"
                  onClick={() => {
                    onClose();
                    trackEvent('Header_Dropdown_Click', { service: t(item.nameKey) });
                  }}
                  role="menuitem"
                >
                  <span className="text-lg" aria-hidden="true">
                    {t(item.iconKey)}
                  </span>
                  <span className="font-medium">{t(item.nameKey)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// ========================================
// MAIN HEADER COMPONENT
// ========================================

export default function Header({ className = '' }: { className?: string }) {
  // ========================================
  // TRANSLATIONS
  // ========================================

  const tServices = useTranslations('services');
  const tCommon = useTranslations('common');
  const tHeader = useTranslations('header');

  // Helper to translate keys like "services.weddings.name" or "common.nav.home"
  const t = useCallback((key: string) => {
    const parts = key.split('.');
    if (parts[0] === 'services') {
      // e.g., "services.weddings.name" -> tServices("weddings.name")
      return tServices(parts.slice(1).join('.'));
    }
    if (parts[0] === 'common') {
      // e.g., "common.nav.home" -> tCommon("nav.home")
      return tCommon(parts.slice(1).join('.'));
    }
    return key;
  }, [tServices, tCommon]);

  // ========================================
  // STATE
  // ========================================

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const dropdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollY = useRef(0);
  
  // ========================================
  // SCROLL DETECTION (for header shadow)
  // ========================================
  
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);
      lastScrollY.current = currentScrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // ========================================
  // HANDLERS
  // ========================================
  
  const handleDropdownEnter = useCallback(() => {
    if (dropdownTimerRef.current) {
      clearTimeout(dropdownTimerRef.current);
    }
    dropdownTimerRef.current = setTimeout(() => {
      setDropdownOpen(true);
    }, 100); // 100ms hover delay (UX best practice)
  }, []);
  
  const handleDropdownLeave = useCallback(() => {
    if (dropdownTimerRef.current) {
      clearTimeout(dropdownTimerRef.current);
    }
    dropdownTimerRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 200);
  }, []);
  
  const toggleMobile = useCallback(() => {
    setMobileOpen((prev) => {
      const newState = !prev;
      trackEvent('Header_Mobile_Menu', { action: newState ? 'open' : 'close' });
      return newState;
    });
  }, []);
  
  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);
  
  const handleLogoClick = useCallback(() => {
    trackEvent('Header_Logo_Click');
  }, []);
  
  // ========================================
  // CLEANUP
  // ========================================
  
  useEffect(() => {
    return () => {
      if (dropdownTimerRef.current) {
        clearTimeout(dropdownTimerRef.current);
      }
    };
  }, []);
  
  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);
  
  // ========================================
  // RENDER
  // ========================================
  
  return (
    <header
      className={`
        sticky top-0 z-[9999]
        backdrop-blur-xl bg-[var(--bg-main)]/90
        border-b transition-all duration-300 relative
        ${scrolled ? 'border-white/10 shadow-lg' : 'border-transparent'}
        ${className}
      `}
      style={{ fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif' }}
      role="banner"
    >

      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20 lg:h-24">
          {/* ========================================
              LOGO
              ======================================== */}
          
          <Link
            href="/"
            onClick={handleLogoClick}
            className="flex items-center transition-all duration-200 hover:opacity-80
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oe-gold)]/50 rounded-lg"
            aria-label={tHeader('logoAria')}
          >
            <Image
              src="/img/logoplanetatextdreta.svg"
              alt="Òrbita Events"
              width={280}
              height={80}
              className="h-16 sm:h-14 lg:h-16 w-auto transition-all duration-300"
              priority
            />
          </Link>
          
          {/* ========================================
              DESKTOP NAVIGATION
              ======================================== */}
          
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2" role="navigation" aria-label={tHeader('mainNav')}>
            {NAV_ITEMS.map((item) =>
              item.submenu ? (
                <div
                  key={item.nameKey}
                  className="relative"
                  onMouseEnter={handleDropdownEnter}
                  onMouseLeave={handleDropdownLeave}
                >
                  <button
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-white/80 hover:text-[var(--oe-gold)]
                             hover:bg-white/5 font-medium transition-colors duration-200
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oe-gold)]/50"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                  >
                    {t(item.nameKey)}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        dropdownOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  <DropdownMenu
                    items={item.submenu}
                    isOpen={dropdownOpen}
                    onClose={() => setDropdownOpen(false)}
                    t={t}
                  />
                </div>
              ) : (
                <Link
                  key={item.nameKey}
                  href={item.href!}
                  onClick={() => trackEvent('Header_Nav_Click', { item: t(item.nameKey) })}
                  className={`
                    px-4 py-2.5 rounded-lg font-medium transition-colors duration-200
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oe-gold)]/50
                    ${
                      item.highlight
                        ? 'btn-primary flex items-center gap-2'
                        : item.href === '/sensorial'
                        ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 flex items-center gap-2'
                        : 'text-white/80 hover:text-[var(--oe-gold)] hover:bg-white/5'
                    }
                  `}
                >
                  {item.highlight && <Calculator className="w-5 h-5" aria-hidden="true" />}
                  {item.href === '/sensorial' && <Accessibility className="w-5 h-5" aria-hidden="true" />}
                  {t(item.nameKey)}
                </Link>
              )
            )}

            {/* Contact CTA Desktop - ELIMINAT: El configurador és el CTA principal */}

            {/* Language Selector Desktop */}
            <div className="ml-2">
              <LanguageSelector />
            </div>
          </nav>
          
          {/* ========================================
              MOBILE MENU TOGGLE
              ======================================== */}
          
          <button
            onClick={toggleMobile}
            className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oe-gold)]/50"
            aria-label={mobileOpen ? tHeader('closeMenu') : tHeader('openMenu')}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen ? (
              <X className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Menu className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      
      {/* ========================================
          MOBILE MENU
          ======================================== */}
      
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            id="mobile-menu"
            className="lg:hidden bg-[var(--bg-main)]/98 backdrop-blur-xl border-t border-white/10"
            role="navigation"
            aria-label={tHeader('mobileNav')}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="container mx-auto px-6 py-8 pb-32 flex flex-col gap-3 max-h-[80vh] overflow-y-auto">
              {NAV_ITEMS.map((item) =>
                item.submenu ? (
                  <details key={item.nameKey} className="group">
                    <summary className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white/80
                                      text-lg font-medium cursor-pointer hover:bg-white/5 transition-all duration-300
                                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oe-gold)]/50">
                      {t(item.nameKey)}
                      <ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform" aria-hidden="true" />
                    </summary>
                    <ul className="mt-2 space-y-1">
                      {item.submenu.map((sub) => (
                        <li key={sub.nameKey}>
                          <Link
                            href={sub.href}
                            onClick={closeMobile}
                            className="flex items-center gap-3 px-6 py-2 rounded-lg text-white/70
                                     hover:text-[var(--oe-gold)] hover:bg-white/5 transition-colors"
                          >
                            <span className="text-lg" aria-hidden="true">{t(sub.iconKey)}</span>
                            {t(sub.nameKey)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <Link
                    key={item.nameKey}
                    href={item.href!}
                    onClick={closeMobile}
                    className={`
                      flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-lg transition-colors duration-200
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oe-gold)]/50
                      ${
                        item.highlight
                          ? 'bg-[var(--oe-gold)] text-black font-bold'
                          : item.href === '/sensorial'
                          ? 'text-purple-400 hover:bg-purple-500/10 font-medium'
                          : 'text-white/80 hover:bg-white/5 font-medium'
                      }
                    `}
                  >
                    {item.highlight && <Calculator className="w-6 h-6" aria-hidden="true" />}
                    {item.href === '/sensorial' && <Accessibility className="w-6 h-6" aria-hidden="true" />}
                    {t(item.nameKey)}
                  </Link>
                )
              )}

              {/* Contact CTA Mobile - ELIMINAT: El configurador és el CTA principal */}

              {/* Language Selector Mobile */}
              <div className="mt-6 flex justify-center border-t border-white/10 pt-6">
                <LanguageSelector />
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

