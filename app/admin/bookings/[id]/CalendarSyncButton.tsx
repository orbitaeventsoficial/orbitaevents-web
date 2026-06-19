'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';

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
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/calendar-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No s\'ha pogut sincronitzar amb Google Calendar');
      }
      const status = data?.result?.status as string | undefined;
      setMessage(
        status === 'synced'
          ? 'Google Calendar sincronitzat'
          : status === 'deleted'
            ? 'Esdeveniment eliminat de Google Calendar'
            : 'Sincronització no necessària'
      );
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'Error inesperat');
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
        className="ap-btn ap-btn--secondary px-3 py-1.5 text-xs disabled:opacity-60"
      >
        {loading ? 'Sincronitzant...' : 'Sincronitza Google Calendar ara'}
      </button>
      {message && (
        <p className={`text-xs ${isError ? 'admin-tone-text-danger' : 'admin-tone-text-success'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
