'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

type Bat = {
  id: number;
  top: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
  mid1: number;
  mid2: number;
  sway1: number;
  sway2: number;
  rotation: number;
};

type Particle = {
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
  drift: number;
  rise: number;
  blur: number;
};

function FloatingBats() {
  const [bats, setBats] = useState<Bat[]>([]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setBats(
      Array.from({ length: 3 }, (_, i) => ({
        id: i,
        top: 10 + Math.random() * 26,
        delay: Math.random() * 16,
        duration: 22 + Math.random() * 8,
        size: 14 + Math.random() * 10,
        opacity: 0.018 + Math.random() * 0.018,
        mid1: 24 + Math.random() * 18,
        mid2: 56 + Math.random() * 18,
        sway1: -16 + Math.random() * 32,
        sway2: -12 + Math.random() * 24,
        rotation: 7 + Math.random() * 8,
      }))
    );
  }, []);

  if (bats.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {bats.map((bat) => (
        <motion.div
          key={bat.id}
          className="absolute left-0 text-white"
          style={{ top: `${bat.top}%`, fontSize: bat.size, opacity: bat.opacity }}
          animate={{
            x: ['-12vw', `${bat.mid1}vw`, `${bat.mid2}vw`, '112vw'],
            y: [0, bat.sway1, bat.sway2, 0],
            rotate: [0, bat.rotation, -bat.rotation, 0],
          }}
          transition={{ duration: bat.duration, delay: bat.delay, repeat: Infinity, ease: 'linear' }}
        >
          🦇
        </motion.div>
      ))}
    </div>
  );
}

function CandleGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[1]" aria-hidden="true">
      <div className="absolute left-[8%] top-[24%] h-24 w-24 rounded-full bg-amber-500/7 blur-3xl" />
      <div className="absolute right-[12%] top-[36%] h-28 w-28 rounded-full bg-orange-500/6 blur-3xl" />
      <div className="absolute left-[20%] bottom-[18%] h-32 w-32 rounded-full bg-red-500/5 blur-3xl" />
      <div className="absolute right-[18%] bottom-[24%] h-24 w-24 rounded-full bg-amber-400/4 blur-3xl" />
      <div className="absolute left-[48%] top-[14%] h-20 w-20 rounded-full bg-orange-300/3 blur-3xl" />
    </div>
  );
}

function DustAndEmbers() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = [
      'rgba(249,115,22,0.28)',
      'rgba(180,83,9,0.18)',
      'rgba(255,255,255,0.09)',
      'rgba(245,158,11,0.16)',
      'rgba(255,214,102,0.11)',
    ];
    setParticles(
      Array.from({ length: 26 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1.2 + Math.random() * 3,
        duration: 7 + Math.random() * 10,
        delay: Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        drift: -10 + Math.random() * 20,
        rise: 18 + Math.random() * 30,
        blur: Math.random() > 0.72 ? 1 + Math.random() * 1.6 : 0,
      }))
    );
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[1]" aria-hidden="true">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            filter: p.blur ? `blur(${p.blur}px)` : undefined,
          }}
          animate={{ opacity: [0, 0.68, 0], y: [0, -p.rise, 0], x: [0, p.drift, 0], scale: [0.55, 1.16, 0.58] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function FogVeils() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute left-[-12%] top-[18%] h-44 w-[48%] rounded-full bg-white/[0.028] blur-3xl"
        animate={{ x: [0, 42, 0], y: [0, 10, 0], opacity: [0.08, 0.18, 0.08] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-[-14%] top-[30%] h-40 w-[42%] rounded-full bg-orange-100/[0.02] blur-3xl"
        animate={{ x: [0, -36, 0], y: [0, -8, 0], opacity: [0.06, 0.14, 0.06] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-[14%] top-[46%] h-36 w-[34%] rounded-full bg-white/[0.022] blur-3xl"
        animate={{ x: [0, 24, 0], y: [0, 12, 0], opacity: [0.04, 0.1, 0.04] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function LowFog() {
  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-[1] h-72" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-t from-orange-950/16 via-orange-950/10 to-transparent" />
      <motion.div
        className="absolute bottom-0 left-[-12%] h-32 w-[62%] rounded-full bg-white/[0.075] blur-3xl"
        animate={{ x: [0, 32, 0], opacity: [0.52, 0.76, 0.52] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-3 right-[-10%] h-32 w-[56%] rounded-full bg-orange-100/[0.06] blur-3xl"
        animate={{ x: [0, -28, 0], opacity: [0.38, 0.62, 0.38] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-7 left-[18%] h-28 w-[46%] rounded-full bg-white/[0.055] blur-3xl"
        animate={{ x: [0, 18, 0], opacity: [0.32, 0.5, 0.32] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-6 right-[12%] h-24 w-[36%] rounded-full bg-orange-100/[0.045] blur-3xl"
        animate={{ x: [0, -16, 0], opacity: [0.24, 0.42, 0.24] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-12 left-[42%] h-20 w-[30%] rounded-full bg-white/[0.04] blur-3xl"
        animate={{ x: [0, 14, 0], opacity: [0.18, 0.3, 0.18] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-16 left-[8%] h-24 w-[34%] rounded-full bg-white/[0.045] blur-3xl"
        animate={{ x: [0, 20, 0], opacity: [0.22, 0.4, 0.22] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-14 right-[4%] h-22 w-[30%] rounded-full bg-orange-50/[0.038] blur-3xl"
        animate={{ x: [0, -18, 0], opacity: [0.18, 0.34, 0.18] }}
        transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

export default function HalloweenAtmosphere() {
  return (
    <>
      <FloatingBats />
      <CandleGlow />
      <DustAndEmbers />
      <FogVeils />
      <LowFog />
    </>
  );
}
