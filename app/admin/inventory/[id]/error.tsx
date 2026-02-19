'use client';

import Link from 'next/link';

export default function InventoryDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4">
      <div className="max-w-md w-full rounded-2xl border border-rose-500/30 bg-rose-950/20 p-8 text-center">
        <p className="text-4xl mb-4">⚠️</p>
        <h2 className="text-lg font-bold text-rose-200 mb-2">
          Error carregant l&apos;element
        </h2>
        <p className="text-sm text-rose-300/80 mb-4">
          No s&apos;ha pogut carregar la fitxa de l&apos;element d&apos;inventari.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <p className="text-xs text-rose-400 font-mono mb-4 break-all">{error.message}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-200 text-sm font-semibold hover:bg-rose-500/30 border border-rose-500/30"
          >
            Reintentar
          </button>
          <Link
            href="/admin/inventory"
            className="px-4 py-2 rounded-xl bg-white/5 text-slate-200 text-sm font-semibold hover:bg-white/10 border border-white/10"
          >
            Tornar a inventari
          </Link>
        </div>
      </div>
    </div>
  );
}
