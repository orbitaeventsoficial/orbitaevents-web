// app/components/landing/ExperienciaMobil.tsx
// ═══════════════════════════════════════════════════════════════════════════════════
// 
//   ██████╗ ██████╗ ██████╗ ██╗████████╗ █████╗     ███████╗██╗   ██╗███████╗███╗   ██╗████████╗███████╗
//  ██╔═══██╗██╔══██╗██╔══██╗██║╚══██╔══╝██╔══██╗    ██╔════╝██║   ██║██╔════╝████╗  ██║╚══██╔══╝██╔════╝
//  ██║   ██║██████╔╝██████╔╝██║   ██║   ███████║    █████╗  ██║   ██║█████╗  ██╔██╗ ██║   ██║   ███████╗
//  ██║   ██║██╔══██╗██╔══██╗██║   ██║   ██╔══██║    ██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║╚██╗██║   ██║   ╚════██║
//  ╚██████╔╝██║  ██║██████╔╝██║   ██║   ██║  ██║    ███████╗ ╚████╔╝ ███████╗██║ ╚████║   ██║   ███████║
//   ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚═╝   ╚═╝   ╚═╝  ╚═╝    ╚══════╝  ╚═══╝  ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝
//
// ═══════════════════════════════════════════════════════════════════════════════════
// 
// LA FILOSOFIA:
// 
// El visitant arriba des d'Instagram. Té 3 segons per decidir si es queda.
// No llegeix. Sent. Veu. El dit és la seva vareta màgica.
// 
// L'HISTÒRIA EN 6 CAPÍTOLS:
// 
// ┌─────────────────────────────────────────────────────────────────────────────────┐
// │ CAPÍTOL 1: L'ENCANTAMENT (0-3s)                                                 │
// │ Una imatge que para el món. El visitant pensa: "WOW, què és això?"              │
// │ Format: Pantalla completa, com una story d'Instagram                            │
// ├─────────────────────────────────────────────────────────────────────────────────┤
// │ CAPÍTOL 2: LA REVELACIÓ (3-8s)                                                  │
// │ Li expliquem el secret: "No posem música. Creem mons."                          │
// │ Format: Text gran, animat, que respira                                          │
// ├─────────────────────────────────────────────────────────────────────────────────┤
// │ CAPÍTOL 3: ELS REGNES (8-30s)                                                   │
// │ Halloween. Món Màgic. Cada món amb les seves fotos.                             │
// │ Format: Carrusel horitzontal, swipe natural                                     │
// ├─────────────────────────────────────────────────────────────────────────────────┤
// │ CAPÍTOL 4: LA MÀGIA (interacció)                                                │
// │ Toca la pantalla = partícules. Sacseja = sorpresa.                              │
// │ Format: Canvas interactiu, vibració hàptica                                     │
// ├─────────────────────────────────────────────────────────────────────────────────┤
// │ CAPÍTOL 5: ELS TESTIMONIS (30-60s)                                              │
// │ Persones reals, events reals, fotos reals.                                      │
// │ Format: Cards amb foto de l'event + quote                                       │
// ├─────────────────────────────────────────────────────────────────────────────────┤
// │ CAPÍTOL 6: LA CRIDA (60s+)                                                      │
// │ "Tens una data al cap?" WhatsApp, Contacte.                                     │
// │ Format: CTA gran, clar, impossible de perdre                                    │
// └─────────────────────────────────────────────────────────────────────────────────┘
//
// ═══════════════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Link } from '@/lib/navigation';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

// ═══════════════════════════════════════════════════════════════════════════════════
// 📸 DADES - Les fotos REALS d'Òrbita
// ═══════════════════════════════════════════════════════════════════════════════════

