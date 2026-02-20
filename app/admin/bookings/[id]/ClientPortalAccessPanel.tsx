'use client';

import { useMemo, useState } from 'react';

type ActivePortal = {
  id: string;
  tokenPrefix: string;
  locale: string;
  personalization?: {
    headline?: string;
    introMessage?: string;
  } | null;
  expiresAt: string | Date | null;
  createdAt: string | Date;
  createdBy?: string | null;
  lastAccessedAt?: string | Date | null;
} | null;

export default function ClientPortalAccessPanel({
  bookingId,
  initialActive,
}: {
  bookingId: string;
  initialActive: ActivePortal;
}) {
  const [active, setActive] = useState<ActivePortal>(initialActive);
  const [locale, setLocale] = useState((initialActive?.locale || 'ca').toLowerCase());
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [headline, setHeadline] = useState('');
  const [introMessage, setIntroMessage] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const expiresAtText = useMemo(() => {
    if (!active?.expiresAt) return 'Sense caducitat';
    return new Date(active.expiresAt).toLocaleString('ca-ES');
  }, [active]);

  const lastAccessText = useMemo(() => {
    if (!active?.lastAccessedAt) return 'Encara no s\'ha obert';
    return new Date(active.lastAccessedAt).toLocaleString('ca-ES');
  }, [active]);

  const handleCreateLink = async () => {
    setLoading(true);
    setMessage(null);
    setIsError(false);

    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/portal-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          expiresInDays,
          personalization: {
            headline: headline.trim() || undefined,
            introMessage: introMessage.trim() || undefined,
          },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No s\'ha pogut generar l\'enllaç');
      }

      setActive(data.active ?? null);
      setGeneratedUrl(typeof data.url === 'string' ? data.url : '');
      setMessage('Enllaç del portal generat. Comparteix-lo ara amb el client.');
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'Error inesperat');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setIsError(false);
      setMessage('Enllaç copiat al porta-retalls');
    } catch {
      setIsError(true);
      setMessage('No s\'ha pogut copiar automàticament');
    }
  };

  const handleRevoke = async () => {
    setLoading(true);
    setMessage(null);
    setIsError(false);

    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/portal-access`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No s\'ha pogut revocar');
      }

      setActive(null);
      setGeneratedUrl('');
      setMessage('Enllaç revocat correctament');
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'Error inesperat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-white/10 bg-slate-950/60 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-slate-200 mb-2">Portal client (link únic)</h2>
      <p className="text-xs text-slate-400 mb-4">
        Genera un enllaç privat sense login per compartir estat, serveis, pagaments i informació post-event.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-300">
          Idioma del portal
          <select
            value={locale}
            onChange={(event) => setLocale(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
          >
            <option value="ca">Català</option>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </label>

        <label className="text-sm text-slate-300">
          Caducitat (dies)
          <input
            type="number"
            min={1}
            max={365}
            value={expiresInDays}
            onChange={(event) => setExpiresInDays(Number(event.target.value) || 30)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-300">
          Títol personalitzat (opcional)
          <input
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            placeholder="Benvinguts a l'espai del vostre esdeveniment"
            className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
          />
        </label>

        <label className="text-sm text-slate-300">
          Missatge personalitzat (opcional)
          <input
            value={introMessage}
            onChange={(event) => setIntroMessage(event.target.value)}
            placeholder="Aquí teniu tots els detalls en un únic lloc"
            className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCreateLink}
          disabled={loading}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-700 disabled:opacity-60"
        >
          {loading ? 'Generant...' : active ? 'Rotar enllaç' : 'Generar enllaç'}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!generatedUrl}
          className="rounded-lg border border-white/10 bg-slate-950/60 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5 disabled:opacity-60"
        >
          Copiar enllaç
        </button>
        <button
          type="button"
          onClick={handleRevoke}
          disabled={loading || !active}
          className="rounded-lg border border-rose-400/30 bg-rose-950/30 px-4 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-900/40 disabled:opacity-60"
        >
          Revocar
        </button>
      </div>

      {generatedUrl && (
        <div className="mt-3 rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3">
          <p className="text-[11px] uppercase tracking-wide text-cyan-300 mb-1">Enllaç generat</p>
          <p className="text-xs break-all text-slate-100">{generatedUrl}</p>
        </div>
      )}

      <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
        <p>Estat: {active ? 'Actiu' : 'No hi ha cap enllaç actiu'}</p>
        {active && (
          <>
            <p>Token: {active.tokenPrefix}…</p>
            <p>Caduca: {expiresAtText}</p>
            <p>Últim accés: {lastAccessText}</p>
          </>
        )}
      </div>

      {message && (
        <p className={`mt-3 text-xs ${isError ? 'text-rose-300' : 'text-emerald-300'}`}>
          {message}
        </p>
      )}
    </section>
  );
}
