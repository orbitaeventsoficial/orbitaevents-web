'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/admin/components/ToastProvider';
import ConfirmDialog from '@/app/admin/components/ConfirmDialog';
import { useConfirmDialog } from '@/app/admin/components/ConfirmDialog';
import { fetchWithCsrf } from '@/lib/csrf';

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
  const toast = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { confirm, dialogProps } = useConfirmDialog();

  const canDelete = DELETABLE_STATUSES.has(status);
  const calendarHref = eventDate
    ? `/admin/calendario?date=${encodeURIComponent(eventDate.slice(0, 10))}`
    : '/admin/calendario';

  const handleDelete = async () => {
    if (!canDelete || isDeleting) return;
    const confirmed = await confirm({
      title: 'Eliminar reserva',
      message: 'Segur que vols eliminar aquesta reserva? Aquesta acció no es pot desfer.',
      variant: 'danger',
      confirmLabel: 'Eliminar',
    });
    if (!confirmed) return;
    setIsDeleting(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || 'Error eliminant reserva');
      }
      toast.success('Reserva eliminada');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error eliminant reserva');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (nextStatus: string) => {
    if (isUpdatingStatus || nextStatus === status) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || "Error actualitzant l'estat");
      }
      toast.success(`Estat canviat a ${nextStatus}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error actualitzant l'estat");
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
        className="rounded-xl border px-2 py-1.5 text-xs"
        title="Canviar estat"
        aria-label="Canviar estat reserva"
      >
        <option value="PENDING">Pendent</option>
        <option value="CONFIRMED">Confirmada</option>
        <option value="PREPARING">Preparant</option>
        <option value="COMPLETED">Completada</option>
        <option value="CANCELLED">Cancel·lada</option>
      </select>
      <Link
        href={calendarHref}
        className="inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-medium border transition-colors"
      >
        Calendari
      </Link>
      {customerId && (
        <Link
          href={`/admin/clientes/${customerId}`}
          className="inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-medium border transition-colors"
        >
          Client
        </Link>
      )}
      <Link
        href={`/admin/bookings/${id}`}
        className="inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-medium border transition-colors"
      >
        Veure
      </Link>
      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          type="button"
          aria-busy={isDeleting}
          className="inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-medium border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
        >
          {isDeleting ? 'Eliminant...' : 'Eliminar'}
        </button>
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

