'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import { formatCurrency } from '@/lib/constants';
import { useToast } from '@/app/admin/components/ToastProvider';

const TARGET_MARGIN = 0.30; // 30% marge mínim recomanat

export default function BookingTotalEditor({
  bookingId,
  total,
  costFloor,
}: {
  bookingId: string;
  total: number;
  costFloor?: number; // cost mínim conegut (col·laborador, transport...)
}) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(Math.round(total * 100) / 100));
  const [saving, setSaving] = useState(false);
  const [pendingTotal, setPendingTotal] = useState<number | null>(null);

  const displayTotal = pendingTotal ?? total;
  const marginAlert = costFloor != null && displayTotal < costFloor;
  const suggestedPrice = costFloor != null
    ? Math.ceil(costFloor / (1 - TARGET_MARGIN))
    : null;

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
      setPendingTotal(newTotal);
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

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
      {editing ? (
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
          <button onClick={save} disabled={saving} className="fxd__savebtn text-xs">✓</button>
          <button onClick={() => setEditing(false)} className="fxd__cancelbtn text-xs">✕</button>
        </span>
      ) : (
        <button
          onClick={() => setEditing(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'inherit', font: 'inherit', fontWeight: 'inherit',
            padding: 0, borderBottom: '1px dashed var(--gold)',
          }}
          title="Clic per editar el total"
        >
          {formatCurrency(displayTotal)}
        </button>
      )}

      {/* Alerta marge negatiu */}
      {marginAlert && costFloor != null && (
        <span style={{
          fontSize: 10, fontWeight: 600, color: 'var(--o-danger, #e05252)',
          background: 'color-mix(in oklab, var(--o-danger, #e05252) 10%, transparent)',
          borderRadius: 3, padding: '2px 5px', letterSpacing: '0.04em',
        }}>
          ⚠ Cost estimat {formatCurrency(costFloor)} · marge {formatCurrency(displayTotal - costFloor)}
          {suggestedPrice != null && (
            <button
              onClick={() => { setValue(String(suggestedPrice)); setEditing(true); }}
              style={{
                marginLeft: 6, background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--gold)', fontWeight: 700, fontSize: 10, padding: 0,
              }}
              title={`Preu suggerit amb marge ${TARGET_MARGIN * 100}%`}
            >
              → {formatCurrency(suggestedPrice)}?
            </button>
          )}
        </span>
      )}
    </span>
  );
}
