/**
 * Tawk.to Live Chat Widget
 * Loads chat widget with deferred loading for performance
 */

'use client';

import { useEffect } from 'react';

type TawkApi = {
  onLoad?: () => void;
  setAttributes?: (attributes: { name?: string }) => void;
};

type TawkWindow = Window & {
  Tawk_API?: TawkApi;
  Tawk_LoadStart?: Date;
};

interface TawkToChatProps {
  /**
   * Your Tawk.to Property ID
   * Find it at: https://dashboard.tawk.to/#/admin/property
   * Format: "5f1234567890abcdef123456"
   */
  propertyId: string;

  /**
   * Your Tawk.to Widget ID (optional)
   * Format: "default" or "1a2b3c4d5e6f7g8h9i0j"
   */
  widgetId?: string;

  /**
   * Delay before loading chat widget (ms)
   * Default: 3000 (3 seconds)
   */
  loadDelay?: number;

  /**
   * Whether to enable chat
   * Default: true
   */
  enabled?: boolean;
}

export function TawkToChat({
  propertyId,
  widgetId = 'default',
  loadDelay = 3000,
  enabled = true,
}: TawkToChatProps) {
  useEffect(() => {
    // Don't load if disabled
    if (!enabled) {
      return;
    }

    // Don't load if already loaded
    const tawkWindow = window as TawkWindow;
    if (tawkWindow.Tawk_API) {
      return;
    }

    // Defer loading for better performance
    const timer = setTimeout(() => {
      // Tawk.to embed script
      const s1 = document.createElement('script');
      const s0 = document.getElementsByTagName('script')[0];

      s1.async = true;
      s1.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
      s1.charset = 'UTF-8';
      s1.setAttribute('crossorigin', '*');

      if (s0 && s0.parentNode) {
        s0.parentNode.insertBefore(s1, s0);
      }

      // Initialize Tawk API
      tawkWindow.Tawk_API = tawkWindow.Tawk_API || {};
      tawkWindow.Tawk_LoadStart = new Date();

      // Optional: Customize widget
      if (tawkWindow.Tawk_API) {
        tawkWindow.Tawk_API.onLoad = function () {
        // Set visitor name if available (from cookies/localStorage)
        const visitorName = localStorage.getItem('visitor_name');
        if (visitorName) {
          tawkWindow.Tawk_API?.setAttributes?.({
            name: visitorName,
          });
        }
        };
      }
    }, loadDelay);

    return () => {
      clearTimeout(timer);
    };
  }, [propertyId, widgetId, loadDelay, enabled]);

  return null; // This component doesn't render anything
}

// Optional: Hook for programmatic control

