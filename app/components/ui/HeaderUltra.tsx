// ═══════════════════════════════════════════════════════════════════════════════
// HEADER ULTRA - LA MILLOR CAPÇALERA DEL MÓN
// ═══════════════════════════════════════════════════════════════════════════════
// Substitueix: app/components/ui/HeaderUltra.tsx
// ═══════════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from '@/lib/navigation';
import Image from 'next/image';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { useTranslations } from 'next-intl';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓ
// ═══════════════════════════════════════════════════════════════════════════════

const SERVICES = [
  { href: '/servicios/bodas', icon: '💍', key: 'bodes', price: '550€', gradient: 'from-rose-500/20 to-pink-500/20', popular: true },
  { href: '/servicios/fiestas', icon: '🎉', key: 'festes', price: '350€', gradient: 'from-amber-500/20 to-orange-500/20' },
  { href: '/servicios/empresas', icon: '💼', key: 'empreses', price: '400€', gradient: 'from-blue-500/20 to-cyan-500/20' },
  { href: '/servicios/discomovil', icon: '🎵', key: 'discomovil', price: '350€', gradient: 'from-purple-500/20 to-pink-500/20' },
  { href: '/servicios/animacion-infantil', icon: '🎈', key: 'infantil', price: '250€', gradient: 'from-green-500/20 to-emerald-500/20' },
];

const EXPERIENCES = [
  { 
    href: '/tematica-mon-magic', 
    icon: '⚡', 
    key: 'monMagic', 
    image: '/images/tematicas/mon-magic/hero/01-taula-panoramica-cartell.jpg',
    badge: '🔥 Popular',
    gradient: 'from-purple-600 to-blue-600'
  },
  { 
    href: '/tematica-halloween', 
    icon: '🎃', 
    key: 'halloween',
    image: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.jpg',
    badge: '👻 Terrorífic',
    gradient: 'from-orange-600 to-red-600'
  },
  { 
    href: '/sensorial', 
    icon: '💜', 
    key: 'sensorial',
    badge: '✨ Nou',
    gradient: 'from-violet-600 to-purple-600'
  },
];

