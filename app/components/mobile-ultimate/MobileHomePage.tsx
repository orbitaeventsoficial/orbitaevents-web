'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MOBILE HOME PAGE - Òrbita Events
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Página principal móvil que integra todos los componentes:
 * - HeroPortalLogo intro (planeta animado)
 * - App Shell con PWA features
 * - Hero inmersivo
 * - Servicios en carrusel 3D
 * - Testimonios tipo Reels
 * - CTA con urgencia
 * - Bottom navigation
 *
 * 100% optimizada para móvil
 *
 * FIXED:
 * - Año dinámico
 * - Enlaces de redes sociales reales
 * - Textos usando sistema de traducciones
 * - Rutas con locale
 * - HeroPortalLogo intro en móvil
 */

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import MobileAppShell from './MobileAppShell';
import MobileErrorBoundary from './MobileErrorBoundary';
import MobileHeroUltimate from './MobileHeroUltimate';
import MobileServicesCards from './MobileServicesCards';
import MobileCTAUrgency from './MobileCTAUrgency';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useMobile } from './MobileAppShell';

// Lazy load HeroPortalLogo
const HeroPortalLogo = dynamic(
  () => import('@/app/components/ui/HeroPortalLogo'),
  { ssr: false }
);

// ═══════════════════════════════════════════════════════════════════════════
// QUICK FEATURES SECTION
// ═══════════════════════════════════════════════════════════════════════════

