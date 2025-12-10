// app/components/landing/ElViatge.tsx
// ═══════════════════════════════════════════════════════════════════════════════
// 
//   ███████╗██╗         ██╗   ██╗██╗ █████╗ ████████╗ ██████╗ ███████╗
//   ██╔════╝██║         ██║   ██║██║██╔══██╗╚══██╔══╝██╔════╝ ██╔════╝
//   █████╗  ██║         ██║   ██║██║███████║   ██║   ██║  ███╗█████╗  
//   ██╔══╝  ██║         ╚██╗ ██╔╝██║██╔══██║   ██║   ██║   ██║██╔══╝  
//   ███████╗███████╗     ╚████╔╝ ██║██║  ██║   ██║   ╚██████╔╝███████╗
//   ╚══════╝╚══════╝      ╚═══╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚══════╝
//
// ═══════════════════════════════════════════════════════════════════════════════
//
// LA WEB NO ÉS UN CATÀLEG. ÉS UN PREVIEW DE LA MÀGIA QUE OFERIM.
//
// CAPÍTOL 1: EL PORTAL        → L'entrada al món Òrbita
// CAPÍTOL 2: LA PROMESA       → Parlem de TU, no de nosaltres
// CAPÍTOL 3: ELS MONS         → Halloween, Món Màgic, Bodes...
// CAPÍTOL 4: LES HISTÒRIES    → Testimonis REALS amb fotos
// CAPÍTOL 5: LA DIFERÈNCIA    → Per què nosaltres
// CAPÍTOL 6: EL PRIMER PAS    → CTA càlid, no agressiu
//
// ═══════════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// 📸 DADES REALS - Les fotos d'Òrbita
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  whatsapp: '34699121023',
  phone: '+34 699 12 10 23',
  email: 'info@orbitaevents.com',
};

const MONS = {
  halloween: {
    id: 'halloween',
    emoji: '🎃',
    nom: 'Halloween',
    titol: 'La Nit dels Morts',
    subtitol: 'Terror, fum, llums verdes... Una nit que no oblidaran.',
    color: '#ff6b00',
    colorSecondary: '#00ff00',
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
  },
  monmagic: {
    id: 'monmagic',
    emoji: '🧙‍♂️',
    nom: 'Món Màgic',
    titol: "Benvingut a l'Escola de Màgia",
    subtitol: 'Varetes, cases, màgia... El somni de tot fan de la fantasia.',
    color: '#ffd700',
    colorSecondary: '#740001',
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
  },
  bodes: {
    id: 'bodes',
    emoji: '💒',
    nom: 'Bodes',
    titol: "L'Amor Celebrat",
    subtitol: 'El dia més important de la vostra vida, perfecte.',
    color: '#f0c0c0',
    colorSecondary: '#d4af37',
    gradient: 'from-rose-400 via-pink-600 to-purple-900',
    fotos: [
      '/img/portfolio/bodas/bodas-01.webp',
      '/img/portfolio/bodas/bodas-02.webp',
      '/img/portfolio/bodas/bodas-03.webp',
      '/img/portfolio/bodas/bodas-04.webp',
      '/img/portfolio/bodas/bodas-05.webp',
      '/img/portfolio/bodas/bodas-06.webp',
      '/img/portfolio/bodas/bodas-07.webp',
      '/img/portfolio/bodas/bodas-08.webp',
      '/img/portfolio/bodas/bodas-09.webp',
      '/img/portfolio/bodas/bodas-10.webp',
      '/img/portfolio/bodas/bodas-11.webp',
    ],
  },
  festes: {
    id: 'festes',
    emoji: '🎉',
    nom: 'Festes',
    titol: "L'Alegria Compartida",
    subtitol: 'Aniversaris, celebracions, moments únics.',
    color: '#ff00ff',
    colorSecondary: '#00ffff',
    gradient: 'from-fuchsia-500 via-purple-600 to-blue-900',
    fotos: [
      '/img/portfolio/fiestas-privadas/fiestas-privadas-01.webp',
      '/img/portfolio/fiestas-privadas/fiestas-privadas-02.webp',
      '/img/portfolio/fiestas-privadas/fiestas-privadas-03.webp',
      '/img/portfolio/fiestas-privadas/fiestas-privadas-04.webp',
      '/img/portfolio/fiestas-privadas/fiestas-privadas-05.webp',
      '/img/portfolio/fiestas-privadas/fiestas-privadas-06.webp',
      '/img/portfolio/fiestas-privadas/fiestas-privadas-07.webp',
    ],
  },
  empreses: {
    id: 'empreses',
    emoji: '🏢',
    nom: 'Empreses',
    titol: "L'Impacte Memorable",
    subtitol: 'Events corporatius que el teu equip recordarà.',
    color: '#3b82f6',
    colorSecondary: '#1e3a5f',
    gradient: 'from-blue-500 via-indigo-700 to-slate-900',
    fotos: [
      '/img/portfolio/eventos-empresa/eventos-empresa-01.webp',
      '/img/portfolio/eventos-empresa/eventos-empresa-02.webp',
      '/img/portfolio/eventos-empresa/eventos-empresa-03.webp',
      '/img/portfolio/eventos-empresa/eventos-empresa-04.webp',
      '/img/portfolio/eventos-empresa/eventos-empresa-05.png',
      '/img/portfolio/eventos-empresa/eventos-empresa-06.png',
    ],
  },
};

