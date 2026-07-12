'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import { formatDateTimeFull, getDeliveryNoteStatusDisplay } from '@/lib/constants';
import ConfirmDialog, { useConfirmDialog } from '../../components/ConfirmDialog';

interface DeliveryNoteData {
  id: string;
  reference: string;
  status: string;
  deliveredAt?: string | null;
  signedAt?: string | null;
  signedBy?: string | null;
  pdfUrl?: string | null;
  createdAt: string;
}

type DeliveryNoteActionTarget = 'create' | 'deliver' | 'sign' | 'cancel' | 'pdf';

const Spinner = () => <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />;

export default function DeliveryNoteSection({
  bookingId,
  deliveryNotes,
}: {
  bookingId: string;
  deliveryNotes: DeliveryNoteData[];
}) {
  const router = useRouter();
  const { confirm, dialogProps } = useConfirmDialog();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; target: DeliveryNoteActionTarget; id?: string } | null>(null);
  const activeDeliveryNote = deliveryNotes.find((deliveryNote) => deliveryNote.status !== 'CANCELLED');
  const statusDisplay = activeDeliveryNote ? getDeliveryNoteStatusDisplay(activeDeliveryNote.status) : null;

  const apiCall = useCallback(async (
    url: string,
    options: RequestInit,
    target: DeliveryNoteActionTarget,
    id?: string,
  ) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetchWithCsrf(url, options);
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.ok) throw new Error(payload?.error || 'Error');
      router.refresh();
    } catch (err) {
      console.error('[DeliveryNoteSection] Error en accio d’albarà', { url, error: err });
      setError({ message: err instanceof Error ? err.message : 'Error', target, id });
    } finally {
      setBusy(false);
    }
  }, [router]);

  const createDeliveryNote = useCallback(() => {
    apiCall('/api/admin/delivery-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    }, 'create');
  }, [apiCall, bookingId]);

  const updateStatus = useCallback((id: string, status: 'DELIVERED' | 'SIGNED' | 'CANCELLED', target: DeliveryNoteActionTarget) => {
    apiCall(`/api/admin/delivery-notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }, target, id);
  }, [apiCall]);

  const cancelDeliveryNote = useCallback(async (id: string) => {
    const ok = await confirm({
      title: 'Cancel·lar albarà',
      message: 'Segur que vols cancel·lar aquest albarà? Es conservarà a l’històric com a cancel·lat.',
      confirmLabel: 'Cancel·lar albarà',
      variant: 'danger',
    });
    if (!ok) return;
    updateStatus(id, 'CANCELLED', 'cancel');
  }, [confirm, updateStatus]);

  const hasError = (target: DeliveryNoteActionTarget, id?: string) =>
    error?.target === target && (!id || error.id === id);

  const generatePdf = useCallback((id: string) => {
    apiCall(`/api/admin/delivery-notes/${id}/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, 'pdf', id);
  }, [apiCall]);

  const canDeliver = activeDeliveryNote && activeDeliveryNote.status === 'DRAFT';
  const canSign = activeDeliveryNote && (activeDeliveryNote.status === 'DRAFT' || activeDeliveryNote.status === 'DELIVERED');
  const canCancel = activeDeliveryNote && activeDeliveryNote.status !== 'SIGNED' && activeDeliveryNote.status !== 'CANCELLED';

  return (
    <div className="ap-card rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-base">📋</span>
        <h3 className="text-sm font-semibold uppercase tracking-wide">Albarà</h3>
      </div>

      {!activeDeliveryNote && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed p-4 admin-tone-border-neutral">
          <div>
            <p className="text-sm font-semibold text-[var(--t)]">Sense albarà operatiu</p>
            <p className="mt-1 text-xs admin-tone-text-slate">Crea’l quan el bolo ja està preparat per deixar constància del servei executat.</p>
          </div>
          <button
            type="button"
            onClick={createDeliveryNote}
            disabled={busy}
            aria-invalid={hasError('create') ? true : undefined}
            className="ap-btn ap-btn--primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <Spinner /> : '+'}
            Crear albarà
          </button>
        </div>
      )}

      {activeDeliveryNote && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold">{activeDeliveryNote.reference}</span>
              <span className={statusDisplay?.className || 'ap-badge'}>
                <span>{statusDisplay?.icon}</span>
                {statusDisplay?.label || activeDeliveryNote.status}
              </span>
            </div>
            <span className="text-xs text-[var(--t3)]">{formatDateTimeFull(activeDeliveryNote.createdAt)}</span>
          </div>

          <dl className="grid grid-cols-1 gap-2 text-xs text-[var(--t2)] sm:grid-cols-2">
            <div className="rounded-xl border p-3 admin-tone-border-neutral admin-tone-bg-neutral">
              <dt className="font-mono uppercase tracking-wide text-[var(--t3)]">Lliurat</dt>
              <dd className="mt-1 font-semibold">{activeDeliveryNote.deliveredAt ? formatDateTimeFull(activeDeliveryNote.deliveredAt) : 'Pendent'}</dd>
            </div>
            <div className="rounded-xl border p-3 admin-tone-border-neutral admin-tone-bg-neutral">
              <dt className="font-mono uppercase tracking-wide text-[var(--t3)]">Signatura</dt>
              <dd className="mt-1 font-semibold">
                {activeDeliveryNote.signedAt ? `${activeDeliveryNote.signedBy || 'Client'} · ${formatDateTimeFull(activeDeliveryNote.signedAt)}` : 'Pendent'}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2">
            {activeDeliveryNote.pdfUrl ? (
              <a
                href={activeDeliveryNote.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ap-btn ap-btn--secondary text-xs"
              >
                📎
                Obrir PDF
              </a>
            ) : (
              <button
                type="button"
                onClick={() => generatePdf(activeDeliveryNote.id)}
                disabled={busy}
                aria-invalid={hasError('pdf', activeDeliveryNote.id) ? true : undefined}
                className="ap-btn ap-btn--secondary text-xs disabled:opacity-50"
              >
                {busy ? <Spinner /> : '📎'}
                Generar PDF
              </button>
            )}
            {canDeliver && (
              <button
                type="button"
                onClick={() => updateStatus(activeDeliveryNote.id, 'DELIVERED', 'deliver')}
                disabled={busy}
                aria-invalid={hasError('deliver', activeDeliveryNote.id) ? true : undefined}
                className="ap-btn ap-btn--secondary text-xs disabled:opacity-50"
              >
                {busy ? <Spinner /> : '✓'}
                Marcar lliurat
              </button>
            )}
            {canSign && (
              <button
                type="button"
                onClick={() => updateStatus(activeDeliveryNote.id, 'SIGNED', 'sign')}
                disabled={busy}
                aria-invalid={hasError('sign', activeDeliveryNote.id) ? true : undefined}
                className="ap-btn ap-btn--primary text-xs disabled:opacity-50"
              >
                {busy ? <Spinner /> : '✓'}
                Marcar signat
              </button>
            )}
            {canCancel && (
              <button
                type="button"
                onClick={() => cancelDeliveryNote(activeDeliveryNote.id)}
                disabled={busy}
                aria-invalid={hasError('cancel', activeDeliveryNote.id) ? true : undefined}
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
