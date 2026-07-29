'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import { formatCurrency } from '@/lib/constants';
import { useToast } from '@/app/admin/components/ToastProvider';

const CASH_PAYMENT_ERROR = 'No s’ha pogut registrar el cobrament en efectiu.';

async function readCashPaymentError(response: Response) {
  const data = typeof response.json === 'function'
    ? ((await response.json().catch(() => null)) as { error?: unknown; message?: unknown } | null)
    : null;
  if (typeof data?.error === 'string' && data.error.trim()) return data.error;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  return CASH_PAYMENT_ERROR;
}

/**
 * Registra el cobrament COMPLET en efectiu d'una reserva: marca dipòsit i resta
 * com a pagats, fixa paymentMethod=CASH i cashAmount=total. Resol el cas en què
 * un bolo cobrat en efectiu apareixia «pendent» (no hi havia manera de registrar-ho).
 * Reutilitza el PATCH canònic /api/admin/bookings/[id].
 */
export default function CashPaymentButton({
  bookingId,
  total,
  fullyPaid,
}: {
  bookingId: string;
  total: number;
  fullyPaid: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si ja està tot pagat, els toggles de dipòsit/resta ja mostren l'estat;
  // el botó d'efectiu només té sentit mentre quedi import per cobrar.
  if (fullyPaid && !done) return null;

  async function markCash() {
    setSaving(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depositPaid: true,
          depositPaidAt: now,
          remainingPaid: true,
          remainingPaidAt: now,
          paymentMethod: 'CASH',
          cashAmount: total,
        }),
      });
      if (!res.ok) throw new Error(await readCashPaymentError(res));
      setDone(true);
      toast.success(`Cobrament en efectiu registrat (${formatCurrency(total)}).`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : CASH_PAYMENT_ERROR;
      console.error('[CashPaymentButton] Error', error);
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <p className="text-xs font-semibold text-[var(--o-stage-won)]">💵 Cobrat en efectiu · {formatCurrency(total)}</p>
    );
  }

  return (
    <div className="inline-flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={markCash}
        disabled={saving}
        aria-invalid={error ? true : undefined}
        className="ap-btn ap-btn--secondary ap-btn--xs"
        title="Marca dipòsit i resta com a pagats en efectiu"
      >
        {saving ? 'Registrant…' : '💵 Cobrat en efectiu'}
      </button>
      {error && (
        <p role="alert" className="max-w-xs text-xs font-semibold admin-tone-text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
