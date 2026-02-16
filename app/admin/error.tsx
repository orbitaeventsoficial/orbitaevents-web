'use client';

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-950/60 border border-amber-200 rounded-2xl p-8 text-center shadow-lg">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-rose-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-stone-800 mb-2">
          Error al panell d&apos;administració
        </h2>

        <p className="text-stone-500 mb-6">
          S&apos;ha produït un error inesperat.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-rose-700 text-sm font-mono break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-rose-400 text-xs mt-2">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            type="button"
            className="px-5 py-2.5 bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white font-medium rounded-xl transition-all shadow-sm"
          >
            Torna-ho a provar
          </button>

          <a
            href="/admin"
            className="px-5 py-2.5 bg-white/5 hover:bg-stone-200 text-stone-700 font-medium rounded-xl transition-colors"
          >
            Tornar a l&apos;inici
          </a>
        </div>
      </div>
    </div>
  );
}

