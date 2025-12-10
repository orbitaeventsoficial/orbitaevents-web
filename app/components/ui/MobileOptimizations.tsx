'use client';

import { useEffect } from 'react';

/**
 * Component que aplica optimitzacions per mòbil
 * - Detecta iOS i aplica classes
 * - Gestiona safe areas
 * - Prevé zoom en inputs
 */
export default function MobileOptimizations() {
  useEffect(() => {
    // Detectar iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      document.documentElement.classList.add('is-ios');
    }

    // Detectar standalone (PWA)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      document.documentElement.classList.add('is-pwa');
    }

    // Prevenir zoom en doble tap
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    // Només aplicar si és touch device
    if ('ontouchstart' in window) {
      document.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    // Actualitzar CSS custom properties per safe areas
    const updateSafeAreas = () => {
      const root = document.documentElement;
      root.style.setProperty('--safe-area-top', 'env(safe-area-inset-top, 0px)');
      root.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom, 0px)');
      root.style.setProperty('--safe-area-left', 'env(safe-area-inset-left, 0px)');
      root.style.setProperty('--safe-area-right', 'env(safe-area-inset-right, 0px)');
    };

    updateSafeAreas();

    // Cleanup
    return () => {
      if ('ontouchstart' in window) {
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, []);

  // Aquest component no renderitza res, només aplica efectes
  return null;
}
