'use client';

import { useState } from 'react';
import { log } from '@/lib/logger';

export default function PostEventEmailButton({ bookingId }: { bookingId: string }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (sending || sent) return;
    setSending(true);

    try {
      const res = await fetch('/api/admin/emails/send-post-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error enviant email');
      }

      setSent(true);
    } catch (error) {
      log.error('Error sending post-event email', error);
      alert(error instanceof Error ? error.message : 'Error enviant email post-event');
    } finally {
      setSending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSend}
      disabled={sending || sent}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
        sent
          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
          : 'bg-amber-500 text-white hover:bg-amber-600'
      } disabled:opacity-60`}
    >
      {sent ? '✅ Enviat!' : sending ? '⏳ Enviant...' : 'Envia post-event al client'}
    </button>
  );
}
