'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MOBILE HOME PAGE - Òrbita Events
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Página principal móvil que integra todos los componentes:
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
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import MobileAppShell from './MobileAppShell';
import MobileErrorBoundary from './MobileErrorBoundary';
import MobileHeroUltimate from './MobileHeroUltimate';
import MobileServicesCards from './MobileServicesCards';
import MobileCTAUrgency from './MobileCTAUrgency';
import MobileStatsSection from './MobileStatsSection';
import MobileProcessSection from './MobileProcessSection';
import MobilePortfolioShowcase from './MobilePortfolioShowcase';
import FAQSection from '@/app/components/home/FAQSection';
import HeroPortalLogo from '@/app/components/ui/HeroPortalLogo';
import GoogleGIcon from '@/app/components/public/GoogleGIcon';
import StarIcon from '@/app/components/public/StarIcon';
import { fetchPublicGoogleReviews, type GoogleReview } from '@/lib/api/googleReviewsClient';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useMobile } from './MobileAppShell';
import { SITE_CONFIG } from '@/app/config/site-config';
import { PUBLIC_MOBILE_HOME_GUARANTEES, type PublicPortfolioShowcaseStory } from '@/lib/publicHomeShowcase';
import { PUBLIC_MOBILE_FOOTER_LEGAL_LINKS } from '@/lib/constants';
import { useManagedImageSrc } from '@/lib/hooks/useManagedImageSrc';
import { hasSeenMobileIntro, markMobileIntroSeen, MOBILE_INTRO_COMPLETE_EVENT } from '@/lib/intro';
import type { PublicMobileServiceCardId } from '@/lib/constants/public-service-media';


// ═══════════════════════════════════════════════════════════════════════════
// SECTION DIVIDER — línia gradient subtil entre seccions
// ═══════════════════════════════════════════════════════════════════════════

