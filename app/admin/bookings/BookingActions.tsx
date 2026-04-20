'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/admin/components/ToastProvider';
import ConfirmDialog, { useConfirmDialog } from '@/app/admin/components/ConfirmDialog';
import { ADMIN_ACTIONS_HELP, helpAttrs } from '@/app/admin/components/adminHelpContent';
import { BOOKING_STATUS_OPTIONS, DELETABLE_BOOKING_STATUSES } from '@/lib/constants';
import { fetchWithCsrf } from '@/lib/csrf';

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

  const canDelete = (DELETABLE_BOOKING_STATUSES as readonly string[]).includes(status);
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
        className="ap-input px-2 py-1.5 text-xs"
        title={ADMIN_ACTIONS_HELP.booking.status.title}
        aria-label={ADMIN_ACTIONS_HELP.booking.status.title}
        {...helpAttrs(ADMIN_ACTIONS_HELP.booking.status)}
      >
        {BOOKING_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <Link href={calendarHref} className="ap-btn ap-btn--secondary px-3 py-1.5 text-xs" {...helpAttrs(ADMIN_ACTIONS_HELP.booking.calendar)}>
        Calendari
      </Link>
      {customerId && (
        <Link href={`/admin/clientes/${customerId}`} className="ap-btn ap-btn--secondary px-3 py-1.5 text-xs" {...helpAttrs(ADMIN_ACTIONS_HELP.booking.customer)}>
          Client
        </Link>
      )}
      <Link href={`/admin/bookings/${id}`} className="ap-btn ap-btn--secondary px-3 py-1.5 text-xs" {...helpAttrs(ADMIN_ACTIONS_HELP.booking.view)}>
        Veure
      </Link>
      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          type="button"
          aria-busy={isDeleting}
          className="ap-btn admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger px-3 py-1.5 text-xs disabled:opacity-50"
          {...helpAttrs(ADMIN_ACTIONS_HELP.booking.remove)}
        >
          {isDeleting ? 'Eliminant...' : 'Eliminar'}
        </button>
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
