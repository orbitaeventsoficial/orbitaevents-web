'use client';

import { useState, useEffect } from 'react';
import { BOOKING_DETAIL_SECTIONS } from '@/lib/constants';

export default function BookingSectionNav() {
  const [active, setActive] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: '-100px 0px -70% 0px' }
    );

    for (const { id } of BOOKING_DETAIL_SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <nav className="bd__secnav" aria-label="Seccions de la reserva">
      <div className="bd__secnav-list">
        {BOOKING_DETAIL_SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className={`bd__secbtn${active === id ? ' bd__secbtn--on' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
