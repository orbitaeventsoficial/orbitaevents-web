// components/security/TurnstileWidget.tsx
'use client';

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { useRef, useEffect } from 'react';

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
}

export default function TurnstileWidget({
  onSuccess,
  onError,
  onExpire,
  theme = 'dark',
  size = 'normal',
}: TurnstileWidgetProps) {
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    // Reset on unmount
    const ref = turnstileRef.current;
    return () => {
      if (ref) {
        ref.reset();
      }
    };
  }, []);

  if (!siteKey || isDev) {
    // En desarrollo sin Turnstile configurado, mostrar placeholder
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className="p-4 border border-yellow-500/30 bg-yellow-500/10 rounded-xl text-yellow-400 text-sm">
          ⚠️ Turnstile desactivado en local (dev mode)
          <br />
          <button
            type="button"
            onClick={() => onSuccess('dev-mode-bypass-token')}
            className="mt-2 px-3 py-1 bg-yellow-500/20 rounded text-xs"
          >
            Bypass CAPTCHA (dev only)
          </button>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="flex justify-center">
      <Turnstile
        ref={turnstileRef}
        siteKey={siteKey}
        onSuccess={onSuccess}
        onError={onError}
        onExpire={onExpire}
        options={{
          theme,
          size,
          action: 'submit-form',
          language: 'es',
        }}
      />
    </div>
  );
}


