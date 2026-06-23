'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';

type PaymentField = 'depositPaid' | 'remainingPaid';

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
  const isDeposit = field === 'depositPaid';

  async function toggle() {
    setSaving(true);
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
        throw new Error(data?.error || 'No s\'ha pogut actualitzar el pagament');
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={saving}
      className={`rounded-md px-2 py-1 text-xs font-semibold ${
        currentValue
          ? 'admin-tone-bg-success admin-tone-text-success hover:admin-tone-bg-success'
          : 'admin-tone-bg-warning admin-tone-text-warning hover:admin-tone-bg-warning'
      } disabled:opacity-60`}
    >
      {saving ? '...' : currentValue ? 'Pagat' : 'Pendent'}
    </button>
  );
}


