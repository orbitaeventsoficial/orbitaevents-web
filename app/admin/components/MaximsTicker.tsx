'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ADMIN_ECONOMY_MAXIMS } from '@/lib/constants/admin';

/**
 * Ticker de màximes d'Economia (#1392): brúixola de gestió sempre visible al top de TOTES
 * les pàgines admin (muntat al shell). NO distreu: la frase és ESTÀTICA molts segons i el
 * canvi és una fosa d'opacitat molt progressiva i lenta — zero translació, res es desplaça,
 * l'ull no persegueix res. Es pausa en hover; respecta `prefers-reduced-motion` (canvi net).
 * Presentacional: les frases són font única a `ADMIN_ECONOMY_MAXIMS` (constants).
 */
const HOLD_MS = 11000;     // estàtic llarg abans de fondre a la següent
const FADE_S = 2.8;        // fosa molt suau i lenta (crossfade solapat, sense buit)

export default function MaximsTicker() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % ADMIN_ECONOMY_MAXIMS.length);
    }, HOLD_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <div
      className="ap-maxims"
      role="note"
      aria-label="Màximes d'Economia"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span className="ap-maxims-mark ap-maxims-mark--left" aria-hidden="true">✦</span>
      <div className="ap-maxims-viewport">
        {/* Sense mode="wait": la frase vella i la nova se superposen (position absolute al CSS)
            i fan un crossfade real — l'una s'esvaeix mentre l'altra apareix, sense buit. */}
        <AnimatePresence initial={false}>
          <motion.p
            key={index}
            className="ap-maxims-item"
            aria-live="polite"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : FADE_S, ease: 'easeInOut' }}
          >
            {ADMIN_ECONOMY_MAXIMS[index]}
          </motion.p>
        </AnimatePresence>
      </div>
      <span className="ap-maxims-mark ap-maxims-mark--right" aria-hidden="true">✦</span>
    </div>
  );
}
