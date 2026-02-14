'use client';

import { useMemo, useState } from 'react';

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
      const res = await fetch('/api/admin/integrations/calendar-token', {
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
          <p className="break-all rounded-lg bg-slate-50 p-2 text-xs text-slate-600">{url}</p>
          <p className="text-xs text-slate-500">
            A Google Calendar: Configuració → Afegir calendari → &quot;Des de URL&quot;.
          </p>
        </>
      ) : (
        <p className="text-xs text-amber-700">
          Encara no hi ha feed generat.
        </p>
      )}
      {error && <p className="text-xs text-rose-700">{error}</p>}
      <button
        type="button"
        onClick={regenerate}
        disabled={loading}
        className="inline-flex rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
      >
        {loading ? 'Generant...' : 'Generar / Regenerar token'}
      </button>
    </div>
  );
}

