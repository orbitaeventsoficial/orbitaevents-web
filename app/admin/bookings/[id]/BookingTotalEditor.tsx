'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import { formatCurrency } from '@/lib/constants';
import { useToast } from '@/app/admin/components/ToastProvider';

export default function BookingTotalEditor({
  bookingId,
  total,
}: {
  bookingId: string;
  total: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(Math.round(total * 100) / 100));
  const [saving, setSaving] = useState(false);

  async function save() {
    const newTotal = parseFloat(value);
    if (!Number.isFinite(newTotal) || newTotal <= 0) {
      toast.error('Import invàlid');
      return;
    }
    setSaving(true);
    try {
      await fetchWithCsrf(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalPrice: newTotal }),
      });
      toast.success('Total actualitzat.');
      setEditing(false);
      router.refresh();
    } catch (error) {
      console.error('[BookingTotalEditor] Error saving total', error);
      toast.error('Error desant el total.');
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <input
          type="number"
          min={0}
          step={0.01}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          autoFocus
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--line2)',
            borderRadius: 4,
            color: 'var(--gold)',
            fontSize: 'inherit',
            fontWeight: 700,
            padding: '2px 8px',
            width: 100,
          }}
        />
        <span className="text-xs text-[var(--t3)]">€</span>
        <button
          onClick={save}
          disabled={saving}
          className="fxd__savebtn text-xs"
        >✓</button>
        <button
          onClick={() => setEditing(false)}
          className="fxd__cancelbtn text-xs"
        >✕</button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'inherit', font: 'inherit', fontWeight: 'inherit',
        padding: 0, borderBottom: '1px dashed var(--gold)',
      }}
      title="Clic per editar el total"
    >
      {formatCurrency(total)}
    </button>
  );
}
