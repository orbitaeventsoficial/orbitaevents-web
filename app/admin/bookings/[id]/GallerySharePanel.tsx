'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';

const GALLERY_SHARE_ERROR_FALLBACK = 'No s\'ha pogut gestionar el link de galeria';

interface Props {
  bookingId: string;
}

interface ShareInfo {
  token: string | null;
  passwordProtected: boolean;
}

type GalleryShareErrorTarget = 'load' | 'create' | 'copy' | 'revoke';

function getGalleryShareErrorMessage(data: unknown, fallback = GALLERY_SHARE_ERROR_FALLBACK): string {
  if (data && typeof data === 'object' && 'error' in data) {
    const message = (data as { error?: unknown }).error;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
}

async function readGalleryShareError(res: Response, fallback = GALLERY_SHARE_ERROR_FALLBACK): Promise<string> {
  const data = await res.json().catch(() => null);
  return getGalleryShareErrorMessage(data, fallback);
}

export default function GallerySharePanel({ bookingId }: Props) {
  const [info, setInfo] = useState<ShareInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [passwordDraft, setPasswordDraft] = useState('');
  const [error, setError] = useState<{ message: string; target: GalleryShareErrorTarget } | null>(null);

  const hasError = (target: GalleryShareErrorTarget) => error?.target === target;

  const loadInfo = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/gallery-share`, { cache: 'no-store' });
      if (!res.ok) {
        setError({
          message: await readGalleryShareError(res, 'No s\'ha pogut carregar el link de galeria'),
          target: 'load',
        });
        return;
      }
      setInfo(await res.json());
    } catch (err) {
      log.error('Error carregant gallery share info', err);
      setError({ message: 'No s\'ha pogut carregar el link de galeria', target: 'load' });
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
    setError(null);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      log.error('Error copiant al portapapers', err);
      setError({ message: 'No s\'ha pogut copiar el link', target: 'copy' });
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
        setError({
          message: await readGalleryShareError(res, 'Error generant el link'),
          target: 'create',
        });
      }
    } catch (err) {
      log.error('Error creant gallery share', err);
      setError({ message: 'Error generant el link', target: 'create' });
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
        setError({
          message: await readGalleryShareError(res, 'Error revocant el link'),
          target: 'revoke',
        });
      }
    } catch (err) {
      log.error('Error revocant gallery share', err);
      setError({ message: 'Error revocant el link', target: 'revoke' });
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
          <svg className="h-4 w-4 shrink-0 text-[var(--t3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
            aria-invalid={hasError('load') ? true : undefined}
            className="ap-btn ap-btn--xs"
          >
            Generar link
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={working}
              aria-invalid={hasError('copy') ? true : undefined}
              className="ap-btn ap-btn--xs"
            >
              {copied ? 'Copiat!' : 'Copiar'}
            </button>
            <button
              type="button"
              onClick={handleRevoke}
              disabled={working}
              aria-invalid={hasError('revoke') ? true : undefined}
              className="ap-btn ap-btn--xs admin-tone-border-danger admin-tone-text-danger"
            >
              Revocar
            </button>
          </div>
        )}
      </div>

      {info?.token && shareUrl && (
        <p className="break-words rounded-lg bg-[var(--panel)] px-3 py-2 font-mono text-xs text-[var(--t3)]">
          {shareUrl}
        </p>
      )}

      {showPasswordInput && !info?.token && (
        <div className="space-y-2">
          <label htmlFor="share-password" className="block text-xs text-[var(--t3)]">
            Contrasenya (opcional)
          </label>
          <div className="flex gap-2">
            <input
              id="share-password"
              type="text"
              value={passwordDraft}
              onChange={(e) => setPasswordDraft(e.target.value)}
              placeholder="Sense contrasenya"
              aria-invalid={hasError('create') ? true : undefined}
              className="ap-input flex-1 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={working}
              aria-invalid={hasError('create') ? true : undefined}
              className="ap-btn ap-btn--primary"
            >
              {working ? 'Generant...' : 'Crear'}
            </button>
          </div>
        </div>
      )}

      {error && <p role="alert" className="text-xs admin-tone-text-danger">{error.message}</p>}
    </div>
  );
}
