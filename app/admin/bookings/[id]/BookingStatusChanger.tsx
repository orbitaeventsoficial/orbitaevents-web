'use client';

// Component client per canviar l'estat d'una reserva
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog, { useConfirmDialog } from '../../components/ConfirmDialog';
import { BOOKING_STATUS_ORDER, getBookingStatusDisplay } from '@/lib/constants';
import { fetchWithCsrf } from '@/lib/csrf';

interface Props {
  bookingId: string;
  currentStatus: string;
  guestCount: number;
}


export function BookingStatusChanger({ bookingId, currentStatus, guestCount }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showConfirmComplete, setShowConfirmComplete] = useState(false);
  const { confirm: confirmDialog, dialogProps } = useConfirmDialog();

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === 'COMPLETED' && currentStatus !== 'COMPLETED') {
      setShowConfirmComplete(true);
      return;
    }

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

      if (!res.ok) {
        throw new Error(data.error || 'Error canviant estat');
      }

      router.refresh();

      const msgs: string[] = [];
      if (data.statsUpdated) {
        msgs.push(`Estadistiques actualitzades: +1 event, +${guestCount} persones`);
      }
      if (data.calendarSync?.status === 'synced') {
        msgs.push('Google Calendar sincronitzat');
      } else if (data.calendarSync?.status === 'error') {
        msgs.push(`Calendar sync error: ${data.calendarSync.error || 'desconegut'}`);
      }
      if (msgs.length > 0) {
        setSuccessMsg(msgs.join(' | '));
        setTimeout(() => setSuccessMsg(null), 6000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconegut');
    } finally {
      setIsLoading(false);
      setShowConfirmComplete(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2">
        {BOOKING_STATUS_ORDER.map((status) => {
          const conf = getBookingStatusDisplay(status);
          const isActive = status === currentStatus;

          return (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={isLoading || isActive}
              type="button"
              aria-pressed={isActive}
              className={`
                px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all
                ${isActive
                  ? `${conf.bg} ${conf.text} ${conf.border} cursor-default`
                  : 'admin-tone-idle'
                }
                ${isLoading ? 'opacity-50 cursor-wait' : ''}
                disabled:cursor-not-allowed
              `}
            >
              {isActive && '✓ '}
              {conf.label}
            </button>
          );
        })}
      </div>

      {successMsg && (
        <div className="mt-2 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs" role="status">
          <span>✓</span>
          <span className="flex-1">{successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg(null)}>✕</button>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs" role="alert">
          <span>⚠️</span>
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {showConfirmComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" role="presentation">
          <div
            className="mx-4 max-w-md rounded-2xl border p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-complete-title"
          >
            <h3 id="confirm-complete-title" className="mb-2 text-lg font-semibold">
              Marcar com a Completat?
            </h3>
            <p className="mb-4">
              Aquesta acció actualitzarà automàticament les estadístiques públiques:
            </p>
            <div className="mb-4 rounded-xl border p-4">
              <p className="text-sm">
                <strong>+1</strong> event realitzat<br />
                <strong>+{guestCount}</strong> persones feliçes
              </p>
            </div>
            <p className="mb-4 text-xs">
              Aquests números apareixeran a la web pública.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmComplete(false)}
                className="px-4 py-2 text-sm font-medium transition-colors"
                disabled={isLoading}
                type="button"
              >
                Cancel·lar
              </button>
              <button
                onClick={() => updateStatus('COMPLETED')}
                disabled={isLoading}
                type="button"
                aria-busy={isLoading}
                className="rounded-xl px-4 py-2 text-sm font-medium text-white shadow-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Actualitzant...' : 'Sí, Completar Event'}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}






