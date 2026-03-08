'use client';

import { useMemo, useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';

export default function CalendarTokenManager({
  baseUrl,
  initialToken,
}: {
  baseUrl: string;
  initialToken: string | null;
}) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = useMemo(() => (token ? `${baseUrl}/api/calendar/feed/${token}` : null), [baseUrl, token]);

  async function regenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithCsrf('/api/admin/integrations/calendar-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok || !data?.token) {
        throw new Error(data?.error || 'No s’ha pogut generar el token');
      }
      setToken(data.token);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperat');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      {url ? (
        <>
          <p className="break-all rounded-xl p-2 text-xs">{url}</p>
          <p className="text-xs">
            A Google Calendar: Configuració → Afegir calendari → &quot;Des de URL&quot;.
          </p>
        </>
      ) : (
        <p className="text-xs">
          Encara no hi ha feed generat.
        </p>
      )}
      {error && <p className="text-xs">{error}</p>}
      <button
        type="button"
        onClick={regenerate}
        disabled={loading}
        className="inline-flex rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? 'Generant...' : 'Generar / Regenerar token'}
      </button>
    </div>
  );
}

