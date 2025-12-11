// app/components/ui/MobileHeaderPro.tsx
// ÒRBITA EVENTS - Mobile Header PROFESSIONAL v6
// Sense rosa, tot daurat, elegant

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import LanguageSelector from './LanguageSelector';

/**
 * MobileHeaderPro - Header PROFESSIONAL per dispositius mòbils
 * 
 * CARACTERÍSTIQUES:
 * - Logo gran i clar
 * - Colors corporatius: DAURAT (ambre) + Negre
 * - SENSE rosa/pink/purple
 * - Navegació clara i accessible
 */

// ═══════════════════════════════════════════════════════════════════
// CONFIGURACIÓ DE SERVEIS
// ═══════════════════════════════════════════════════════════════════
const SERVICE_ITEMS = [
  { href: '/servicios/bodas', labelKey: 'weddings', icon: '💍' },
  { href: '/servicios/fiestas', labelKey: 'parties', icon: '🎉' },
  { href: '/servicios/empresas', labelKey: 'corporate', icon: '💼' },
  { href: '/servicios/discomovil', labelKey: 'discomovil', icon: '🎵' },
];

// ═══════════════════════════════════════════════════════════════════
// EXPERIÈNCIES TEMÀTIQUES
// ═══════════════════════════════════════════════════════════════════
const EXPERIENCE_ITEMS = [
  {
    href: '/tematica-mon-magic',
    labelKey: 'monMagic',
    icon: '🪄',
    descKey: 'monMagicDesc',
    badge: 'Popular',
  },
  {
    href: '/tematica-halloween',
    labelKey: 'halloween',
    icon: '🎃',
    descKey: 'halloweenDesc',
  },
  {
    href: '/boda-halloween',
    labelKey: 'bodaHalloween',
    icon: '💀',
    descKey: 'bodaHalloweenDesc',
  },
];

const MAIN_NAV_ITEMS = [
  { href: '/portfolio', labelKey: 'portfolio', icon: '📸' },
  { href: '/opiniones', labelKey: 'reviews', icon: '⭐' },
  { href: '/contacto', labelKey: 'contact', icon: '💬' },
];

