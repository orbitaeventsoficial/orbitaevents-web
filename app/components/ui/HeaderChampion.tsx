// app/components/ui/HeaderChampion.tsx
// ═══════════════════════════════════════════════════════════════════════════
// HEADER PREMIUM V2 - ÒRBITA EVENTS
// ═══════════════════════════════════════════════════════════════════════════
// Fixes: logo gigante, tipografía, desplegables transparents, Barcelona petit
// - Top bar amb status online + ubicació + urgència
// - Logo més petit i elegant (32-36px)
// - Desplegables SÒLIDS (no transparents)
// - Barcelona & Girona més visible
// ═══════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from '@/lib/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSelector from './LanguageSelector';

// ═══════════════════════════════════════════════════════════════════════════
// NAVEGACIÓ
// ═══════════════════════════════════════════════════════════════════════════

interface DropdownItem {
  label: string;
  labelEs: string;
  description?: string;
  descriptionEs?: string;
  href: string;
  icon?: string;
  badge?: string;
}

interface NavItem {
  label: string;
  labelEs: string;
  href: string;
  badge?: string;
  dropdown?: DropdownItem[];
}

const navItems: NavItem[] = [
  {
    label: 'Serveis',
    labelEs: 'Servicios',
    href: '/serveis',
    dropdown: [
      { label: 'Casaments', labelEs: 'Bodas', description: 'El dia més especial', descriptionEs: 'El día más especial', href: '/servicios/bodas', icon: '💍' },
      { label: 'Festes', labelEs: 'Fiestas', description: 'Aniversaris i celebracions', descriptionEs: 'Cumpleaños y celebraciones', href: '/servicios/fiestas', icon: '🎉' },
      { label: 'Empreses', labelEs: 'Empresas', description: 'Events corporatius', descriptionEs: 'Eventos corporativos', href: '/servicios/empresas', icon: '💼' },
    ]
  },
  {
    label: 'Experiències',
    labelEs: 'Experiencias',
    href: '/experiencies',
    badge: 'NEW',
    dropdown: [
      { label: 'Món Màgic', labelEs: 'Mundo Mágico', description: 'Tematització Harry Potter', descriptionEs: 'Tematización Harry Potter', href: '/tematica-mon-magic', icon: '⚡', badge: 'EXCLUSIU' },
      { label: 'Halloween', labelEs: 'Halloween', description: 'Nits de terror amb tots els efectes', descriptionEs: 'Noches de terror con todos los efectos', href: '/tematica-halloween', icon: '🎃' },
    ]
  },
  { label: 'Portfolio', labelEs: 'Portfolio', href: '/portfolio' },
  { label: 'Opinions', labelEs: 'Opiniones', href: '/opiniones' },
  { label: 'Contacte', labelEs: 'Contacto', href: '/contacto' },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function HeaderChampion() {
  const t = useTranslations('common');
  const isEs = t('language') === 'es';

  // Estados
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Refs per scroll sense temblor
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const scrollThreshold = 10;

  // Scroll handler optimitzat
  const handleScroll = useCallback(() => {
    if (ticking.current) return;

    ticking.current = true;

    requestAnimationFrame(() => {
      const currentScrollY = window.scrollY;
      const scrollDiff = currentScrollY - lastScrollY.current;

      if (Math.abs(scrollDiff) > scrollThreshold) {
        if (scrollDiff > 0 && currentScrollY > 100) {
          setIsVisible(false);
          setActiveDropdown(null);
        } else {
          setIsVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }

      setIsScrolled(currentScrollY > 50);
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

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TOP BAR - Info + Idioma */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className={`
        fixed top-0 left-0 right-0 z-50
        bg-zinc-950 border-b border-zinc-800/50
        transition-all duration-300
        ${isVisible ? 'translate-y-0' : '-translate-y-full'}
      `}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-8 text-xs">

            {/* Left: Status */}
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400 font-medium">
                  {isEs ? 'Online ahora' : 'Online ara'}
                </span>
              </span>
              <a href="tel:699121023" className="text-zinc-400 hover:text-white transition-colors hidden sm:block">
                📞 699 121 023
              </a>
            </div>

            {/* Center: Location - MÉS GRAN */}
            <div className="flex items-center gap-1.5 text-zinc-300">
              <span className="text-amber-500">📍</span>
              <span className="font-medium text-sm">Barcelona & Girona</span>
            </div>

            {/* Right: Urgency + Language */}
            <div className="flex items-center gap-3">
              {/* Urgency badge */}
              <span className="hidden md:flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full text-xs">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                <span className="font-medium">
                  {isEs ? 'Solo 1 sábado en Diciembre' : 'Sol 1 dissabte a Desembre'}
                </span>
              </span>

              {/* Language selector */}
              <LanguageSelector />
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MAIN HEADER */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <header
        className={`
          fixed top-8 left-0 right-0 z-50
          transition-all duration-300 ease-out
          ${isVisible ? 'translate-y-0' : '-translate-y-[calc(100%+2rem)]'}
          ${isScrolled
            ? 'bg-zinc-950/98 backdrop-blur-xl shadow-xl shadow-black/30 border-b border-zinc-800/50'
            : 'bg-zinc-950/80 backdrop-blur-md'
          }
        `}
        style={{
          willChange: 'transform',
          backfaceVisibility: 'hidden',
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 md:h-16">

            {/* ════════════════════════════════════════════════════════════ */}
            {/* LOGO - Més petit i elegant */}
            {/* ════════════════════════════════════════════════════════════ */}
            <Link href="/" className="flex items-center gap-2.5 group">
              {/* Logo SVG */}
              <Image
                src="/img/logoplanetatextdreta.svg"
                alt="Òrbita Events"
                width={140}
                height={36}
                className="h-8 md:h-9 w-auto"
                priority
              />
            </Link>

            {/* ════════════════════════════════════════════════════════════ */}
            {/* NAV DESKTOP amb DROPDOWNS SÒLIDS */}
            {/* ════════════════════════════════════════════════════════════ */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {navItems.map((item) => (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => item.dropdown && setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={item.dropdown ? '#' : item.href}
                    className={`
                      relative px-3 py-2 text-sm font-medium
                      transition-colors flex items-center gap-1.5
                      ${activeDropdown === item.label ? 'text-amber-400' : 'text-zinc-300 hover:text-white'}
                    `}
                    onClick={(e) => {
                      if (item.dropdown) {
                        e.preventDefault();
                        setActiveDropdown(activeDropdown === item.label ? null : item.label);
                      }
                    }}
                  >
                    {isEs ? item.labelEs : item.label}
                    {item.badge && (
                      <span className="bg-amber-500 text-[10px] text-black font-bold px-1.5 py-0.5 rounded">
                        {item.badge}
                      </span>
                    )}
                    {item.dropdown && (
                      <svg
                        className={`w-3.5 h-3.5 transition-transform ${activeDropdown === item.label ? 'rotate-180' : ''}`}
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
                    {item.dropdown && activeDropdown === item.label && (
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
                          shadow-2xl shadow-black/50
                        "
                        style={{
                          // FONS COMPLETAMENT SÒLID
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
                              transition-colors
                              group/item
                            "
                            onClick={() => setActiveDropdown(null)}
                          >
                            {/* Icon */}
                            <span className="text-2xl mt-0.5">{subItem.icon}</span>

                            {/* Content */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium group-hover/item:text-amber-400 transition-colors">
                                  {isEs ? subItem.labelEs : subItem.label}
                                </span>
                                {subItem.badge && (
                                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                                    {subItem.badge}
                                  </span>
                                )}
                              </div>
                              {subItem.description && (
                                <p className="text-xs text-zinc-400 mt-0.5">
                                  {isEs ? subItem.descriptionEs : subItem.description}
                                </p>
                              )}
                            </div>

                            {/* Arrow */}
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
                            {isEs ? 'Presupuesto en 2 minutos' : 'Pressupost en 2 minuts'}
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* ════════════════════════════════════════════════════════════ */}
            {/* CTA BUTTONS */}
            {/* ════════════════════════════════════════════════════════════ */}
            <div className="flex items-center gap-2">

              {/* WhatsApp */}
              <a
                href="https://wa.me/34699121023?text=Hola! M'agradaria informació sobre els vostres serveis"
                target="_blank"
                rel="noopener noreferrer"
                className="
                  flex items-center justify-center
                  w-9 h-9 md:w-auto md:h-auto md:px-3 md:py-2
                  bg-zinc-800 hover:bg-green-600
                  text-white text-sm font-medium
                  rounded-full md:rounded-lg
                  border border-zinc-700 md:border-transparent
                  transition-all duration-200
                  hover:scale-105
                "
              >
                <svg className="w-4 h-4 md:mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="hidden md:inline">WhatsApp</span>
              </a>

              {/* CTA Principal */}
              <Link
                href="/configurador"
                className="
                  relative overflow-hidden
                  flex items-center justify-center gap-1.5
                  px-4 py-2 md:px-5 md:py-2.5
                  bg-gradient-to-r from-amber-500 to-amber-400
                  text-zinc-900 text-sm font-bold
                  rounded-lg
                  transition-all duration-200
                  hover:from-amber-400 hover:to-amber-300
                  hover:scale-105
                  hover:shadow-lg hover:shadow-amber-500/25
                  group
                "
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  <span>✨</span>
                  <span className="hidden sm:inline">{isEs ? 'Presupuesto' : 'Pressupost'}</span>
                  <span className="font-black">GRATIS</span>
                </span>

                {/* Shine */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </Link>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5"
                aria-label="Menú"
              >
                <span className={`w-5 h-0.5 bg-white transition-all ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`w-5 h-0.5 bg-white transition-all ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`w-5 h-0.5 bg-white transition-all ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
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
              transition={{ type: 'tween', duration: 0.3 }}
              className="absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-zinc-950 border-l border-zinc-800"
            >
              <div className="flex flex-col h-full pt-24 pb-6 px-6">
                <div className="flex-1 space-y-1 overflow-y-auto">
                  {navItems.map((item) => (
                    <div key={item.href}>
                      <Link
                        href={item.dropdown ? '#' : item.href}
                        onClick={() => !item.dropdown && setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between px-4 py-3 text-lg text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg"
                      >
                        <span className="flex items-center gap-2">
                          {isEs ? item.labelEs : item.label}
                          {item.badge && (
                            <span className="bg-amber-500 text-[10px] text-black font-bold px-1.5 py-0.5 rounded">
                              {item.badge}
                            </span>
                          )}
                        </span>
                        {item.dropdown && (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </Link>

                      {/* Subitems mòbil */}
                      {item.dropdown && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.dropdown.map((sub) => (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-lg"
                            >
                              <span>{sub.icon}</span>
                              <span>{isEs ? sub.labelEs : sub.label}</span>
                              {sub.badge && (
                                <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1 rounded">
                                  {sub.badge}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Language selector mòbil */}
                <div className="py-4 border-t border-zinc-800">
                  <LanguageSelector />
                </div>

                {/* CTAs mòbil */}
                <div className="space-y-3 pt-4 border-t border-zinc-800">
                  <Link
                    href="/configurador"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-900 font-bold rounded-lg"
                  >
                    ✨ {isEs ? 'Presupuesto' : 'Pressupost'} GRATIS
                  </Link>
                  <a
                    href="https://wa.me/34699121023"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white font-semibold rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp Directe
                  </a>
                </div>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer - top bar (32px) + header (56-64px) */}
      <div className="h-[88px] md:h-[96px]" />
    </>
  );
}
