'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const DELETABLE_STATUSES = new Set(['PENDING', 'CANCELLED']);

export default function BookingActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = DELETABLE_STATUSES.has(status);

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

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/admin/bookings/${id}`}
        className="inline-flex items-center rounded-md bg-stone-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-stone-100"
      >
        Veure
      </Link>
      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex items-center rounded-md bg-red-100 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
        >
          {isDeleting ? 'Eliminant...' : 'Eliminar'}
        </button>
      )}
    </div>
  );
}
