'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';

const FAB_ITEMS = [
  { icon: '👥', label: 'Entrada ràpida', href: '/admin/leads' },
  { icon: '📋', label: 'Reserva', href: '/admin/bookings/new' },
  { icon: '📝', label: 'Tasca', href: '/admin/tasks/new' },
  { icon: '📄', label: 'Pressupost', href: '/admin/presupuestos' },
] as const;

export default function FloatingAddButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Tancar amb Escape
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open]);

  return (
    <div ref={ref} className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-[90] flex flex-col items-end gap-2">
      {/* Opcions expandides */}
      {open && (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
          {FAB_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-black/80 backdrop-blur-md px-4 py-2.5 text-sm font-medium text-white/90 shadow-lg transition-all hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Botó principal */}
      <button
        type="button"
        onClick={toggle}
        aria-label="Accions ràpides"
        aria-expanded={open}
        className={`flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all active:scale-95 ${
          open
            ? 'bg-white/20 rotate-45'
            : 'bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400'
        }`}
      >
        <span className="text-2xl text-white font-bold transition-transform">+</span>
      </button>
    </div>
  );
}
