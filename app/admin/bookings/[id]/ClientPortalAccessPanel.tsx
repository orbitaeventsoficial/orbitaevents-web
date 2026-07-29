'use client';

import { useMemo, useState } from 'react';
import { formatDateTimeFull } from '@/lib/constants';
import { fetchWithCsrf } from '@/lib/csrf';
import { ADMIN_BOOKING_HELP_3, helpAttrs } from '@/app/admin/components/adminHelpContent';
import {
  CLIENT_PORTAL_ACCESS_EXPIRY_LIMITS,
  CLIENT_PORTAL_DEFAULT_ACCENT_COLOR,
  CLIENT_PORTAL_PERSONALIZATION_LIMITS,
  type PortalPersonalization,
} from '@/lib/constants/clientPortalPersonalization';

type ActivePortal = {
  id: string;
  tokenPrefix: string;
  locale: string;
  personalization?: PortalPersonalization | null;
  expiresAt: string | Date | null;
  createdAt: string | Date;
  createdBy?: string | null;
  lastAccessedAt?: string | Date | null;
} | null;

type PortalActionErrorTarget = 'create' | 'copy' | 'revoke';

function clampPortalExpiryDays(value: number): number {
  if (!Number.isFinite(value)) return CLIENT_PORTAL_ACCESS_EXPIRY_LIMITS.defaultDays;
  return Math.max(
    CLIENT_PORTAL_ACCESS_EXPIRY_LIMITS.minDays,
    Math.min(CLIENT_PORTAL_ACCESS_EXPIRY_LIMITS.maxDays, Math.round(value)),
  );
}

export default function ClientPortalAccessPanel({
  bookingId,
  initialActive,
}: {
  bookingId: string;
  initialActive: ActivePortal;
}) {
  const [active, setActive] = useState<ActivePortal>(initialActive);
  const [locale, setLocale] = useState((initialActive?.locale || 'ca').toLowerCase());
  const [expiresInDays, setExpiresInDays] = useState<number>(CLIENT_PORTAL_ACCESS_EXPIRY_LIMITS.defaultDays);
  const [headline, setHeadline] = useState(initialActive?.personalization?.headline || '');
  const [introMessage, setIntroMessage] = useState(initialActive?.personalization?.introMessage || '');
  const [accentColor, setAccentColor] = useState(
    initialActive?.personalization?.accentColor || CLIENT_PORTAL_DEFAULT_ACCENT_COLOR,
  );
  const [showTimeline, setShowTimeline] = useState(initialActive?.personalization?.showTimeline ?? true);
  const [showPayments, setShowPayments] = useState(initialActive?.personalization?.showPayments ?? true);
  const [showDocuments, setShowDocuments] = useState(initialActive?.personalization?.showDocuments ?? true);
  const [showPostEvent, setShowPostEvent] = useState(initialActive?.personalization?.showPostEvent ?? true);
  const [showQuestionnaire, setShowQuestionnaire] = useState(initialActive?.personalization?.showQuestionnaire ?? true);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorTarget, setErrorTarget] = useState<PortalActionErrorTarget | null>(null);

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
    setErrorTarget(null);

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
            showQuestionnaire,
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
      console.error('[ClientPortalAccessPanel] Error generant portal', error);
      setErrorTarget('create');
      setMessage(error instanceof Error ? error.message : 'Error inesperat');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedUrl) return;
    setMessage(null);
    setErrorTarget(null);
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setMessage('Enllaç copiat al porta-retalls');
    } catch (error) {
      console.error('[ClientPortalAccessPanel] Error copiant portal', error);
      setErrorTarget('copy');
      setMessage('No s\'ha pogut copiar automàticament');
    }
  };

  const handleRevoke = async () => {
    setLoading(true);
    setMessage(null);
    setErrorTarget(null);

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
      console.error('[ClientPortalAccessPanel] Error revocant portal', error);
      setErrorTarget('revoke');
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
            min={CLIENT_PORTAL_ACCESS_EXPIRY_LIMITS.minDays}
            max={CLIENT_PORTAL_ACCESS_EXPIRY_LIMITS.maxDays}
            value={expiresInDays}
            onChange={(event) => setExpiresInDays(clampPortalExpiryDays(Number(event.target.value)))}
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
            maxLength={CLIENT_PORTAL_PERSONALIZATION_LIMITS.headline}
            className="ap-input mt-1 w-full text-sm"
          />
        </label>

        <label className="text-sm">
          Missatge personalitzat (opcional)
          <textarea
            value={introMessage}
            onChange={(event) => setIntroMessage(event.target.value)}
            placeholder="Aquí teniu tots els detalls en un únic lloc"
            rows={3}
            maxLength={CLIENT_PORTAL_PERSONALIZATION_LIMITS.introMessage}
            className="ap-input mt-1 w-full resize-y text-sm"
          />
        </label>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2" {...helpAttrs(ADMIN_BOOKING_HELP_3.portal.options)}>
        <label className="text-sm">
          Color accent del portal
          <input
            value={accentColor}
            onChange={(event) => setAccentColor(event.target.value)}
            placeholder={CLIENT_PORTAL_DEFAULT_ACCENT_COLOR}
            maxLength={CLIENT_PORTAL_PERSONALIZATION_LIMITS.accentColor}
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
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={showQuestionnaire} onChange={(e) => setShowQuestionnaire(e.target.checked)} />
            Qüestionari
          </label>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" {...helpAttrs(ADMIN_BOOKING_HELP_3.portal.actions)}>
        <button
          type="button"
          onClick={handleCreateLink}
          disabled={loading}
          aria-invalid={errorTarget === 'create' ? true : undefined}
          className="ap-btn ap-btn--primary px-4 py-2 text-xs disabled:opacity-60"
        >
          {loading ? 'Generant...' : active ? 'Rotar enllaç' : 'Generar enllaç'}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!generatedUrl}
          aria-invalid={errorTarget === 'copy' ? true : undefined}
          className="ap-btn ap-btn--secondary px-4 py-2 text-xs disabled:opacity-60"
        >
          Copiar enllaç
        </button>
        <button
          type="button"
          onClick={handleRevoke}
          disabled={loading || !active}
          aria-invalid={errorTarget === 'revoke' ? true : undefined}
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
        <p role={errorTarget ? 'alert' : 'status'} className={`mt-3 text-xs ${errorTarget ? 'admin-tone-text-danger' : 'admin-tone-text-success'}`}>
          {message}
        </p>
      )}
    </section>
  );
}
