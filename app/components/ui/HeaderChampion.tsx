// app/components/ui/HeaderChampion.tsx
// ═══════════════════════════════════════════════════════════════════════════
// HEADER PREMIUM V2 - ÒRBITA EVENTS (i18n complert)
// ═══════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from '@/lib/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSelector, { LanguageSelectorMobile } from './LanguageSelector';
import { WHATSAPP_URL } from '@/lib/constants';

// ═══════════════════════════════════════════════════════════════════════════
// NAVEGACIÓ - Configuració amb claus de traducció
// ═══════════════════════════════════════════════════════════════════════════

interface NavItemConfig {
  labelKey: string;
  href: string;
  badge?: string;
  dropdownType?: 'services' | 'zones';
  dropdown?: {
    labelKey: string;
    descKey: string;
    href: string;
    icon: string;
    badge?: string;
  }[];
}

const navItemsConfig: NavItemConfig[] = [
  {
    labelKey: 'services',
    href: '/servicios',
    dropdownType: 'services',
    dropdown: [
      { labelKey: 'bodas', descKey: 'bodasDesc', href: '/servicios/bodas', icon: '💍' },
      { labelKey: 'fiestas', descKey: 'fiestasDesc', href: '/servicios/fiestas', icon: '🎉' },
      { labelKey: 'discomovil', descKey: 'discomovilDesc', href: '/servicios/discomovil', icon: '🎵' },
      { labelKey: 'empresas', descKey: 'empresasDesc', href: '/servicios/empresas', icon: '💼' },
      { labelKey: 'monMagic', descKey: 'monMagicDesc', href: '/tematica-mon-magic', icon: '⚡', badge: 'EXCLUSIU' },
      { labelKey: 'halloween', descKey: 'halloweenDesc', href: '/tematica-halloween', icon: '🎃' },
    ]
  },
  { labelKey: 'configurator', href: '/configurador', badge: 'NEW' },
  { labelKey: 'portfolio', href: '/portfolio' },
  {
    labelKey: 'about',
    href: '/opiniones',
    dropdownType: 'zones',
    dropdown: [
      { labelKey: 'reviews', descKey: 'reviewsDesc', href: '/opiniones', icon: '⭐' },
      { labelKey: 'blog', descKey: 'blogDesc', href: '/blog', icon: '📝' },
      { labelKey: 'contact', descKey: 'contactDesc', href: '/contacto', icon: '💬' },
    ]
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function HeaderChampion() {
  const tHeader = useTranslations('header');
  const tNav = useTranslations('header.nav');
  const tServices = useTranslations('header.services');
  const tZones = useTranslations('header.zones');
  const respiraLabel = tHeader('respira.label');
  const respiraTitle = tHeader('respira.title');
  const respiraDescription = tHeader('respira.description');

  // Estados
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpandedSection, setMobileExpandedSection] = useState<string | null>(null);
  const [managedLogoSrc, setManagedLogoSrc] = useState('/img/logoplanetatextdreta.svg');

  // Refs per scroll sense temblor
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const hideThreshold = 32;
  const showThreshold = 6;
  const minHideOffset = 100;

  // Scroll handler optimitzat
  const handleScroll = useCallback(() => {
    if (ticking.current) return;

    ticking.current = true;

        requestAnimationFrame(() => {
      const currentScrollY = Math.max(window.scrollY, 0);
      const scrollDiff = currentScrollY - lastScrollY.current;
      const isNearTop = currentScrollY < 48;

      if (isNearTop) {
        setIsVisible(true);
      } else if (scrollDiff > hideThreshold && currentScrollY > minHideOffset) {
        setIsVisible(false);
        setActiveDropdown(null);
      } else if (scrollDiff < -showThreshold) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
      setIsScrolled(currentScrollY > 36);
      ticking.current = false;
    });
  }, []);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Tancar dropdown al clicar fora
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeDropdown]);

  useEffect(() => {
    let cancelled = false;

    const loadManagedLogo = async () => {
      try {
        const response = await fetch('/api/public/image-manager?key=layout.logo.header', { cache: 'no-store' });
        const data = await response.json().catch(() => null);
        const src = data?.data?.['layout.logo.header']?.item?.src;
        if (!cancelled && typeof src === 'string' && src.length > 0) {
          setManagedLogoSrc(src);
        }
      } catch {
        // mantenir fallback estàtic
      }
    };

    void loadManagedLogo();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MAIN HEADER - Clean & Minimal */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <header
        id="main-nav"
        role="banner"
        className={`
          fixed top-0 left-0 right-0 z-50
                    transition-[transform,opacity,background-color,backdrop-filter,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
          ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-[108%] opacity-0'}
          ${isScrolled
            ? 'bg-zinc-950/94 backdrop-blur-2xl shadow-xl shadow-black/20 border-b border-zinc-800/60'
            : 'bg-zinc-950/76 backdrop-blur-lg border-b border-transparent'
          }
        `}
        style={{
          willChange: 'transform',
          backfaceVisibility: 'hidden',
        }}
      >
        <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-[84px] md:h-28 pt-3">

            {/* ════════════════════════════════════════════════════════════ */}
            {/* LOGO */}
            {/* ════════════════════════════════════════════════════════════ */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group shrink-0"
              style={{ touchAction: 'manipulation' }}
            >
              <Image
                src={managedLogoSrc}
                alt="Òrbita Events"
                width={260}
                height={80}
                sizes="260px"
                quality={85}
                className="h-14 md:h-[4.5rem] w-auto pointer-events-none select-none transition-transform group-hover:scale-105"
                priority
                draggable={false}
              />
            </Link>

            {/* ════════════════════════════════════════════════════════════ */}
            {/* NAV DESKTOP amb DROPDOWNS SÒLIDS */}
            {/* ════════════════════════════════════════════════════════════ */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {navItemsConfig.map((item) => {
                // Seleccionar el traductor correcte per al dropdown
                const dropdownT = item.dropdownType === 'services' ? tServices : tZones;

                return (
                  <div
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => item.dropdown && setActiveDropdown(item.labelKey)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <Link
                      href={item.href}
                      className={`
                        relative px-4 py-2 text-base font-semibold
                        transition-colors flex items-center gap-2
                        ${activeDropdown === item.labelKey ? 'text-amber-400' : 'text-zinc-300 hover:text-white'}
                      `}
                    >
                      {tNav(item.labelKey)}
                      {item.badge && (
                        <span className="bg-amber-500 text-[10px] text-black font-bold px-1.5 py-0.5 rounded">
                          {item.badge}
                        </span>
                      )}
                      {item.dropdown && (
                        <svg
                          className={`w-3.5 h-3.5 transition-transform ${activeDropdown === item.labelKey ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </Link>

                    {/* ══════════════════════════════════════════════════════ */}
                    {/* DROPDOWN - FONS SÒLID (no transparent!) */}
                    {/* ══════════════════════════════════════════════════════ */}
                    <AnimatePresence>
                      {item.dropdown && activeDropdown === item.labelKey && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="
                            absolute top-full left-0 mt-1
                            w-72 p-2
                            bg-zinc-900
                            border border-zinc-700
                            rounded-xl
                            shadow-2xl shadow-black/60
                          "
                          style={{
                            backgroundColor: 'rgb(24, 24, 27)',
                          }}
                        >
                          {item.dropdown.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className="
                                flex items-start gap-3 p-3
                                rounded-lg
                                hover:bg-zinc-800
                                transition-all duration-200
                                group/item
                              "
                              onClick={() => setActiveDropdown(null)}
                            >
                              <span className="text-2xl mt-0.5">{subItem.icon}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-medium group-hover/item:text-amber-400 transition-colors">
                                    {dropdownT(subItem.labelKey)}
                                  </span>
                                  {subItem.badge && (
                                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                                      {subItem.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                  {dropdownT(subItem.descKey)}
                                </p>
                              </div>
                              <svg
                                className="w-4 h-4 text-zinc-600 group-hover/item:text-amber-400 group-hover/item:translate-x-1 transition-all mt-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          ))}

                          {/* CTA al final del dropdown */}
                          <div className="mt-2 pt-2 border-t border-zinc-800">
                            <Link
                              href="/configurador"
                              onClick={() => setActiveDropdown(null)}
                              className="
                                flex items-center justify-center gap-2
                                w-full py-2.5
                                bg-gradient-to-r from-amber-500 to-amber-400
                                text-zinc-900 font-semibold text-sm
                                rounded-lg
                                hover:from-amber-400 hover:to-amber-300
                                transition-all
                              "
                            >
                              <span>✨</span>
                              {tHeader('ctaQuick')}
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </nav>

            {/* Pestaña especial Respira (separada visualmente del menú) */}
            <div className="hidden lg:flex items-center ml-4 pl-4 border-l border-zinc-700/70">
              <div className="relative group">
              <Link
                href="/respira"
                className="
                  inline-flex items-center gap-2
                  px-4 py-2.5
                  rounded-xl
                  border border-pink-300/50
                  bg-gradient-to-r from-pink-500/90 via-fuchsia-500/90 to-rose-500/90
                  text-white text-sm font-semibold
                  shadow-lg shadow-pink-500/20
                  transition-all duration-200
                  hover:scale-[1.03] hover:shadow-pink-400/35
                "
                aria-label={respiraLabel}
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/25 text-base">
                  🌼
                </span>
                <span>{respiraLabel}</span>
              </Link>
              <div
                className="
                  pointer-events-none
                  absolute left-0 top-full mt-2 w-80
                  rounded-xl border border-pink-200/40 bg-zinc-950/95 p-4
                  text-white opacity-0 shadow-2xl shadow-pink-500/20
                  transition-opacity duration-200
                  group-hover:opacity-100 group-focus-within:opacity-100
                "
              >
                <p className="text-sm font-semibold text-pink-300">{respiraTitle}</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-200">{respiraDescription}</p>
              </div>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════ */}
            {/* CTA BUTTONS + Language */}
            {/* ════════════════════════════════════════════════════════════ */}
            <div className="flex items-center gap-2">

              {/* Language selector - desktop only */}
              <div className="hidden lg:block">
                <LanguageSelectorMobile />
              </div>

              {/* CTA Principal - Contacte */}
              <Link
                href="/contacto"
                className="
                  relative overflow-hidden
                  hidden md:flex items-center justify-center gap-2
                  px-3 py-2 md:px-6 md:py-3
                  bg-gradient-to-r from-amber-500 to-amber-400
                  text-zinc-900 text-sm md:text-base font-bold
                  rounded-xl
                  transition-all duration-200
                  hover:from-amber-400 hover:to-amber-300
                  hover:scale-105
                  hover:shadow-lg hover:shadow-amber-500/25
                  group
                "
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  <span className="font-bold">{tHeader('cta')}</span>
                </span>

                {/* Shine */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </Link>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden flex flex-col items-center justify-center gap-1.5 w-11 h-11 -mr-2 rounded-xl"
                aria-label="Menú"
                aria-expanded={isMobileMenuOpen}
              >
                <span className={`block w-5 h-0.5 bg-white transition-all duration-300 origin-center ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-5 h-0.5 bg-white transition-all duration-300 origin-center ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MOBILE MENU */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-zinc-950/95 backdrop-blur-xl border-l border-white/[0.08]"
            >
              {/* Ambient glow */}
              <div className="absolute top-20 right-0 w-48 h-48 bg-amber-500/8 rounded-full blur-[80px] pointer-events-none" />

              <div className="flex flex-col h-full pt-20 pb-6 px-5 relative">
                {/* Close hint */}
                <div className="absolute top-7 right-5">
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/40 active:scale-90 transition-transform"
                    aria-label="Tancar menú"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1" style={{ scrollbarWidth: 'none' }}>
                  {/* Respira — featured card */}
                  <Link
                    href="/respira"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="mb-5 flex items-center gap-3 rounded-2xl border border-pink-400/20 bg-gradient-to-r from-pink-500/12 to-fuchsia-500/8 px-4 py-3 text-white active:scale-[0.98] transition-transform"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-pink-500/20 text-base">🌼</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-white/85">{respiraLabel}</span>
                      <span className="block text-[11px] text-white/40">{respiraTitle}</span>
                    </span>
                    <svg className="h-3.5 w-3.5 text-white/25 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  {/* Nav items */}
                  {navItemsConfig.map((item) => {
                    const dropdownT = item.dropdownType === 'services' ? tServices : tZones;
                    const isExpanded = mobileExpandedSection === item.href;
                    const isServiceGrid = item.dropdownType === 'services';

                    return (
                      <div key={item.href}>
                        {item.dropdown ? (
                          /* Collapsable section header */
                          <button
                            type="button"
                            onClick={() => setMobileExpandedSection(isExpanded ? null : item.href)}
                            className="flex w-full items-center justify-between px-3 py-3 text-[15px] font-semibold text-white/75 active:text-white rounded-xl transition-colors"
                            aria-expanded={isExpanded}
                          >
                            <span className="flex items-center gap-2">
                              {tNav(item.labelKey)}
                              {item.badge && (
                                <span className="bg-amber-500/20 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                                  {item.badge}
                                </span>
                              )}
                            </span>
                            <svg className={`w-3.5 h-3.5 text-white/30 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        ) : (
                          /* Direct link */
                          <Link
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center justify-between px-3 py-3 text-[15px] font-semibold text-white/75 active:text-white active:bg-white/[0.04] rounded-xl transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              {tNav(item.labelKey)}
                              {item.badge && (
                                <span className="bg-amber-500/20 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                                  {item.badge}
                                </span>
                              )}
                            </span>
                          </Link>
                        )}

                        {/* Subitems — col·lapsables, grid per serveis */}
                        {item.dropdown && isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className={`mt-1 mb-3 mx-1 p-2 rounded-2xl bg-white/[0.03] border border-white/[0.05] ${isServiceGrid ? 'grid grid-cols-2 gap-1' : 'space-y-0.5'}`}
                          >
                            {item.dropdown.map((sub) => (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-2 px-3 py-2.5 text-white/55 active:text-white active:bg-white/[0.05] rounded-xl transition-colors ${isServiceGrid ? 'flex-col gap-1 py-3 text-center' : ''}`}
                              >
                                <span className={`flex items-center justify-center text-sm ${isServiceGrid ? 'w-9 h-9 rounded-xl bg-white/[0.06]' : 'w-7 h-7 rounded-lg bg-white/[0.05]'}`}>{sub.icon}</span>
                                <span className={`font-medium ${isServiceGrid ? 'text-xs leading-tight' : 'text-sm'}`}>{dropdownT(sub.labelKey)}</span>
                                {sub.badge && (
                                  <span className="text-[7px] bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-md font-bold">
                                    {sub.badge}
                                  </span>
                                )}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Language selector mòbil */}
                <div className="py-3 border-t border-white/[0.06]">
                  <LanguageSelector />
                </div>

                {/* CTAs mòbil */}
                <div className="space-y-2.5 pt-3 border-t border-white/[0.06]">
                  <Link
                    href="/contacto"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-sm font-black rounded-2xl shadow-[0_8px_24px_rgba(251,191,36,0.25)] active:scale-[0.97] transition-transform"
                  >
                    {tHeader('cta')}
                  </Link>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank" rel="noopener noreferrer"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-white/[0.06] text-white text-sm font-semibold rounded-2xl border border-white/[0.10] active:scale-[0.97] transition-transform"
                  >
                    <svg className="w-4.5 h-4.5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>
                </div>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer - header height */}
      <div className="h-[84px] md:h-28" />
    </>
  );
}

