'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/app/admin/components/ToastProvider';

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export default function BookingChecklist({ bookingId }: { bookingId: string }) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/checklist`, { credentials: 'include' });
      const data = await res.json();
      if (data.ok) setItems(data.items);
    } catch {
      // fallback to empty
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { load(); }, [load]);

  async function save(updated: ChecklistItem[]) {
    setItems(updated);
    try {
      await fetch(`/api/admin/bookings/${bookingId}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items: updated }),
      });
    } catch {
      toast.error('Error desant checklist');
    }
  }

  function toggle(id: string) {
    const updated = items.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    save(updated);
  }

  function addItem() {
    if (!newLabel.trim()) return;
    const id = `custom-${Date.now()}`;
    const updated = [...items, { id, label: newLabel.trim(), checked: false }];
    save(updated);
    setNewLabel('');
    setAdding(false);
  }

  function removeItem(id: string) {
    const updated = items.filter((item) => item.id !== id);
    save(updated);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 p-5">
        <div className="animate-pulse h-4 w-32 rounded bg-white/10" />
      </div>
    );
  }

  const done = items.filter((i) => i.checked).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <section className="rounded-2xl border border-white/10 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold">Preparació del bolo</h3>
          <p className="text-xs opacity-50 mt-0.5">{done}/{total} completat</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-20 h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`text-sm font-bold ${
            pct === 100 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {pct}%
          </span>
        </div>
      </div>

      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/[0.03] transition-colors">
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                item.checked
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-white/20 hover:border-white/40'
              }`}
              aria-label={item.checked ? `Desmarcar: ${item.label}` : `Marcar: ${item.label}`}
            >
              {item.checked && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className={`flex-1 text-sm ${item.checked ? 'line-through opacity-40' : ''}`}>
              {item.label}
            </span>
            {item.id.startsWith('custom-') && (
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="opacity-0 group-hover:opacity-40 hover:!opacity-100 text-xs transition-opacity"
                aria-label={`Eliminar: ${item.label}`}
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder="Nou ítem..."
            className="flex-1 px-3 py-2 text-sm rounded-xl border border-white/10 bg-white/5 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
            autoFocus
          />
          <button type="button" onClick={addItem} className="px-3 py-2 text-sm rounded-xl bg-white/10 hover:bg-white/15 font-medium">
            Afegir
          </button>
          <button type="button" onClick={() => { setAdding(false); setNewLabel(''); }} className="px-3 py-2 text-sm rounded-xl hover:bg-white/5">
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 w-full px-3 py-2 text-sm rounded-xl border border-dashed border-white/10 hover:border-white/20 hover:bg-white/[0.02] transition-colors text-center opacity-50 hover:opacity-80"
        >
          + Afegir ítem
        </button>
      )}
    </section>
  );
}
