'use client';

// app/admin/bookings/[id]/BookingStatusChanger.tsx
// Component client per canviar l'estat d'una reserva
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  bookingId: string;
  currentStatus: string;
  guestCount: number;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
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
  const [showConfirmComplete, setShowConfirmComplete] = useState(false);

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
      const res = await fetch(`/api/admin/bookings/${bookingId}/status`, {
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

      // Si s\'han actualitzat les stats, mostrar notificació
      if (data.statsUpdated) {
        alert(`✅ Event completat!\n\nLes estadístiques s\'han actualitzat:\n• +1 event\n• +${guestCount} persones`);
      }
      if (data.calendarSync?.status === 'synced') {
        alert('📅 Google Calendar sincronizado automáticamente.');
      } else if (data.calendarSync?.status === 'error') {
        alert(`⚠️ Reserva actualizada, pero falló la sync de Google Calendar: ${data.calendarSync.error || 'error desconocido'}`);
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
          const conf = STATUS_CONFIG[status];
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
                  : 'bg-slate-700/50 text-slate-400 border-slate-600/50 hover:border-slate-500/50 hover:text-slate-300'
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

      {/* Error */}
      {error && (
        <div className="mt-2 p-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm rounded-xl" role="alert">
          {error}
        </div>
      )}

      {/* Confirmation Modal for COMPLETED */}
      {showConfirmComplete && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50" role="presentation">
          <div
            className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6 max-w-md mx-4 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-complete-title"
          >
            <h3 id="confirm-complete-title" className="text-lg font-semibold text-slate-100 mb-2">
              Marcar com a Completat?
            </h3>
            <p className="text-slate-400 mb-4">
              Aquesta acció actualitzarà automàticament les estadístiques públiques:
            </p>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-4">
              <p className="text-sm text-emerald-300">
                <strong>+1</strong> event realitzat<br />
                <strong>+{guestCount}</strong> persones feliçes
              </p>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Aquests números apareixeran a la web pública.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmComplete(false)}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors"
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
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium rounded-xl hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 shadow-lg shadow-emerald-500/20 transition-colors"
              >
                {isLoading ? 'Actualitzant...' : 'Sí, Completar Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

