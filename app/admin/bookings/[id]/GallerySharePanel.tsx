'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';

interface Props {
  bookingId: string;
}

interface ShareInfo {
  token: string | null;
  passwordProtected: boolean;
}

export default function GallerySharePanel({ bookingId }: Props) {
  const [info, setInfo] = useState<ShareInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [passwordDraft, setPasswordDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadInfo = useCallback(async () => {
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/gallery-share`, { cache: 'no-store' });
      if (res.ok) setInfo(await res.json());
    } catch (err) {
      log.error('Error carregant gallery share info', err);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { loadInfo(); }, [loadInfo]);

  const shareUrl = info?.token
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/ca/gallery/${info.token}`
    : null;

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      log.error('Error copiant al portapapers', null);
    }
  };

  const handleCreate = async () => {
    setWorking(true);
    setError(null);
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/gallery-share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordDraft.trim() || null }),
      });
      if (res.ok) {
        setPasswordDraft('');
        setShowPasswordInput(false);
        await loadInfo();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d?.error || 'Error generant el link');
      }
    } catch (err) {
      log.error('Error creant gallery share', err);
      setError('Error generant el link');
    } finally {
      setWorking(false);
    }
  };

  const handleRevoke = async () => {
    setWorking(true);
    setError(null);
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/gallery-share`, { method: 'DELETE' });
      if (res.ok) {
        setInfo({ token: null, passwordProtected: false });
      } else {
        setError('Error revocant el link');
      }
    } catch (err) {
      log.error('Error revocant gallery share', err);
      setError('Error revocant el link');
    } finally {
      setWorking(false);
    }
  };

  if (loading) {
    return <div className="h-14 rounded-xl animate-pulse admin-tone-bg-neutral" />;
  }

  return (
    <div className="ap-card rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="text-sm font-medium">Link de galeria compartida</span>
          {info?.token && info.passwordProtected && (
            <span className="ap-badge text-xs">Amb contrasenya</span>
          )}
        </div>

        {!info?.token ? (
          <button
            type="button"
            onClick={() => setShowPasswordInput((v) => !v)}
            disabled={working}
            className="rounded-xl border border-white/10 px-3 py-1.5 text-xs font-medium hover:border-white/30 transition-colors disabled:opacity-50 min-h-[36px]"
          >
            Generar link
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={working}
              className="rounded-xl border border-white/10 px-3 py-1.5 text-xs font-medium hover:border-white/30 transition-colors disabled:opacity-50 min-h-[36px]"
            >
              {copied ? 'Copiat!' : 'Copiar'}
            </button>
            <button
              type="button"
              onClick={handleRevoke}
              disabled={working}
              className="rounded-xl border admin-tone-border-danger px-3 py-1.5 text-xs font-medium admin-tone-text-danger hover:admin-tone-border-danger transition-colors disabled:opacity-50 min-h-[36px]"
            >
              Revocar
            </button>
          </div>
        )}
      </div>

      {info?.token && shareUrl && (
        <p className="text-xs text-white/40 break-all font-mono bg-[var(--panel)] rounded-lg px-3 py-2">
          {shareUrl}
        </p>
      )}

      {showPasswordInput && !info?.token && (
        <div className="space-y-2">
          <label htmlFor="share-password" className="text-xs text-white/50 block">
            Contrasenya (opcional)
          </label>
          <div className="flex gap-2">
            <input
              id="share-password"
              type="text"
              value={passwordDraft}
              onChange={(e) => setPasswordDraft(e.target.value)}
              placeholder="Sense contrasenya"
              className="ap-input flex-1 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={working}
              className="rounded-xl admin-tone-bg-info border admin-tone-border-info px-4 py-2 text-xs font-semibold admin-tone-text-info hover:admin-tone-bg-info transition-colors disabled:opacity-50 min-h-[36px]"
            >
              {working ? 'Generant...' : 'Crear'}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs admin-tone-text-danger">{error}</p>}
    </div>
  );
}
