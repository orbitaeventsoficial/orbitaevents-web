// app/components/ui/Header.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - HEADER UNIFICAT v3.0
// ═══════════════════════════════════════════════════════════════════════════
//
// Un sol header per desktop i mòbil:
// - Disseny elegant i professional
// - Animacions suaus i performants
// - Menú mòbil fullscreen
// - Dropdowns accessibles
// - Zero duplicació de codi
//
// ═══════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from '@/lib/navigation';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Menu, X, ChevronDown, Phone, Calculator } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓ
// ═══════════════════════════════════════════════════════════════════════════

const SERVICES = [
  { href: '/servicios/bodas', icon: '💍', titleKey: 'services.bodas', descKey: 'services.bodasDesc' },
  { href: '/servicios/fiestas', icon: '🎉', titleKey: 'services.fiestas', descKey: 'services.fiestasDesc' },
  { href: '/servicios/empresas', icon: '💼', titleKey: 'services.empresas', descKey: 'services.empresasDesc' },
  { href: '/servicios/discomovil', icon: '🎵', titleKey: 'services.discomovil', descKey: 'services.discomovilDesc' },
];

const EXPERIENCES = [
  { href: '/tematica-mon-magic', icon: '🪄', titleKey: 'experiences.monMagic', descKey: 'experiences.monMagicDesc', badge: true },
  { href: '/tematica-halloween', icon: '🎃', titleKey: 'experiences.halloween', descKey: 'experiences.halloweenDesc' },
  { href: '/boda-halloween', icon: '💀', titleKey: 'experiences.bodaHalloween', descKey: 'experiences.bodaHalloweenDesc' },
];

const NAV_LINKS = [
  { href: '/portfolio', labelKey: 'nav.portfolio' },
  { href: '/opiniones', labelKey: 'nav.reviews' },
  { href: '/contacto', labelKey: 'nav.contact' },
];

// ═══════════════════════════════════════════════════════════════════════════
// DROPDOWN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface DropdownItem {
  href: string;
  icon: string;
  titleKey: string;
  descKey: string;
  badge?: boolean;
}

interface DropdownProps {
  items: DropdownItem[];
  isOpen: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
  t: (key: string) => string;
  accentColor?: 'gold' | 'purple';
}

function Dropdown({ items, isOpen, title, subtitle, onClose, t, accentColor = 'gold' }: DropdownProps) {
  const colors = {
    gold: {
      header: 'from-amber-500/10 to-orange-500/5',
      hover: 'hover:bg-amber-500/10',
      text: 'group-hover:text-amber-400',
      icon: 'group-hover:bg-amber-500/20',
      badge: 'bg-amber-500 text-black',
    },
    purple: {
      header: 'from-purple-500/10 to-pink-500/5',
      hover: 'hover:bg-purple-500/10',
      text: 'group-hover:text-purple-400',
      icon: 'group-hover:bg-purple-500/20',
      badge: 'bg-purple-500 text-white',
    },
  }[accentColor];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="absolute top-full left-0 mt-3 w-80 bg-zinc-900/98 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
        >
          {/* Header */}
          <div className={`px-5 py-4 bg-gradient-to-r ${colors.header} border-b border-white/5`}>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="text-xs text-white/50 mt-0.5">{subtitle}</p>
          </div>

          {/* Items */}
          <div className="p-2">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${colors.hover}`}
              >
                <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center transition-colors ${colors.icon}`}>
                  <span className="text-lg">{item.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium text-white transition-colors ${colors.text}`}>
                      {t(item.titleKey)}
                    </span>
                    {item.badge && (
                      <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${colors.badge}`}>
                        ★
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-white/40 line-clamp-1">{t(item.descKey)}</span>
                </div>
                <ChevronDown className="w-4 h-4 -rotate-90 text-white/20 group-hover:text-white/40 transition-colors" />
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MOBILE MENU COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

