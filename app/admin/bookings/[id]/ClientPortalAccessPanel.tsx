'use client';

import { useMemo, useState } from 'react';
import { formatDateTimeFull } from '@/lib/constants';
import { fetchWithCsrf } from '@/lib/csrf';
import { ADMIN_BOOKING_HELP_3, helpAttrs } from '@/app/admin/components/adminHelpContent';

type ActivePortal = {
  id: string;
  tokenPrefix: string;
  locale: string;
  personalization?: {
    headline?: string;
    introMessage?: string;
    accentColor?: string;
    showTimeline?: boolean;
    showPayments?: boolean;
    showDocuments?: boolean;
    showPostEvent?: boolean;
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
  const [headline, setHeadline] = useState(initialActive?.personalization?.headline || '');
  const [introMessage, setIntroMessage] = useState(initialActive?.personalization?.introMessage || '');
  const [accentColor, setAccentColor] = useState(initialActive?.personalization?.accentColor || '#06b6d4');
  const [showTimeline, setShowTimeline] = useState(initialActive?.personalization?.showTimeline ?? true);
  const [showPayments, setShowPayments] = useState(initialActive?.personalization?.showPayments ?? true);
  const [showDocuments, setShowDocuments] = useState(initialActive?.personalization?.showDocuments ?? true);
  const [showPostEvent, setShowPostEvent] = useState(initialActive?.personalization?.showPostEvent ?? true);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const expiresAtText = useMemo(() => {
    if (!active?.expiresAt) return 'Sense caducitat';
    return formatDateTimeFull(active.expiresAt);
  }, [active]);

  const lastAccessText = useMemo(() => {
    if (!active?.lastAccessedAt) return 'Encara no s\'ha obert';
    return formatDateTimeFull(active.lastAccessedAt);
  }, [active]);

  const handleCreateLink = async () => {
    setLoading(true);
    setMessage(null);
    setIsError(false);

    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/portal-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          expiresInDays,
          personalization: {
            headline: headline.trim() || undefined,
            introMessage: introMessage.trim() || undefined,
            accentColor: accentColor.trim() || undefined,
            showTimeline,
            showPayments,
            showDocuments,
            showPostEvent,
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
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/portal-access`, {
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
    <section className="ap-card p-6" {...helpAttrs(ADMIN_BOOKING_HELP_3.portal.root)}>
      <h2 className="mb-2 ap-h2">Portal client (link únic)</h2>
      <p className="mb-4 text-xs">
        Genera un enllaç privat sense login per compartir estat, serveis, pagaments i informació post-event.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Idioma del portal
          <select
            value={locale}
            onChange={(event) => setLocale(event.target.value)}
            className="ap-input mt-1 w-full text-sm"
          >
            <option value="ca">Català</option>
            <option value="es">Castellà</option>
            <option value="en">Anglès</option>
          </select>
        </label>

        <label className="text-sm">
          Caducitat (dies)
          <input
            type="number"
            min={1}
            max={365}
            value={expiresInDays}
            onChange={(event) => setExpiresInDays(Number(event.target.value) || 30)}
            className="ap-input mt-1 w-full text-sm"
          />
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2" {...helpAttrs(ADMIN_BOOKING_HELP_3.portal.options)}>
        <label className="text-sm">
          Títol personalitzat (opcional)
          <input
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            placeholder="Benvinguts a l'espai del vostre esdeveniment"
            className="ap-input mt-1 w-full text-sm"
          />
        </label>

        <label className="text-sm">
          Missatge personalitzat (opcional)
          <input
            value={introMessage}
            onChange={(event) => setIntroMessage(event.target.value)}
            placeholder="Aquí teniu tots els detalls en un únic lloc"
            className="ap-input mt-1 w-full text-sm"
          />
        </label>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2" {...helpAttrs(ADMIN_BOOKING_HELP_3.portal.options)}>
        <label className="text-sm">
          Color accent del portal
          <input
            value={accentColor}
            onChange={(event) => setAccentColor(event.target.value)}
            placeholder="#06b6d4"
            className="ap-input mt-1 w-full text-sm"
          />
        </label>
        <div className="ap-card admin-tone-border-neutral grid grid-cols-2 gap-2 p-3 text-xs">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={showTimeline} onChange={(e) => setShowTimeline(e.target.checked)} />
            Timeline
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={showPayments} onChange={(e) => setShowPayments(e.target.checked)} />
            Pagaments
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={showDocuments} onChange={(e) => setShowDocuments(e.target.checked)} />
            Documents
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={showPostEvent} onChange={(e) => setShowPostEvent(e.target.checked)} />
            Post-event
          </label>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" {...helpAttrs(ADMIN_BOOKING_HELP_3.portal.actions)}>
        <button
          type="button"
          onClick={handleCreateLink}
          disabled={loading}
          className="ap-btn ap-btn--primary px-4 py-2 text-xs disabled:opacity-60"
        >
          {loading ? 'Generant...' : active ? 'Rotar enllaç' : 'Generar enllaç'}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!generatedUrl}
          className="ap-btn ap-btn--secondary px-4 py-2 text-xs disabled:opacity-60"
        >
          Copiar enllaç
        </button>
        <button
          type="button"
          onClick={handleRevoke}
          disabled={loading || !active}
          className="ap-btn admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger px-4 py-2 text-xs disabled:opacity-60"
        >
          Revocar
        </button>
      </div>

      {generatedUrl && (
        <div className="ap-card mt-3 p-3">
          <p className="mb-1 text-xs uppercase tracking-wide">Enllaç generat</p>
          <p className="break-all text-xs">{generatedUrl}</p>
        </div>
      )}

      <div className="ap-card admin-tone-border-neutral admin-tone-bg-neutral mt-3 p-3 text-xs">
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
        <p className={`mt-3 text-xs ${isError ? 'admin-tone-text-danger' : 'admin-tone-text-success'}`}>
          {message}
        </p>
      )}
    </section>
  );
}

