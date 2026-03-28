'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Floating bats across the page
function FloatingBats() {
  const [mounted, setMounted] = useState(false);
  const [bats, setBats] = useState<Array<{ id: number; left: number; delay: number; duration: number; size: number }>>([]);

  useEffect(() => {
    setMounted(true);
    const shouldReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (shouldReduce) return;
    setBats(Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: 5 + Math.random() * 90,
      delay: Math.random() * 8,
      duration: 12 + Math.random() * 8,
      size: 16 + Math.random() * 12,
    })));
  }, []);

  if (!mounted || bats.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden" aria-hidden="true">
      {bats.map((bat) => (
        <motion.div
          key={bat.id}
          className="absolute text-white/[0.07]"
          style={{ left: `${bat.left}%`, fontSize: bat.size }}
          animate={{
            y: ['-10vh', '110vh'],
            x: [0, Math.sin(bat.id) * 80, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: bat.duration,
            delay: bat.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          🦇
        </motion.div>
      ))}
    </div>
  );
}

// Fog/mist effect at the bottom of sections
function FogLayer() {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none z-[1]" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-t from-orange-950/10 via-orange-950/5 to-transparent" />
    </div>
  );
}

// Spooky particles (dust, embers)
function SpookyParticles() {
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Array<{ left: number; top: number; size: number; duration: number; delay: number; color: string }>>([]);

  useEffect(() => {
    setMounted(true);
    const shouldReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (shouldReduce) return;
    const colors = ['rgba(249,115,22,0.4)', 'rgba(239,68,68,0.3)', 'rgba(255,255,255,0.15)', 'rgba(34,197,94,0.2)'];
    setParticles(Array.from({ length: 25 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 1.5 + Math.random() * 3,
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
    })));
  }, []);

  if (!mounted || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[1]" aria-hidden="true">
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
          }}
          animate={{
            opacity: [0, 0.7, 0],
            y: [0, -40, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export default function HalloweenAtmosphere() {
  return (
    <>
      <FloatingBats />
      <SpookyParticles />
      <FogLayer />
    </>
  );
}
