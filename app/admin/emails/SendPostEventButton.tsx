'use client';

import { useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';

export default function SendPostEventButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (loading || sent) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set('bookingId', bookingId);

      const res = await fetchWithCsrf('/api/admin/emails/send-post-event', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No s'ha pogut enviar el correu");
      }

      setSent(true);
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
        disabled={loading || sent}
        aria-busy={loading}
        className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
          sent
            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
            : 'bg-amber-500 text-white shadow-lg hover:bg-amber-600'
        }`}
      >
        {sent ? 'Enviat!' : loading ? 'Enviant...' : 'Envia ara'}
      </button>
      {error && (
        <span className="text-xs" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
