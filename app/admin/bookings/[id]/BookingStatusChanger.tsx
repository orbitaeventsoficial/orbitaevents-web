'use client';

// Component client per canviar l'estat d'una reserva
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog, { useConfirmDialog } from '../../components/ConfirmDialog';
import { fetchWithCsrf } from '@/lib/csrf';

interface Props {
  bookingId: string;
  currentStatus: string;
  guestCount: number;
}

// Local config kept because it includes a `border` class not present in the
// centralized BOOKING_STATUS_CONFIG (which only has bg + text + label).
const BOOKING_STATUS_CONFIG_LOCAL: Record<string, { label: string; bg: string; text: string; border: string }> = {
  PENDING: { label: 'Pendent', bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30' },
  CONFIRMED: { label: 'Confirmada', bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  PREPARING: { label: 'Preparant', bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' },
  COMPLETED: { label: 'Completada', bg: 'bg-teal-500/20', text: 'text-teal-300', border: 'border-teal-500/30' },
  CANCELLED: { label: 'Cancel·lada', bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/30' },
};

const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'PREPARING', 'COMPLETED', 'CANCELLED'];

export function BookingStatusChanger({ bookingId, currentStatus, guestCount }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showConfirmComplete, setShowConfirmComplete] = useState(false);
  const { confirm: confirmDialog, dialogProps } = useConfirmDialog();

  const handleStatusChange = async (newStatus: string) => {
    // Si canviem a COMPLETED, mostrar confirmació
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

      // Refrescar la pàgina
      router.refresh();

      // Notificacions informatives
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
      {/* Status Buttons */}
      <div className="flex flex-wrap gap-2">
        {STATUS_ORDER.map((status) => {
          const conf = BOOKING_STATUS_CONFIG_LOCAL[status];
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
                  : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20 hover:text-white/60'
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

      {/* Success */}
      {successMsg && (
        <div className="mt-2 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs" role="status">
          <span>✓</span>
          <span className="flex-1">{successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg(null)} className="">✕</button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-2 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs" role="alert">
          <span>⚠️</span>
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} className="">✕</button>
        </div>
      )}

      {/* Confirmation Modal for COMPLETED */}
      {showConfirmComplete && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" role="presentation">
          <div
            className="border rounded-2xl p-6 max-w-md mx-4 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-complete-title"
          >
            <h3 id="confirm-complete-title" className="text-lg font-semibold mb-2">
              Marcar com a Completat?
            </h3>
            <p className="mb-4">
              Aquesta acció actualitzarà automàticament les estadístiques públiques:
            </p>
            <div className="border rounded-xl p-4 mb-4">
              <p className="text-sm">
                <strong>+1</strong> event realitzat<br />
                <strong>+{guestCount}</strong> persones feliçes
              </p>
            </div>
            <p className="text-xs mb-4">
              Aquests números apareixeran a la web pública.
            </p>
            <div className="flex gap-3 justify-end">
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
                className="px-4 py-2 text-white text-sm font-medium rounded-xl disabled:opacity-50 shadow-lg transition-colors"
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

