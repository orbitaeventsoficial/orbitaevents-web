'use client';

export default function CustomerHubError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6">
        <h1 className="text-lg font-semibold text-amber-200">No s&apos;ha pogut carregar la fitxa del client</h1>
        <p className="mt-2 text-sm text-amber-100/90">
          Reintenta la càrrega. Si continua fallant, revisa permisos o integritat de dades.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-lg border border-amber-300/50 bg-amber-200/10 px-3 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-200/20"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