// Fotos hero - els alt vindran de traduccions
const FOTOS_HERO_DATA = [
  { src: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.jpg', tema: 'halloween', altKey: 'hero.altHalloween' },
  { src: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-01.webp', tema: 'monmagic', altKey: 'hero.altMonMagic' },
  { src: '/img/portfolio/bodas/bodas-01.webp', tema: 'boda', altKey: 'hero.altBoda' },
  { src: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.webp', tema: 'festa', altKey: 'hero.altFesta' },
];

// Dades estàtiques dels regnes (no traduïbles: colors, gradients, fotos, emojis)
const REGNES_DATA = {
  halloween: {
    color: '#ff6b00',
    gradient: 'from-orange-600 via-red-700 to-black',
    fotos: [
      '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.jpg',
      '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-02.webp',
      '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-03.webp',
      '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-04.webp',
      '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-05.webp',
      '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-06.webp',
      '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-07.webp',
      '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-08.webp',
      '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-09.webp',
      '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-10.webp',
      '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-11.webp',
      '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-12.webp',
    ],
    particules: ['🎃', '👻', '🦇', '🕷️', '💀', '🕸️'],
  },
  monmagic: {
    color: '#ffd700',
    gradient: 'from-amber-600 via-red-800 to-black',
    fotos: [
      '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-01.webp',
      '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-02.webp',
      '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-03.webp',
      '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-04.webp',
      '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-05.webp',
      '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-06.webp',
      '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-07.webp',
      '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-08.webp',
      '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-09.webp',
      '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-10.webp',
      '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-11.webp',
      '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-12.webp',
    ],
    particules: ['⭐', '✨', '🪄', '⚡', '🦉', '📜'],
  },
};

// Dades estàtiques dels testimonis (fotos i ratings)
const TESTIMONIS_DATA = [
  {
    foto: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-06.webp',
    rating: 5,
  },
  {
    foto: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-06.webp',
    rating: 5,
  },
  {
    foto: '/img/portfolio/eventos-empresa/eventos-empresa-01.webp',
    rating: 5,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════════
// 🎭 COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════════

export default function ExperienciaMobil() {
  const [isMounted, setIsMounted] = useState(false);
  const t = useTranslations('mobileExperience');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <LoadingScreen />;
  }

  return (
    <main className="bg-black min-h-screen overflow-x-hidden selection:bg-amber-500/30">
      {/* Capa de màgia interactiva */}
      <MagicTouchLayer />

      {/* CAPÍTOL 1: L'ENCANTAMENT */}
      <Capitol1_Encantament t={t} />

      {/* CAPÍTOL 2: LA REVELACIÓ */}
      <Capitol2_Revelacio t={t} />

      {/* CAPÍTOL 3: ELS REGNES */}
      <Capitol3_Regnes t={t} />

      {/* CAPÍTOL 4: LES PROVES (Galeria extra) */}
      <Capitol4_Proves t={t} />

      {/* CAPÍTOL 5: ELS TESTIMONIS */}
      <Capitol5_Testimonis t={t} />

      {/* CAPÍTOL 6: LA CRIDA */}
      <Capitol6_Crida t={t} />

      {/* WhatsApp flotant */}
      <WhatsAppButton />
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════════
// ⏳ LOADING SCREEN
// ═══════════════════════════════════════════════════════════════════════════════════

function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-6xl"
      >
        ✨
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════════
// ✨ MAGIC TOUCH LAYER - El dit és la vareta
// ═══════════════════════════════════════════════════════════════════════════════════

function MagicTouchLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    emoji: string;
    size: number;
    rotation: number;
    rotationSpeed: number;
  }

  const emojis = useMemo(() => ['✨', '⭐', '💫', '🌟', '🎃', '🧙‍♂️'], []);

  const createParticle = useCallback((x: number, y: number): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1,
      maxLife: 60 + Math.random() * 30,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      size: 16 + Math.random() * 16,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
    };
  }, [emojis]);

  const handleTouch = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;

    // Vibració hàptica suau
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    // Crear partícules
    for (let i = 0; i < 5; i++) {
      particlesRef.current.push(
        createParticle(
          touch.clientX + (Math.random() - 0.5) * 30,
          touch.clientY + (Math.random() - 0.5) * 30
        )
      );
    }

    // Limitar partícules
    if (particlesRef.current.length > 100) {
      particlesRef.current = particlesRef.current.slice(-100);
    }
  }, [createParticle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Escoltar tocs
    window.addEventListener('touchmove', handleTouch, { passive: true });
    window.addEventListener('touchstart', handleTouch, { passive: true });

    // Animació
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // Gravetat
        p.life -= 1 / p.maxLife;
        p.rotation += p.rotationSpeed;

        if (p.life <= 0) return false;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.life;
        ctx.font = `${p.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.emoji, 0, 0);
        ctx.restore();

        return true;
      });

      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('touchmove', handleTouch);
      window.removeEventListener('touchstart', handleTouch);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [handleTouch]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ touchAction: 'none' }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 📖 CAPÍTOL 1: L'ENCANTAMENT
// Primera impressió. 3 segons per enamorar.
// ═══════════════════════════════════════════════════════════════════════════════════

function Capitol1_Encantament({ t }: { t: (key: string) => string }) {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const touchStartX = useRef(0);
  const autoplayRef = useRef<NodeJS.Timeout>();

  // Genera fotos amb alt traduït
  const FOTOS_HERO = FOTOS_HERO_DATA.map(foto => ({
    ...foto,
    alt: t(foto.altKey),
  }));

  // Autoplay amb progress bar
  useEffect(() => {
    const duration = 5000; // 5 segons per slide
    const interval = 50; // Actualitzar cada 50ms
    let elapsed = 0;

    autoplayRef.current = setInterval(() => {
      elapsed += interval;
      setProgress((elapsed / duration) * 100);

      if (elapsed >= duration) {
        setCurrent((prev) => (prev + 1) % FOTOS_HERO_DATA.length);
        elapsed = 0;
      }
    }, interval);

    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [current]);

  // Swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setCurrent((prev) => (prev + 1) % FOTOS_HERO_DATA.length);
      } else {
        setCurrent((prev) => (prev - 1 + FOTOS_HERO_DATA.length) % FOTOS_HERO_DATA.length);
      }
      setProgress(0);
    }
  };

  return (
    <section
      className="relative h-[100svh] w-full"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Imatges */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          <Image
            src={FOTOS_HERO[current].src}
            alt={FOTOS_HERO[current].alt}
            fill
            priority
            className="object-cover"
            sizes="100vw"
            quality={90}
          />
        </motion.div>
      </AnimatePresence>

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

      {/* Progress bars estil Stories */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-3 pt-safe z-20">
        {FOTOS_HERO_DATA.map((_, idx) => (
          <div key={idx} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              style={{
                width: idx === current ? `${progress}%` : idx < current ? '100%' : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Contingut principal - A BAIX */}
      <div className="absolute inset-x-0 bottom-0 p-6 pb-10 z-10 pb-safe">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {/* Títol principal */}
          <h1 className="text-[11vw] sm:text-5xl font-black text-white leading-[0.95] mb-4">
            {t('hero.title1')}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500">
              {t('hero.title2')}
            </span>
          </h1>

          {/* Subtítol */}
          <p className="text-lg text-white/70 mb-6 max-w-xs">
            {t('hero.subtitle')}
          </p>

          {/* CTA Scroll */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex items-center gap-2 text-white/60"
          >
            <span className="text-sm">{t('hero.discover')}</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </motion.div>
      </div>

      {/* Indicador de swipe */}
      <div className="absolute bottom-4 right-4 text-white/40 text-xs z-10">
        {t('hero.swipe')}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 📖 CAPÍTOL 2: LA REVELACIÓ
// El secret d'Òrbita en una frase
// ═══════════════════════════════════════════════════════════════════════════════════

function Capitol2_Revelacio({ t }: { t: (key: string) => string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [0.8, 1, 1, 0.8]);
  const y = useTransform(scrollYProgress, [0, 0.3], [60, 0]);

  return (
    <section ref={ref} className="min-h-[70vh] flex items-center justify-center px-6 py-20 bg-black">
      <motion.div style={{ opacity, scale, y }} className="text-center max-w-md">
        {/* Icon */}
        <motion.div
          animate={{
            rotate: [0, 5, -5, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="text-6xl mb-6"
        >
          ✨
        </motion.div>

        {/* El secret */}
        <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">
          {t('revelation.title1')}
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
            {t('revelation.title2')}
          </span>
        </h2>

        {/* Explicació */}
        <p className="text-white/60 text-lg leading-relaxed">
          {t('revelation.description1')}
          <br />
          <span className="text-white/80">{t('revelation.description2')}</span>
        </p>

        {/* Hint interactiu */}
        <p className="text-amber-400/60 text-sm mt-8">
          👆 {t('revelation.touchHint')}
        </p>
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 📖 CAPÍTOL 3: ELS REGNES
// Halloween i Món Màgic - El diferencial visual
// ═══════════════════════════════════════════════════════════════════════════════════

function Capitol3_Regnes({ t }: { t: (key: string) => string }) {
  const [regneActiu, setRegneActiu] = useState<'halloween' | 'monmagic'>('halloween');
  const [fotoIndex, setFotoIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const regneData = REGNES_DATA[regneActiu];

  // Reset foto index quan canvia de regne
  useEffect(() => {
    setFotoIndex(0);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [regneActiu]);

  return (
    <section className="py-16 bg-gradient-to-b from-black via-neutral-950 to-black">
      {/* Header */}
      <div className="px-6 mb-6">
        <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-2">
          {t('realms.sectionTitle')}
        </p>
        <h2 className="text-3xl font-black text-white">
          {t('realms.title')}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
            {t('realms.titleHighlight')}
          </span>
        </h2>
      </div>

      {/* Selector de regne */}
      <div className="flex gap-3 px-6 mb-6">
        {(Object.keys(REGNES_DATA) as Array<keyof typeof REGNES_DATA>).map((key) => (
          <motion.button
            key={key}
            onClick={() => setRegneActiu(key)}
            whileTap={{ scale: 0.95 }}
            className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
              regneActiu === key
                ? `bg-gradient-to-r ${REGNES_DATA[key].gradient} text-white shadow-lg`
                : 'bg-white/5 text-white/50 border border-white/10'
            }`}
          >
            {key === 'halloween' ? `🎃 ${t('realms.halloween.name')}` : `🧙‍♂️ ${t('realms.monmagic.name')}`}
          </motion.button>
        ))}
      </div>

      {/* Títol del regne */}
      <AnimatePresence mode="wait">
        <motion.div
          key={regneActiu}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="px-6 mb-4"
        >
          <h3 className="text-2xl font-black text-white">{t(`realms.${regneActiu}.title`)}</h3>
          <p className="text-white/60">{t(`realms.${regneActiu}.description`)}</p>
        </motion.div>
      </AnimatePresence>

      {/* Galeria horitzontal */}
      <div
        ref={scrollRef}
        className="flex gap-4 px-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {regneData.fotos.map((foto, idx) => (
          <motion.div
            key={`${regneActiu}-${idx}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="snap-center flex-shrink-0"
          >
            <div
              className={`relative w-[75vw] max-w-[300px] aspect-[3/4] rounded-3xl overflow-hidden ${
                idx === fotoIndex ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-black' : ''
              }`}
              onClick={() => setFotoIndex(idx)}
            >
              <Image
                src={foto}
                alt={`${t(`realms.${regneActiu}.name`)} - ${idx + 1}`}
                fill
                className="object-cover"
                sizes="75vw"
              />
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-t ${regneData.gradient} opacity-30`} />

              {/* Número de foto */}
              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <span className="text-white text-xs font-bold">{idx + 1}</span>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Card CTA al final */}
        <div className="snap-center flex-shrink-0">
          <Link
            href="/contacto"
            className={`flex flex-col items-center justify-center w-[75vw] max-w-[300px] aspect-[3/4] rounded-3xl bg-gradient-to-br ${regneData.gradient} p-8`}
          >
            <span className="text-6xl mb-4">{regneData.particules[0]}</span>
            <p className="text-white font-bold text-xl text-center mb-2">
              {t('realms.wantParty')}
              <br />
              {t(`realms.${regneActiu}.name`)}!
            </p>
            <span className="mt-4 px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
              {t('realms.contact')}
            </span>
          </Link>
        </div>
      </div>

      {/* Indicador de swipe */}
      <div className="px-6 mt-4 flex items-center justify-between">
        <p className="text-amber-400/60 text-xs">
          {t('realms.swipeHint')}
        </p>
        <p className="text-white/40 text-xs">
          {fotoIndex + 1} / {regneData.fotos.length}
        </p>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 📖 CAPÍTOL 4: LES PROVES
