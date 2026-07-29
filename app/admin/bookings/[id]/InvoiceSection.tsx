'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency, getInvoiceStatusDisplay } from '@/lib/constants';
import ConfirmDialog, { useConfirmDialog } from '../../components/ConfirmDialog';
import { fetchWithCsrf } from '@/lib/csrf';
import { ADMIN_BOOKING_HELP_2, helpAttrs } from '@/app/admin/components/adminHelpContent';

interface InvoiceData {
  id: string;
  reference: string;
  status: string;
  total: number;
  holdedInvoiceUrl?: string | null;
  holdedSyncError?: string | null;
  pdfUrl?: string | null;
  createdAt: string;
}

type InvoiceActionErrorTarget = 'create' | 'retry-sync' | 'mark-paid' | 'cancel';


const Spinner = () => <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />;

export default function InvoiceSection({
  bookingId,
  invoices,
  customerHref,
  leadHref,
}: {
  bookingId: string;
  invoices: InvoiceData[];
  customerHref?: string | null;
  leadHref?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{
    message: string;
    target: InvoiceActionErrorTarget;
    invoiceId?: string;
  } | null>(null);
  const { confirm, dialogProps } = useConfirmDialog();

  const activeInvoice = invoices.find((inv) => inv.status !== 'CANCELLED');
  const hasContextLinks = Boolean(customerHref || leadHref);

  const apiCall = useCallback(async (
    url: string,
    options: RequestInit,
    target: InvoiceActionErrorTarget,
    invoiceId?: string,
  ) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetchWithCsrf(url, options);
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.ok) throw new Error(payload?.error || 'Error');
      router.refresh();
    } catch (err) {
      console.error('[InvoiceSection] Error en accio de factura', { url, error: err });
      setError({ message: err instanceof Error ? err.message : 'Error', target, invoiceId });
    } finally {
      setBusy(false);
    }
  }, [router]);

  const createInvoice = useCallback(() => {
    apiCall('/api/admin/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId }) }, 'create');
  }, [bookingId, apiCall]);

  const retrySync = useCallback((invoiceId: string) => {
    apiCall(`/api/admin/invoices/${invoiceId}/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, 'retry-sync', invoiceId);
  }, [apiCall]);

  const markPaid = useCallback((invoiceId: string) => {
    apiCall(`/api/admin/invoices/${invoiceId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'PAID' }) }, 'mark-paid', invoiceId);
  }, [apiCall]);

  const cancelInvoice = useCallback(async (invoiceId: string) => {
    const ok = await confirm({ title: 'Cancel·lar factura', message: 'Segur que vols cancel·lar aquesta factura? Aquesta acció no es pot desfer.', confirmLabel: 'Cancel·lar factura', variant: 'danger' });
    if (!ok) return;
    apiCall(`/api/admin/invoices/${invoiceId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'CANCELLED' }) }, 'cancel', invoiceId);
  }, [apiCall, confirm]);

  const hasError = (target: InvoiceActionErrorTarget, invoiceId?: string) =>
    error?.target === target && (!invoiceId || error.invoiceId === invoiceId);

  const canMarkPaid = activeInvoice && ['DRAFT', 'SYNCED', 'PENDING_SYNC', 'SYNC_ERROR'].includes(activeInvoice.status);
  const canCancel = activeInvoice && activeInvoice.status !== 'PAID' && activeInvoice.status !== 'CANCELLED';
  const statusDisplay = activeInvoice ? getInvoiceStatusDisplay(activeInvoice.status) : null;

  return (
    <div className="ap-card rounded-2xl p-5" {...helpAttrs(ADMIN_BOOKING_HELP_2.invoice.root)}>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-base">🧾</span>
        <h3 className="text-sm font-semibold uppercase tracking-wide">Factura</h3>
      </div>

      {hasContextLinks && (
        <div className="mb-4 rounded-xl border p-3 admin-tone-border-neutral admin-tone-bg-neutral">
          <p className="text-xs font-semibold uppercase tracking-wide admin-tone-text-slate">Context de la factura</p>
          <p className="mt-1 text-sm admin-tone-text-slate">
            Aquesta factura neix de la reserva actual i manté accés directe al client i a l'entrada original.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {customerHref && (
              <Link href={customerHref} className="ap-btn ap-btn--secondary text-xs">
                Client 360
              </Link>
            )}
            {leadHref && (
              <Link href={leadHref} className="ap-btn ap-btn--secondary text-xs">
                Lead origen
              </Link>
            )}
          </div>
        </div>
      )}

      {!activeInvoice && (
        <div className="flex items-center justify-between rounded-xl border border-dashed p-4 admin-tone-border-neutral">
          <p className="text-sm admin-tone-text-slate">Sense factura generada</p>
          <button
            type="button"
            onClick={createInvoice}
            disabled={busy}
            aria-invalid={hasError('create') ? true : undefined}
            className="ap-btn ap-btn--primary disabled:opacity-50 disabled:cursor-not-allowed"
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
              <span className={statusDisplay?.className || 'ap-badge'}>
                <span>{statusDisplay?.icon}</span>
                {statusDisplay?.label || activeInvoice.status}
              </span>
            </div>
            <span className="text-lg font-bold">{formatCurrency(activeInvoice.total)}</span>
          </div>

          {activeInvoice.status === 'SYNC_ERROR' && activeInvoice.holdedSyncError && (
            <div className="ap-inline-alert ap-inline-alert--danger" role="alert">
              <p className="mb-2.5 text-xs">{activeInvoice.holdedSyncError}</p>
              <button
                type="button"
                onClick={() => retrySync(activeInvoice.id)}
                disabled={busy}
                aria-invalid={hasError('retry-sync', activeInvoice.id) ? true : undefined}
                className="ap-btn ap-btn--secondary text-xs disabled:opacity-50"
              >
                {busy ? <Spinner /> : '🔄'}
                Reintentar sync
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2" {...helpAttrs(ADMIN_BOOKING_HELP_2.invoice.actions)}>
            {activeInvoice.pdfUrl && (
              <a href={activeInvoice.pdfUrl} target="_blank" rel="noopener noreferrer" className="ap-btn ap-btn--secondary text-xs">
                Obrir PDF
              </a>
            )}
            {activeInvoice.holdedInvoiceUrl && (
              <a href={activeInvoice.holdedInvoiceUrl} target="_blank" rel="noopener noreferrer" className="ap-btn ap-btn--secondary text-xs">
                Veure a Holded
              </a>
            )}
            {canMarkPaid && (
              <button
                type="button"
                onClick={() => markPaid(activeInvoice.id)}
                disabled={busy}
                aria-invalid={hasError('mark-paid', activeInvoice.id) ? true : undefined}
                className="ap-btn ap-btn--primary text-xs disabled:opacity-50"
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
                aria-invalid={hasError('cancel', activeInvoice.id) ? true : undefined}
                className="ap-btn ap-btn--danger text-xs disabled:opacity-50"
              >
                {busy ? <Spinner /> : '✕'}
                Cancel·lar
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 ap-inline-alert ap-inline-alert--danger flex items-center gap-2" role="alert">
          <span className="text-xs">⚠️</span>
          <p className="flex-1 text-xs">{error.message}</p>
          <button type="button" onClick={() => setError(null)} className="text-xs" aria-label="Tancar error">✕</button>
        </div>
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
