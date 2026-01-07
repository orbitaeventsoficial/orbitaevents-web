"use client";
// app/error.tsx - Error boundary for route segments
// NO html/body tags - uses parent layout

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-black text-white p-6"
    >
      <div className="max-w-md text-center">
        <div className="text-5xl mb-4">😕</div>
        <h1 className="text-2xl font-bold mb-2">Algo salió mal</h1>
        <p className="text-white/70 mb-6">
          {error?.message || 'Error inesperado. Intenta recargar.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition-colors"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="px-4 py-2 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors"
          >
            Ir al inicio
          </a>
        </div>
        {error?.digest && (
          <p className="mt-4 text-xs text-white/60">
            Código: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
