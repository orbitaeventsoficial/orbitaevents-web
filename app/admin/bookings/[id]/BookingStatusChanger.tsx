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
  PENDING: { label: 'Pendent', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  CONFIRMED: { label: 'Confirmada', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  PREPARING: { label: 'Preparant', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  COMPLETED: { label: 'Completada', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  CANCELLED: { label: 'Cancel·lada', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
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

      // Si s'han actualitzat les stats, mostrar notificació
      if (data.statsUpdated) {
        alert(`✅ Event completat!\n\nLes estadístiques s'han actualitzat:\n• +1 event\n• +${guestCount} persones`);
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
              className={`
                px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all
                ${isActive
                  ? `${conf.bg} ${conf.text} ${conf.border} cursor-default`
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
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
        <div className="mt-2 p-2 bg-red-50 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Confirmation Modal for COMPLETED */}
      {showConfirmComplete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Marcar com a Completat?
            </h3>
            <p className="text-slate-600 mb-4">
              Aquesta acció actualitzarà automàticament les estadístiques públiques:
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-emerald-800">
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
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                disabled={isLoading}
              >
                Cancel·lar
              </button>
              <button
                onClick={() => updateStatus('COMPLETED')}
                disabled={isLoading}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
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
