'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

function FloatingBats() {
  const [bats, setBats] = useState<Array<{ id: number; left: number; delay: number; duration: number; size: number }>>([]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setBats(Array.from({ length: 5 }, (_, i) => ({
      id: i,
      left: 8 + Math.random() * 84,
      delay: Math.random() * 10,
      duration: 16 + Math.random() * 8,
      size: 14 + Math.random() * 10,
    })));
  }, []);

  if (bats.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden="true">
      {bats.map((bat) => (
        <motion.div
          key={bat.id}
          className="absolute text-white/[0.05]"
          style={{ left: `${bat.left}%`, fontSize: bat.size }}
          animate={{ y: ['-12vh', '112vh'], x: [0, Math.sin(bat.id + 1) * 60, 0], rotate: [0, 8, -8, 0] }}
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
      <div className="absolute left-[8%] top-[24%] h-24 w-24 rounded-full bg-amber-500/8 blur-3xl" />
      <div className="absolute right-[12%] top-[36%] h-28 w-28 rounded-full bg-orange-500/7 blur-3xl" />
      <div className="absolute left-[20%] bottom-[18%] h-32 w-32 rounded-full bg-red-500/6 blur-3xl" />
    </div>
  );
}

function DustAndEmbers() {
  const [particles, setParticles] = useState<Array<{ left: number; top: number; size: number; duration: number; delay: number; color: string }>>([]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['rgba(249,115,22,0.32)', 'rgba(180,83,9,0.22)', 'rgba(255,255,255,0.12)', 'rgba(245,158,11,0.18)'];
    setParticles(Array.from({ length: 18 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 1.5 + Math.random() * 3,
      duration: 6 + Math.random() * 8,
      delay: Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
    })));
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[1]" aria-hidden="true">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size, backgroundColor: p.color }}
          animate={{ opacity: [0, 0.75, 0], y: [0, -28, 0], x: [0, 6, 0], scale: [0.6, 1.2, 0.6] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function LowFog() {
  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-[1] h-40" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-t from-orange-950/10 via-orange-950/6 to-transparent" />
      <div className="absolute bottom-0 left-[-10%] h-24 w-[55%] rounded-full bg-white/[0.04] blur-3xl" />
      <div className="absolute bottom-2 right-[-8%] h-24 w-[48%] rounded-full bg-orange-200/[0.03] blur-3xl" />
    </div>
  );
}

export default function HalloweenAtmosphere() {
  return (
    <>
      <CandleGlow />
      <FloatingBats />
      <DustAndEmbers />
      <LowFog />
    </>
  );
}
