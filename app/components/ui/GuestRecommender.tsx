"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Link } from '@/lib/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Users, ChevronRight, Star, Sparkles } from 'lucide-react';
import type { PackDefinition } from '@/config/packs-config';

interface GuestRecommenderProps {
  packs: PackDefinition[];
  service: string;
  labels: {
    question: string;
    people: string;
    recommended: string;
    configure: string;
    from: string;
  };
}

export default function GuestRecommender({ packs, service, labels }: GuestRecommenderProps) {
  const [numGuests, setNumGuests] = useState(60);
  const [hasInteracted, setHasInteracted] = useState(false);
  const reduceMotion = useReducedMotion();
  const recommendRef = useRef<HTMLDivElement>(null);
  const prevPackId = useRef<string | null>(null);

  const recommendedPack = useMemo(() => {
    const eligible = packs.filter((pack) => {
      const min = pack.capacidadMinima ?? 0;
      const max = pack.capacidadMaxima ?? Infinity;
      return numGuests >= min && numGuests <= max;
    });
    if (eligible.length === 0) {
      return packs.find((p) => p.popular) || packs[Math.floor(packs.length / 2)] || null;
    }
    if (eligible.length === 1) {
      return eligible[0];
    }
    // Multiple eligible: best fit = closest to midpoint of capacity range
    return eligible.reduce((best, pack) => {
      const bestMid = ((best.capacidadMinima ?? 0) + (best.capacidadMaxima ?? 300)) / 2;
      const packMid = ((pack.capacidadMinima ?? 0) + (pack.capacidadMaxima ?? 300)) / 2;
      return Math.abs(numGuests - packMid) < Math.abs(numGuests - bestMid) ? pack : best;
    });
  }, [packs, numGuests]);

  // Auto-center when recommendation changes after user interaction
  useEffect(() => {
    if (!recommendedPack || !hasInteracted) return;
    if (prevPackId.current && prevPackId.current !== recommendedPack.id) {
      requestAnimationFrame(() => {
        recommendRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
    prevPackId.current = recommendedPack.id;
  }, [recommendedPack, hasInteracted]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNumGuests(parseInt(e.target.value));
    if (!hasInteracted) setHasInteracted(true);
  }, [hasInteracted]);

  if (packs.length === 0) return null;

  // Calculate slider fill percentage for custom styling
  const fillPercent = ((numGuests - 20) / (300 - 20)) * 100;

  return (
    <section className="max-w-2xl mx-auto px-4">
      <div className="p-8 md:p-10 rounded-3xl bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-oe-gold/10 border border-oe-gold/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-oe-gold" />
          </div>
          <h3 className="text-xl font-bold text-white">{labels.question}</h3>
        </div>

        {/* Number display */}
        <div className="text-center mb-8">
          <motion.div
            key={numGuests}
            initial={reduceMotion ? false : { scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="text-7xl font-black bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent"
          >
            {numGuests}
          </motion.div>
          <div className="text-white/40 mt-1 text-sm">{labels.people}</div>
        </div>

        {/* Slider */}
        <div className="space-y-3 mb-8">
          <div className="relative">
            <div className="absolute top-1/2 -translate-y-1/2 left-0 h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 pointer-events-none transition-all" style={{ width: `${fillPercent}%` }} />
            <input
              type="range"
              min="20"
              max="300"
              step="5"
              value={numGuests}
              onChange={handleSliderChange}
              className="relative w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 slider-custom z-10"
              aria-label={labels.question}
            />
          </div>
          <div className="flex justify-between text-xs text-white/30">
            <span>20 {labels.people}</span>
            <span>300 {labels.people}</span>
          </div>
        </div>

        {/* Recommendation */}
        <AnimatePresence mode="wait">
          {recommendedPack && (
            <motion.div
              ref={recommendRef}
              key={recommendedPack.id}
              initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="group relative p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/30 hover:border-amber-500/60 hover:shadow-[0_8px_32px_rgba(245,158,11,0.15)] transition-all duration-300 overflow-hidden"
            >
              {/* Subtle glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-orange-500/0 group-hover:from-amber-500/5 group-hover:to-orange-500/5 transition-all duration-500 rounded-2xl" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-amber-400 group-hover:animate-pulse" />
                  <span className="text-sm font-bold text-oe-gold">{labels.recommended}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xl font-bold text-white group-hover:text-oe-gold transition-colors">{recommendedPack.name}</h4>
                    {recommendedPack.tagline && (
                      <p className="text-white/50 text-sm">{recommendedPack.tagline}</p>
                    )}
                    {recommendedPack.duration && (
                      <p className="text-white/40 text-xs">⏰ {recommendedPack.duration}</p>
                    )}
                    <p className="text-3xl font-black text-oe-gold pt-1">{recommendedPack.price}</p>
                  </div>
                  <Link
                    href={`/configurador?service=${service}&packId=${recommendedPack.id}&guests=${numGuests}`}
                    className="shrink-0 inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-xl hover:scale-105 active:scale-100 transition-transform shadow-lg shadow-orange-500/25 group-hover:shadow-orange-500/40"
                  >
                    {labels.configure}
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
