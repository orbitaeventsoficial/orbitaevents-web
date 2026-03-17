'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import { useState, useEffect, useCallback } from 'react';
import { WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';
import { trackCTAClick, trackWhatsAppClick } from '@/app/lib/analytics';

// ─── Typewriter animation ──────────────────────────────────────────────────

function TypewriterText({ text, className }: { text: string; className?: string }) {
  const reduceMotion = useReducedMotion();
  const [displayedCount, setDisplayedCount] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    setDisplayedCount(0);
    setShowCursor(true);
  }, [text]);

  useEffect(() => {
    if (reduceMotion) {
      setDisplayedCount(text.length);
      return;
    }
    if (displayedCount < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedCount((c) => c + 1);
      }, 45);
      return () => clearTimeout(timeout);
    } else {
      // Cursor blink then hide
      const timeout = setTimeout(() => setShowCursor(false), 1500);
      return () => clearTimeout(timeout);
    }
  }, [displayedCount, text, reduceMotion]);

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden="true">
        {text.slice(0, displayedCount)}
        {showCursor && (
          <span className="inline-block w-[3px] h-[0.85em] bg-amber-400 ml-0.5 align-middle animate-pulse" />
        )}
      </span>
    </span>
  );
}

// ─── Stagger wrapper ────────────────────────────────────────────────────────

function StaggerItem({
  children,
  delay,
  reduceMotion,
}: {
  children: React.ReactNode;
  delay: number;
  reduceMotion: boolean | null;
}) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }
      }
    >
      {children}
    </motion.div>
  );
}

// ─── Hero ───────────────────────────────────────────────────────────────────

export default function HeroElegant() {
  const t = useTranslations('hero.elegant');
  const tCommon = useTranslations('common');
  const rotatingTexts = t.raw('rotatingTexts') as string[];
  const [currentIndex, setCurrentIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  // Rotate every 4.5s (longer to let typewriter finish)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % rotatingTexts.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [rotatingTexts.length]);

  return (
    <section
      aria-label="Hero"
      className="relative min-h-[100svh] flex items-center justify-center overflow-x-hidden pointer-events-none"
    >
      {/* Background Video */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          disablePictureInPicture
          poster="/img/hero-poster.webp"
          className="w-full h-full object-cover scale-105 pointer-events-none"
          style={{ filter: 'brightness(0.7) saturate(1.1)' }}
        >
          <source src="/video/Herovideo.mp4" type="video/mp4" />
        </video>
        {/* Gradient overlay — stronger for text readability */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/70 via-black/50 to-[#0A0A0A]" />
        {/* Subtle noise texture */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]" />
      </div>

      {/* Content — staggered entrance */}
      <div className="relative z-10 container mx-auto px-5 py-24 md:py-32 pointer-events-none">
        <div className="max-w-3xl mx-auto text-center">

          {/* 1. Badge — enters first */}
          <StaggerItem delay={0.2} reduceMotion={reduceMotion}>
            <div className="inline-flex items-center gap-2 mb-5 md:mb-6 px-5 py-2.5 rounded-full bg-white/[0.06] border border-white/[0.12] backdrop-blur-sm">
              <span className="text-amber-400 text-lg">{t('badgeEmoji')}</span>
              <span className="text-white/80 text-sm font-medium tracking-wider uppercase">
                {t('badge')}
              </span>
            </div>
          </StaggerItem>

          {/* 2. Title — static line + typewriter rotating */}
          <StaggerItem delay={0.5} reduceMotion={reduceMotion}>
            <h1 className="text-[2.5rem] leading-[1.05] md:text-6xl lg:text-[5rem] font-black text-white mb-4 md:mb-5 tracking-tight">
              {t('title1')}
              <br />
              <span className="relative block w-full min-h-[1.2em] mt-1">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentIndex}
                    initial={reduceMotion ? false : { opacity: 0, y: 20, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -20, filter: 'blur(4px)' }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="relative block w-full text-center"
                  >
                    <TypewriterText
                      text={rotatingTexts[currentIndex]}
                      className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent"
                    />
                  </motion.span>
                </AnimatePresence>
              </span>
            </h1>
          </StaggerItem>

          {/* 3. Subtitle */}
          <StaggerItem delay={0.9} reduceMotion={reduceMotion}>
            <p className="text-lg md:text-xl text-white/60 mb-8 md:mb-10 max-w-xl mx-auto leading-relaxed">
              {t('subtitle')}
            </p>
          </StaggerItem>

          {/* 4. Single CTA — one clear action */}
          <StaggerItem delay={1.2} reduceMotion={reduceMotion}>
            <Link
              href="/configurador"
              onClick={() => trackCTAClick('hero_configurator_primary', 'hero_elegant')}
              className="group relative inline-flex items-center justify-center gap-3 overflow-hidden px-10 py-5 rounded-2xl transition-transform hover:scale-[1.03] active:scale-[0.98] pointer-events-auto"
            >
              {/* Animated gradient bg */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 bg-[length:200%_100%] rounded-2xl animate-[shimmer_3s_ease-in-out_infinite]" />
              {/* Glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: '0 0 40px rgba(251, 191, 36, 0.4), 0 0 80px rgba(251, 191, 36, 0.15)' }} />
              <span className="relative z-10 text-zinc-900 font-black text-lg">
                {t('ctaConfigurator')}
              </span>
              <svg className="relative z-10 w-5 h-5 text-zinc-900 group-hover:translate-x-1.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </StaggerItem>

          {/* 5. Social proof — enters last */}
          <StaggerItem delay={1.6} reduceMotion={reduceMotion}>
            <div className="mt-8 md:mt-10 flex flex-col items-center gap-4">
              {/* Rating pill */}
              <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-white font-semibold text-sm">{t('rating')}</span>
                <span className="text-white/20">·</span>
                <span className="text-white/50 text-sm">{t('socialProof')}</span>
              </div>

              {/* WhatsApp — subtle auxiliary */}
              <a
                href={WHATSAPP_URL_WITH_MESSAGE(t('whatsappMessage'))}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWhatsAppClick('hero_elegant')}
                className="inline-flex items-center gap-1.5 text-sm text-white/30 hover:text-[#25D366] transition-colors duration-300 pointer-events-auto"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.613.613l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.352 0-4.556-.725-6.379-1.963l-.447-.305-2.948.988.988-2.948-.305-.447A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                <span>{tCommon('buttons.whatsapp')}</span>
              </a>
            </div>
          </StaggerItem>
        </div>
      </div>

      {/* Scroll indicator — cinematic mouse */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={reduceMotion ? { duration: 0 } : { delay: 1.9, duration: 0.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2"
      >
        <motion.div
          animate={reduceMotion ? {} : { y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-5 h-8 border border-white/20 rounded-full flex justify-center pt-1.5"
        >
          <div className="w-1 h-1.5 bg-amber-400 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}



