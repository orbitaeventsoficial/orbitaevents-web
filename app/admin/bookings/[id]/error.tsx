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
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <div className="ap-card max-w-md p-8 text-center">
        <p className="mb-4 text-4xl">⚠️</p>
        <h2 className="mb-2 text-lg font-bold">
          Error carregant la reserva
        </h2>
        <p className="mb-4 text-sm">
          No s&apos;ha pogut carregar la fitxa de la reserva.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <p className="mb-4 break-all font-mono text-xs">{error.message}</p>
        )}
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="ap-btn ap-btn--secondary px-4 py-2 text-sm"
          >
            Reintentar
          </button>
          <Link
            href="/admin/bookings"
            className="ap-btn ap-btn--secondary px-4 py-2 text-sm"
          >
            Tornar a reserves
          </Link>
        </div>
      </div>
    </div>
  );
}
