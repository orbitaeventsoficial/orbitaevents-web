'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/constants';
import ConfirmDialog, { useConfirmDialog } from '../../components/ConfirmDialog';
import { fetchWithCsrf } from '@/lib/csrf';

interface InvoiceData {
  id: string;
  reference: string;
  status: string;
  total: number;
  holdedInvoiceUrl?: string | null;
  holdedSyncError?: string | null;
  createdAt: string;
}

const STATUS_STYLES: Record<string, { label: string; color: string; icon: string }> = {
  DRAFT: { label: 'Esborrany', color: 'text-white/70 bg-white/10 border-white/15', icon: '📝' },
  PENDING_SYNC: { label: 'Sincronitzant...', color: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/40', icon: '🔄' },
  SYNCED: { label: 'Sincronitzada', color: 'text-blue-300 bg-blue-500/20 border-blue-500/40', icon: '☁️' },
  SYNC_ERROR: { label: 'Error sync', color: 'text-rose-300 bg-rose-500/20 border-rose-500/40', icon: '⚠️' },
  PAID: { label: 'Pagada', color: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40', icon: '✓' },
  CANCELLED: { label: 'Cancel\u00B7lada', color: 'text-white/40 bg-white/20/10 border-white/20/30', icon: '✕' },
};

const Spinner = () => (
  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
);

export default function InvoiceSection({
  bookingId,
  invoices,
}: {
  bookingId: string;
  invoices: InvoiceData[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { confirm, dialogProps } = useConfirmDialog();

  const activeInvoice = invoices.find((inv) => inv.status !== 'CANCELLED');

  const apiCall = useCallback(async (url: string, options: RequestInit) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetchWithCsrf(url, options);
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Error');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }, [router]);

  const createInvoice = useCallback(() => {
    apiCall('/api/admin/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    });
  }, [bookingId, apiCall]);

  const retrySync = useCallback((invoiceId: string) => {
    apiCall(`/api/admin/invoices/${invoiceId}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  }, [apiCall]);

  const markPaid = useCallback((invoiceId: string) => {
    apiCall(`/api/admin/invoices/${invoiceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PAID' }),
    });
  }, [apiCall]);

  const cancelInvoice = useCallback(async (invoiceId: string) => {
    const ok = await confirm({
      title: 'Cancel\u00B7lar factura',
      message: 'Segur que vols cancel\u00B7lar aquesta factura? Aquesta accio no es pot desfer.',
      confirmLabel: 'Cancel\u00B7lar factura',
      variant: 'danger',
    });
    if (!ok) return;
    apiCall(`/api/admin/invoices/${invoiceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
  }, [apiCall, confirm]);

  const canMarkPaid = activeInvoice && ['DRAFT', 'SYNCED', 'PENDING_SYNC', 'SYNC_ERROR'].includes(activeInvoice.status);
  const canCancel = activeInvoice && activeInvoice.status !== 'PAID' && activeInvoice.status !== 'CANCELLED';
  const statusStyle = activeInvoice ? STATUS_STYLES[activeInvoice.status] : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">🧾</span>
        <h3 className="text-sm font-semibold uppercase tracking-wide">Factura</h3>
      </div>

      {!activeInvoice && (
        <div className="flex items-center justify-between rounded-xl border border-dashed border-white/10 p-4">
          <p className="text-sm text-white/40">Sense factura generada</p>
          <button
            type="button"
            onClick={createInvoice}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-2 text-xs font-semibold text-cyan-200 transition-colors hover:bg-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? <Spinner /> : '+'}
            Crear factura
          </button>
        </div>
      )}

      {activeInvoice && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold">{activeInvoice.reference}</span>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusStyle?.color || ''}`}>
                <span>{statusStyle?.icon}</span>
                {statusStyle?.label || activeInvoice.status}
              </span>
            </div>
            <span className="text-lg font-bold">{formatCurrency(activeInvoice.total)}</span>
          </div>

          {/* Sync error */}
          {activeInvoice.status === 'SYNC_ERROR' && activeInvoice.holdedSyncError && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5">
              <p className="text-xs text-rose-300 mb-2.5">{activeInvoice.holdedSyncError}</p>
              <button
                type="button"
                onClick={() => retrySync(activeInvoice.id)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-200 transition-colors hover:bg-rose-500/10 disabled:opacity-50"
              >
                {busy ? <Spinner /> : '🔄'}
                Reintentar sync
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {activeInvoice.holdedInvoiceUrl && (
              <a
                href={activeInvoice.holdedInvoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/5 hover:border-white/20"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Veure a Holded
              </a>
            )}

            {canMarkPaid && (
              <button
                type="button"
                onClick={() => markPaid(activeInvoice.id)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
              >
                {busy ? <Spinner /> : '✓'}
                Marcar pagada
              </button>
            )}

            {canCancel && (
              <button
                type="button"
                onClick={() => cancelInvoice(activeInvoice.id)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/5 hover:text-white/70 disabled:opacity-50"
              >
                {busy ? <Spinner /> : '✕'}
                Cancel{'\u00B7'}lar
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 py-2">
          <span className="text-rose-400 text-xs">⚠️</span>
          <p className="text-xs text-rose-300 flex-1">{error}</p>
          <button type="button" onClick={() => setError(null)} className="text-rose-400/50 hover:text-rose-400 text-xs">✕</button>
        </div>
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
