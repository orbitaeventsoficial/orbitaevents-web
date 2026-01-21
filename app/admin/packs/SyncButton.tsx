'use client';

import { useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';

export default function SyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    message?: string;
    stats?: { total: number; created: number; updated: number; errors: number };
    errors?: string[];
  } | null>(null);

  async function handleSync() {
    if (!confirm('Sincronizar tots els packs del config a la base de dades?')) return;

    setSyncing(true);
    setResult(null);

    try {
      const response = await fetchWithCsrf('/api/admin/packs/sync', {
        method: 'POST',
      });

      const data = await response.json();
      setResult(data);

      if (data.ok) {
        // Recargar la página después de 2 segundos para ver los nuevos packs
        setTimeout(() => {
          window.location.reload();
        }, 2000);
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
        className="inline-flex items-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {syncing ? (
          <>
            <span className="animate-spin">⚙️</span>
            Sincronitzant...
          </>
        ) : (
          <>
            🔄 Sincronitzar Packs
          </>
        )}
      </button>

      {result && (
        <div
          className={`mt-4 rounded-lg p-4 ${
            result.ok
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
          role={result.ok ? 'status' : 'alert'}
        >
          <p className={`text-sm font-medium ${result.ok ? 'text-green-800' : 'text-red-800'}`}>
            {result.message || (result.ok ? '✓ Sincronització completada' : '✗ Error')}
          </p>

          {result.stats && (
            <div className="mt-2 text-sm text-slate-600 space-y-1">
              <p>📦 Total: {result.stats.total}</p>
              <p>✓ Creats: {result.stats.created}</p>
              <p>🔄 Actualitzats: {result.stats.updated}</p>
              {result.stats.errors > 0 && (
                <p className="text-red-600">✗ Errors: {result.stats.errors}</p>
              )}
            </div>
          )}

          {result.errors && result.errors.length > 0 && (
            <div className="mt-2 text-xs text-red-600 max-h-32 overflow-y-auto">
              {result.errors.map((err, i) => (
                <p key={i}>• {err}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
