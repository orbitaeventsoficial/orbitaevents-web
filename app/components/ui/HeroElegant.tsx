'use client';

import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import { trackCTAClick } from '@/app/lib/analytics';

interface HeroMediaItem {
  id: string;
  url: string;
  type: 'video' | 'image';
  label: string;
}

const FALLBACK: HeroMediaItem[] = [
  { id: 'video-original', url: '/videos/hero-orbita-mobile.mp4', type: 'video', label: 'Vídeo' },
  { id: 'img-disco-01', url: '/img/portfolio/discomovil/discomovil-01.avif', type: 'image', label: 'Discomòbil' },
  { id: 'img-bodas-04', url: '/img/portfolio/bodas/bodas-04.avif', type: 'image', label: 'Bodes' },
  { id: 'img-halloween-01', url: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.avif', type: 'image', label: 'Halloween' },
  { id: 'img-magic-05', url: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-05.avif', type: 'image', label: 'Món Màgic' },
  { id: 'img-empresa-01', url: '/img/portfolio/eventos-empresa/eventos-empresa-01.avif', type: 'image', label: 'Empreses' },
];

const IMAGE_DURATION = 7000;
const VIDEO_MIN_DURATION = 10000;

// Ken Burns — zoom in suau, cada direcció diferent
const KB = [
  { x: [0, -1],   y: [0, -0.5], scale: [0.93, 1.02] },
  { x: [0, 1],    y: [0, -0.5], scale: [0.94, 1.02] },
  { x: [0, -0.5], y: [0, 0.5],  scale: [0.92, 1.01] },
  { x: [0, 0.5],  y: [0, -1],   scale: [0.93, 1.02] },
  { x: [0, -0.5], y: [0, 0.5],  scale: [0.94, 1.02] },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Staggered word reveal ───────────────────────────────────────────────────
function StaggeredWords({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(' ');
  return (
    <>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 28, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{
            duration: 0.7,
            delay: delay + i * 0.1,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </>
  );
}

// ─── Ambient particles — memoitzades per evitar re-render ────────────────────
interface ParticleData {
  w: number; h: number; left: string; top: string;
  color: string; dy: number; dx: number; dur: number; del: number;
}

function AmbientParticles({ particles }: { particles: ParticleData[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[8]" aria-hidden="true">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.w,
            height: p.h,
            left: p.left,
            top: p.top,
            background: p.color,
            boxShadow: `0 0 ${p.w * 3}px ${p.color}`,
          }}
          animate={{ y: [0, -p.dy], x: [0, p.dx], opacity: [0.15, 0.9, 0.15] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.del, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ─── Counter animat ──────────────────────────────────────────────────────────
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const dur = 1200;
        const start = performance.now();
        const step = (now: number) => {
          const t = Math.min((now - start) / dur, 1);
          const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
          setCount(Math.round(ease * value));
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ─── Cursor glow (desktop only) ──────────────────────────────────────────────
function CursorGlow({ containerRef }: { containerRef: React.RefObject<HTMLElement | null> }) {
  const [pos, setPos] = useState({ x: -200, y: -200 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    const onLeave = () => setPos({ x: -200, y: -200 });
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, [containerRef]);

  return (
    <div
      className="absolute pointer-events-none z-[5] hidden md:block"
      style={{
        left: pos.x - 200,
        top: pos.y - 200,
        width: 400,
        height: 400,
        background: 'radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 70%)',
        transition: 'left 0.15s ease-out, top 0.15s ease-out',
      }}
    />
  );
}

export default function HeroElegant() {
  const t = useTranslations('hero.elegant');
  const rotatingTexts = t.raw('rotatingTexts') as string[];
  const [textIndex, setTextIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [mediaItems, setMediaItems] = useState<HeroMediaItem[]>(FALLBACK);
  const [videoReady, setVideoReady] = useState(false);
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  // Scroll parallax
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.5], ['0px', '60px']);

  // Partícules memoitzades — es generen un sol cop
  const particles = useMemo<ParticleData[]>(() =>
    Array.from({ length: 16 }, (_, i) => {
      const size = 3 + (i % 5) * 1.5;
      return {
        w: size, h: size,
        left: `${(i * 6.25) % 100}%`,
        top: `${(i * 6.1 + 5) % 100}%`,
        color: i % 3 === 0
          ? 'rgba(251, 191, 36, 0.8)'
          : i % 3 === 1
            ? 'rgba(251, 191, 36, 0.5)'
            : 'rgba(255, 255, 255, 0.4)',
        dy: 50 + (i % 5) * 18,
        dx: ((i % 3) - 1) * 15,
        dur: 5 + (i % 4) * 2,
        del: (i % 8) * 0.8,
      };
    }),
  []);

  // Fetch media from API + shuffle
  useEffect(() => {
    fetch('/api/hero-media')
      .then((r) => r.json())
      .then((data: HeroMediaItem[]) => {
        if (data.length > 0) setMediaItems(shuffle(data));
      })
      .catch(() => {});
  }, []);

  const currentItem = mediaItems[slideIndex % mediaItems.length];
  const kbDir = KB[slideIndex % KB.length];

  // Rotate text
  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % rotatingTexts.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [rotatingTexts.length]);

  // Rotate slides
  useEffect(() => {
    if (mediaItems.length <= 1) return;
    const duration = currentItem?.type === 'video' ? VIDEO_MIN_DURATION : IMAGE_DURATION;
    const timer = setTimeout(() => {
      setSlideIndex((prev) => (prev + 1) % mediaItems.length);
      setVideoReady(false);
    }, duration);
    return () => clearTimeout(timer);
  }, [slideIndex, mediaItems, currentItem?.type]);

  const handleVideoReady = useCallback(() => {
    setTimeout(() => setVideoReady(true), 200);
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Hero"
      className="relative min-h-[100svh] flex items-end overflow-hidden bg-black"
    >
      {/* ── Background media — amb parallax ── */}
      <motion.div className="absolute inset-0" style={{ y: reduceMotion ? 0 : bgY }} aria-hidden="true">
        {/* Poster — primer frame mentre carrega */}
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/orbitalockupwhite.svg" alt="Òrbita Events" className="w-48 h-48 md:w-64 md:h-64 opacity-30" />
        </div>

        {/* Slides — crossfade simultani */}
        <AnimatePresence>
          {currentItem.type === 'video' ? (
            <motion.div
              key={`${currentItem.id}-${slideIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0"
            >
              <video
                key={currentItem.url}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                disableRemotePlayback
                disablePictureInPicture
                className="w-full h-full object-cover"
                style={{
                  opacity: videoReady ? 1 : 0,
                  transition: 'opacity 1s ease',
                  filter: 'brightness(0.6) saturate(1.1)',
                }}
                onCanPlay={handleVideoReady}
              >
                <source src={currentItem.url} type="video/mp4" />
              </video>
            </motion.div>
          ) : (
            <motion.div
              key={`${currentItem.id}-${slideIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0"
            >
              <motion.div
                className="absolute inset-0"
                animate={
                  reduceMotion
                    ? {}
                    : { x: kbDir.x, y: kbDir.y, scale: kbDir.scale }
                }
                transition={{ duration: IMAGE_DURATION / 1000, ease: 'linear' }}
              >
                <Image
                  src={currentItem.url}
                  alt={currentItem.label}
                  fill
                  className="object-cover"
                  style={{ filter: 'brightness(0.6) saturate(1.1)' }}
                  sizes="100vw"
                  priority={slideIndex === 0}
                  quality={85}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Cinematic grade ── */}
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-amber-950/15 to-transparent" />
        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)' }}
        />
        {/* Film grain */}
        <div
          className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      </motion.div>

      {/* ── Cursor glow ── */}
      {!reduceMotion && <CursorGlow containerRef={sectionRef} />}

      {/* ── Ambient particles — sempre visibles ── */}
      <AmbientParticles particles={particles} />

      {/* ── Slide indicators ── */}
      {mediaItems.length > 1 && (
        <div className="absolute top-6 right-6 md:top-10 md:right-10 z-20 flex items-center gap-2">
          {mediaItems.map((_, i) => (
            <button
              key={i}
              onClick={() => { setSlideIndex(i); setVideoReady(false); }}
              aria-label={`Slide ${i + 1}`}
              className="group relative h-8 flex items-center cursor-pointer"
            >
              <div
                className="h-[2px] rounded-full transition-all duration-500"
                style={{
                  width: i === slideIndex % mediaItems.length ? 32 : 8,
                  backgroundColor: i === slideIndex % mediaItems.length
                    ? 'rgba(255,255,255,0.3)'
                    : 'rgba(255,255,255,0.15)',
                }}
              />
              {i === slideIndex % mediaItems.length && (
                <motion.div
                  className="absolute left-0 h-[2px] rounded-full bg-amber-400"
                  initial={{ width: 0 }}
                  animate={{ width: 32 }}
                  transition={{
                    duration: (currentItem?.type === 'video' ? VIDEO_MIN_DURATION : IMAGE_DURATION) / 1000,
                    ease: 'linear',
                  }}
                  key={slideIndex}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Content — amb parallax fade-out ── */}
      <motion.div
        className="relative z-10 w-full pb-20 md:pb-28 lg:pb-32 pt-40"
        style={reduceMotion ? {} : { opacity: contentOpacity, y: contentY }}
      >
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <div className="max-w-3xl">

            {/* Badge */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6 md:mb-8"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] text-white/70 text-xs md:text-sm font-medium tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {t('badge')}
              </span>
            </motion.div>

            {/* Title — staggered word reveal */}
            <h1
              className="text-[2.5rem] leading-[0.95] md:text-6xl lg:text-7xl xl:text-[5.2rem] font-black text-white tracking-[-0.03em]"
              style={{ textShadow: '0 4px 60px rgba(0,0,0,0.6)' }}
            >
              {reduceMotion ? (
                <>
                  {t('title1')}
                  <br />
                  <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                    {rotatingTexts[textIndex]}
                  </span>
                </>
              ) : (
                <>
                  <StaggeredWords text={t('title1')} delay={0.4} />
                  <br />
                  <span className="relative block mt-2 md:mt-4 h-[1.15em]">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={textIndex}
                        initial={{ opacity: 0, y: 28, filter: 'blur(14px)', scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
                        exit={{ opacity: 0, y: -18, filter: 'blur(10px)', scale: 0.98 }}
                        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute left-0 top-0 whitespace-nowrap bg-[length:200%_auto] bg-clip-text text-transparent animate-[gradient-shift_4s_ease_infinite]"
                        style={{
                          backgroundImage: 'linear-gradient(90deg, #fcd34d, #f59e0b, #fb923c, #f59e0b, #fcd34d)',
                          textShadow: 'none',
                        }}
                      >
                        {rotatingTexts[textIndex]}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </>
              )}
            </h1>

            {/* Subtitle */}
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="text-base md:text-lg lg:text-xl text-white/65 mt-5 md:mt-7 max-w-lg leading-relaxed font-light"
              style={{ textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}
            >
              {t('subtitle')}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap items-center gap-4 mt-8 md:mt-10"
            >
              {/* Primary CTA */}
              <Link
                href="/configurador"
                onClick={() => trackCTAClick('hero_configurator_primary', 'hero_elegant')}
                className="group relative inline-flex items-center justify-center gap-3 overflow-hidden px-8 py-4 md:px-10 md:py-5 rounded-2xl transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]"
              >
                <div className="absolute -inset-3 bg-amber-500/20 rounded-3xl blur-2xl group-hover:bg-amber-500/35 transition-colors duration-700" />
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 bg-[length:200%_100%] rounded-2xl animate-[shimmer_3s_ease-in-out_infinite]" />
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/25 to-transparent bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
                <span className="relative z-10 text-zinc-900 font-black text-base md:text-lg">
                  {t('ctaConfigurator')}
                </span>
                <svg className="relative z-10 w-5 h-5 text-zinc-900 group-hover:translate-x-1.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>

              {/* Secondary CTA */}
              <Link
                href="/portfolio"
                onClick={() => trackCTAClick('hero_portfolio_secondary', 'hero_elegant')}
                className="group inline-flex items-center gap-2 px-6 py-4 md:px-8 md:py-5 rounded-2xl border border-white/10 hover:border-white/25 bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-sm transition-all duration-300"
              >
                <span className="text-white font-semibold text-base md:text-lg">
                  {t('ctaPrices')}
                </span>
                <svg className="w-4 h-4 text-white/60 group-hover:text-amber-400 group-hover:translate-x-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </motion.div>

            {/* Social proof — amb counter animat */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.8 }}
              className="flex flex-wrap items-center gap-4 md:gap-5 mt-8 md:mt-10"
            >
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <motion.svg
                      key={i}
                      initial={reduceMotion ? false : { opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 1.9 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                      className="w-4 h-4 text-amber-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </motion.svg>
                  ))}
                </div>
                <span className="text-white font-bold text-sm">{t('rating')}</span>
              </div>
              <span className="w-px h-4 bg-white/20" />
              <span className="text-white/80 font-medium text-sm">
                <strong className="text-white"><AnimatedCounter value={50} suffix="+" /></strong>{' '}
                {t('socialProof').replace(/\d+\+?\s*/, '')}
              </span>
              <span className="w-px h-4 bg-white/20 hidden sm:block" />
              <span className="text-white/80 font-medium text-sm hidden sm:block">{'<2h '}{t('responseLabel')}</span>
              <span className="w-px h-4 bg-white/20 hidden md:block" />
              <span className="text-amber-400/90 font-semibold text-sm hidden md:inline-flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                {t('exclusivity')}
              </span>
            </motion.div>

          </div>
        </div>
      </motion.div>

      {/* ── Scroll indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={reduceMotion ? { duration: 0 } : { delay: 3, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 z-10"
      >
        <motion.div
          animate={reduceMotion ? {} : { y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-5 h-9 border border-white/20 rounded-full flex justify-center pt-2"
        >
          <motion.div
            animate={reduceMotion ? {} : { opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1 h-2 bg-amber-400/80 rounded-full"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
