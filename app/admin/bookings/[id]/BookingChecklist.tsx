'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/app/admin/components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';
import { ADMIN_BOOKING_HELP_2, helpAttrs } from '@/app/admin/components/adminHelpContent';

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

type ChecklistSaveErrorTarget = 'toggle' | 'remove' | 'add';

type ChecklistSaveError = {
  message: string;
  target: ChecklistSaveErrorTarget;
  itemId?: string;
};

const CHECKLIST_LOAD_ERROR = "No s'ha pogut carregar la checklist";
const CHECKLIST_SAVE_ERROR = "No s'ha pogut desar la checklist";

async function readChecklistError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as { error?: unknown; message?: unknown } | null;
  if (typeof data?.error === 'string' && data.error.trim()) return data.error;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  return fallback;
}

function progressTone(pct: number) {
  if (pct === 100) return { bar: 'admin-tone-bg-success', text: 'admin-tone-text-success', check: 'ap-badge ap-badge--success' };
  if (pct >= 50) return { bar: 'admin-tone-bg-warning', text: 'admin-tone-text-warning', check: 'ap-badge ap-badge--warning' };
  return { bar: 'admin-tone-bg-danger', text: 'admin-tone-text-danger', check: 'ap-badge ap-badge--danger' };
}

export default function BookingChecklist({ bookingId }: { bookingId: string }) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<ChecklistSaveError | null>(null);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/checklist`, { credentials: 'include' });
      if (!res.ok) throw new Error(await readChecklistError(res, CHECKLIST_LOAD_ERROR));
      const data = await res.json();
      if (data.ok) {
        setItems(data.items);
      } else {
        throw new Error(typeof data.error === 'string' ? data.error : CHECKLIST_LOAD_ERROR);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : CHECKLIST_LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(
    updated: ChecklistItem[],
    previous: ChecklistItem[],
    errorTarget: { target: ChecklistSaveErrorTarget; itemId?: string },
    onFailure?: () => void,
  ) {
    if (saving) return;
    setSaveError(null);
    setSaving(true);
    setItems(updated);
    try {
      const response = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items: updated }),
      });
      if (!response.ok) throw new Error(await readChecklistError(response, CHECKLIST_SAVE_ERROR));
    } catch (error) {
      const message = error instanceof Error ? error.message : CHECKLIST_SAVE_ERROR;
      setItems(previous);
      setSaveError({ message, ...errorTarget });
      onFailure?.();
      console.error(CHECKLIST_SAVE_ERROR, error);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function toggle(id: string) {
    if (saving) return;
    const previous = items;
    const updated = items.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item));
    void save(updated, previous, { target: 'toggle', itemId: id });
  }

  function addItem() {
    if (saving) return;
    if (!newLabel.trim()) return;
    const previous = items;
    const label = newLabel.trim();
    const id = `custom-${Date.now()}`;
    const updated = [...items, { id, label, checked: false }];
    void save(updated, previous, { target: 'add' }, () => {
      setNewLabel(label);
      setAdding(true);
    });
    setNewLabel('');
    setAdding(false);
  }

  function removeItem(id: string) {
    if (saving) return;
    const previous = items;
    const updated = items.filter((item) => item.id !== id);
    void save(updated, previous, { target: 'remove', itemId: id });
  }

  if (loading) {
    return (
      <div className="ap-card rounded-2xl p-5">
        <div className="admin-shimmer h-4 w-32 rounded" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="ap-card rounded-2xl p-5 text-sm admin-tone-soft-danger admin-tone-border-danger admin-tone-text-danger" role="alert">
        {loadError}
      </div>
    );
  }

  const done = items.filter((i) => i.checked).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const tone = progressTone(pct);

  return (
    <section className="ap-card rounded-2xl p-5" {...helpAttrs(ADMIN_BOOKING_HELP_2.checklist.root)}>
      <div className="mb-4 flex items-center justify-between" {...helpAttrs(ADMIN_BOOKING_HELP_2.checklist.progress)}>
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
          <li key={item.id} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:admin-tone-bg-neutral" {...helpAttrs(ADMIN_BOOKING_HELP_2.checklist.item)}>
            <button
              type="button"
              onClick={() => toggle(item.id)}
              disabled={saving}
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all ${item.checked ? 'admin-tone-border-success admin-tone-bg-success' : 'admin-tone-border-neutral hover:admin-tone-border-slate'}`}
              aria-invalid={saveError?.target === 'toggle' && saveError.itemId === item.id ? true : undefined}
              aria-label={item.checked ? `Desmarcar: ${item.label}` : `Marcar: ${item.label}`}
            >
              {item.checked && (
                <svg className="h-3 w-3 text-[var(--t)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className={`flex-1 text-sm ${item.checked ? 'line-through opacity-40' : ''}`}>{item.label}</span>
            {item.id.startsWith('custom-') && (
              <button type="button" onClick={() => removeItem(item.id)} disabled={saving} aria-invalid={saveError?.target === 'remove' && saveError.itemId === item.id ? true : undefined} className="text-xs opacity-0 transition-opacity group-hover:opacity-60 hover:!opacity-100 disabled:cursor-not-allowed disabled:opacity-30" aria-label={`Eliminar: ${item.label}`}>
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>

      {saveError && (
        <p role="alert" className="mt-3 rounded-xl border admin-tone-border-danger px-3 py-2 text-sm admin-tone-text-danger">
          {saveError.message}
        </p>
      )}

      {adding ? (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder="Nou ítem..."
            className="ap-input flex-1 px-3 py-2 text-sm"
            disabled={saving}
            aria-invalid={saveError?.target === 'add' ? true : undefined}
            autoFocus
          />
          <button type="button" onClick={addItem} disabled={saving} aria-invalid={saveError?.target === 'add' ? true : undefined} className="ap-btn ap-btn--primary">
            Afegir
          </button>
          <button type="button" onClick={() => { setAdding(false); setNewLabel(''); }} disabled={saving} className="ap-btn ap-btn--secondary">
            ✕
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} disabled={saving} aria-invalid={saveError?.target === 'add' ? true : undefined} className="admin-tone-idle mt-3 w-full rounded-xl border border-dashed px-3 py-2 text-center text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60" {...helpAttrs(ADMIN_BOOKING_HELP_2.checklist.add)}>
          + Afegir ítem
        </button>
      )}
    </section>
  );
}
