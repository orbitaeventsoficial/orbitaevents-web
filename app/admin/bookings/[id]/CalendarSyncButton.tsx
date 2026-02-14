'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CalendarSyncButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function syncNow() {
    setLoading(true);
    setMessage(null);
    setIsError(false);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/calendar-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No se pudo sincronizar con Google Calendar');
      }
      const status = data?.result?.status as string | undefined;
      setMessage(
        status === 'synced'
          ? 'Google Calendar sincronizado'
          : status === 'deleted'
            ? 'Evento eliminado de Google Calendar'
            : 'Sincronización no necesaria'
      );
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col gap-2">
      <button
        type="button"
        onClick={syncNow}
        disabled={loading}
        className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {loading ? 'Sincronizando...' : 'Sync Google Calendar ahora'}
      </button>
      {message && (
        <p className={`text-[11px] ${isError ? 'text-rose-600' : 'text-emerald-700'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
