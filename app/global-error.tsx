'use client';

import caMessages from '@/messages/ca.json';
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { SITE_CONFIG } from '@/app/config/site-config';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  type ErrorPageMessages = { title?: string; defaultMessage?: string; tryAgain?: string; backToHome?: string; errorCode?: string };

  const t: ErrorPageMessages = (caMessages as { errorPage?: ErrorPageMessages }).errorPage || {};

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="bg-black text-white">
        <div className="flex min-h-screen items-center justify-center px-6 py-16">
          <div className="max-w-md text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-white/50">{SITE_CONFIG.business.name}</p>
            <h1 className="mt-4 text-3xl font-semibold">{t.title}</h1>
            <p className="mt-3 text-white/70">
              {t.defaultMessage}
            </p>
            <button
              type="button"
              onClick={() => reset()}
              className="mt-6 rounded-full bg-white/10 px-6 py-3 text-sm font-medium text-white hover:bg-white/20"
            >
              {t.tryAgain}
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}