// Més fotos - Galeria estil Pinterest
// ═══════════════════════════════════════════════════════════════════════════════════

function Capitol4_Proves({ t }: { t: (key: string) => string }) {
  const TOTES_FOTOS = [
    '/img/portfolio/bodas/bodas-02.webp',
    '/img/portfolio/bodas/bodas-03.webp',
    '/img/portfolio/bodas/bodas-04.webp',
    '/img/portfolio/fiestas-privadas/fiestas-privadas-02.webp',
    '/img/portfolio/fiestas-privadas/fiestas-privadas-03.webp',
    '/img/portfolio/eventos-empresa/eventos-empresa-02.webp',
    '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-09.webp',
    '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-09.webp',
  ];

  return (
    <section className="py-16 bg-black">
      <div className="px-6 mb-8">
        <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-2">
          {t('gallery.sectionTitle')}
        </p>
        <h2 className="text-3xl font-black text-white">
          {t('gallery.title')}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
            {t('gallery.titleHighlight')}
          </span>
        </h2>
      </div>

      {/* Grid estil Pinterest */}
      <div className="columns-2 gap-3 px-4">
        {TOTES_FOTOS.map((foto, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: idx * 0.05 }}
            className="mb-3 break-inside-avoid"
          >
            <div className="relative rounded-2xl overflow-hidden">
              <Image
                src={foto}
                alt={`${t('gallery.imageAlt')} ${idx + 1}`}
                width={400}
                height={idx % 3 === 0 ? 500 : 350}
                className="w-full object-cover"
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-6 mt-8 text-center">
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 rounded-full text-white font-medium"
        >
          {t('gallery.viewAll')}
          <span>→</span>
        </Link>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 📖 CAPÍTOL 5: ELS TESTIMONIS
// Veus reals amb fotos reals
// ═══════════════════════════════════════════════════════════════════════════════════

function Capitol5_Testimonis({ t }: { t: (key: string) => string }) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setCurrent((prev) => (prev + 1) % TESTIMONIS_DATA.length);
      } else {
        setCurrent((prev) => (prev - 1 + TESTIMONIS_DATA.length) % TESTIMONIS_DATA.length);
      }
    }
  };

  const testimoniData = TESTIMONIS_DATA[current];

  return (
    <section className="py-16 bg-neutral-950">
      <div className="px-6 mb-8">
        <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-2">
          {t('testimonials.sectionTitle')}
        </p>
        <h2 className="text-3xl font-black text-white">
          {t('testimonials.title')}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
            {t('testimonials.titleHighlight')}
          </span>
        </h2>
      </div>

      {/* Testimoni card */}
      <div
        className="px-6"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-white/5 rounded-3xl overflow-hidden border border-white/10"
          >
            {/* Imatge de l'event */}
            <div className="relative aspect-video">
              <Image
                src={testimoniData.foto}
                alt={t(`testimonis.${current}.event`)}
                fill
                className="object-cover"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Rating */}
              <div className="absolute top-4 right-4 flex gap-0.5">
                {[...Array(testimoniData.rating)].map((_, i) => (
                  <span key={i} className="text-amber-400 text-lg">★</span>
                ))}
              </div>

              {/* Event badge */}
              <div className="absolute bottom-4 left-4">
                <span className="px-3 py-1.5 bg-amber-500 rounded-full text-black text-xs font-bold">
                  {t(`testimonis.${current}.event`)}
                </span>
              </div>
            </div>

            {/* Text */}
            <div className="p-6">
              <blockquote className="text-white text-lg leading-relaxed mb-4">
                &ldquo;{t(`testimonis.${current}.text`)}&rdquo;
              </blockquote>
              <p className="text-amber-400 font-bold">
                — {t(`testimonis.${current}.nom`)}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navegació */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {TESTIMONIS_DATA.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === current ? 'w-8 bg-amber-500' : 'w-2 bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Hint */}
        <p className="text-center text-white/40 text-xs mt-4">
          {t('testimonials.swipe')}
        </p>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 📖 CAPÍTOL 6: LA CRIDA
// El moment de contactar
// ═══════════════════════════════════════════════════════════════════════════════════

function Capitol6_Crida({ t }: { t: (key: string) => string }) {
  return (
    <section className="py-20 px-6 bg-gradient-to-b from-neutral-950 via-black to-black">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-md mx-auto text-center"
      >
        {/* Emoji animat */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-7xl mb-6"
        >
          ✨
        </motion.div>

        {/* Títol */}
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
          {t('cta.title')}
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
            {t('cta.titleHighlight')}
          </span>
        </h2>

        {/* Subtítol */}
        <p className="text-white/60 mb-8">
          {t('cta.description1')}
          <br />
          <span className="text-white/80">{t('cta.description2')}</span>
        </p>

        {/* Botons */}
        <div className="flex flex-col gap-3">
          {/* WhatsApp - Principal */}
          <motion.a
            href="https://wa.me/34699121023?text=Hola!%20Vull%20informació%20sobre%20els%20vostres%20serveis"
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-3 w-full py-4 bg-[#25D366] rounded-2xl text-white font-bold text-lg shadow-lg shadow-[#25D366]/30"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {t('cta.whatsapp')}
          </motion.a>

          {/* Formulari */}
          <motion.div whileTap={{ scale: 0.98 }}>
            <Link
              href="/contacto"
              className="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl text-black font-bold text-lg"
            >
              ✉️ {t('cta.contactForm')}
            </Link>
          </motion.div>

          {/* Trucar */}
          <motion.a
            href="tel:+34699121023"
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-3 w-full py-4 bg-white/5 border border-white/20 rounded-2xl text-white font-medium"
          >
            📞 {t('cta.call')}
          </motion.a>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-4 mt-10 text-white/40 text-sm">
          <span className="flex items-center gap-1">
            {t('cta.trustYears')}
          </span>
          <span>•</span>
          <span>{t('cta.trustLocation')}</span>
          <span>•</span>
          <span>{t('cta.trustResponse')}</span>
        </div>

        {/* Garantia */}
        <p className="text-white/30 text-xs mt-6">
          {t('cta.guarantee')}
        </p>
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 💬 WHATSAPP BUTTON FLOTANT
// ═══════════════════════════════════════════════════════════════════════════════════

function WhatsAppButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.a
          href="https://wa.me/34699121023?text=Hola!%20Vull%20informació%20sobre%20els%20vostres%20serveis"
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center shadow-xl shadow-[#25D366]/40"
        >
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          
          {/* Pulse animation */}
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
        </motion.a>
      )}
    </AnimatePresence>
  );
}