function QuickFeatures() {
  const t = useTranslations('mobileHome.quickFeatures');
  const reduceMotion = useReducedMotion();

  const features = [
    { icon: '💍', titleKey: 'bodas.title', descKey: 'bodas.desc', gradient: 'from-amber-400 to-orange-500' },
    { icon: '🎃', titleKey: 'halloween.title', descKey: 'halloween.desc', gradient: 'from-orange-500 to-red-500' },
    { icon: '🪄', titleKey: 'monMagic.title', descKey: 'monMagic.desc', gradient: 'from-purple-500 to-pink-500' },
    { icon: '🎵', titleKey: 'djPro.title', descKey: 'djPro.desc', gradient: 'from-amber-500 to-orange-500' },
  ];

  return (
    <section className="py-10 px-6 relative">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px]" />

      <div className="relative grid grid-cols-2 gap-3 auto-rows-fr">
        {features.map((feature, i) => (
          <motion.div
            key={feature.titleKey}
            initial={reduceMotion ? false : { opacity: 0, y: 30, scale: 0.8 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={reduceMotion ? { duration: 0 } : { delay: i * 0.1, type: 'spring', damping: 20 }}
            whileTap={{ scale: 0.95 }}
            className="relative group p-4 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 backdrop-blur-sm shadow-xl overflow-hidden h-full text-center"
          >
            {/* Hover glow effect */}
            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-active:opacity-20 transition-opacity`} />

            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={reduceMotion ? { x: 0, opacity: 0 } : { x: ['-100%', '200%'] }}
              transition={reduceMotion ? { duration: 0 } : { duration: 3, repeat: Infinity, ease: 'linear', delay: i * 0.5 }}
            />

            <div className="relative flex flex-col items-center">
              <motion.span
                className="text-3xl block mb-2"
                animate={reduceMotion ? { rotate: 0 } : { rotate: [0, 5, -5, 0] }}
                transition={reduceMotion ? { duration: 0 } : { duration: 4, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
              >
                {feature.icon}
              </motion.span>
              <h3 className="text-white font-black text-sm mb-1">{t(feature.titleKey)}</h3>
              <p className="text-white/60 text-[11px] leading-snug">{t(feature.descKey)}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GUARANTEE SECTION
// ═══════════════════════════════════════════════════════════════════════════

function GuaranteeSection() {
  const t = useTranslations('mobileHome.guarantees');
  const reduceMotion = useReducedMotion();

  const guarantees = [
    {
      icon: '🛡️',
      titleKey: 'satisfaction.title',
      descKey: 'satisfaction.desc',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: '🔧',
      titleKey: 'backup.title',
      descKey: 'backup.desc',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: '⚡',
      titleKey: 'response.title',
      descKey: 'response.desc',
      gradient: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <section className="py-14 px-6 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[100px]" />

      <div className="relative">
        {/* Header - Enhanced */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 px-4"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold tracking-wider uppercase mb-3"
          >
            {t('sectionLabel')}
          </motion.span>
          <h2 className="text-3xl font-black text-white bg-gradient-to-r from-white to-white/80 bg-clip-text mx-auto">
            {t('sectionTitle')}
          </h2>
        </motion.div>

        {/* Guarantees - Enhanced */}
        <div className="space-y-4">
          {guarantees.map((guarantee, i) => (
            <motion.div
              key={guarantee.titleKey}
              initial={reduceMotion ? false : { opacity: 0, x: -30, scale: 0.9 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={reduceMotion ? { duration: 0 } : { delay: i * 0.15, type: 'spring', damping: 20 }}
              whileTap={{ scale: 0.98 }}
              className="relative group"
            >
              <div className="relative flex items-start gap-4 p-5 rounded-3xl bg-gradient-to-r from-white/10 to-white/5 border border-white/20 backdrop-blur-sm shadow-xl overflow-hidden">
                {/* Animated gradient background */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${guarantee.gradient} opacity-0 group-active:opacity-10 transition-opacity`}
                />

                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                  animate={reduceMotion ? { x: 0, opacity: 0 } : { x: ['-100%', '200%'] }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 3, repeat: Infinity, ease: 'linear', delay: i * 1 }}
                />

                <div className="relative">
                  <motion.div
                    animate={reduceMotion ? { scale: 1, rotate: 0 } : {
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 3, repeat: Infinity, delay: i * 0.5 }}
                    className="text-4xl"
                  >
                    {guarantee.icon}
                  </motion.div>
                </div>

                <div className="relative flex-1">
                  <h3 className="text-white font-black text-lg mb-1">
                    {t(guarantee.titleKey)}
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed">
                    {t(guarantee.descKey)}
                  </p>
                </div>

                {/* Checkmark icon */}
                <div className={`relative w-10 h-10 rounded-2xl bg-gradient-to-br ${guarantee.gradient} flex items-center justify-center shadow-lg`}>
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FOOTER SIMPLE
// ═══════════════════════════════════════════════════════════════════════════

function MobileFooter() {
  const t = useTranslations('mobileHome.footer');
  const { locale } = useMobile();
  const currentYear = new Date().getFullYear();

  // URLs de redes sociales reales
  const socialLinks = {
    instagram: 'https://instagram.com/orbitaevents',
  };

  return (
    <footer className="py-8 px-6 pb-24 border-t border-white/10">
      <div className="text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <Image
              src="/img/orbita-glyph.svg"
              alt="Òrbita Events"
              width={40}
              height={40}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-white font-bold text-xl">Òrbita Events</span>
        </div>

        {/* Tagline */}
        <p className="text-white/50 text-sm mb-6">
          {t('tagline')}
        </p>

        {/* Location */}
        <div className="flex items-center justify-center gap-2 text-white/60 text-sm mb-4">
          <span>📍</span>
          <span>{t('location')}</span>
        </div>

        {/* Social links */}
        <div className="flex justify-center gap-4 mb-6">
          <a
            href={socialLinks.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
        </div>

        {/* Legal */}
        <div className="flex justify-center gap-4 text-white/50 text-xs">
          <a href={`/${locale}/legal/privacidad`} className="hover:text-white/60">{t('legal.privacy')}</a>
          <span>·</span>
          <a href={`/${locale}/legal/cookies`} className="hover:text-white/60">{t('legal.cookies')}</a>
          <span>·</span>
          <a href={`/${locale}/legal/aviso-legal`} className="hover:text-white/60">{t('legal.legal')}</a>
        </div>

        {/* Copyright - Dynamic year */}
        <p className="text-white/20 text-xs mt-4">
          © {currentYear} Òrbita Events. {t('copyright')}
        </p>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function MobileHomePage() {
  const [showIntro, setShowIntro] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);

  useEffect(() => {
    // Check if user has seen the intro in this session
    const hasSeenIntro = sessionStorage.getItem('orbita-mobile-intro-seen');

    if (!hasSeenIntro) {
      setShowIntro(true);
    } else {
      setIntroFinished(true);
    }
  }, []);

  useEffect(() => {
    if (!showIntro) return;

    const fallbackTimer = window.setTimeout(() => {
      setShowIntro(false);
      setIntroFinished(true);
      sessionStorage.setItem('orbita-mobile-intro-seen', 'true');
      window.dispatchEvent(new Event('orbita-mobile-intro-complete'));
    }, 2200);

    return () => window.clearTimeout(fallbackTimer);
  }, [showIntro]);

  const handleIntroFinish = () => {
    setShowIntro(false);
    setIntroFinished(true);
    sessionStorage.setItem('orbita-mobile-intro-seen', 'true');
    window.dispatchEvent(new Event('orbita-mobile-intro-complete'));
  };

  return (
    <MobileErrorBoundary>
      {/* Intro mágica - HeroPortalLogo - Optimitzada per mòbil */}
      {showIntro && (
        <HeroPortalLogo
          onFinish={handleIntroFinish}
          fadeMs={2200}
          holdMs={1000}
        />
      )}

      {/* Contenido principal móvil - Solo se muestra después de la intro */}
      {introFinished && (
        <MobileAppShell showSplash={false}>
          {/* Hero */}
          <MobileHeroUltimate />

          {/* Quick Features */}
          <QuickFeatures />

          {/* Services */}
          <MobileServicesCards />

          {/* Guarantees */}
          <GuaranteeSection />

          {/* Final CTA */}
          <MobileCTAUrgency />

          {/* Footer */}
          <MobileFooter />

        </MobileAppShell>
      )}
    </MobileErrorBoundary>
  );
}
