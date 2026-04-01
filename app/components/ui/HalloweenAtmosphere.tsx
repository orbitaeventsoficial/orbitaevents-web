"use client";

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  buildHalloweenBrokenFilamentGeometry,
  buildHalloweenCobwebGeometry,
  buildHalloweenCobwebLayer,
  buildHalloweenFilamentLayer,
  getHalloweenCobwebLeftPercent,
  getHalloweenCobwebMirrorClass,
  getHalloweenCobwebTopPercent,
  getHalloweenCobwebTransformOrigin,
  type HalloweenCobwebCoverage,
  type HalloweenCobwebGeometry,
  type HalloweenCobwebLayerItem,
  type HalloweenFilamentItem,
} from '@/lib/constants/halloween-atmosphere';

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

type Spiral = {
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  rotateEnd: number;
};

function CobwebSvg({ coverage, className }: { coverage: HalloweenCobwebCoverage; className?: string }) {
  const geometry: HalloweenCobwebGeometry = buildHalloweenCobwebGeometry(coverage);

  return (
    <svg viewBox={geometry.viewBox} fill="none" className={className}>
      {geometry.radialLines.map((path, index) => (
        <path key={`radial-${index}`} d={path} stroke="currentColor" strokeWidth="0.96" strokeLinecap="round" />
      ))}
      {geometry.ringLines.map((path, index) => (
        <path key={`ring-${index}`} d={path} stroke="currentColor" strokeWidth="0.62" strokeLinecap="round" />
      ))}
      {geometry.hangingThread ? (
        <path d={geometry.hangingThread} stroke="currentColor" strokeWidth="0.56" strokeLinecap="round" strokeDasharray="1.4 2.2" />
      ) : null}
      {geometry.spider ? (
        <g>
          <ellipse cx={geometry.spider.bodyCx} cy={geometry.spider.bodyCy} rx={geometry.spider.bodyRx} ry={geometry.spider.bodyRy} fill="currentColor" />
          <circle cx={geometry.spider.headCx} cy={geometry.spider.headCy} r={geometry.spider.headR} fill="currentColor" />
          <path d={geometry.spider.legsPath} stroke="currentColor" strokeWidth="0.62" strokeLinecap="round" />
        </g>
      ) : null}
    </svg>
  );
}

function BrokenFilamentSvg({ curve, tension, forkBias, className }: { curve: number; tension: number; forkBias: number; className?: string }) {
  const paths = buildHalloweenBrokenFilamentGeometry('top-left', curve, 0, tension, forkBias);

  return (
    <svg viewBox="0 0 120 120" fill="none" className={className}>
      {paths.map((path, index) => (
        <path key={index} d={path} stroke="currentColor" strokeWidth={index === 0 ? '0.9' : '0.72'} strokeLinecap="round" />
      ))}
    </svg>
  );
}

