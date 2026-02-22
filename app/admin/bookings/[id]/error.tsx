'use client';

import Link from 'next/link';

export default function BookingDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4">
      <div className="max-w-md w-full rounded-2xl border p-8 text-center">
        <p className="text-4xl mb-4">⚠️</p>
        <h2 className="text-lg font-bold mb-2">
          Error carregant la reserva
        </h2>
        <p className="text-sm mb-4">
          No s&apos;ha pogut carregar la fitxa de la reserva.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <p className="text-xs font-mono mb-4 break-all">{error.message}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-xl text-sm font-semibold border"
          >
            Reintentar
          </button>
          <Link
            href="/admin/bookings"
            className="px-4 py-2 rounded-xl bg-white/5 text-sm font-semibold hover:bg-white/10 border border-white/10"
          >
            Tornar a reserves
          </Link>
        </div>
      </div>
    </div>
  );
}
