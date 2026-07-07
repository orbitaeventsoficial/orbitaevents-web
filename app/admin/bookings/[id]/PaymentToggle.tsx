'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import { useToast } from '@/app/admin/components/ToastProvider';

const PAYMENT_TOGGLE_ERROR = 'No s’ha pogut actualitzar el pagament.';

async function readPaymentToggleError(response: Response) {
  const data = typeof response.json === 'function'
    ? ((await response.json().catch(() => null)) as { error?: unknown; message?: unknown } | null)
    : null;
  if (typeof data?.error === 'string' && data.error.trim()) return data.error;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  return PAYMENT_TOGGLE_ERROR;
}

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
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !optimistic;
    setSaving(true);
    setError(null);
    setOptimistic(next);
    const atField = field === 'depositPaid' ? 'depositPaidAt' : 'remainingPaidAt';
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: next, [atField]: next ? new Date().toISOString() : null }),
      });
      if (!res.ok) throw new Error(await readPaymentToggleError(res));
      toast.success(next ? 'Marcat com a pagat.' : 'Marcat com a pendent.');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : PAYMENT_TOGGLE_ERROR;
      console.error('[PaymentToggle] Error updating payment', error);
      setOptimistic(!next);
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={toggle}
        disabled={saving}
        className={`ap-btn ap-btn--xs ${optimistic ? 'ap-btn--secondary' : 'ap-btn--primary'}`}
        title={optimistic ? 'Clic per marcar com a pendent' : 'Clic per marcar com a pagat'}
        aria-pressed={optimistic}
        aria-invalid={error ? true : undefined}
      >
        {optimistic ? '✓ Pagat' : 'Marcar pagat'}
      </button>
      {error && (
        <span role="alert" className="max-w-xs text-xs font-semibold admin-tone-text-danger">
          {error}
        </span>
      )}
    </span>
  );
}
