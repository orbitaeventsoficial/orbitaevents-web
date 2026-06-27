'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import { formatCurrency } from '@/lib/constants';
import { useToast } from '@/app/admin/components/ToastProvider';

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

  // Si ja està tot pagat, els toggles de dipòsit/resta ja mostren l'estat;
  // el botó d'efectiu només té sentit mentre quedi import per cobrar.
  if (fullyPaid && !done) return null;

  async function markCash() {
    setSaving(true);
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
      if (!res.ok) throw new Error('PATCH failed');
      setDone(true);
      toast.success(`Cobrament en efectiu registrat (${formatCurrency(total)}).`);
      router.refresh();
    } catch (error) {
      console.error('[CashPaymentButton] Error', error);
      toast.error('No s’ha pogut registrar el cobrament en efectiu.');
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <p className="bd__cashnote">💵 Cobrat en efectiu · {formatCurrency(total)}</p>
    );
  }

  return (
    <button
      type="button"
      onClick={markCash}
      disabled={saving}
      className="ap-btn ap-btn--secondary ap-btn--xs"
      title="Marca dipòsit i resta com a pagats en efectiu"
    >
      {saving ? 'Registrant…' : '💵 Cobrat en efectiu'}
    </button>
  );
}
