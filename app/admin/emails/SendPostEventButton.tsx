'use client';

import { useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';

export default function SendPostEventButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set('bookingId', bookingId);

      const response = await fetchWithCsrf('/api/admin/emails/send-post-event', {
        method: 'POST',
        body: formData,
      });

      if (response.redirected) {
        window.location.href = response.url;
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "No s'ha pogut enviar el correu");
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconegut');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-busy={loading}
        className="px-4 py-2 text-white text-sm font-medium rounded-xl shadow-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Enviant...' : 'Envia ara'}
      </button>
      {error && (
        <span className="text-xs" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
