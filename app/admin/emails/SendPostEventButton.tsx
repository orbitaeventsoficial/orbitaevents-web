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

  const buttonClass = sent
    ? 'admin-tone-bg-success admin-tone-text-success admin-tone-border-success border'
    : loading
      ? 'border border-white/10 bg-white/5 text-white/30'
      : 'ap-btn ap-btn--primary';

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || sent}
        aria-busy={loading}
        className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${buttonClass}`}
      >
        {sent ? 'Enviat!' : loading ? 'Enviant...' : 'Envia ara'}
      </button>
      {error && (
        <span className="text-xs admin-tone-text-danger" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
