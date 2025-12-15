// app/components/ui/HeaderChampion.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - HEADER CHAMPION v2.1 (Simplificado)
// ═══════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from '@/lib/navigation';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import LanguageSelector from './LanguageSelector';

// ═══════════════════════════════════════════════════════════════════════════
// ICONOS SVG INLINE
// ═══════════════════════════════════════════════════════════════════════════

const Icons = {
  Menu: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  ),
  Close: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  ChevronDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  WhatsApp: () => (
    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  Phone: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  Sparkles: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z"/>
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE NAVEGACIÓN
// ═══════════════════════════════════════════════════════════════════════════

const SERVICES = [
  {
    href: '/servicios/bodas',
    icon: '💍',
    titleKey: 'services.bodas',
    descKey: 'services.bodasDesc',
    color: 'from-rose-500 to-pink-600',
    badge: 'MÁS PEDIDO'
  },
  {
    href: '/servicios/fiestas',
    icon: '🎉',
    titleKey: 'services.fiestas',
    descKey: 'services.fiestasDesc',
    color: 'from-amber-500 to-orange-600',
  },
  {
    href: '/servicios/empresas',
    icon: '💼',
    titleKey: 'services.empresas',
    descKey: 'services.empresasDesc',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    href: '/servicios/discomovil',
    icon: '🎵',
    titleKey: 'services.discomovil',
    descKey: 'services.discomovilDesc',
    color: 'from-purple-500 to-violet-600',
  },
];

const EXPERIENCES = [
  {
    href: '/tematica-mon-magic',
    icon: '🪄',
    titleKey: 'experiences.monMagic',
    descKey: 'experiences.monMagicDesc',
    badge: '★ EXCLUSIVO',
    color: 'from-amber-400 to-yellow-500'
  },
  {
    href: '/tematica-halloween',
    icon: '🎃',
    titleKey: 'experiences.halloween',
    descKey: 'experiences.halloweenDesc',
    color: 'from-orange-500 to-red-600'
  },
  {
    href: '/sensorial',
    icon: '✨',
    titleKey: 'experiences.sensorial',
    descKey: 'experiences.sensorialDesc',
    badge: 'NUEVO',
    color: 'from-emerald-400 to-teal-500'
  },
];

const NAV_LINKS = [
  { href: '/portfolio', labelKey: 'nav.portfolio', icon: '📸' },
  { href: '/opiniones', labelKey: 'nav.reviews', icon: '⭐' },
  { href: '/contacto', labelKey: 'nav.contact', icon: '📧' },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Mega Dropdown (SÓLIDO)
// ═══════════════════════════════════════════════════════════════════════════

interface MegaDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'services' | 'experiences';
  t: (key: string) => string;
}

function MegaDropdown({ isOpen, onClose, type, t }: MegaDropdownProps) {
  const items = type === 'services' ? SERVICES : EXPERIENCES;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-50"
          >
            {/* FONDO SÓLIDO */}
            <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden min-w-[420px]">
              <div className="absolute -top-px left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

              <div className="px-5 py-3 border-b border-zinc-700 bg-zinc-800">
                <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider">
                  {type === 'services' ? '🎯 Nuestros Servicios' : '✨ Experiencias Únicas'}
                </h3>
              </div>

              <div className="p-2 bg-zinc-900">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="group relative flex items-center gap-4 p-3 rounded-xl transition-all duration-200 hover:bg-zinc-800"
                  >
                    <div className={`relative w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200`}>
                      <span className="text-xl">{item.icon}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          {t(item.titleKey)}
                        </span>
                        {'badge' in item && item.badge && (
                          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                            item.badge === 'MÁS PEDIDO' ? 'bg-rose-500 text-white' :
                            item.badge === '★ EXCLUSIVO' ? 'bg-amber-500 text-black' :
                            'bg-emerald-500 text-white'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/50 mt-0.5 group-hover:text-white/70 transition-colors line-clamp-1">
                        {t(item.descKey)}
                      </p>
                    </div>

                    <div className="text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all duration-200">
                      <Icons.ArrowRight />
                    </div>
                  </Link>
                ))}
              </div>

              <div className="px-4 py-3 border-t border-zinc-700 bg-zinc-800">
                <Link
                  href="/configurador"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition-all"
                >
                  <Icons.Sparkles />
                  <span>Presupuesto en 2 minutos</span>
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Mobile Menu (SIN URGENCIA)
// ═══════════════════════════════════════════════════════════════════════════

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

function MobileMenu({ isOpen, onClose, t, tCommon }: MobileMenuProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setExpandedSection(null);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] lg:hidden"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-zinc-950 border-l border-white/10 overflow-y-auto"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/10 bg-zinc-950/95 backdrop-blur-lg">
              <Image
                src="/img/logoplanetatextdreta.svg"
                alt="Òrbita Events"
                width={130}
                height={36}
                className="h-8 w-auto"
              />
              <button
                onClick={onClose}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <Icons.Close />
              </button>
            </div>

            <nav className="p-4 space-y-2">
              {/* Servicios */}
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <button
                  onClick={() => toggleSection('services')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-lg">🎯</span>
                    <span className="font-semibold text-white">{t('nav.services')}</span>
                  </span>
                  <motion.div
                    animate={{ rotate: expandedSection === 'services' ? 180 : 0 }}
                    className="text-white/40"
                  >
                    <Icons.ChevronDown />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {expandedSection === 'services' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5 bg-white/5"
                    >
                      {SERVICES.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                        >
                          <span className="text-lg">{item.icon}</span>
                          <div className="flex-1">
                            <span className="block text-sm font-medium text-white">{t(item.titleKey)}</span>
                            <span className="block text-xs text-white/50">{t(item.descKey)}</span>
                          </div>
                          {'badge' in item && item.badge && (
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-rose-500 text-white rounded-full">
                              {item.badge === 'MÁS PEDIDO' ? 'TOP' : item.badge}
                            </span>
                          )}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Experiencias */}
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <button
                  onClick={() => toggleSection('experiences')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-lg">✨</span>
                    <span className="font-semibold text-white">{t('nav.experiences')}</span>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-purple-500 text-white rounded">NEW</span>
                  </span>
                  <motion.div
                    animate={{ rotate: expandedSection === 'experiences' ? 180 : 0 }}
                    className="text-white/40"
                  >
                    <Icons.ChevronDown />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {expandedSection === 'experiences' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5 bg-white/5"
                    >
                      {EXPERIENCES.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                        >
                          <span className="text-lg">{item.icon}</span>
                          <div className="flex-1">
                            <span className="block text-sm font-medium text-white">{t(item.titleKey)}</span>
                            <span className="block text-xs text-white/50">{t(item.descKey)}</span>
                          </div>
                          {'badge' in item && item.badge && (
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-500 text-black rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Links directos */}
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className="flex items-center gap-3 p-4 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
                >
                  <span className="text-lg">{link.icon}</span>
                  <span className="font-semibold text-white">{tCommon(link.labelKey)}</span>
                </Link>
              ))}
            </nav>

            {/* CTAs */}
            <div className="p-4 space-y-3 border-t border-white/10 mt-4">
              <a
                href="https://wa.me/34699121023"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full p-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all"
              >
                <Icons.WhatsApp />
                <span>WhatsApp Directo</span>
              </a>

              <Link
                href="/contacto"
                onClick={onClose}
                className="flex items-center justify-center gap-3 w-full p-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all"
              >
                <Icons.Sparkles />
                <span>Presupuesto Gratis</span>
              </Link>

              <a
                href="tel:+34699121023"
                className="flex items-center justify-center gap-3 w-full p-4 border border-white/20 text-white font-medium rounded-xl hover:bg-white/5 transition-all"
              >
                <Icons.Phone />
                <span>699 121 023</span>
              </a>
            </div>

            <div className="p-4 border-t border-white/10">
              <LanguageSelector />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL: HeaderChampion
// ═══════════════════════════════════════════════════════════════════════════

export default function HeaderChampion() {
  const t = useTranslations('header');
  const tCommon = useTranslations('common');
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'services' | 'experiences' | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const lastScrollY = useRef(0);
  const dropdownTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 20);

      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
        setActiveDropdown(null);
      } else {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  const handleMouseEnter = useCallback((dropdown: 'services' | 'experiences') => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setActiveDropdown(dropdown);
  }, []);

  const handleMouseLeave = useCallback(() => {
    dropdownTimeout.current = setTimeout(() => setActiveDropdown(null), 100);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : -100 }}
        transition={{ duration: 0.3 }}
        className={`
          fixed top-0 left-0 right-0 z-50
          transition-all duration-500
          ${isScrolled
            ? 'bg-zinc-950/95 backdrop-blur-2xl shadow-xl shadow-black/20 border-b border-white/5'
            : 'bg-gradient-to-b from-black/90 via-black/50 to-transparent'
          }
        `}
      >
        <div className="container mx-auto px-4 lg:px-6">
          <div className={`flex items-center justify-between transition-all duration-500 ${isScrolled ? 'h-16' : 'h-18 lg:h-20'}`}>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0 group relative">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Image
                  src="/img/logoplanetatextdreta.svg"
                  alt="Òrbita Events"
                  width={170}
                  height={48}
                  className={`transition-all duration-500 ${isScrolled ? 'h-10 lg:h-12' : 'h-12 lg:h-14'} w-auto`}
                  priority
                />
              </motion.div>
              <div className="absolute inset-0 bg-amber-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {/* Servicios */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('services')}
                onMouseLeave={handleMouseLeave}
              >
                <button className={`
                  flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${activeDropdown === 'services'
                    ? 'text-amber-400 bg-amber-500/10'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                  }
                `}>
                  <span>{t('nav.services')}</span>
                  <motion.div animate={{ rotate: activeDropdown === 'services' ? 180 : 0 }}>
                    <Icons.ChevronDown />
                  </motion.div>
                </button>
                <MegaDropdown
                  isOpen={activeDropdown === 'services'}
                  onClose={() => setActiveDropdown(null)}
                  type="services"
                  t={t}
                />
              </div>

              {/* Experiencias */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('experiences')}
                onMouseLeave={handleMouseLeave}
              >
                <button className={`
                  flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${activeDropdown === 'experiences'
                    ? 'text-purple-400 bg-purple-500/10'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                  }
                `}>
                  <span>{t('nav.experiences')}</span>
                  <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold bg-purple-500 text-white rounded">NEW</span>
                  <motion.div animate={{ rotate: activeDropdown === 'experiences' ? 180 : 0 }}>
                    <Icons.ChevronDown />
                  </motion.div>
                </button>
                <MegaDropdown
                  isOpen={activeDropdown === 'experiences'}
                  onClose={() => setActiveDropdown(null)}
                  type="experiences"
                  t={t}
                />
              </div>

              {/* Links directos */}
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${pathname === link.href
                      ? 'text-amber-400 bg-amber-500/10'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  {tCommon(link.labelKey)}
                </Link>
              ))}
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden lg:flex items-center gap-3">
              <LanguageSelector />

              {/* WhatsApp */}
              <motion.a
                href="https://wa.me/34699121023"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2.5 text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all"
              >
                <Icons.WhatsApp />
              </motion.a>

              {/* CTA Principal - VISIBLE Y SIMPLE */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/contacto"
                  className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-sm rounded-xl shadow-lg shadow-amber-500/30 transition-all uppercase tracking-wide"
                >
                  <Icons.Sparkles />
                  <span>Presupuesto Gratis</span>
                </Link>
              </motion.div>
            </div>

            {/* Mobile CTAs + Hamburger */}
            <div className="flex lg:hidden items-center gap-2">
              <motion.a
                href="https://wa.me/34699121023"
                target="_blank"
                rel="noopener noreferrer"
                whileTap={{ scale: 0.9 }}
                className="relative p-2.5 text-emerald-400 bg-emerald-500/10 rounded-xl"
              >
                <Icons.WhatsApp />
              </motion.a>

              <motion.button
                onClick={() => setMobileMenuOpen(true)}
                whileTap={{ scale: 0.9 }}
                className="p-2.5 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <Icons.Menu />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Spacer */}
      <div className={`transition-all duration-500 ${isScrolled ? 'h-16' : 'h-[72px] lg:h-[80px]'}`} />

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