function FloatingCobwebs() {
  const [webs, setWebs] = useState<HalloweenCobwebLayerItem[]>([]);
  const [filaments, setFilaments] = useState<HalloweenFilamentItem[]>([]);

  useEffect(() => {
    const updateLayer = () => {
      const viewportWidth = window.innerWidth || 1440;
      setWebs(buildHalloweenCobwebLayer(viewportWidth));
      setFilaments(buildHalloweenFilamentLayer(91, viewportWidth, viewportWidth < 768 ? [2, 3] : [4, 6], 'page'));
    };

    updateLayer();
    window.addEventListener('resize', updateLayer);
    return () => window.removeEventListener('resize', updateLayer);
  }, []);

  if (webs.length === 0 && filaments.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden" aria-hidden="true">
      {webs.map((web) => (
        <motion.div
          key={web.id}
          className="absolute"
          style={{
            top: getHalloweenCobwebTopPercent(web.topRatio),
            left: getHalloweenCobwebLeftPercent(web.leftRatio),
            width: web.width,
            height: web.height,
            opacity: web.opacity,
            transformOrigin: getHalloweenCobwebTransformOrigin(web.anchor),
          }}
          animate={{ x: [0, web.driftX, 0], y: [0, web.driftY, 0], rotate: [web.rotateDeg, web.rotateDeg + web.driftX * 0.14, web.rotateDeg] }}
          transition={{ duration: 9.5 + Math.abs(web.driftX) * 0.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <CobwebSvg coverage={web.coverage} className={`h-full w-full ${getHalloweenCobwebMirrorClass(web.anchor)} text-purple-100/84`} />
        </motion.div>
      ))}
      {filaments.map((filament) => (
        <motion.div
          key={filament.id}
          className="absolute"
          style={{
            top: `${filament.topRatio * 100}%`,
            left: `${filament.leftRatio * 100}%`,
            width: filament.width,
            height: filament.height,
            opacity: filament.opacity,
            transform: `${filament.mirror ? 'scaleX(-1) ' : ''}rotate(${filament.rotateDeg}deg)`,
          }}
          animate={{
            x: [0, filament.swayX * 0.22, filament.swayX * 0.82, filament.swayX * 0.34, 0],
            y: [0, Math.abs(filament.swayY) * 0.36, Math.abs(filament.swayY) * 0.92, Math.abs(filament.swayY) * 0.48, 0],
            rotate: [0, filament.swayX * 0.05, filament.swayX * 0.14, filament.swayX * 0.07, 0],
          }}
          transition={{ duration: 5.8 + Math.abs(filament.swayX) * 0.1, repeat: Infinity, ease: 'easeInOut' }}
        >
          <BrokenFilamentSvg curve={filament.curve} tension={filament.tension} forkBias={filament.forkBias} className="h-full w-full text-purple-100/58" />
        </motion.div>
      ))}
    </div>
  );
}

function FloatingBats() {
  const [bats, setBats] = useState<Bat[]>([]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setBats(
      Array.from({ length: 4 }, (_, i) => ({
        id: i,
        top: 8 + Math.random() * 30,
        delay: Math.random() * 20,
        duration: 20 + Math.random() * 10,
        size: 18 + Math.random() * 14,
        opacity: 0.024 + Math.random() * 0.02,
        mid1: 20 + Math.random() * 22,
        mid2: 52 + Math.random() * 22,
        sway1: -20 + Math.random() * 40,
        sway2: -16 + Math.random() * 32,
        rotation: 10 + Math.random() * 12,
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
          animate={{ x: ['-14vw', `${bat.mid1}vw`, `${bat.mid2}vw`, '114vw'], y: [0, bat.sway1, bat.sway2, 0], rotate: [0, bat.rotation, -bat.rotation, 0] }}
          transition={{ duration: bat.duration, delay: bat.delay, repeat: Infinity, ease: 'linear' }}
        >
          🦇
        </motion.div>
      ))}
    </div>
  );
}

function MoonlightGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[1]" aria-hidden="true">
      <div className="absolute left-[42%] top-[6%] h-32 w-32 rounded-full bg-purple-300/[0.045] blur-3xl" />
      <div className="absolute left-[8%] top-[22%] h-28 w-28 rounded-full bg-violet-500/[0.05] blur-3xl" />
      <div className="absolute right-[10%] top-[32%] h-32 w-32 rounded-full bg-indigo-500/[0.04] blur-3xl" />
      <div className="absolute left-[22%] bottom-[20%] h-24 w-24 rounded-full bg-teal-400/[0.035] blur-3xl" />
      <div className="absolute right-[18%] bottom-[28%] h-28 w-28 rounded-full bg-emerald-400/[0.025] blur-3xl" />
      <div className="absolute left-[52%] top-[48%] h-20 w-20 rounded-full bg-orange-400/[0.02] blur-3xl" />
    </div>
  );
}

function SpectralParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['rgba(139,92,246,0.24)', 'rgba(99,102,241,0.18)', 'rgba(45,212,191,0.16)', 'rgba(74,222,128,0.12)', 'rgba(249,115,22,0.14)', 'rgba(200,180,255,0.10)', 'rgba(255,255,255,0.08)'];
    setParticles(
      Array.from({ length: 24 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 3.2,
        duration: 8 + Math.random() * 12,
        delay: Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        drift: -12 + Math.random() * 24,
        rise: 16 + Math.random() * 34,
        blur: Math.random() > 0.65 ? 1 + Math.random() * 2 : 0,
      }))
    );
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[1]" aria-hidden="true">
      {particles.map((particle, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            filter: particle.blur ? `blur(${particle.blur}px)` : undefined,
          }}
          animate={{ opacity: [0, 0.7, 0], y: [0, -particle.rise, 0], x: [0, particle.drift, 0], scale: [0.5, 1.2, 0.5] }}
          transition={{ duration: particle.duration, delay: particle.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function SpiralMotes() {
  const [spirals, setSpirals] = useState<Spiral[]>([]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setSpirals(
      Array.from({ length: 6 }, () => ({
        left: Math.random() * 100,
        top: 10 + Math.random() * 80,
        size: 8 + Math.random() * 16,
        duration: 14 + Math.random() * 12,
        delay: Math.random() * 14,
        opacity: 0.03 + Math.random() * 0.025,
        rotateEnd: 360 + Math.random() * 360,
      }))
    );
  }, []);

  if (spirals.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[1]" aria-hidden="true">
      {spirals.map((spiral, index) => (
        <motion.div key={index} className="absolute" style={{ left: `${spiral.left}%`, top: `${spiral.top}%` }} animate={{ opacity: [0, spiral.opacity, 0], rotate: [0, spiral.rotateEnd], y: [0, -20 - Math.random() * 30, 0] }} transition={{ duration: spiral.duration, delay: spiral.delay, repeat: Infinity, ease: 'easeInOut' }}>
          <svg width={spiral.size} height={spiral.size} viewBox="0 0 24 24" fill="none">
            <path d="M12 2C12 2 14 6 14 8C14 10 12 12 12 12C12 12 10 10 10 8C10 6 12 2 12 2Z M12 12C12 12 16 14 18 14C20 14 22 12 22 12C22 12 20 10 18 10C16 10 12 12 12 12Z M12 12C12 12 10 16 10 18C10 20 12 22 12 22C12 22 14 20 14 18C14 16 12 12 12 12Z M12 12C12 12 8 10 6 10C4 10 2 12 2 12C2 12 4 14 6 14C8 14 12 12 12 12Z" stroke="rgba(168,130,255,0.6)" strokeWidth="0.5" fill="none" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

function FogVeils() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden="true">
      <motion.div className="absolute left-[-10%] top-[10%] h-56 w-[58%] rounded-full bg-purple-200/[0.14] blur-[96px]" animate={{ x: [0, 54, 0], y: [0, 18, 0], opacity: [0.26, 0.5, 0.26] }} transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute right-[-14%] top-[24%] h-56 w-[54%] rounded-full bg-indigo-200/[0.13] blur-[104px]" animate={{ x: [0, -46, 0], y: [0, -12, 0], opacity: [0.24, 0.46, 0.24] }} transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute left-[10%] top-[40%] h-52 w-[48%] rounded-full bg-violet-100/[0.12] blur-[94px]" animate={{ x: [0, 30, 0], y: [0, 16, 0], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 21, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute right-[2%] top-[54%] h-44 w-[38%] rounded-full bg-slate-100/[0.09] blur-[88px]" animate={{ x: [0, -26, 0], y: [0, 10, 0], opacity: [0.18, 0.34, 0.18] }} transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }} />
    </div>
  );
}

function LowFog() {
  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-[1] h-[36vh] min-h-[280px]" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-t from-purple-950/22 via-indigo-950/12 to-transparent" />
      <motion.div className="absolute bottom-[-4%] left-[-10%] h-44 w-[66%] rounded-full bg-white/[0.18] blur-[92px]" animate={{ x: [0, 42, 0], opacity: [0.56, 0.92, 0.56] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute bottom-[2%] right-[-10%] h-40 w-[62%] rounded-full bg-violet-100/[0.16] blur-[90px]" animate={{ x: [0, -34, 0], opacity: [0.5, 0.84, 0.5] }} transition={{ duration: 21, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute bottom-[9%] left-[18%] h-36 w-[52%] rounded-full bg-purple-100/[0.14] blur-[84px]" animate={{ x: [0, 24, 0], opacity: [0.42, 0.72, 0.42] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute bottom-[14%] right-[8%] h-32 w-[40%] rounded-full bg-slate-100/[0.12] blur-[80px]" animate={{ x: [0, -20, 0], opacity: [0.34, 0.62, 0.34] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute bottom-[22%] left-[42%] h-24 w-[28%] rounded-full bg-indigo-100/[0.1] blur-[74px]" animate={{ x: [0, 18, 0], opacity: [0.28, 0.52, 0.28] }} transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }} />
    </div>
  );
}

function FastFrontClouds() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[4] overflow-hidden" aria-hidden="true">
      <motion.div className="absolute left-[-24%] top-[8%] h-28 w-[54%] rounded-full bg-white/[0.16] blur-[74px]" animate={{ x: ['0vw', '132vw'], opacity: [0, 0.82, 0.24, 0] }} transition={{ duration: 6.8, repeat: Infinity, ease: 'linear' }} />
      <motion.div className="absolute left-[-30%] top-[28%] h-24 w-[48%] rounded-full bg-violet-100/[0.13] blur-[70px]" animate={{ x: ['0vw', '138vw'], opacity: [0, 0.76, 0.18, 0] }} transition={{ duration: 7.4, delay: 1.2, repeat: Infinity, ease: 'linear' }} />
      <motion.div className="absolute left-[-22%] top-[58%] h-20 w-[44%] rounded-full bg-slate-100/[0.11] blur-[66px]" animate={{ x: ['0vw', '130vw'], opacity: [0, 0.68, 0.16, 0] }} transition={{ duration: 6.2, delay: 2.1, repeat: Infinity, ease: 'linear' }} />
    </div>
  );
}

function TwistedBranches() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <svg className="absolute -left-4 top-[12%] h-[40vh] w-auto opacity-[0.035]" viewBox="0 0 120 300" fill="none">
        <path d="M60 300 C60 260 45 240 40 220 C35 200 50 180 42 160 C34 140 25 130 20 110 C15 90 30 70 22 50 C14 30 10 20 8 0" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <path d="M42 160 C52 148 65 140 80 125 C90 114 95 100 100 85" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 110 C10 100 0 95 -5 80" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M40 220 C55 210 70 205 85 195" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M22 50 C32 42 45 38 55 28" stroke="white" strokeWidth="1" strokeLinecap="round" />
      </svg>
      <svg className="absolute -right-4 top-[18%] h-[36vh] w-auto opacity-[0.03]" viewBox="0 0 120 280" fill="none" style={{ transform: 'scaleX(-1)' }}>
        <path d="M60 280 C60 245 50 230 45 210 C40 190 55 170 48 150 C41 130 30 120 25 100 C20 80 35 65 28 45 C21 25 15 15 12 0" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M48 150 C58 138 72 130 88 118" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M25 100 C15 90 5 85 -5 72" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M28 45 C40 36 52 30 62 20" stroke="white" strokeWidth="1" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function HalloweenAtmosphere() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <TwistedBranches />
      <FloatingCobwebs />
      <FloatingBats />
      <MoonlightGlow />
      <SpectralParticles />
      <SpiralMotes />
      <FogVeils />
      <LowFog />
      <FastFrontClouds />
    </>
  );
}

