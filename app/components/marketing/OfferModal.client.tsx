"use client";

import { useEffect, useRef, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

const LS_KEY = 'oe.offer.v1';     // cambia versión si quieres forzar reaparición
const SUPPRESS_DAYS = 7;          // días sin mostrar tras cerrar
const SHOW_DELAY_MS = 25000;       // retardo antes de aparecer

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

function shouldShow(): boolean {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return true;
    const until = new Date(raw).getTime();
    return Date.now() > until;
  } catch {
    return true;
  }
}

export default function OfferModal() {
  const t = useTranslations('offerModal');
  const [open, setOpen] = useState(false);
  const firstBtnRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Respeta reduce motion
    const _reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const t = setTimeout(() => {
      if (typeof window === 'undefined') return;
      if (shouldShow()) setOpen(true);
    }, SHOW_DELAY_MS);

    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;

    // foco inicial
    firstBtnRef.current?.focus();

    // cierre con ESC y click fuera
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'Tab') {
        // Focus trap muy básico
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          'a,button,textarea,input,select,[tabindex]:not([tabindex="-1"])'
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  function handleClose() {
    try {
      localStorage.setItem(LS_KEY, daysFromNow(SUPPRESS_DAYS));
    } catch {}
    setOpen(false);
  }

  function handleAccept() {
    try {
      localStorage.setItem(LS_KEY, daysFromNow(SUPPRESS_DAYS));
    } catch {}
    window.location.href = '/contacto?promo=LAST10';
  }

  if (!open) return null;

  return (
    <div
      aria-hidden={!open}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('ariaLabel')}
        className="relative z-[101] m-4 w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-gold)] animate-breathe"
      >
        <button
          onClick={handleClose}
          aria-label={t('close')}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/70 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-oe-gold/30 bg-oe-gold/10 px-3 py-1 text-xs font-semibold text-oe-gold">
          <Sparkles className="h-4 w-4" />
          {t('badge')}
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold">
          {t('title')} <span className="gradient-text">{t('discount')}</span>
        </h2>
        <p className="mt-3 text-white/70">
          {t('description')}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            ref={firstBtnRef}
            onClick={handleAccept}
            className="oe-btn-gold w-full sm:w-auto"
          >
            {t('cta')}
          </button>
          <button
            onClick={handleClose}
            className="w-full sm:w-auto rounded-xl border border-[var(--border)] px-6 py-3 text-white/90 hover:text-white"
          >
            {t('later')}
          </button>
        </div>

        <div className="mt-4 text-xs text-white/40">
          {t('code')}
        </div>
      </div>
    </div>
  );
}
