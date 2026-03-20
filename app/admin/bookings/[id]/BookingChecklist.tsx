'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/app/admin/components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

function progressTone(pct: number) {
  if (pct === 100) return { bar: 'admin-tone-bg-success', text: 'admin-tone-text-success', check: 'ap-badge ap-badge--success' };
  if (pct >= 50) return { bar: 'admin-tone-bg-warning', text: 'admin-tone-text-warning', check: 'ap-badge ap-badge--warning' };
  return { bar: 'admin-tone-bg-danger', text: 'admin-tone-text-danger', check: 'ap-badge ap-badge--danger' };
}

export default function BookingChecklist({ bookingId }: { bookingId: string }) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/checklist`, { credentials: 'include' });
      const data = await res.json();
      if (data.ok) setItems(data.items);
    } catch {
      // fallback to empty
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(updated: ChecklistItem[]) {
    setItems(updated);
    try {
      await fetchWithCsrf(`/api/admin/bookings/${bookingId}/checklist`, {
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
    const updated = items.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item));
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
      <div className="ap-card rounded-2xl p-5">
        <div className="admin-shimmer h-4 w-32 rounded" />
      </div>
    );
  }

  const done = items.filter((i) => i.checked).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const tone = progressTone(pct);

  return (
    <section className="ap-card rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Preparació del bolo</h3>
          <p className="mt-0.5 text-xs admin-tone-text-neutral">{done}/{total} completat</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-20 overflow-hidden rounded-full admin-tone-bg-neutral">
            <div className={`h-full rounded-full transition-all ${tone.bar}`} style={{ width: `${pct}%` }} />
          </div>
          <span className={`text-sm font-bold ${tone.text}`}>{pct}%</span>
        </div>
      </div>

      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:admin-tone-bg-neutral">
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all ${item.checked ? 'admin-tone-border-success admin-tone-bg-success' : 'admin-tone-border-neutral hover:admin-tone-border-slate'}`}
              aria-label={item.checked ? `Desmarcar: ${item.label}` : `Marcar: ${item.label}`}
            >
              {item.checked && (
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className={`flex-1 text-sm ${item.checked ? 'line-through opacity-40' : ''}`}>{item.label}</span>
            {item.id.startsWith('custom-') && (
              <button type="button" onClick={() => removeItem(item.id)} className="text-xs opacity-0 transition-opacity group-hover:opacity-60 hover:!opacity-100" aria-label={`Eliminar: ${item.label}`}>
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder="Nou ítem..."
            className="ap-input flex-1 px-3 py-2 text-sm"
            autoFocus
          />
          <button type="button" onClick={addItem} className="ap-btn ap-btn--primary">
            Afegir
          </button>
          <button type="button" onClick={() => { setAdding(false); setNewLabel(''); }} className="ap-btn ap-btn--secondary">
            ✕
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="admin-tone-idle mt-3 w-full rounded-xl border border-dashed px-3 py-2 text-center text-sm transition-colors">
          + Afegir ítem
        </button>
      )}
    </section>
  );
}
