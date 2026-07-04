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
const HOLD_MS = 9000;      // estàtic llarg abans de fondre a la següent
const FADE_S = 1.8;        // fosa molt progressiva

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
      <span className="ap-maxims-mark" aria-hidden="true">✦</span>
      <div className="ap-maxims-viewport">
        <AnimatePresence mode="wait">
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
    </div>
  );
}
