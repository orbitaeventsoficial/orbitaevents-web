'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog, { useConfirmDialog } from '../../components/ConfirmDialog';
import { BOOKING_STATUS_ORDER, getBookingStatusDisplay } from '@/lib/constants';
import { fetchWithCsrf } from '@/lib/csrf';
import { ADMIN_BOOKING_HELP_3, helpAttrs } from '@/app/admin/components/adminHelpContent';

interface Props {
  bookingId: string;
  currentStatus: string;
  guestCount: number;
}

const STATUS_DOT: Record<string, string> = {
  PENDING:   'bg-[var(--o-warning)]',
  CONFIRMED: 'bg-[var(--o-success)]',
  PREPARING: 'bg-[var(--o-info)]',
  COMPLETED: 'bg-[var(--o-success)]',
  CANCELLED: 'bg-[var(--o-danger)]',
};

export function BookingStatusChanger({ bookingId, currentStatus, guestCount }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showConfirmComplete, setShowConfirmComplete] = useState(false);
  const { confirm: confirmDialog, dialogProps } = useConfirmDialog();
  const ref = useRef<HTMLDivElement>(null);

  const conf = getBookingStatusDisplay(currentStatus);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleStatusChange = async (newStatus: string) => {
    setOpen(false);
    if (newStatus === currentStatus) return;
    if (newStatus === 'COMPLETED') { setShowConfirmComplete(true); return; }
    await updateStatus(newStatus);
  };

  const updateStatus = async (newStatus: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error canviant estat');
      router.refresh();
      const msgs: string[] = [];
      if (data.statsUpdated) msgs.push(`+1 event, +${guestCount} persones`);
      if (data.calendarSync?.status === 'synced') msgs.push('Calendar sync ✓');
      if (msgs.length > 0) {
        setSuccessMsg(msgs.join(' · '));
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconegut');
    } finally {
      setIsLoading(false);
      setShowConfirmComplete(false);
    }
  };

  return (
    <div className="relative" ref={ref} {...helpAttrs(ADMIN_BOOKING_HELP_3.status.root)}>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isLoading}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`bd__status-chip ${conf.bg} ${conf.text} ${conf.border}`}
      >
        <span className={`bd__status-dot ${STATUS_DOT[currentStatus] ?? 'bg-white/30'}`} />
        {conf.label}
        <svg className="bd__status-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true" style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }}>
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="bd__status-menu" role="listbox" aria-label="Canviar estat">
          {BOOKING_STATUS_ORDER.map((status) => {
            const c = getBookingStatusDisplay(status);
            const isActive = status === currentStatus;
            return (
              <button
                key={status}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => void handleStatusChange(status)}
                className={`bd__status-opt${isActive ? ' bd__status-opt--on' : ''}`}
              >
                <span className={`bd__status-dot ${STATUS_DOT[status] ?? 'bg-white/30'}`} />
                {c.label}
                {isActive && <span className="ml-auto opacity-50 text-[10px]">actiu</span>}
              </button>
            );
          })}
        </div>
      )}

      {successMsg && (
        <p className="absolute top-full left-0 mt-1 text-[11px] text-[var(--o-success)] whitespace-nowrap pointer-events-none">
          ✓ {successMsg}
        </p>
      )}
      {error && (
        <p className="absolute top-full left-0 mt-1 text-[11px] text-[var(--o-danger)] whitespace-nowrap pointer-events-none">
          ⚠ {error}
        </p>
      )}

      {showConfirmComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" role="presentation">
          <div className="mx-4 max-w-md rounded-2xl border p-6 shadow-xl"
            {...helpAttrs(ADMIN_BOOKING_HELP_3.status.complete)}
            role="dialog" aria-modal="true" aria-labelledby="confirm-complete-title">
            <h3 id="confirm-complete-title" className="mb-2 text-lg font-semibold">Marcar com a Completat?</h3>
            <p className="mb-4">Actualitzarà les estadístiques públiques automàticament:</p>
            <div className="mb-4 rounded-xl border p-4 text-sm">
              <strong>+1</strong> event realitzat · <strong>+{guestCount}</strong> persones feliçes
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirmComplete(false)} className="px-4 py-2 text-sm" disabled={isLoading} type="button">
                Cancel·lar
              </button>
              <button onClick={() => void updateStatus('COMPLETED')} disabled={isLoading} type="button"
                className="rounded-xl px-4 py-2 text-sm font-medium text-white shadow disabled:opacity-50">
                {isLoading ? 'Actualitzant…' : 'Completar'}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
