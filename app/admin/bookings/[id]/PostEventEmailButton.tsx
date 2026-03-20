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
        className={`ap-btn px-3 py-1.5 text-xs disabled:opacity-60 ${
          sent
            ? 'ap-btn--secondary admin-tone-border-success admin-tone-bg-success admin-tone-text-success'
            : 'ap-btn--primary'
        }`}
      >
        {sent ? '✓ Enviat!' : sending ? 'Enviant...' : 'Envia post-event al client'}
      </button>
      {error && (
        <span className="admin-tone-text-danger mt-1 text-[10px]">{error}</span>
      )}
    </div>
  );
}
