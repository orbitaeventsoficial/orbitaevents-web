'use client';

// app/components/ui/ExitIntentModal.tsx
// ─────────────────────────────────────────────
// Mostra un modal quan l'usuari a punt de marxar (cursor surt per dalt del viewport)
// - Desktop only: detecta mouseleave del document
// - Una sola vegada per sessió (sessionStorage)
// - Delay mínim 3s a la pàgina abans d'activar

import { useEffect, useRef, useState } from 'react';
import WhatsAppIcon from '@/app/components/public/WhatsAppIcon';
import { WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';

const SESSION_KEY = 'exit_intent_shown';
const MIN_TIME_ON_PAGE_MS = 3000;

function trackExitIntent(action: string) {
  if (typeof window === 'undefined') return;
  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({
      event: 'cta_click',
      cta_type: action,
      cta_location: 'exit_intent_modal',
    });
  }
}

export default function ExitIntentModal() {
  const [open, setOpen] = useState(false);
  const enteredAt = useRef(Date.now());

  useEffect(() => {
    // Only desktop
    if (typeof window === 'undefined' || window.innerWidth < 768) return;
    // Only once per session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    function handleMouseLeave(e: MouseEvent) {
      // Cursor left through the top edge
      if (e.clientY > 10) return;
      const elapsed = Date.now() - enteredAt.current;
      if (elapsed < MIN_TIME_ON_PAGE_MS) return;
      if (sessionStorage.getItem(SESSION_KEY)) return;

      sessionStorage.setItem(SESSION_KEY, '1');
      setOpen(true);
      trackExitIntent('modal_shown');
    }

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, []);

  if (!open) return null;

  const waUrl = WHATSAPP_URL_WITH_MESSAGE('Hola! M\'agradaria rebre informació sobre els vostres serveis.');

  function handleClose() {
    setOpen(false);
    trackExitIntent('modal_closed');
  }

  function handleWhatsApp() {
    trackExitIntent('exit_intent_whatsapp');
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setOpen(false);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Oferta especial"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
          aria-label="Tancar"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
          </svg>
        </button>

        {/* Icon */}
        <div className="text-5xl mb-4">⚡</div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-white mb-2">
          Espera un moment!
        </h2>
        <p className="text-white/60 text-sm mb-6 leading-relaxed">
          Rebeu resposta en <strong className="text-amber-400">menys de 2 hores</strong>.
          Sense compromís ni cost. Consulteu-nos ara!
        </p>

        {/* CTA */}
        <button
          onClick={handleWhatsApp}
          className="w-full flex items-center justify-center gap-3 bg-[var(--oe-whatsapp)] hover:bg-[var(--oe-whatsapp-strong)] active:bg-[var(--oe-whatsapp-strong)] text-white font-semibold py-3.5 px-6 rounded-xl transition-colors shadow-lg shadow-[rgba(var(--oe-whatsapp-rgb),0.2)] mb-3"
        >
          {/* WhatsApp icon */}
          <WhatsAppIcon width={22} height={22} />
          Escriu-nos per WhatsApp
        </button>

        <button
          onClick={handleClose}
          className="text-white/40 hover:text-white/60 text-sm transition-colors"
        >
          No, gràcies
        </button>
      </div>
    </div>
  );
}