const NAV_ITEMS = [
  { href: '/portfolio', key: 'portfolio' },
  { href: '/packs', key: 'packs' },
  { href: '/faq', key: 'faq' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: MEGA MENU SERVEIS
// ═══════════════════════════════════════════════════════════════════════════════

function ServicesMegaMenu({ isOpen, onClose, t }: { isOpen: boolean; onClose: () => void; t: any }) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="absolute top-full left-0 right-0 mt-2"
      onMouseLeave={onClose}
    >
      <div className="mx-auto max-w-5xl">
        <div className="bg-zinc-900/98 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Header del mega menu */}
          <div className="px-6 py-4 bg-gradient-to-r from-amber-600/10 to-orange-600/10 border-b border-white/5">
            <p className="text-amber-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="text-lg">🎯</span>
              {t('servicesTitle')}
            </p>
          </div>

          {/* Grid de serveis */}
          <div className="p-4 grid grid-cols-2 lg:grid-cols-3 gap-3">
            {SERVICES.map((service) => (
              <Link
                key={service.href}
                href={service.href}
                onClick={onClose}
                className={`group relative flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-br ${service.gradient} border border-white/5 hover:border-amber-500/30 transition-all duration-300 hover:scale-[1.02]`}
              >
                {service.popular && (
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-black rounded-full">
                    🔥 TOP
                  </span>
                )}
                
                <span className="text-3xl group-hover:scale-110 transition-transform duration-300">
                  {service.icon}
                </span>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white group-hover:text-amber-400 transition-colors">
                    {t(`services.${service.key}`)}
                  </h3>
                  <p className="text-white/50 text-sm line-clamp-2">
                    {t(`services.${service.key}Desc`)}
                  </p>
                  <p className="mt-2 text-amber-400 font-bold text-sm">
                    Des de {service.price}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="px-6 py-4 bg-black/40 border-t border-white/5 flex items-center justify-between">
            <p className="text-white/50 text-sm">
              💡 No saps quin necessites?
            </p>
            <Link
              href="/contacto"
              onClick={onClose}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-full transition-colors"
            >
              Assessorament gratuït →
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: MEGA MENU EXPERIÈNCIES
// ═══════════════════════════════════════════════════════════════════════════════

function ExperiencesMegaMenu({ isOpen, onClose, t }: { isOpen: boolean; onClose: () => void; t: any }) {
  const [hoveredExp, setHoveredExp] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[600px]"
      onMouseLeave={onClose}
    >
      <div className="bg-zinc-900/98 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-purple-500/20 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-white/5">
          <p className="text-purple-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
            <span className="text-lg">✨</span>
            {t('experiencesTitle')}
          </p>
          <p className="text-white/50 text-sm mt-1">
            Festes temàtiques que transporten a altres mons
          </p>
        </div>

        {/* Grid d'experiències */}
        <div className="p-4 grid grid-cols-1 gap-3">
          {EXPERIENCES.map((exp) => (
            <Link
              key={exp.href}
              href={exp.href}
              onClick={onClose}
              onMouseEnter={() => setHoveredExp(exp.key)}
              onMouseLeave={() => setHoveredExp(null)}
              className="group relative flex items-center gap-4 p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-purple-500/30 transition-all duration-300 overflow-hidden"
            >
              {/* Imatge de fons (blur) quan hover */}
              {exp.image && hoveredExp === exp.key && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.15 }}
                  className="absolute inset-0"
                >
                  <Image src={exp.image} alt="" fill className="object-cover blur-sm" />
                </motion.div>
              )}

              <span className="relative text-4xl group-hover:scale-110 transition-transform duration-300 z-10">
                {exp.icon}
              </span>

              <div className="relative flex-1 z-10">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors">
                    {t(`experiences.${exp.key}`)}
                  </h3>
                  {exp.badge && (
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r ${exp.gradient} text-white`}>
                      {exp.badge}
                    </span>
                  )}
                </div>
                <p className="text-white/50 text-sm mt-1">
                  {t(`experiences.${exp.key}Desc`)}
                </p>
              </div>

              <span className="relative text-white/30 group-hover:text-purple-400 group-hover:translate-x-1 transition-all z-10">
                →
              </span>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-t border-white/5 text-center">
          <p className="text-white/60 text-sm">
            🎨 Qualsevol temàtica és possible. <span className="text-purple-400 font-semibold">Consulta'ns!</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: MOBILE MENU
// ═══════════════════════════════════════════════════════════════════════════════

function MobileMenu({ isOpen, onClose, t }: { isOpen: boolean; onClose: () => void; t: any }) {
  const [activeSection, setActiveSection] = useState<'main' | 'services' | 'experiences'>('main');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          />

          {/* Menu */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-zinc-950 border-l border-white/10 z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-zinc-950/95 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between z-10">
              <Image
                src="/img/orbita-logo.svg"
                alt="Òrbita Events"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contingut */}
            <div className="p-4">
              {activeSection === 'main' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-2"
                >
                  {/* Serveis */}
                  <button
                    onClick={() => setActiveSection('services')}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-white"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-2xl">🎯</span>
                      <span className="font-bold">{t('services')}</span>
                    </span>
                    <span className="text-amber-400">→</span>
                  </button>

                  {/* Experiències */}
                  <button
                    onClick={() => setActiveSection('experiences')}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-white"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-2xl">✨</span>
                      <span className="font-bold">{t('experiences')}</span>
                    </span>
                    <span className="text-purple-400">→</span>
                  </button>

                  {/* Altres links */}
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className="block w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-white font-medium transition-colors"
                    >
                      {t(item.key)}
                    </Link>
                  ))}

                  {/* Espai Sensorial destacat */}
                  <Link
                    href="/sensorial"
                    onClick={onClose}
                    className="block w-full p-4 rounded-2xl bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30 text-white relative overflow-hidden"
                  >
                    <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold bg-violet-500 rounded-full">
                      NOU
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-2xl">💜</span>
                      <div>
                        <span className="font-bold block">Espai Sensorial</span>
                        <span className="text-white/50 text-sm">Experiència adaptada</span>
                      </div>
                    </span>
                  </Link>

                  {/* CTA principal */}
                  <div className="pt-4 mt-4 border-t border-white/10">
                    <Link
                      href="/contacto"
                      onClick={onClose}
                      className="block w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-center rounded-2xl text-lg"
                    >
                      Demana Pressupost Gratis 🚀
                    </Link>

                    <a
                      href="https://wa.me/34699121023"
                      onClick={onClose}
                      className="flex items-center justify-center gap-3 w-full py-4 mt-3 bg-[#25D366] text-white font-bold rounded-2xl"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp directe
                    </a>

                    <a
                      href="tel:+34699121023"
                      className="flex items-center justify-center gap-2 w-full py-3 mt-2 text-white/60 text-sm"
                    >
                      📞 699 121 023
                    </a>
                  </div>
                </motion.div>
              )}

              {/* Submenú Serveis */}
              {activeSection === 'services' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <button
                    onClick={() => setActiveSection('main')}
                    className="flex items-center gap-2 text-amber-400 font-medium mb-4"
                  >
                    ← Tornar
                  </button>

                  <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                    <span>🎯</span> {t('servicesTitle')}
                  </h3>

                  <div className="space-y-2">
                    {SERVICES.map((service) => (
                      <Link
                        key={service.href}
                        href={service.href}
                        onClick={onClose}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-amber-500/30 transition-colors"
                      >
                        <span className="text-3xl">{service.icon}</span>
                        <div className="flex-1">
                          <p className="font-bold text-white">{t(`services.${service.key}`)}</p>
                          <p className="text-amber-400 text-sm font-medium">Des de {service.price}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Submenú Experiències */}
              {activeSection === 'experiences' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <button
                    onClick={() => setActiveSection('main')}
                    className="flex items-center gap-2 text-purple-400 font-medium mb-4"
                  >
                    ← Tornar
                  </button>

                  <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                    <span>✨</span> {t('experiencesTitle')}
                  </h3>

                  <div className="space-y-2">
                    {EXPERIENCES.map((exp) => (
                      <Link
                        key={exp.href}
                        href={exp.href}
                        onClick={onClose}
                        className="relative flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-colors overflow-hidden"
                      >
                        {exp.image && (
                          <div className="absolute inset-0 opacity-10">
                            <Image src={exp.image} alt="" fill className="object-cover" />
                          </div>
                        )}
                        <span className="relative text-3xl z-10">{exp.icon}</span>
                        <div className="relative flex-1 z-10">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-white">{t(`experiences.${exp.key}`)}</p>
                            {exp.badge && (
                              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full bg-gradient-to-r ${exp.gradient} text-white`}>
                                {exp.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-white/50 text-sm mt-1">{t(`experiences.${exp.key}Desc`)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL: HEADER ULTRA
// ═══════════════════════════════════════════════════════════════════════════════

export default function HeaderUltra() {
  const t = useTranslations('header');
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'services' | 'experiences' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 50);
  });

  // Tancar menú en scroll
  useEffect(() => {
    const handleScroll = () => {
      if (activeMenu) setActiveMenu(null);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeMenu]);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'py-2 bg-black/90 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20'
            : 'py-4 bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="relative group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Image
                  src="/img/orbita-logo.svg"
                  alt="Òrbita Events"
                  width={140}
                  height={45}
                  className={`transition-all duration-300 ${isScrolled ? 'h-8' : 'h-10'} w-auto`}
                  priority
                />
              </motion.div>
              {/* Glow en hover */}
              <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </Link>

            {/* Nav Desktop */}
            <nav className="hidden lg:flex items-center gap-1">
              {/* Serveis */}
              <div
                className="relative"
                onMouseEnter={() => setActiveMenu('services')}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                    activeMenu === 'services'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{t('services')}</span>
                  <motion.svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    animate={{ rotate: activeMenu === 'services' ? 180 : 0 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </button>

                <AnimatePresence>
                  <ServicesMegaMenu
                    isOpen={activeMenu === 'services'}
                    onClose={() => setActiveMenu(null)}
                    t={t}
                  />
                </AnimatePresence>
              </div>

              {/* Experiències */}
              <div
                className="relative"
                onMouseEnter={() => setActiveMenu('experiences')}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                    activeMenu === 'experiences'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{t('experiences')}</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                    WOW
                  </span>
                  <motion.svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    animate={{ rotate: activeMenu === 'experiences' ? 180 : 0 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </button>

                <AnimatePresence>
                  <ExperiencesMegaMenu
                    isOpen={activeMenu === 'experiences'}
                    onClose={() => setActiveMenu(null)}
                    t={t}
                  />
                </AnimatePresence>
              </div>

              {/* Altres links */}
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-4 py-2.5 rounded-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all"
                >
                  {t(item.key)}
                </Link>
              ))}

              {/* Espai Sensorial - destacat */}
              <Link
                href="/sensorial"
                className="relative px-4 py-2.5 rounded-full text-sm font-medium text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-all group"
              >
                <span className="flex items-center gap-1.5">
                  <span>💜</span>
                  <span>Sensorial</span>
                </span>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-violet-500 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-violet-500 rounded-full" />
              </Link>
            </nav>

            {/* CTAs Desktop */}
            <div className="hidden lg:flex items-center gap-3">
              {/* WhatsApp */}
              <a
                href="https://wa.me/34699121023"
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="hidden xl:inline">WhatsApp</span>
              </a>

              {/* CTA Principal */}
              <Link
                href="/contacto"
                className="relative group px-6 py-2.5 rounded-full overflow-hidden text-sm font-bold"
              >
                {/* Fons gradient */}
                <span className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_auto] animate-shimmer" />
                {/* Glow */}
                <span className="absolute inset-0 blur-xl bg-amber-500/50 scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {/* Text */}
                <span className="relative z-10 flex items-center gap-2 text-black">
                  {t('cta')}
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        t={t}
      />

      {/* Shimmer keyframes */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .animate-shimmer {
          animation: shimmer 3s linear infinite;
        }
      `}</style>
    </>
  );
}

export { HeaderUltra };
