'use client';

import { useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';

export default function DbReconnectButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function reconnect() {
    setLoading(true);
    setMessage(null);
    setIsError(false);
    try {
      const res = await fetchWithCsrf('/api/admin/system/db-reconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Error reconnectant la BBDD');
      }
      setMessage(data?.message || 'Connexio reiniciada');
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'Error reconnectant la BBDD');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={reconnect}
        disabled={loading}
        className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-60"
      >
        {loading ? 'Reiniciant connexio...' : 'Reiniciar connexio BBDD'}
      </button>
      {message ? (
        <p className={`text-xs ${isError ? 'text-rose-300' : 'text-emerald-300'}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
