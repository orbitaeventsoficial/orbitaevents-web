// app/components/ui/HeaderChampion.tsx
// ═══════════════════════════════════════════════════════════════════════════
// HEADER PREMIUM - ÒRBITA EVENTS v3.0
// ═══════════════════════════════════════════════════════════════════════════
// Soluciona: temblor, botón invisible, transiciones bruscas
// - Scroll optimitzat amb requestAnimationFrame + threshold
// - GPU acceleration (will-change, backfaceVisibility)
// - Botó CTA daurat brillant + text negre + "GRATIS" font-black
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

interface NavItem {
  label: string;
  labelEs: string;
  href: string;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: 'Experiències', labelEs: 'Experiencias', href: '/tematica-mon-magic', badge: '✨' },
  { label: 'Casaments', labelEs: 'Bodas', href: '/servicios/bodas' },
  { label: 'Festes', labelEs: 'Fiestas', href: '/servicios/fiestas' },
  { label: 'Empreses', labelEs: 'Empresas', href: '/servicios/empresas' },
  { label: 'Portfolio', labelEs: 'Portfolio', href: '/portfolio' },
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

  // Refs per evitar temblor
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const scrollThreshold = 10; // Mínim de píxels per activar canvi

  // ─────────────────────────────────────────────────────────────────────────
  // SCROLL HANDLER OPTIMITZAT (sense temblor)
  // ─────────────────────────────────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    if (ticking.current) return;

    ticking.current = true;

    requestAnimationFrame(() => {
      const currentScrollY = window.scrollY;
      const scrollDiff = currentScrollY - lastScrollY.current;

      // Només canviar si el scroll és significatiu (evita temblor)
      if (Math.abs(scrollDiff) > scrollThreshold) {
        // Mostrar/amagar basat en direcció
        if (scrollDiff > 0 && currentScrollY > 100) {
          // Scrolling DOWN + ja passat 100px → amagar
          setIsVisible(false);
        } else {
          // Scrolling UP → mostrar
          setIsVisible(true);
        }

        lastScrollY.current = currentScrollY;
      }

      // Background sòlid després de 50px
      setIsScrolled(currentScrollY > 50);

      ticking.current = false;
    });
  }, []);

  useEffect(() => {
    // Inicialitzar posició
    lastScrollY.current = window.scrollY;
    setIsScrolled(window.scrollY > 50);

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Tancar menú mòbil al fer scroll
  useEffect(() => {
    if (isMobileMenuOpen && isScrolled) {
      setIsMobileMenuOpen(false);
    }
  }, [isScrolled, isMobileMenuOpen]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-50
          transition-all duration-300 ease-out
          ${isVisible ? 'translate-y-0' : '-translate-y-full'}
          ${isScrolled
            ? 'bg-zinc-950/95 backdrop-blur-xl shadow-lg shadow-black/20 border-b border-zinc-800/50'
            : 'bg-gradient-to-b from-black/80 to-transparent'
          }
        `}
        style={{
          // Optimització GPU per evitar temblor
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* LOGO */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <Link
              href="/"
              className="flex items-center gap-2 group"
            >
              <Image
                src="/img/logoplanetatextdreta.svg"
                alt="Òrbita Events"
                width={150}
                height={40}
                className="h-9 md:h-11 w-auto"
                priority
              />
            </Link>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* NAV DESKTOP */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative px-4 py-2 text-sm text-zinc-300 hover:text-white transition-colors group"
                >
                  <span className="relative z-10 flex items-center gap-1">
                    {item.badge && <span className="text-xs">{item.badge}</span>}
                    {isEs ? item.labelEs : item.label}
                  </span>
                  {/* Hover effect */}
                  <span className="absolute inset-0 bg-white/5 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-200" />
                </Link>
              ))}
            </nav>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* CTA BUTTONS */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <div className="flex items-center gap-2 md:gap-3">

              {/* Language Selector - Desktop */}
              <div className="hidden lg:block">
                <LanguageSelector />
              </div>

              {/* WhatsApp - Solo icono en móvil */}
              <a
                href="https://wa.me/34699121023?text=Hola! M'agradaria informació sobre els vostres serveis"
                target="_blank"
                rel="noopener noreferrer"
                className="
                  flex items-center justify-center
                  w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2.5
                  bg-green-600 hover:bg-green-500
                  text-white text-sm font-medium
                  rounded-full md:rounded-lg
                  transition-all duration-200
                  hover:scale-105 hover:shadow-lg hover:shadow-green-500/25
                "
                aria-label="WhatsApp"
              >
                {/* Icono WhatsApp */}
                <svg className="w-5 h-5 md:mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="hidden md:inline">WhatsApp</span>
              </a>

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* CTA PRINCIPAL - MÀXIMA VISIBILITAT */}
              {/* ═══════════════════════════════════════════════════════════ */}
              <Link
                href="/configurador"
                className="
                  relative overflow-hidden
                  flex items-center justify-center gap-2
                  px-4 py-2.5 md:px-6 md:py-3
                  bg-gradient-to-r from-amber-500 to-amber-400
                  text-zinc-900 text-sm md:text-base font-bold
                  rounded-lg
                  transition-all duration-200
                  hover:from-amber-400 hover:to-amber-300
                  hover:scale-105
                  hover:shadow-xl hover:shadow-amber-500/30
                  group
                "
              >
                {/* Shine effect */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                {/* Text */}
                <span className="relative z-10 whitespace-nowrap">
                  <span className="hidden sm:inline">{isEs ? 'Presupuesto ' : 'Pressupost '}</span>
                  <span className="font-black">GRATIS</span>
                </span>

                {/* Arrow */}
                <svg
                  className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* HAMBURGER MÒBIL */}
              {/* ═══════════════════════════════════════════════════════════ */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5"
                aria-label="Menú"
                aria-expanded={isMobileMenuOpen}
              >
                <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </button>

            </div>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MENÚ MÒBIL */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Content */}
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-zinc-950 border-l border-zinc-800 shadow-2xl"
            >
              <div className="flex flex-col h-full pt-20 pb-6 px-6">

                {/* Nav Items */}
                <div className="flex-1 space-y-1">
                  {navItems.map((item, i) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-lg text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors"
                      >
                        {item.badge && <span>{item.badge}</span>}
                        {isEs ? item.labelEs : item.label}
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Language Selector - Mobile */}
                <div className="py-4 border-t border-zinc-800">
                  <LanguageSelector />
                </div>

                {/* CTA en mòbil */}
                <div className="space-y-3 pt-4 border-t border-zinc-800">
                  <Link
                    href="/configurador"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-900 font-bold rounded-lg"
                  >
                    {isEs ? 'Presupuesto' : 'Pressupost'} GRATIS
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>

                  <a
                    href="https://wa.me/34699121023"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-green-600 text-white font-semibold rounded-lg"
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

      {/* Spacer per evitar que el contingut quedi darrere del header */}
      <div className="h-16 md:h-20" />
    </>
  );
}
