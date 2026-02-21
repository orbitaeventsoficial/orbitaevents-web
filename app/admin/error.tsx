'use client';

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl border border-rose-500/30 bg-gradient-to-b from-slate-900/95 to-slate-950/95 p-8 text-center shadow-xl shadow-black/35">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-rose-500/40 bg-rose-500/15">
          <svg
            className="w-8 h-8 text-rose-300"
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

        <h2 className="mb-2 text-xl font-bold text-slate-100">
          Error al panell d&apos;administració
        </h2>

        <p className="mb-6 text-slate-300">
          S&apos;ha produït un error inesperat.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4">
            <p className="text-sm font-mono text-rose-200 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-2 text-xs text-rose-300/80">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            type="button"
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 font-medium text-white transition-all hover:from-amber-400 hover:to-orange-500"
          >
            Torna-ho a provar
          </button>

          <a
            href="/admin"
            className="rounded-xl border border-slate-600/60 bg-slate-800/70 px-5 py-2.5 font-medium text-slate-200 transition-colors hover:bg-slate-700/70"
          >
            Tornar a l&apos;inici
          </a>
        </div>
      </div>
    </div>
  );
}

