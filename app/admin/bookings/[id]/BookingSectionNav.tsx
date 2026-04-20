'use client';

import { useState, useEffect } from 'react';
import { BOOKING_DETAIL_SECTIONS } from '@/lib/constants';
import { ADMIN_BOOKING_HELP_3, helpAttrs } from '@/app/admin/components/adminHelpContent';

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

    for (const { id } of BOOKING_DETAIL_SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <nav
      className="admin-booking-section-nav admin-tone-border-neutral admin-tone-bg-neutral sticky top-[60px] z-20 -mx-6 mb-3 overflow-x-auto border-b px-6 py-3 backdrop-blur"
      {...helpAttrs(ADMIN_BOOKING_HELP_3.nav.root)}
      aria-label="Seccions de la reserva"
    >
      <div className="admin-booking-section-nav-list flex gap-2">
        {BOOKING_DETAIL_SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className={`admin-booking-section-nav-item shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
              active === id
                ? 'admin-booking-section-nav-item--active admin-tone-bg-info admin-tone-text-info'
                : 'admin-tone-text-neutral hover:brightness-105'
            }`}
            {...helpAttrs(ADMIN_BOOKING_HELP_3.nav.item)}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}

