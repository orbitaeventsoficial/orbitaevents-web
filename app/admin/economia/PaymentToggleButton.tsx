'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';

type PaymentField = 'depositPaid' | 'remainingPaid';

const PAYMENT_UPDATE_ERROR = 'No s\'ha pogut actualitzar el pagament';

function getPaymentErrorMessage(data: unknown): string {
  if (data && typeof data === 'object' && 'error' in data) {
    const message = (data as { error?: unknown }).error;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return PAYMENT_UPDATE_ERROR;
}

export default function PaymentToggleButton({
  bookingId,
  field,
  currentValue,
}: {
  bookingId: string;
  field: PaymentField;
  currentValue: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDeposit = field === 'depositPaid';
  const errorId = `payment-toggle-${bookingId}-${field}-error`;

  async function toggle() {
    setSaving(true);
    setError(null);
    try {
      const nextValue = !currentValue;
      const payload: Record<string, unknown> = {
        [field]: nextValue,
      };

      if (isDeposit) {
        payload.depositPaidAt = nextValue ? new Date().toISOString() : null;
      } else {
        payload.remainingPaidAt = nextValue ? new Date().toISOString() : null;
      }

      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(getPaymentErrorMessage(data));
      }
      router.refresh();
    } catch (err) {
      const message = err instanceof Error && err.message.trim() ? err.message : PAYMENT_UPDATE_ERROR;
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={saving}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`rounded-md px-2 py-1 text-xs font-semibold ${
          currentValue
            ? 'admin-tone-bg-success admin-tone-text-success hover:admin-tone-bg-success'
            : 'admin-tone-bg-warning admin-tone-text-warning hover:admin-tone-bg-warning'
        } disabled:opacity-60`}
      >
        {saving ? '...' : currentValue ? 'Pagat' : 'Pendent'}
      </button>
      {error ? (
        <span id={errorId} role="alert" className="max-w-40 text-left text-xs leading-snug admin-tone-text-danger">
          {error}
        </span>
      ) : null}
    </span>
  );
}

