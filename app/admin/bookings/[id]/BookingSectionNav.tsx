'use client';

import { useState, useEffect } from 'react';

const SECTIONS = [
  { id: 'sec-client', label: 'Client' },
  { id: 'sec-event', label: 'Event' },
  { id: 'sec-serveis', label: 'Serveis' },
  { id: 'sec-equipament', label: 'Equipament' },
  { id: 'sec-portal', label: 'Portal' },
  { id: 'sec-finances', label: 'Finances' },
  { id: 'sec-marge', label: 'Marge' },
  { id: 'sec-documents', label: 'Documents' },
  { id: 'sec-comunicacions', label: 'Comunicacions' },
  { id: 'sec-historial', label: 'Historial' },
  { id: 'sec-galeria', label: 'Galeria' },
] as const;

export default function BookingSectionNav() {
  const [active, setActive] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: '-100px 0px -70% 0px' }
    );

    for (const { id } of SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <nav
      className="sticky top-[60px] z-20 -mx-6 mb-2 overflow-x-auto border-b border-white/10 bg-black/80 px-6 py-2 backdrop-blur"
      aria-label="Seccions de la reserva"
    >
      <div className="flex gap-1">
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
              active === id
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