const TESTIMONIS = [
  {
    id: 1,
    text: "Van transformar el nostre casament en una experiència màgica d'escola de bruixeria. Els convidats encara en parlen. El DJ va llegir l'ambient perfectament. INCREÏBLE.",
    nom: 'Lorena & Carles',
    event: 'Boda Món Màgic',
    lloc: 'Catalunya',
    data: 'Juliol 2025',
    foto: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-06.webp',
    rating: 5,
  },
  {
    id: 2,
    text: 'La millor festa de Halloween de la meva vida. El fum, les llums verdes, les carbasses... Els meus amics encara al·lucinen.',
    nom: 'Àngela',
    event: '18è Aniversari Halloween',
    lloc: 'Barcelona',
    data: 'Octubre 2024',
    foto: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-06.webp',
    rating: 5,
  },
  {
    id: 3,
    text: "Volíem quelcom diferent per l'empresa. Van superar totes les expectatives. Professional, creatiu, i l'equip encara en parla.",
    nom: 'Marta - Dir. RRHH',
    event: 'Sopar Empresa',
    lloc: 'Girona',
    data: 'Desembre 2024',
    foto: '/img/portfolio/eventos-empresa/eventos-empresa-01.webp',
    rating: 5,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 🎭 COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default function ElViatge() {
  const [mounted, setMounted] = useState(false);
  const [portalComplete, setPortalComplete] = useState(false);
  const [currentMon, setCurrentMon] = useState<keyof typeof MONS>('halloween');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Loading mentre no estem muntats
  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-6xl"
        >
          ✨
        </motion.div>
      </div>
    );
  }

  return (
    <main className="bg-black min-h-screen overflow-x-hidden">
      {/* Cursor màgic - només desktop */}
      <MagicCursor />

      {/* Partícules de fons */}
      <BackgroundParticles />

      {/* CAPÍTOL 1: EL PORTAL */}
      <AnimatePresence>
        {!portalComplete && (
          <Portal onComplete={() => setPortalComplete(true)} />
        )}
      </AnimatePresence>

      {/* Contingut principal - només es mostra després del portal */}
      {portalComplete && (
        <>
          {/* CAPÍTOL 2: LA PROMESA */}
          <LaPromesa />

          {/* CAPÍTOL 3: ELS MONS */}
          <ElsMons currentMon={currentMon} setCurrentMon={setCurrentMon} />

          {/* CAPÍTOL 4: LES HISTÒRIES */}
          <LesHistories />

          {/* CAPÍTOL 5: LA DIFERÈNCIA */}
          <LaDiferencia />

          {/* CAPÍTOL 6: EL PRIMER PAS */}
          <ElPrimerPas />

          {/* WhatsApp flotant */}
          <WhatsAppFloat />
        </>
      )}
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ✨ CAPÍTOL 1: EL PORTAL
// L'entrada al món Òrbita. 5-7 segons de màgia pura.
// ═══════════════════════════════════════════════════════════════════════════════

function Portal({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);
  // 0: Negre total
  // 1: Text subliminal apareix
  // 2: Logo apareix
  // 3: Partícules exploten
  // 4: Transició a contingut

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 3000),
      setTimeout(() => setPhase(4), 4500),
      setTimeout(() => onComplete(), 5500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden"
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      {/* Text subliminal */}
      <AnimatePresence>
        {phase >= 1 && phase < 3 && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 1.5, ease: [0.22, 0.61, 0.36, 1] }}
            className="absolute top-1/3 text-magic text-magic-lg animate-magic-breathe"
          >
            La màgia comença...
          </motion.p>
        )}
      </AnimatePresence>

      {/* Logo amb planeta orbitant */}
      <AnimatePresence>
        {phase >= 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="relative flex flex-col items-center"
          >
            {/* Planeta orbitant */}
            <div className="relative w-40 h-40 md:w-56 md:h-56 mb-6">
              {/* Òrbita (anell) */}
              <motion.div
                className="absolute inset-0 border-2 border-amber-400/30 rounded-full"
                style={{ borderStyle: 'dashed' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              />

              {/* Glow del planeta */}
              <motion.div
                className="absolute inset-4 rounded-full"
                animate={{
                  boxShadow: [
                    '0 0 40px rgba(215, 184, 110, 0.4)',
                    '0 0 80px rgba(215, 184, 110, 0.6)',
                    '0 0 40px rgba(215, 184, 110, 0.4)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              {/* Planeta (logo SVG) */}
              <motion.div
                className="absolute inset-4 flex items-center justify-center"
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.02, 1],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Image
                  src="/img/logosoloplaneta.svg"
                  alt="Òrbita"
                  width={180}
                  height={180}
                  className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(215,184,110,0.5)]"
                  priority
                />
              </motion.div>

              {/* Satèl·lit petit orbitant */}
              <motion.div
                className="absolute w-3 h-3 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(215,184,110,0.8)]"
                animate={{
                  rotate: 360,
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                style={{
                  top: '50%',
                  left: '50%',
                  transformOrigin: '0 -70px',
                }}
              />

              {/* Segon satèl·lit (més petit, més ràpid) */}
              <motion.div
                className="absolute w-2 h-2 bg-amber-300/70 rounded-full shadow-[0_0_8px_rgba(215,184,110,0.6)]"
                animate={{
                  rotate: -360,
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                style={{
                  top: '50%',
                  left: '50%',
                  transformOrigin: '0 -55px',
                }}
              />
            </div>

            {/* Text del logo */}
            <motion.h1
              className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ backgroundSize: '200% 200%' }}
            >
              ÒRBITA
            </motion.h1>
            <p className="text-center text-white/60 text-sm tracking-[0.5em] mt-2">
              EVENTS
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Partícules d'explosió */}
      {phase >= 3 && <PortalParticles />}

      {/* Skip button - Millorat */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        whileHover={{ opacity: 1 }}
        onClick={onComplete}
        className="absolute bottom-8 px-4 py-2 rounded-full
                   bg-white/10 text-white/70 text-sm
                   hover:bg-white/20 hover:text-white
                   transition-all duration-200
                   focus-visible:ring-2 focus-visible:ring-amber-400/50"
      >
        Saltar intro →
      </motion.button>
    </motion.div>
  );
}

function PortalParticles() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 400,
    y: (Math.random() - 0.5) * 400,
    delay: Math.random() * 0.3,
    size: 4 + Math.random() * 8,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0 }}
          transition={{ duration: 1.5, delay: p.delay, ease: 'easeOut' }}
          className="absolute left-1/2 top-1/2 rounded-full bg-amber-400"
          style={{ width: p.size, height: p.size }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💫 CAPÍTOL 2: LA PROMESA
// No parlem de nosaltres. Parlem de TU.
// ═══════════════════════════════════════════════════════════════════════════════

function LaPromesa() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);

  const [currentImage, setCurrentImage] = useState(0);
  const heroImages = [
    MONS.halloween.fotos[0],
    MONS.monmagic.fotos[0],
    MONS.bodes.fotos[0],
  ];

  // Slideshow automàtic
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Imatge de fons amb parallax */}
      <motion.div style={{ scale }} className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <Image
              src={heroImages[currentImage]}
              alt="Event Òrbita"
              fill
              className="object-cover"
              priority
            />
          </motion.div>
        </AnimatePresence>
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />
      </motion.div>

      {/* Contingut */}
      <motion.div style={{ opacity }} className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Títol que s'escriu */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-tight mb-6"
        >
          El dia que sempre
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300">
            vas imaginar
          </span>
        </motion.h1>

        {/* Subtítol emocional */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-8 leading-relaxed"
        >
          Aquell moment en què mires al teu voltant i veus tothom somrient.
          <br className="hidden sm:block" />
          La música perfecta. Les llums justes. I saps que aquest instant quedarà per sempre.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9 }}
        >
          <Link
            href="#mons"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full text-black font-bold text-lg hover:scale-105 transition-transform shadow-lg shadow-amber-500/30"
          >
            Comença a crear-lo
            <motion.span
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ↓
            </motion.span>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="flex flex-wrap justify-center gap-8 mt-12"
        >
          {[
            { num: '2+', label: 'anys en el sector' },
            { num: 'BCN', label: '+ Girona' },
            { num: '2h', label: 'resposta' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl font-black text-amber-400">{stat.num}</p>
              <p className="text-white/60 text-sm">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Indicador de scroll */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-amber-400"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🌍 CAPÍTOL 3: ELS MONS
// No un llistat. Universos per explorar.
// ═══════════════════════════════════════════════════════════════════════════════

function ElsMons({
  currentMon,
  setCurrentMon,
}: {
  currentMon: keyof typeof MONS;
  setCurrentMon: (_mon: keyof typeof MONS) => void;
}) {
  const mon = MONS[currentMon];
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section id="mons" className="py-20 bg-gradient-to-b from-black via-neutral-950 to-black">
      {/* Header */}
      <div className="text-center px-6 mb-12">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-amber-400/80 text-sm tracking-[0.3em] uppercase mb-4"
        >
          Escull el teu univers
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl sm:text-5xl font-black text-white"
        >
          Cada event és un{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500">
            món
          </span>
        </motion.h2>
      </div>

      {/* Selector de mons */}
      <div className="flex flex-wrap justify-center gap-3 px-6 mb-8">
        {(Object.keys(MONS) as Array<keyof typeof MONS>).map((key) => (
          <motion.button
            key={key}
            onClick={() => setCurrentMon(key)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-5 py-3 rounded-full font-bold text-sm transition-all ${
              currentMon === key
                ? `bg-gradient-to-r ${MONS[key].gradient} text-white shadow-lg`
                : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/30'
            }`}
          >
            {MONS[key].emoji} {MONS[key].nom}
          </motion.button>
        ))}
      </div>

      {/* Info del món actual */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMon}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="text-center px-6 mb-8"
        >
          <h3 className="text-3xl font-black text-white mb-2">{mon.titol}</h3>
          <p className="text-white/60 max-w-md mx-auto">{mon.subtitol}</p>
        </motion.div>
      </AnimatePresence>

      {/* Galeria de fotos */}
      <div
        ref={scrollRef}
        className="flex gap-4 px-6 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide"
        style={{ scrollbarWidth: 'none' }}
      >
        {mon.fotos.map((foto, idx) => (
          <motion.div
            key={`${currentMon}-${idx}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="snap-center flex-shrink-0"
          >
            <div className="relative w-[280px] sm:w-[320px] aspect-[3/4] rounded-3xl overflow-hidden group">
              <Image
                src={foto}
                alt={`${mon.nom} - ${idx + 1}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="320px"
              />
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-t ${mon.gradient} opacity-20 group-hover:opacity-40 transition-opacity`} />
              {/* Número */}
              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <span className="text-white text-xs font-bold">{idx + 1}</span>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Card CTA al final */}
        <div className="snap-center flex-shrink-0">
          <Link
            href="/contacto"
            className={`flex flex-col items-center justify-center w-[280px] sm:w-[320px] aspect-[3/4] rounded-3xl bg-gradient-to-br ${mon.gradient} p-8 hover:scale-105 transition-transform`}
          >
            <span className="text-6xl mb-4">{mon.emoji}</span>
            <p className="text-white font-bold text-xl text-center mb-2">
              Vull una festa
              <br />
              {mon.nom}!
            </p>
            <span className="mt-4 px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
              Contactar →
            </span>
          </Link>
        </div>
      </div>

      {/* Indicador swipe */}
      <p className="text-center text-white/40 text-sm mt-4">
        ← swipe per veure més →
      </p>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📖 CAPÍTOL 4: LES HISTÒRIES
// Testimonis REALS amb fotos dels events.
// ═══════════════════════════════════════════════════════════════════════════════

function LesHistories() {
  const [current, setCurrent] = useState(0);

  // Auto-advance
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % TESTIMONIS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const testimoni = TESTIMONIS[current];

  return (
    <section className="py-20 bg-gradient-to-b from-black via-neutral-950 to-black">
      {/* Header */}
      <div className="text-center px-6 mb-12">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-amber-400/80 text-sm tracking-[0.3em] uppercase mb-4"
        >
          Històries reals
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl sm:text-5xl font-black text-white"
        >
          No t'ho diem nosaltres.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500">
            T'ho diuen ells.
          </span>
        </motion.h2>
      </div>

      {/* Testimoni actual */}
      <div className="max-w-4xl mx-auto px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="grid md:grid-cols-2 gap-8 items-center"
          >
            {/* Foto */}
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden">
              <Image
                src={testimoni.foto}
                alt={testimoni.nom}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              {/* Badge event */}
              <div className="absolute bottom-4 left-4">
                <div className="bg-amber-500/90 px-4 py-2 rounded-full">
                  <span className="text-black font-bold text-sm">{testimoni.event}</span>
                </div>
              </div>
              {/* Rating */}
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <span className="text-amber-400">{'★'.repeat(testimoni.rating)}</span>
              </div>
            </div>

            {/* Text */}
            <div>
              <blockquote className="text-xl sm:text-2xl text-white italic leading-relaxed mb-6">
                "{testimoni.text}"
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
                  <span className="text-2xl">😊</span>
                </div>
                <div>
                  <p className="font-bold text-white">{testimoni.nom}</p>
                  <p className="text-white/60 text-sm">
                    {testimoni.lloc} · {testimoni.data}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots navegació */}
        <div className="flex justify-center gap-2 mt-8">
          {TESTIMONIS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === current ? 'w-8 bg-amber-500' : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⚡ CAPÍTOL 5: LA DIFERÈNCIA
// Per què nosaltres.
// ═══════════════════════════════════════════════════════════════════════════════

function LaDiferencia() {
  const diferencies = [
    {
      altres: 'Només música de fons',
      nosaltres: 'Música + tematització + animació',
      emoji: '🎵',
    },
    {
      altres: "DJ que no s'adapta",
      nosaltres: 'Llegim la sala en temps real',
      emoji: '👀',
    },
    {
      altres: '"Estuvo bien... nada especial"',
      nosaltres: '"Encara en parlen després de mesos"',
      emoji: '✨',
    },
  ];

  return (
    <section className="py-20 bg-black">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl font-black text-white"
          >
            Event normal
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500">
              vs Event Òrbita
            </span>
          </motion.h2>
        </div>

        {/* Comparativa */}
        <div className="space-y-6">
          {diferencies.map((dif, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center"
            >
              {/* Altres */}
              <div className="bg-red-950/30 border border-red-900/30 rounded-2xl p-4 text-right">
                <p className="text-white/60 line-through">{dif.altres}</p>
              </div>

              {/* Emoji */}
              <div className="text-3xl">{dif.emoji}</div>

              {/* Nosaltres */}
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4">
                <p className="text-amber-200 font-medium">{dif.nosaltres}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 CAPÍTOL 6: EL PRIMER PAS
// CTA càlid, no agressiu. Una invitació.
// ═══════════════════════════════════════════════════════════════════════════════

function ElPrimerPas() {
  return (
    <section className="py-20 bg-gradient-to-b from-black via-neutral-950 to-black">
      <div className="max-w-2xl mx-auto px-6 text-center">
        {/* Emoji animat */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-7xl mb-6"
        >
          ✨
        </motion.div>

        {/* Títol */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl sm:text-5xl font-black text-white mb-4"
        >
          Tens una data
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500">
            al cap?
          </span>
        </motion.h2>

        {/* Subtítol */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-white/60 text-lg mb-8"
        >
          Explica'ns què imagines.
          <br />
          <span className="text-white/80">Et responem en menys de 2 hores. Sense compromís.</span>
        </motion.p>

        {/* Botons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* WhatsApp */}
          <motion.a
            href={`https://wa.me/${CONFIG.whatsapp}?text=Hola!%20Vull%20informació%20sobre%20els%20vostres%20serveis`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-[#25D366] rounded-full text-white font-bold text-lg shadow-lg shadow-[#25D366]/30"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp directe
          </motion.a>

          {/* Formulari */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/contacto"
              className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full text-black font-bold text-lg"
            >
              ✉️ Formulari de contacte
            </Link>
          </motion.div>
        </div>

        {/* Telèfon */}
        <motion.a
          href={`tel:${CONFIG.whatsapp}`}
          whileHover={{ scale: 1.02 }}
          className="inline-flex items-center gap-2 mt-6 text-white/60 hover:text-white transition-colors"
        >
          📞 {CONFIG.phone}
        </motion.a>

        {/* Trust badge */}
        <div className="flex flex-wrap justify-center gap-4 mt-10 text-white/40 text-sm">
          <span>2+ anys en el sector</span>
          <span>•</span>
          <span>BCN + Girona</span>
          <span>•</span>
          <span>2h resposta</span>
        </div>

        {/* Mini testimoni REAL */}
        <p className="text-white/30 text-sm mt-6 italic">
          "Van transformar el nostre casament en una experiència màgica inoblidable."
          <br />
          — Lorena i Carles
        </p>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🟢 WHATSAPP FLOTANT
// ═══════════════════════════════════════════════════════════════════════════════

function WhatsAppFloat() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          href={`https://wa.me/${CONFIG.whatsapp}?text=Hola!%20Vull%20informació`}
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center shadow-xl shadow-[#25D366]/40"
        >
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          {/* Pulse */}
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
        </motion.a>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ✨ CURSOR MÀGIC (només desktop)
// ═══════════════════════════════════════════════════════════════════════════════

function MagicCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Només activar en desktop
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024 && !('ontouchstart' in window));
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    if (isDesktop) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('resize', checkDesktop);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDesktop]);

  if (!isDesktop) return null;

  return (
    <motion.div
      className="fixed w-4 h-4 rounded-full bg-amber-400/50 pointer-events-none z-[9999] mix-blend-screen"
      animate={{ x: position.x - 8, y: position.y - 8 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎆 PARTÍCULES DE FONS
// ═══════════════════════════════════════════════════════════════════════════════

function BackgroundParticles() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; delay: number; duration: number; size: number }>>([]);

  useEffect(() => {
    // Crear partícules només un cop
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 15 + Math.random() * 10,
      size: 2 + Math.random() * 4,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-amber-400/20"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [window.innerHeight + 50, -50],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}
