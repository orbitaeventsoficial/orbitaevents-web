'use client';

import { useState } from 'react';
import { log } from '@/lib/logger';
import { fetchWithCsrf } from '@/lib/csrf';

export default function PostEventEmailButton({ bookingId }: { bookingId: string }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (sending || sent) return;
    setSending(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('bookingId', bookingId);
      const res = await fetchWithCsrf('/api/admin/emails/send-post-event', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error enviant email');
      }

      setSent(true);
    } catch (err) {
      log.error('Error sending post-event email', err);
      setError(err instanceof Error ? err.message : 'Error enviant email post-event');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="inline-flex flex-col">
      <button
        type="button"
        onClick={handleSend}
        disabled={sending || sent}
        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
          sent
            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
            : 'bg-amber-500 text-white hover:bg-amber-600'
        } disabled:opacity-60`}
      >
        {sent ? '✓ Enviat!' : sending ? 'Enviant...' : 'Envia post-event al client'}
      </button>
      {error && (
        <span className="text-[10px] mt-1">{error}</span>
      )}
    </div>
  );
}
