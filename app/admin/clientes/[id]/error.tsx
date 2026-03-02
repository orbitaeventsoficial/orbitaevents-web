'use client';

export default function CustomerHubError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl border p-6">
        <h1 className="text-lg font-semibold">No s&apos;ha pogut carregar la fitxa del client</h1>
        <p className="mt-2 text-sm">
          Reintenta la càrrega. Si continua fallant, revisa permisos o integritat de dades.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-xl border px-3 py-2 text-sm font-semibold"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