export default function MobileHeaderPro() {
  const t = useTranslations('common.nav');
  const tHeader = useTranslations('header');
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Bloquejar scroll quan menú obert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  // Tancar menú amb ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <>
      {/* Header fixe */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || isOpen
            ? 'bg-black/95 backdrop-blur-xl shadow-2xl border-b border-white/5'
            : 'bg-gradient-to-b from-black/90 to-transparent'
        }`}
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <div className="flex items-center justify-between px-4 h-18">
          {/* Logo - MÉS GRAN */}
          <Link
            href="/"
            className="relative z-10 active:opacity-80 transition-opacity py-3"
            onClick={() => setIsOpen(false)}
          >
            <Image
              src="/img/logoplanetatextdreta.svg"
              alt="Òrbita Events"
              width={160}
              height={48}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Botons dreta */}
          <div className="flex items-center gap-2">
            {/* CTA Pressupost - DAURAT */}
            <Link
              href="/contacto"
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-sm font-bold rounded-full active:scale-95 transition-transform shadow-lg shadow-amber-500/20"
              style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
            >
              Pressupost
            </Link>

            {/* Hamburger button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-12 h-12 flex flex-col items-center justify-center gap-1.5 rounded-full active:bg-white/10 transition-colors"
              aria-label={isOpen ? 'Tancar menú' : 'Obrir menú'}
              aria-expanded={isOpen}
              style={{ minWidth: '48px', minHeight: '48px' }}
            >
              <motion.span
                className="w-6 h-0.5 bg-white rounded-full origin-center"
                animate={{
                  rotate: isOpen ? 45 : 0,
                  y: isOpen ? 8 : 0,
                }}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                className="w-6 h-0.5 bg-white rounded-full"
                animate={{
                  opacity: isOpen ? 0 : 1,
                  scaleX: isOpen ? 0 : 1,
                }}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                className="w-6 h-0.5 bg-white rounded-full origin-center"
                animate={{
                  rotate: isOpen ? -45 : 0,
                  y: isOpen ? -8 : 0,
                }}
                transition={{ duration: 0.2 }}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Menú fullscreen */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/98 backdrop-blur-2xl"
            style={{
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 72px)',
              paddingBottom: 'env(safe-area-inset-bottom, 20px)',
            }}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="relative h-full overflow-y-auto px-6 py-4"
            >
              {/* Header del menú amb selector d'idioma */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">
                  Menú
                </span>
                <LanguageSelector />
              </div>

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* EXPERIÈNCIES TEMÀTIQUES - AMB ESTIL DAURAT                  */}
              {/* ═══════════════════════════════════════════════════════════ */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">✨</span>
                  <span className="text-white font-bold text-lg">
                    {tHeader('experiencies')}
                  </span>
                </div>

                <div className="space-y-3">
                  {EXPERIENCE_ITEMS.map((exp, index) => (
                    <motion.div
                      key={exp.href}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                    >
                      <Link
                        href={exp.href}
                        onClick={() => setIsOpen(false)}
                        className="relative flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 overflow-hidden active:scale-98 transition-transform"
                      >
                        {/* Icona */}
                        <div className="relative z-10 w-14 h-14 rounded-xl bg-amber-500/20 backdrop-blur flex items-center justify-center">
                          <span className="text-3xl">{exp.icon}</span>
                        </div>

                        {/* Contingut */}
                        <div className="relative z-10 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold block">
                              {tHeader(exp.labelKey)}
                            </span>
                            {exp.badge && (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-black rounded-full">
                                {exp.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-white/60 text-sm">
                            {tHeader(exp.descKey)}
                          </span>
                        </div>

                        {/* Fletxa */}
                        <svg className="relative z-10 w-5 h-5 text-amber-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* SERVEIS                                                     */}
              {/* ═══════════════════════════════════════════════════════════ */}
              <div className="mb-8">
                <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-4 px-1">
                  {tHeader('serveis')}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {SERVICE_ITEMS.map((service, index) => (
                    <motion.div
                      key={service.href}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                    >
                      <Link
                        href={service.href}
                        onClick={() => setIsOpen(false)}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 active:bg-amber-500/10 active:border-amber-500/20 transition-colors"
                      >
                        <span className="text-3xl">{service.icon}</span>
                        <span className="text-white font-medium text-sm text-center">
                          {t(service.labelKey)}
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* ALTRES ENLLAÇOS                                             */}
              {/* ═══════════════════════════════════════════════════════════ */}
              <div className="mb-8">
                <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-4 px-1">
                  Més
                </p>
                <div className="space-y-2">
                  {MAIN_NAV_ITEMS.map((item, index) => (
                    <motion.div
                      key={item.href}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/10 transition-colors"
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-white font-medium">
                          {t(item.labelKey)}
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* CTAs FINALS                                                 */}
              {/* ═══════════════════════════════════════════════════════════ */}
              <div className="space-y-3 mt-auto">
                <a
                  href="https://wa.me/34699121023?text=Hola!%20M'agradaria%20informació%20sobre%20els%20vostres%20serveis"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-3 w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp Directe
                </a>

                <a
                  href="tel:+34699121023"
                  className="flex items-center justify-center gap-3 w-full py-4 bg-white/10 text-white font-bold rounded-full border border-white/20"
                >
                  <span className="text-xl">📞</span>
                  +34 699 12 10 23
                </a>
              </div>

              {/* Info de contacte */}
              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <p className="text-white/40 text-sm">
                  📍 Barcelona + Girona
                </p>
                <p className="text-white/40 text-sm mt-1">
                  ⚡ Resposta en 2h
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="h-18" aria-hidden="true" />
    </>
  );
}
