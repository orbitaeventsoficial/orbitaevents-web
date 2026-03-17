"use client";
import caMessages from '@/messages/ca.json';
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function Error({
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-black text-white">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-4">😕</div>
        <h1 className="text-2xl font-bold mb-2">{t.title || 'Hi ha hagut un error'}</h1>
        <p className="text-white/70 mb-6">
          {error?.message || t.defaultMessage || "S'ha produït un error inesperat."}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition-colors"
          >
            {t.tryAgain || 'Torna-ho a provar'}
          </button>
          <a
            href="/"
            className="px-4 py-2 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors"
          >
            {t.backToHome || "Torna a l'inici"}
          </a>
        </div>
        {error?.digest && (
          <p className="mt-4 text-xs text-white/60">
            {(t.errorCode || 'Codi error:')} {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}



