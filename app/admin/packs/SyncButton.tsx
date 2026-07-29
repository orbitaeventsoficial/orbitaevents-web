'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Package, RefreshCw, X } from 'lucide-react';
import { fetchWithCsrf } from '@/lib/csrf';
import ConfirmDialog, { useConfirmDialog } from '../components/ConfirmDialog';

const SYNC_ICON = 'h-4 w-4 shrink-0';

export default function SyncButton() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const { confirm, dialogProps } = useConfirmDialog();
  const [result, setResult] = useState<{
    ok: boolean;
    message?: string;
    stats?: { total: number; created: number; updated: number; errors: number };
    errors?: string[];
  } | null>(null);

  async function handleSync() {
    const ok = await confirm({ title: 'Sincronitzar packs', message: 'Sincronitzar tots els packs del config a la base de dades?', confirmLabel: 'Sincronitzar', variant: 'warning' });
    if (!ok) return;

    setSyncing(true);
    setResult(null);

    try {
      const response = await fetchWithCsrf('/api/admin/packs/sync', {
        method: 'POST',
      });

      const data = await response.json();
      setResult(data);

      if (data.ok) {
        setTimeout(() => router.refresh(), 2000);
      }
    } catch (error) {
      setResult({
        ok: false,
        message: 'Error de connexió',
      });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleSync}
        disabled={syncing}
        type="button"
        aria-busy={syncing}
        className="ap-btn ap-btn--primary"
      >
        {syncing ? (
          <>
            <span className="w-4 h-4 border-2 border-[var(--line)] border-t-transparent rounded-full animate-spin" />
            Sincronitzant...
          </>
        ) : (
          <>
            <RefreshCw className={SYNC_ICON} aria-hidden="true" />
            Sincronitzar Packs
          </>
        )}
      </button>

      {result && (
        <div
          className={`mt-4 rounded-xl p-4 ${
            result.ok
              ? 'admin-tone-bg-success border admin-tone-border-success'
              : 'admin-tone-bg-danger border admin-tone-border-danger'
          }`}
          role={result.ok ? 'status' : 'alert'}
        >
          <p className={`inline-flex items-center gap-1.5 text-sm font-medium ${result.ok ? 'admin-tone-text-success' : 'admin-tone-text-danger'}`}>
            {result.ok ? <Check className={SYNC_ICON} aria-hidden="true" /> : <X className={SYNC_ICON} aria-hidden="true" />}
            {result.message || (result.ok ? 'Sincronització completada' : 'Error')}
          </p>

          {result.stats && (
            <div className="mt-2 text-sm space-y-1">
              <p className="inline-flex items-center gap-1.5"><Package className={SYNC_ICON} aria-hidden="true" /> Total: {result.stats.total}</p>
              <p className="inline-flex items-center gap-1.5"><Check className={SYNC_ICON} aria-hidden="true" /> Creats: {result.stats.created}</p>
              <p className="inline-flex items-center gap-1.5"><RefreshCw className={SYNC_ICON} aria-hidden="true" /> Actualitzats: {result.stats.updated}</p>
              {result.stats.errors > 0 && (
                <p className="inline-flex items-center gap-1.5"><X className={SYNC_ICON} aria-hidden="true" /> Errors: {result.stats.errors}</p>
              )}
            </div>
          )}

          {result.errors && result.errors.length > 0 && (
            <div className="mt-2 text-xs max-h-32 overflow-y-auto">
              {result.errors.map((err, i) => (
                <p key={i}>• {err}</p>
              ))}
            </div>
          )}
        </div>
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
