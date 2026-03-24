'use client';

// app/components/ui/ExitIntentModal.tsx
// ─────────────────────────────────────────────
// Mostra un modal quan l'usuari a punt de marxar (cursor surt per dalt del viewport)
// - Desktop only: detecta mouseleave del document
// - Una sola vegada per sessió (sessionStorage)
// - Delay mínim 3s a la pàgina abans d'activar

import { useEffect, useRef, useState } from 'react';
import { SITE_CONFIG } from '@/app/config/site-config';

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

  const waPhone = SITE_CONFIG.business.phone.replace(/\D/g, '');
  const waMessage = encodeURIComponent('Hola! M\'agradaria rebre informació sobre els vostres serveis.');
  const waUrl = `https://wa.me/${waPhone}?text=${waMessage}`;

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
          className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20b858] active:bg-[#1da051] text-white font-semibold py-3.5 px-6 rounded-xl transition-colors shadow-lg shadow-[#25D366]/20 mb-3"
        >
          {/* WhatsApp icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
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
