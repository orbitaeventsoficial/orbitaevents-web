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
