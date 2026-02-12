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
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useMobile } from './MobileAppShell';
import { SITE_CONFIG } from '@/app/config/site-config';

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

      <div className="relative grid grid-cols-2 gap-4">
        {features.map((feature, i) => (
          <motion.div
            key={feature.titleKey}
            initial={reduceMotion ? false : { opacity: 0, y: 30, scale: 0.8 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={reduceMotion ? { duration: 0 } : { delay: i * 0.1, type: 'spring', damping: 20 }}
            whileTap={{ scale: 0.95 }}
            className="relative group p-5 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 backdrop-blur-sm shadow-xl overflow-hidden"
          >
            {/* Hover glow effect */}
            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-active:opacity-20 transition-opacity`} />

            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={reduceMotion ? { x: 0, opacity: 0 } : { x: ['-100%', '200%'] }}
              transition={reduceMotion ? { duration: 0 } : { duration: 3, repeat: Infinity, ease: 'linear', delay: i * 0.5 }}
            />

            <div className="relative">
              <motion.span
                className="text-4xl block mb-3"
                animate={reduceMotion ? { rotate: 0 } : { rotate: [0, 5, -5, 0] }}
                transition={reduceMotion ? { duration: 0 } : { duration: 4, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
              >
                {feature.icon}
              </motion.span>
              <h3 className="text-white font-black text-base mb-1">{t(feature.titleKey)}</h3>
              <p className="text-white/60 text-xs leading-tight">{t(feature.descKey)}</p>
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
                <div className={`relative w-8 h-8 rounded-full bg-gradient-to-br ${guarantee.gradient} flex items-center justify-center shadow-lg`}>
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
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

const CLIENT_LOGOS = [
  '/img/logoz/cliente1.webp',
  '/img/logoz/cliente2.webp',
  '/img/logoz/cliente3.webp',
  '/img/logoz/cliente4.webp',
  '/img/logoz/cliente5.webp',
  '/img/logoz/cliente6.webp',
  '/img/logoz/cliente7.webp',
  '/img/logoz/cliente8.webp',
];

function TrustedBySection() {
  const t = useTranslations('mobileHome.trustedBy');
  const reduceMotion = useReducedMotion();

  return (
    <section className="py-10 overflow-hidden">
      <motion.p
        initial={reduceMotion ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center text-white/40 text-xs font-semibold tracking-widest uppercase mb-6 px-6"
      >
        {t('sectionTitle')}
      </motion.p>

      {/* Infinite scroll marquee */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0a0a0b] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0a0a0b] to-transparent z-10 pointer-events-none" />

        <motion.div
          className="flex gap-8 items-center"
          animate={reduceMotion ? {} : { x: ['0%', '-50%'] }}
          transition={reduceMotion ? { duration: 0 } : { x: { duration: 20, repeat: Infinity, ease: 'linear' } }}
        >
          {/* Double the logos for seamless loop */}
          {[...CLIENT_LOGOS, ...CLIENT_LOGOS].map((logo, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-20 h-12 relative grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            >
              <Image
                src={logo}
                alt={`Cliente ${(i % CLIENT_LOGOS.length) + 1}`}
                fill
                sizes="80px"
                className="object-contain"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MOBILE REVIEWS SECTION
// ═══════════════════════════════════════════════════════════════════════════

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
  profile_photo_url?: string;
}

function MobileReviewsSection() {
  const t = useTranslations('mobileHome.reviews');
  const { locale } = useMobile();
  const reduceMotion = useReducedMotion();
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [averageRating, setAverageRating] = useState(5);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    async function loadReviews() {
      try {
        const response = await fetch('/data/google-reviews.json');
        const data = await response.json();
        const fiveStarReviews = data.reviews.filter((r: GoogleReview) => r.rating === 5);
        setReviews(fiveStarReviews);
        setAverageRating(data.rating);
        setTotalReviews(data.total);
      } catch {
        // silently fail
      }
    }
    loadReviews();
  }, []);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (reviews.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [reviews.length]);

  if (reviews.length === 0) return null;

  const review = reviews[currentIndex];

  return (
    <section className="py-12 px-6 relative overflow-hidden">
      {/* Background */}
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
                <svg key={star} width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
            <span className="text-white font-bold">{averageRating.toFixed(1)}</span>
            <span className="text-white/50 text-sm">· {totalReviews} {t('inGoogle')}</span>
          </div>
        </motion.div>

        {/* Review Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={reduceMotion ? false : { opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="relative bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-2xl p-5"
          >
            {/* Quote */}
            <div className="absolute top-4 right-4 text-3xl text-amber-500/15">&ldquo;</div>

            {/* Author */}
            <div className="flex items-center gap-3 mb-4">
              {review.profile_photo_url ? (
                <Image
                  src={review.profile_photo_url}
                  alt={review.author_name}
                  width={44}
                  height={44}
                  className="w-11 h-11 rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                  {review.author_name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white text-sm truncate">{review.author_name}</h4>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs text-white/40">{review.relative_time_description}</span>
                </div>
              </div>
              {/* Google badge */}
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>

            {/* Review text */}
            <p className="text-white/80 text-sm leading-relaxed line-clamp-4">
              &ldquo;{review.text}&rdquo;
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Dots navigation */}
        {reviews.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-4">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-6 bg-amber-400'
                    : 'w-1.5 bg-white/20'
                }`}
                aria-label={`Review ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* CTA to all reviews */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-6"
        >
          <a
            href={`/${locale}/opiniones`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/[0.06] border border-white/10 rounded-full text-white/70 text-sm font-medium hover:bg-white/10 transition-colors"
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
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    SITE_CONFIG.social.instagram.enabled && SITE_CONFIG.social.instagram.url
      ? { name: 'Instagram', url: SITE_CONFIG.social.instagram.url, icon: 'instagram' }
      : null,
    SITE_CONFIG.social.tiktok.enabled && SITE_CONFIG.social.tiktok.url
      ? { name: 'TikTok', url: SITE_CONFIG.social.tiktok.url, icon: 'tiktok' }
      : null,
  ].filter(Boolean) as { name: string; url: string; icon: string }[];

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
        <div className="flex justify-center gap-3 mb-6">
          {socialLinks.map((social) => (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.name}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
            >
              {social.icon === 'instagram' ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              )}
            </a>
          ))}
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

          {/* Trusted By */}
          <TrustedBySection />

          {/* Services */}
          <MobileServicesCards />

          {/* Guarantees */}
          <GuaranteeSection />

          {/* Reviews */}
          <MobileReviewsSection />

          {/* Final CTA */}
          <MobileCTAUrgency />

          {/* Footer */}
          <MobileFooter />

        </MobileAppShell>
      )}
    </MobileErrorBoundary>
  );
}
