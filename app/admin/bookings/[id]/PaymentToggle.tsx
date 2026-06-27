'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import { useToast } from '@/app/admin/components/ToastProvider';

/**
 * Toggle per marcar un pagament (paga i senyal o resta) com a pagat/pendent
 * directament des de la fitxa de la reserva. Reutilitza el PATCH canònic
 * /api/admin/bookings/[id] (camps depositPaid/remainingPaid + *PaidAt).
 */
export default function PaymentToggle({
  bookingId,
  field,
  paid,
}: {
  bookingId: string;
  field: 'depositPaid' | 'remainingPaid';
  paid: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [optimistic, setOptimistic] = useState(paid);

  async function toggle() {
    const next = !optimistic;
    setSaving(true);
    setOptimistic(next);
    const atField = field === 'depositPaid' ? 'depositPaidAt' : 'remainingPaidAt';
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: next, [atField]: next ? new Date().toISOString() : null }),
      });
      if (!res.ok) throw new Error('PATCH failed');
      toast.success(next ? 'Marcat com a pagat.' : 'Marcat com a pendent.');
      router.refresh();
    } catch (error) {
      console.error('[PaymentToggle] Error updating payment', error);
      setOptimistic(!next);
      toast.error('No s’ha pogut actualitzar el pagament.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={saving}
      className={`ap-btn ap-btn--xs ${optimistic ? 'ap-btn--secondary' : 'ap-btn--primary'}`}
      title={optimistic ? 'Clic per marcar com a pendent' : 'Clic per marcar com a pagat'}
      aria-pressed={optimistic}
    >
      {optimistic ? '✓ Pagat' : 'Marcar pagat'}
    </button>
  );
}
