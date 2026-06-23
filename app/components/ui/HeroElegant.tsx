'use client';

import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import { trackCTAClick } from '@/app/lib/analytics';
import { PUBLIC_HERO_KEN_BURNS_PRESETS, PUBLIC_HERO_MEDIA_FALLBACK } from '@/lib/constants';
import { fetchHeroMedia, type HeroMediaItem } from '@/lib/api/heroMediaClient';
import ArrowRightIcon from '@/app/components/public/ArrowRightIcon';
import { shuffle } from '@/lib/utils/shuffle';


const IMAGE_DURATION = 9000;
const VIDEO_MIN_DURATION = 12000;

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
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[9]" aria-hidden="true">
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
            boxShadow: `0 0 ${p.w * 4}px ${p.color}`,
          }}
          animate={{ y: [0, -p.dy], x: [0, p.dx], opacity: [0.15, 0.85, 0.15] }}
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
  const rotatingTextsRaw = t.raw('rotatingTexts') as string[] | undefined;
  const rotatingTexts = Array.isArray(rotatingTextsRaw)
    ? rotatingTextsRaw.filter((text) => typeof text === 'string' && text.trim().length > 0)
    : [];
  const hasRotatingLine = rotatingTexts.length > 0;
  const hookLine1 = t('hook.line1');
  const hookLine2 = t('hook.line2');
  const [textIndex, setTextIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [mediaItems, setMediaItems] = useState<HeroMediaItem[]>([...PUBLIC_HERO_MEDIA_FALLBACK]);
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
  // Seeded pseudo-random per posicions naturals però deterministes
  const particles = useMemo<ParticleData[]>(() => {
    const seed = (n: number) => ((n * 9301 + 49297) % 233280) / 233280;
    return Array.from({ length: 16 }, (_, i) => {
      const r = seed(i);
      const size = 3 + r * 8;
      return {
        w: size, h: size,
        left: `${seed(i * 7 + 1) * 100}%`,
        top: `${seed(i * 13 + 3) * 100}%`,
        color: i % 4 === 0
          ? 'rgba(251, 191, 36, 0.7)'
          : i % 4 === 1
            ? 'rgba(251, 191, 36, 0.5)'
            : i % 4 === 2
              ? 'rgba(255, 255, 255, 0.4)'
              : 'rgba(251, 146, 60, 0.55)',
        dy: 40 + seed(i * 3) * 80,
        dx: (seed(i * 5) - 0.5) * 40,
        dur: 3 + seed(i * 11) * 4,
        del: seed(i * 17) * 6,
      };
    });
  }, []);

  // Fetch media from API + shuffle
  useEffect(() => {
    fetchHeroMedia()
      .then((data) => {
        if (data.length > 0) setMediaItems(shuffle(data));
      })
      .catch(() => {});
  }, []);

  const currentItem = mediaItems[slideIndex % mediaItems.length];
  const kbDir = PUBLIC_HERO_KEN_BURNS_PRESETS[slideIndex % PUBLIC_HERO_KEN_BURNS_PRESETS.length];

  // Rotate text
  useEffect(() => {
    if (!hasRotatingLine) return;
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % rotatingTexts.length);
    }, 4400);
    return () => clearInterval(interval);
  }, [hasRotatingLine, rotatingTexts.length]);

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
      className="relative min-h-[100svh] flex items-center overflow-hidden bg-black"
    >
      {/* ── Background media — amb parallax ── */}
      <motion.div className="absolute inset-0" style={{ y: reduceMotion ? 0 : bgY }} aria-hidden="true">
        {/* Poster — primer frame mentre carrega */}
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <Image
            src="/img/orbitalockupwhite.svg"
            alt="Òrbita Events"
            width={256}
            height={256}
            className="w-48 h-48 md:w-64 md:h-64 opacity-30"
            priority
          />
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
                  filter: 'brightness(0.72) saturate(1.1)',
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
                    : { x: [...kbDir.x], y: [...kbDir.y], scale: [...kbDir.scale] }
                }
                transition={{ duration: IMAGE_DURATION / 1000, ease: 'linear' }}
              >
                <Image
                  src={currentItem.url}
                  alt={currentItem.label}
                  fill
                  className="object-cover"
                  style={{ filter: 'brightness(0.72) saturate(1.1)' }}
                  sizes="100vw"
                  priority={slideIndex === 0}
                  quality={75}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Cinematic grade ── */}
        <div className="absolute inset-0 bg-black/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-amber-950/15 to-transparent" />
        {/* Vignette + Film grain — via classes CSS globals */}
        <div className="absolute inset-0 oe-vignette" />
        <div className="absolute inset-0 oe-film-grain" />
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
        className="relative z-10 w-full pb-10 md:pb-14 lg:pb-16 pt-24 md:pt-28"
        style={reduceMotion ? {} : { opacity: contentOpacity, y: contentY }}
      >
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <div className="max-w-3xl">

            {/* Badge */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mb-4 md:mb-5"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] text-white/70 text-xs md:text-sm font-medium tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {t('badge')}
              </span>
            </motion.div>

            {/* Hook — emotional opener with left accent bar */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mb-5 md:mb-6"
            >
              <div className="relative pl-5 border-l-[2px] border-amber-400/70">
                <span
                  aria-hidden
                  className="absolute -left-[2px] top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-amber-400 to-transparent animate-[gradient-shift_3s_ease_infinite] bg-[length:100%_200%]"
                />
                <p className="text-[0.72rem] md:text-[0.8rem] uppercase tracking-[0.32em] text-white/80 font-semibold leading-relaxed">
                  {hookLine1}
                </p>
                <p className="text-[0.72rem] md:text-[0.8rem] uppercase tracking-[0.32em] text-amber-300 font-semibold leading-relaxed">
                  {hookLine2}
                </p>
              </div>
            </motion.div>

            {/* Title - staggered word reveal */}
            <h1
              className="text-[2.5rem] leading-[0.95] md:text-6xl lg:text-7xl xl:text-[5.2rem] font-black text-white tracking-[-0.03em]"
              style={{ textShadow: '0 4px 60px rgba(0,0,0,0.6)' }}
            >
              {reduceMotion ? (
                <>
                  {t('title1')}
                  {hasRotatingLine ? (
                    <>
                      <br />
                      <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                        {rotatingTexts[textIndex]}
                      </span>
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  <StaggeredWords text={t('title1')} delay={0.4} />
                  {hasRotatingLine ? (
                    <>
                      <br />
                      <span className="relative block mt-2 md:mt-4 h-[1.15em]">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={textIndex}
                            initial={{ opacity: 0, y: 28, filter: 'blur(14px)', scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
                            exit={{ opacity: 0, y: -18, filter: 'blur(10px)', scale: 0.98 }}
                            transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
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
                  ) : null}
                </>
              )}
            </h1>

            {/* Subtitle */}
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="text-base md:text-lg lg:text-xl text-white/65 mt-4 md:mt-5 max-w-lg leading-relaxed font-light"
              style={{ textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}
            >
              {t('subtitle')}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap items-center gap-4 mt-6 md:mt-7"
            >
              {/* Primary CTA — Preus */}
              <Link
                href="/packs"
                onClick={() => trackCTAClick('hero_packs_primary', 'hero_elegant')}
                className="group relative inline-flex items-center justify-center gap-3 overflow-hidden px-8 py-4 md:px-10 md:py-5 rounded-2xl transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]"
              >
                <div className="absolute -inset-3 bg-amber-500/20 rounded-3xl blur-2xl group-hover:bg-amber-500/35 transition-colors duration-700" />
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 bg-[length:200%_100%] rounded-2xl animate-[shimmer_3s_ease-in-out_infinite]" />
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/25 to-transparent bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
                <span className="relative z-10 text-zinc-900 font-black text-base md:text-lg">
                  {t('ctaPacks')}
                </span>
                <ArrowRightIcon className="relative z-10 w-5 h-5 text-zinc-900 group-hover:translate-x-1.5 transition-transform duration-300" strokeWidth={3} />
              </Link>

              {/* Secondary CTA — Configurador */}
              <Link
                href="/configurador"
                onClick={() => trackCTAClick('hero_configurator_secondary', 'hero_elegant')}
                className="group inline-flex items-center gap-2 px-6 py-4 md:px-8 md:py-5 rounded-2xl border border-white/10 hover:border-white/25 bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-sm transition-all duration-300"
              >
                <span className="text-white font-semibold text-base md:text-lg">
                  {t('ctaConfigurator')}
                </span>
                <ArrowRightIcon className="w-4 h-4 text-white/60 group-hover:text-amber-400 group-hover:translate-x-1 transition-all duration-300" />
              </Link>

              {/* Tertiary CTA — Contact (text link with amber accent) */}
              <Link
                href="/contacto"
                onClick={() => trackCTAClick('hero_contact_tertiary', 'hero_elegant')}
                className="group inline-flex items-center gap-1.5 text-sm md:text-base font-medium text-white/60 hover:text-amber-300 transition-colors duration-300 ml-0 sm:ml-2"
              >
                <span className="hidden sm:inline text-white/35">·</span>
                <span className="underline underline-offset-[6px] decoration-white/20 decoration-[1.5px] group-hover:decoration-amber-400/70 transition-colors">
                  {t('ctaContact')}
                </span>
                <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-300" strokeWidth={2.5} />
              </Link>
            </motion.div>

            {/* Social proof — premium glass capsule */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.8, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 md:mt-8"
            >
              <div className="inline-flex flex-wrap items-center gap-4 md:gap-5 px-5 md:px-6 py-3 md:py-3.5 rounded-full border border-white/[0.08] bg-white/[0.04] backdrop-blur-md shadow-[0_8px_32px_-12px_rgba(0,0,0,0.5)]">
                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <motion.svg
                        key={i}
                        initial={reduceMotion ? false : { opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 1.9 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                        className="w-4 h-4 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </motion.svg>
                    ))}
                  </div>
                  <span className="text-white font-bold text-sm tracking-tight">{t('rating')}</span>
                </div>

                <span className="w-px h-4 bg-white/15" />

                {/* Counter */}
                <span className="text-white/85 font-medium text-sm">
                  <strong className="text-white font-bold"><AnimatedCounter value={50} suffix="+" /></strong>{' '}
                  {t('socialProof').replace(/\d+\+?\s*/, '')}
                </span>

                <span className="w-px h-4 bg-white/15 hidden sm:block" />

                {/* Response time */}
                <span className="text-white/85 font-medium text-sm hidden sm:inline-flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-white/55"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  {'<2h '}{t('responseLabel')}
                </span>

                <span className="w-px h-4 bg-white/15 hidden md:block" />

                {/* Exclusivity — amber emphasis */}
                <span className="text-amber-300 font-semibold text-sm hidden md:inline-flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
                  </span>
                  {t('exclusivity')}
                </span>
              </div>
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



