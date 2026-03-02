'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { log } from '@/lib/logger';

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'COMPLETED' | 'CANCELLED';

export default function BookingStatusQuickActions({
  bookingId,
  currentStatus,
}: {
  bookingId: string;
  currentStatus: BookingStatus;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const onChange = async (nextStatus: BookingStatus) => {
    if (saving || nextStatus === currentStatus) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch (err) {
      log.error('Failed to update booking status', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      value={currentStatus}
      onChange={(e) => onChange(e.target.value as BookingStatus)}
      disabled={saving}
      className="rounded-xl border px-2 py-1 text-[11px]"
      title="Canviar estat reserva"
      aria-label="Canviar estat reserva"
    >
      <option value="PENDING">Pendent</option>
      <option value="CONFIRMED">Confirmada</option>
      <option value="PREPARING">Preparant</option>
      <option value="COMPLETED">Completada</option>
      <option value="CANCELLED">Cancel·lada</option>
    </select>
  );
}

