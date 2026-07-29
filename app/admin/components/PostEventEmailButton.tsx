'use client';

import { useState } from 'react';
import { log } from '@/lib/logger';
import { fetchWithCsrf } from '@/lib/csrf';

export default function PostEventEmailButton({
  bookingId,
  initiallySent = false,
}: {
  bookingId: string;
  initiallySent?: boolean;
}) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(initiallySent);
  const [error, setError] = useState<string | null>(null);
  const [confirmSend, setConfirmSend] = useState(false);

  const handleSend = async () => {
    if (sending || sent) return;
    if (!confirmSend) {
      setConfirmSend(true);
      setError(null);
      return;
    }
    setSending(true);
    setConfirmSend(false);
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
        aria-invalid={error ? true : undefined}
        aria-pressed={confirmSend}
      >
        {sent ? '✓ Enviat!' : sending ? 'Enviant...' : confirmSend ? 'Confirmar enviament' : 'Envia post-event al client'}
      </button>
      {confirmSend && (
        <span role="status" className="admin-tone-text-warning mt-1 text-xs">
          Enviarà un email real al client. Torna a clicar per confirmar.
        </span>
      )}
      {sent && (
        <span role="status" className="sr-only">
          Email post-event enviat
        </span>
      )}
      {error && (
        <span role="alert" className="admin-tone-text-danger mt-1 text-xs">{error}</span>
      )}
    </div>
  );
}
