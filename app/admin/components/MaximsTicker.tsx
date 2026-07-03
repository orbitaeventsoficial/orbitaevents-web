'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ADMIN_ECONOMY_MAXIMS } from '@/lib/constants/admin';

/**
 * Ticker de màximes d'Economia (#1391): brúixola de gestió sempre visible al top de TOTES
 * les pàgines admin (muntat al shell). Carrousel real: la frase surt lliscant per l'esquerra
 * i la següent entra per la dreta. Es pausa en hover i pot avançar-se a mà; si l'usuari
 * prefereix menys moviment (`useReducedMotion`) el lliscament es torna un fos suau.
 * Presentacional: les frases són font única a `ADMIN_ECONOMY_MAXIMS` (constants), no aquí.
 */
const ROTATE_MS = 6000;

export default function MaximsTicker() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % ADMIN_ECONOMY_MAXIMS.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const next = () => setIndex((prev) => (prev + 1) % ADMIN_ECONOMY_MAXIMS.length);

  const variants = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { x: '110%', opacity: 0 },
        animate: { x: '0%', opacity: 1 },
        exit: { x: '-110%', opacity: 0 },
      };

  return (
    <div
      className="ap-maxims"
      role="note"
      aria-label="Màximes d'Economia"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span className="ap-maxims-eyebrow" aria-hidden="true">Brúixola</span>
      <div className="ap-maxims-viewport">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={index}
            className="ap-maxims-text"
            aria-live="polite"
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{ duration: reduce ? 0.25 : 0.5, ease: 'easeInOut' }}
          >
            {ADMIN_ECONOMY_MAXIMS[index]}
          </motion.p>
        </AnimatePresence>
      </div>
      <button
        type="button"
        className="ap-maxims-next"
        onClick={next}
        aria-label="Següent màxima"
        title="Següent màxima"
      >
        →
      </button>
    </div>
  );
}