function SectionDivider() {
  return (
    <div className="flex items-center justify-center gap-3 py-2 px-10">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
      <div className="w-1 h-1 rounded-full bg-amber-500/30" />
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GUARANTEE SECTION
// ═══════════════════════════════════════════════════════════════════════════

function GuaranteeSection() {
  const t = useTranslations('mobileHome.guarantees');
  const reduceMotion = useReducedMotion();

  const guarantees = PUBLIC_MOBILE_HOME_GUARANTEES;

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
        <div className="space-y-3">
          {guarantees.map((guarantee, i) => (
            <motion.div
              key={guarantee.titleKey}
              initial={reduceMotion ? false : { opacity: 0, x: -30, scale: 0.9 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={reduceMotion ? { duration: 0 } : { delay: i * 0.1, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              whileTap={{ scale: 0.98 }}
              className="relative group"
            >
              <div className="relative flex items-start gap-4 p-5 rounded-3xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.2)] overflow-hidden">
                {/* Tap glow */}
                <div className={`absolute inset-0 bg-gradient-to-r ${guarantee.gradient} opacity-0 group-active:opacity-10 transition-opacity`} />
                {/* Subtle top shine */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                <div className="relative flex-shrink-0">
                  <div className="text-3xl w-12 h-12 rounded-2xl bg-white/[0.06] flex items-center justify-center">
                    {guarantee.icon}
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-zinc-950 border border-white/20 flex items-center justify-center">
                    <span className="text-amber-400 text-[8px] font-black">{i + 1}</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-black text-base mb-1 leading-snug">
                    {t(guarantee.titleKey)}
                  </h3>
                  <p className="text-white/55 text-sm leading-relaxed">
                    {t(guarantee.descKey)}
                  </p>
                </div>

                {/* Checkmark icon */}
                <div className={`relative w-7 h-7 rounded-full bg-gradient-to-br ${guarantee.gradient} flex items-center justify-center shadow-lg flex-shrink-0 mt-0.5`}>
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
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
// TRUSTED BY / LOGOS SECTION
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// MOBILE REVIEWS SECTION
// ═══════════════════════════════════════════════════════════════════════════

function MobileReviewsSection() {
  const t = useTranslations('mobileHome.reviews');
  const { locale, haptic } = useMobile();
  const reduceMotion = useReducedMotion();
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [averageRating, setAverageRating] = useState(5);
  const [totalReviews, setTotalReviews] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);

  useEffect(() => {
    async function loadReviews() {
      try {
        const data = await fetchPublicGoogleReviews();
        const fiveStarReviews = (data.reviews || []).filter((r: GoogleReview) => r.rating === 5);
        setReviews(fiveStarReviews);
        setAverageRating(data.rating ?? 5);
        setTotalReviews(data.user_ratings_total ?? 0);
      } catch (error) {
        console.error('[MobileHome] Error carregant reviews:', error);
      }
    }
    loadReviews();
  }, []);

  // Auto-rotate — pausa si l'usuari ha fet swipe
  useEffect(() => {
    if (reviews.length <= 1 || userInteracted) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [reviews.length, userInteracted]);

  // Reprèn auto-rotate 8s després de l'última interacció
  useEffect(() => {
    if (!userInteracted) return;
    const timer = setTimeout(() => setUserInteracted(false), 12000);
    return () => clearTimeout(timer);
  }, [userInteracted, currentIndex]);

  const goTo = useCallback((newIndex: number) => {
    setDirection(newIndex > currentIndex ? 1 : -1);
    setCurrentIndex(newIndex);
    setUserInteracted(true);
    haptic('light');
  }, [currentIndex, haptic]);

  const handleDragEnd = useCallback((_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const swipe = info.offset.x;
    const velocity = info.velocity.x;
    if (swipe < -56 || velocity < -360) {
      // Swipe left → next
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
      setUserInteracted(true);
      haptic('light');
    } else if (swipe > 56 || velocity > 360) {
      // Swipe right → prev
      setDirection(-1);
      setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
      setUserInteracted(true);
      haptic('light');
    }
  }, [reviews.length, haptic]);

  if (reviews.length === 0) return null;

  const review = reviews[currentIndex];

  return (
    <section className="py-12 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.06),transparent_70%)]" />

      <div className="relative">
        {/* Header */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <span className="inline-block px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs font-bold tracking-wider uppercase mb-3">
            {t('sectionLabel')}
          </span>
          <h2 className="text-2xl font-black text-white mb-3">
            {t('sectionTitle')}
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="flex gap-0.5 text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon key={star} width={18} height={18} fill="currentColor" />
              ))}
            </div>
            <span className="text-white font-bold">{averageRating.toFixed(1)}</span>
            <span className="text-white/50 text-sm">· {totalReviews} {t('inGoogle')}</span>
          </div>
        </motion.div>

        {/* Review Card — swipeable */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              drag={reduceMotion ? false : 'x'}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={handleDragEnd}
              initial={reduceMotion ? false : { opacity: 0, x: direction * 52 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -direction * 52 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-sm border border-white/[0.10] rounded-3xl p-6 cursor-grab active:cursor-grabbing shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
              style={{ touchAction: 'pan-y' }}
            >
              {/* Quote */}
              <div className="absolute top-4 right-5 text-5xl text-amber-400/10 select-none font-serif leading-none">&ldquo;</div>
              {/* Top shine */}
              <div className="absolute inset-x-0 top-0 h-px rounded-t-3xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />

              {/* Author */}
              <div className="flex items-center gap-3 mb-4" style={{ fontFamily: 'Roboto, "Google Sans", system-ui, sans-serif' }}>
                {review.profile_photo_url ? (
                  <Image
                    src={review.profile_photo_url}
                    alt={review.author_name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-medium text-base">
                    {review.author_name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white text-sm truncate">{review.author_name}</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon key={star} width={12} height={12} fill="currentColor" />
                      ))}
                    </div>
                    <span className="text-xs text-white/50">{review.relative_time_description}</span>
                  </div>
                </div>
                <GoogleGIcon width={18} height={18} className="flex-shrink-0" />
              </div>

              {/* Review text */}
              <p className="text-white/85 text-sm leading-relaxed line-clamp-4 select-none" style={{ fontFamily: 'Roboto, "Google Sans", system-ui, sans-serif' }}>
                {review.text}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots + swipe hint */}
        {reviews.length > 1 && (
          <div className="flex justify-center items-center gap-1.5 mt-4">
            {reviews.slice(0, Math.min(reviews.length, 8)).map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={`h-[3px] rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-6 bg-amber-400'
                    : 'w-1.5 bg-white/20'
                }`}
                aria-label={`Review ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* CTAs */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center gap-3 mt-6"
        >
          <a
            href={SITE_CONFIG.reviews.googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-6 py-3 bg-white text-[#1a1a1a] font-bold text-sm rounded-full active:scale-[0.97] transition-transform shadow-lg shadow-white/10"
          >
            <GoogleGIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
            {t('leaveReview')}
          </a>
          <a
            href={`/${locale}/opiniones`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/[0.06] border border-white/10 rounded-full text-white/60 text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <span>{t('viewAll')}</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </motion.div>
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
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const managedMobileLogoSrc = useManagedImageSrc('layout.logo.admin', '/img/orbita-glyph.svg');

  const socialLinks = [
    SITE_CONFIG.social.instagram.enabled && SITE_CONFIG.social.instagram.url
      ? { name: 'Instagram', url: SITE_CONFIG.social.instagram.url, icon: 'instagram' }
      : null,
    SITE_CONFIG.social.tiktok.enabled && SITE_CONFIG.social.tiktok.url
      ? { name: 'TikTok', url: SITE_CONFIG.social.tiktok.url, icon: 'tiktok' }
      : null,
  ].filter(Boolean) as { name: string; url: string; icon: string }[];

  return (
    <footer className="relative py-10 px-6 pb-32 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-amber-500/8 rounded-full blur-[80px] pointer-events-none" />
      {/* Top divider */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500/30 shadow-[0_0_8px_rgba(251,191,36,0.3)]" />
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="relative text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
            <Image
              src={managedMobileLogoSrc}
              alt="Òrbita Events"
              width={36}
              height={36}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-lg font-black bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            Òrbita Events
          </span>
        </div>

        {/* Tagline */}
        <p className="text-white/40 text-sm mb-5">
          {t('tagline')}
        </p>

        {/* Location pill */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs mb-5">
          <span>📍</span>
          <span>{t('location')}</span>
        </div>

        {/* Social links */}
        <div className="flex justify-center gap-2.5 mb-6">
          {socialLinks.map((social) => (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.name}
              className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/50 active:scale-95 active:bg-white/10 transition-all"
            >
              {social.icon === 'instagram' ? (
                <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              ) : (
                <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              )}
            </a>
          ))}
        </div>

        {/* Legal */}
        <div className="flex justify-center gap-3 text-white/35 text-[11px] mb-4">
          {PUBLIC_MOBILE_FOOTER_LEGAL_LINKS.map((link, idx) => (
            <span key={link.href} className="flex items-center gap-3">
              <a href={`/${locale}${link.href}`} className="active:text-white/50 transition-colors">{t(link.tKey)}</a>
              {idx < PUBLIC_MOBILE_FOOTER_LEGAL_LINKS.length - 1 && (
                <span className="text-white/15">·</span>
              )}
            </span>
          ))}
        </div>

        {/* Copyright */}
        <p className="text-white/25 text-[10px] tracking-wider">
          © {currentYear} Òrbita Events. {t('copyright')}
        </p>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function MobileHomePage({
  portfolioStories = [],
  serviceCardImages,
}: {
  portfolioStories?: PublicPortfolioShowcaseStory[];
  serviceCardImages?: Record<PublicMobileServiceCardId, string>;
}) {
  const locale = useLocale();
  const [showIntro, setShowIntro] = useState(false);
  const [introFading, setIntroFading] = useState(false);

  useEffect(() => {
    if (!hasSeenMobileIntro(localStorage)) {
      setShowIntro(true);
    }
  }, []);

  useEffect(() => {
    const handler = () => setShowIntro(false);
    window.addEventListener(MOBILE_INTRO_COMPLETE_EVENT, handler);
    return () => window.removeEventListener(MOBILE_INTRO_COMPLETE_EVENT, handler);
  }, []);

  const handleIntroFinish = useCallback(() => {
    markMobileIntroSeen(localStorage, window);
    setIntroFading(true);
    // Brief black pause before content reveals
    setTimeout(() => {
      setShowIntro(false);
      setIntroFading(false);
      document.getElementById('mobile-intro-hide')?.remove();
    }, 300);
  }, []);

  return (
    <MobileErrorBoundary>
      {/* Amaga header/nav del layout durant la intro */}
      {showIntro && (
        <style>{`header, nav, .mobile-nav-bar { display: none !important; }`}</style>
      )}

      {/* Intro mágica - HeroPortalLogo - Optimitzada per mòbil */}
      {showIntro ? (
        <>
          <HeroPortalLogo
            onFinish={handleIntroFinish}
            totalMs={4000}
            fadeMs={2200}
            holdMs={1000}
            speedMultiplier={1.2}
            locale={locale}
          />
          {/* Black curtain during fade gap */}
          {introFading && (
            <div className="fixed inset-0 z-[9998] bg-black" />
          )}
        </>
      ) : (
      <MobileAppShell showSplash={false}>
        {/* 1. Hero — primera impressió, què som */}
        <MobileHeroUltimate />

        {/* 2. Serveis — què oferim (prioritat: el client vol saber QUÈ fem) */}
        <MobileServicesCards serviceCardImages={serviceCardImages} />

        <SectionDivider />

        {/* 3. Stats — per què confiar en nosaltres (reforç amb dades) */}
        <MobileStatsSection />

        <SectionDivider />

        {/* 4. Portfolio — prova visual: resultats reals */}
        <MobilePortfolioShowcase stories={portfolioStories} />

        <SectionDivider />

        {/* 5. Com funciona — simplifica el camí a contractar */}
        <MobileProcessSection />

        <SectionDivider />

        {/* 6. Reviews — veu dels clients satisfets */}
        <MobileReviewsSection />

        <SectionDivider />

        {/* 7. Garanties — elimina dubtes finals */}
        <GuaranteeSection />

        <SectionDivider />

        {/* 8. FAQ — respon les últimes preguntes */}
        <FAQSection />

        {/* 9. CTA final — tancament amb urgència */}
        <MobileCTAUrgency />

        {/* Footer */}
        <MobileFooter />

      </MobileAppShell>
      )}
    </MobileErrorBoundary>
  );
}

















