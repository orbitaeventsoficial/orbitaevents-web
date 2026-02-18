'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const DELETABLE_STATUSES = new Set(['PENDING', 'CANCELLED']);

export default function BookingActions({
  id,
  status,
  eventDate,
  customerId,
}: {
  id: string;
  status: string;
  eventDate?: string;
  customerId?: string | null;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const canDelete = DELETABLE_STATUSES.has(status);
  const calendarHref = eventDate
    ? `/admin/calendario?date=${encodeURIComponent(eventDate.slice(0, 10))}`
    : '/admin/calendario';

  const handleDelete = async () => {
    if (!canDelete || isDeleting) return;
    if (!confirm('Segur que vols eliminar aquesta reserva?')) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || 'Error eliminant reserva');
      }
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error eliminant reserva');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (nextStatus: string) => {
    if (isUpdatingStatus || nextStatus === status) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/bookings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || "Error actualitzant l'estat");
      }
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error actualitzant l'estat");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={isUpdatingStatus}
        className="rounded-lg border border-slate-600/50 bg-slate-800/80 px-2 py-1.5 text-xs text-slate-200"
        title="Canviar estat"
      >
        <option value="PENDING">Pendent</option>
        <option value="CONFIRMED">Confirmada</option>
        <option value="PREPARING">Preparant</option>
        <option value="COMPLETED">Completada</option>
        <option value="CANCELLED">Cancel·lada</option>
      </select>
      <Link
        href={calendarHref}
        className="inline-flex items-center rounded-lg bg-indigo-500/20 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 transition-colors"
      >
        Calendari
      </Link>
      {customerId && (
        <Link
          href={`/admin/contactes/${customerId}`}
          className="inline-flex items-center rounded-lg bg-violet-500/20 px-3 py-1.5 text-xs font-medium text-violet-300 hover:bg-violet-500/30 border border-violet-500/30 transition-colors"
        >
          Client
        </Link>
      )}
      <Link
        href={`/admin/bookings/${id}`}
        className="inline-flex items-center rounded-lg bg-slate-700/50 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-600/50 border border-slate-600/50 transition-colors"
      >
        Veure
      </Link>
      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          type="button"
          aria-busy={isDeleting}
          className="inline-flex items-center rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 transition-colors disabled:opacity-50"
        >
          {isDeleting ? 'Eliminant...' : 'Eliminar'}
        </button>
      )}
    </div>
  );
}
