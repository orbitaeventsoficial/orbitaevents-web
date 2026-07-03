'use client';

import { useState, useEffect } from 'react';
import { ADMIN_ECONOMY_MAXIMS } from '@/lib/constants/admin';

/**
 * Ticker de màximes d'Economia (#1390): brúixola de gestió sempre visible al top del
 * dashboard i d'Economia. Roten soles cada uns segons amb un fade net; si l'usuari prefereix
 * menys moviment (`prefers-reduced-motion`) es queden fixes i pot avançar-les amb el botó.
 * Presentacional: les frases són font única a `ADMIN_ECONOMY_MAXIMS` (constants), no aquí.
 */
const ROTATE_MS = 7000;

export default function MaximsTicker() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || paused) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % ADMIN_ECONOMY_MAXIMS.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const next = () => setIndex((prev) => (prev + 1) % ADMIN_ECONOMY_MAXIMS.length);

  return (
    <div
      className="ap-maxims"
      role="note"
      aria-label="Màximes d'Economia"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span className="ap-maxims-eyebrow" aria-hidden="true">Brúixola</span>
      <p key={index} className="ap-maxims-text" aria-live="polite">
        {ADMIN_ECONOMY_MAXIMS[index]}
      </p>
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
