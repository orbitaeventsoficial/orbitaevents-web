'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-black text-white">
        <div className="flex min-h-screen items-center justify-center px-6 py-16">
          <div className="max-w-md text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-white/50">Òrbita Events</p>
            <h1 className="mt-4 text-3xl font-semibold">Algo ha fallado</h1>
            <p className="mt-3 text-white/70">
              Ha ocurrido un error inesperado. Intenta recargar o vuelve en unos minutos.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              className="mt-6 rounded-full bg-white/10 px-6 py-3 text-sm font-medium text-white hover:bg-white/20"
            >
              Reintentar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