function MobileMenu({ isOpen, onClose, t, tCommon }: MobileMenuProps) {
  const [expandedSection, setExpandedSection] = useState<'services' | 'experiences' | null>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const toggleSection = (section: 'services' | 'experiences') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 lg:hidden"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Menu panel */}
          <motion.nav
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-zinc-950 border-l border-white/10 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-zinc-950/95 backdrop-blur-lg border-b border-white/5">
              <Image
                src="/img/logoplanetatextdreta.svg"
                alt="Òrbita Events"
                width={140}
                height={40}
                className="h-8 w-auto"
              />
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                aria-label="Tancar menú"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-2">
              {/* Services Accordion */}
              <div className="rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('services')}
                  className="w-full flex items-center justify-between p-4 text-left bg-white/5 hover:bg-white/[0.07] transition-colors"
                >
                  <span className="font-semibold text-white">{t('nav.services')}</span>
                  <ChevronDown className={`w-5 h-5 text-white/40 transition-transform ${expandedSection === 'services' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {expandedSection === 'services' && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden bg-white/[0.02]"
                    >
                      <div className="p-2 space-y-1">
                        {SERVICES.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-white/80">{t(item.titleKey)}</span>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Experiences Accordion */}
              <div className="rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('experiences')}
                  className="w-full flex items-center justify-between p-4 text-left bg-white/5 hover:bg-white/[0.07] transition-colors"
                >
                  <span className="font-semibold text-white">{t('nav.experiences')}</span>
                  <ChevronDown className={`w-5 h-5 text-white/40 transition-transform ${expandedSection === 'experiences' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {expandedSection === 'experiences' && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden bg-white/[0.02]"
                    >
                      <div className="p-2 space-y-1">
                        {EXPERIENCES.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-white/80">{t(item.titleKey)}</span>
                            {item.badge && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-black rounded">★</span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Direct Links */}
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className="block p-4 rounded-xl bg-white/5 hover:bg-white/[0.07] font-semibold text-white transition-colors"
                >
                  {tCommon(link.labelKey)}
                </Link>
              ))}

              {/* Divider */}
              <div className="h-px bg-white/10 my-4" />

              {/* CTAs */}
              <Link
                href="/configurador"
                onClick={onClose}
                className="flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold hover:shadow-lg hover:shadow-amber-500/25 transition-all"
              >
                <Calculator className="w-5 h-5" />
                {tCommon('buttons.configure')}
              </Link>

              <a
                href="tel:+34699121023"
                className="flex items-center justify-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-colors"
              >
                <Phone className="w-5 h-5" />
                699 121 023
              </a>

              {/* Language Selector */}
              <div className="flex justify-center pt-4">
                <LanguageSelector />
              </div>
            </div>
          </motion.nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HEADER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function Header() {
  const t = useTranslations('header');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'services' | 'experiences' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Dropdown handlers with delay
  const handleMouseEnter = useCallback((dropdown: 'services' | 'experiences') => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setActiveDropdown(dropdown);
  }, []);

  const handleMouseLeave = useCallback(() => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-50 
          transition-all duration-500
          ${isScrolled 
            ? 'bg-black/95 backdrop-blur-xl shadow-lg shadow-black/20 border-b border-white/5' 
            : 'bg-gradient-to-b from-black/90 via-black/50 to-transparent'
          }
        `}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className={`flex items-center justify-between transition-all duration-500 ${isScrolled ? 'h-16' : 'h-20 lg:h-24'}`}>
            
            {/* ══════════════════════════════════════════════════════════════ */}
            {/* LOGO */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <Link href="/" className="flex-shrink-0 group">
              <Image
                src="/img/logoplanetatextdreta.svg"
                alt="Òrbita Events"
                width={200}
                height={56}
                className={`transition-all duration-500 group-hover:brightness-110 ${isScrolled ? 'h-10 lg:h-11' : 'h-11 lg:h-14'} w-auto`}
                priority
              />
            </Link>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* DESKTOP NAV */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <nav className="hidden lg:flex items-center gap-1">
              
              {/* Services Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('services')}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className={`
                    flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${activeDropdown === 'services' 
                      ? 'text-amber-400 bg-amber-500/10' 
                      : 'text-white/75 hover:text-white hover:bg-white/5'
                    }
                  `}
                  aria-expanded={activeDropdown === 'services'}
                >
                  {t('nav.services')}
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'services' ? 'rotate-180' : ''}`} />
                </button>
                <Dropdown
                  items={SERVICES}
                  isOpen={activeDropdown === 'services'}
                  title={t('dropdowns.servicesTitle')}
                  subtitle={t('dropdowns.servicesSubtitle')}
                  onClose={() => setActiveDropdown(null)}
                  t={t}
                  accentColor="gold"
                />
              </div>

              {/* Experiences Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('experiences')}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className={`
                    flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${activeDropdown === 'experiences' 
                      ? 'text-purple-400 bg-purple-500/10' 
                      : 'text-white/75 hover:text-white hover:bg-white/5'
                    }
                  `}
                  aria-expanded={activeDropdown === 'experiences'}
                >
                  {t('nav.experiences')}
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'experiences' ? 'rotate-180' : ''}`} />
                </button>
                <Dropdown
                  items={EXPERIENCES}
                  isOpen={activeDropdown === 'experiences'}
                  title={t('dropdowns.experiencesTitle')}
                  subtitle={t('dropdowns.experiencesSubtitle')}
                  onClose={() => setActiveDropdown(null)}
                  t={t}
                  accentColor="purple"
                />
              </div>

              {/* Direct Links */}
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-white/75 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  {tCommon(link.labelKey)}
                </Link>
              ))}
            </nav>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* DESKTOP CTAs */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <div className="hidden lg:flex items-center gap-3">
              <LanguageSelector />
              
              {/* WhatsApp */}
              <a
                href="https://wa.me/34699121023"
                target="_blank"
                rel="noopener noreferrer"
                className="relative p-2.5 text-white/50 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-all"
                aria-label="WhatsApp"
              >
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>

              {/* CTA Button */}
              <Link
                href="/configurador"
                className="group relative px-5 py-2.5 rounded-full overflow-hidden bg-gradient-to-r from-amber-500 to-amber-600 hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 hover:scale-[1.02]"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative flex items-center gap-2 text-black font-semibold text-sm">
                  <Calculator className="w-4 h-4" />
                  {t('cta')}
                </span>
              </Link>
            </div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* MOBILE HAMBURGER */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -mr-2 text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Obrir menú"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Spacer */}
      <div className={`transition-all duration-500 ${isScrolled ? 'h-16' : 'h-20 lg:h-24'}`} aria-hidden="true" />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        t={t}
        tCommon={tCommon}
      />
    </>
  );
}
