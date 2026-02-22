'use client';

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl border p-8 text-center shadow-xl shadow-black/35">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border">
          <svg
            className="w-8 h-8"
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

        <h2 className="mb-2 text-xl font-bold">
          Error al panell d&apos;administració
        </h2>

        <p className="mb-6">
          S&apos;ha produït un error inesperat.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 rounded-xl border p-4">
            <p className="text-sm font-mono break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-2 text-xs">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            type="button"
            className="rounded-xl px-5 py-2.5 font-medium text-white transition-all"
          >
            Torna-ho a provar
          </button>

          <a
            href="/admin"
            className="rounded-xl border px-5 py-2.5 font-medium transition-colors"
          >
            Tornar a l&apos;inici
          </a>
        </div>
      </div>
    </div>
  );
}

