'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency, getInvoiceStatusDisplay } from '@/lib/constants';
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


const Spinner = () => <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />;

export default function InvoiceSection({ bookingId, invoices }: { bookingId: string; invoices: InvoiceData[] }) {
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
      if (!res.ok || !payload?.ok) throw new Error(payload?.error || 'Error');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }, [router]);

  const createInvoice = useCallback(() => {
    apiCall('/api/admin/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId }) });
  }, [bookingId, apiCall]);

  const retrySync = useCallback((invoiceId: string) => {
    apiCall(`/api/admin/invoices/${invoiceId}/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  }, [apiCall]);

  const markPaid = useCallback((invoiceId: string) => {
    apiCall(`/api/admin/invoices/${invoiceId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'PAID' }) });
  }, [apiCall]);

  const cancelInvoice = useCallback(async (invoiceId: string) => {
    const ok = await confirm({ title: 'Cancel·lar factura', message: 'Segur que vols cancel·lar aquesta factura? Aquesta acció no es pot desfer.', confirmLabel: 'Cancel·lar factura', variant: 'danger' });
    if (!ok) return;
    apiCall(`/api/admin/invoices/${invoiceId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'CANCELLED' }) });
  }, [apiCall, confirm]);

  const canMarkPaid = activeInvoice && ['DRAFT', 'SYNCED', 'PENDING_SYNC', 'SYNC_ERROR'].includes(activeInvoice.status);
  const canCancel = activeInvoice && activeInvoice.status !== 'PAID' && activeInvoice.status !== 'CANCELLED';
  const statusDisplay = activeInvoice ? getInvoiceStatusDisplay(activeInvoice.status) : null;

  return (
    <div className="ap-card rounded-2xl p-5" data-help-title="Factura" data-help-desc="Des d'aquí pots generar, revisar, marcar com pagada o cancel·lar la factura vinculada a la reserva.">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-base">🧾</span>
        <h3 className="text-sm font-semibold uppercase tracking-wide">Factura</h3>
      </div>

      {!activeInvoice && (
        <div className="flex items-center justify-between rounded-xl border border-dashed p-4 admin-tone-border-neutral">
          <p className="text-sm admin-tone-text-slate">Sense factura generada</p>
          <button type="button" onClick={createInvoice} disabled={busy} className="ap-btn ap-btn--primary disabled:opacity-50 disabled:cursor-not-allowed">
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
              <span className={statusDisplay?.className || 'ap-badge'}>
                <span>{statusDisplay?.icon}</span>
                {statusDisplay?.label || activeInvoice.status}
              </span>
            </div>
            <span className="text-lg font-bold">{formatCurrency(activeInvoice.total)}</span>
          </div>

          {activeInvoice.status === 'SYNC_ERROR' && activeInvoice.holdedSyncError && (
            <div className="ap-inline-alert ap-inline-alert--danger">
              <p className="mb-2.5 text-xs">{activeInvoice.holdedSyncError}</p>
              <button type="button" onClick={() => retrySync(activeInvoice.id)} disabled={busy} className="ap-btn ap-btn--secondary text-xs disabled:opacity-50">
                {busy ? <Spinner /> : '🔄'}
                Reintentar sync
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2" data-help-title="Accions de factura" data-help-desc="Mostren les accions disponibles segons l'estat actual: veure a Holded, marcar pagada, reintentar sync o cancel·lar.">
            {activeInvoice.holdedInvoiceUrl && (
              <a href={activeInvoice.holdedInvoiceUrl} target="_blank" rel="noopener noreferrer" className="ap-btn ap-btn--secondary text-xs">
                Veure a Holded
              </a>
            )}
            {canMarkPaid && (
              <button type="button" onClick={() => markPaid(activeInvoice.id)} disabled={busy} className="ap-btn ap-btn--primary text-xs disabled:opacity-50">
                {busy ? <Spinner /> : '✓'}
                Marcar pagada
              </button>
            )}
            {canCancel && (
              <button type="button" onClick={() => cancelInvoice(activeInvoice.id)} disabled={busy} className="ap-btn ap-btn--danger text-xs disabled:opacity-50">
                {busy ? <Spinner /> : '✕'}
                Cancel·lar
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 ap-inline-alert ap-inline-alert--danger flex items-center gap-2">
          <span className="text-xs">⚠️</span>
          <p className="flex-1 text-xs">{error}</p>
          <button type="button" onClick={() => setError(null)} className="text-xs" aria-label="Tancar error">✕</button>
        </div>
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}


