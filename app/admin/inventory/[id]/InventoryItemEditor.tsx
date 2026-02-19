'use client';

/**
 * Formulari d'edició d'un element d'inventari (client component)
 */

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  { value: 'SOUND', label: 'So', icon: '🔊' },
  { value: 'LIGHTING', label: 'Il·luminació', icon: '💡' },
  { value: 'EFFECTS', label: 'Efectes', icon: '✨' },
  { value: 'STRUCTURE', label: 'Estructura', icon: '🏗️' },
  { value: 'CABLING', label: 'Cablejat', icon: '🔌' },
  { value: 'TECH', label: 'Tecnologia', icon: '💻' },
  { value: 'DECORATION_HP', label: 'Deco HP', icon: '🎃' },
  { value: 'DECORATION_HW', label: 'Deco HW', icon: '🎄' },
  { value: 'DECORATION_GEN', label: 'Deco General', icon: '🎨' },
  { value: 'CONSUMABLE', label: 'Consumibles', icon: '📦' },
];

const CONDITIONS = [
  { value: 'NEW', label: 'Nou' },
  { value: 'EXCELLENT', label: 'Excel·lent' },
  { value: 'GOOD', label: 'Bo' },
  { value: 'FAIR', label: 'Acceptable' },
  { value: 'POOR', label: 'Dolent' },
];

const STATUSES = [
  { value: 'AVAILABLE', label: 'Disponible' },
  { value: 'IN_USE', label: 'En ús' },
  { value: 'MAINTENANCE', label: 'Manteniment' },
  { value: 'BROKEN', label: 'Avariat' },
  { value: 'RETIRED', label: 'Retirat' },
];

interface ItemData {
  id: string;
  name: string;
  description: string | null;
  category: string;
  watts: number | null;
  value: number;
  status: string;
  condition: string;
  notes: string | null;
  purchaseDate: string | Date | null;
  purchasePrice: number | null;
  expectedLifeHours: number | null;
  isConsumable: boolean;
  stockQuantity: number | null;
  minStock: number | null;
}

export default function InventoryItemEditor({ item }: { item: ItemData }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: item.name,
    description: item.description || '',
    category: item.category,
    watts: item.watts?.toString() || '',
    value: item.value.toString(),
    status: item.status,
    condition: item.condition,
    notes: item.notes || '',
    purchaseDate: item.purchaseDate
      ? new Date(item.purchaseDate).toISOString().split('T')[0]
      : '',
    purchasePrice: item.purchasePrice?.toString() || '',
    expectedLifeHours: (item.expectedLifeHours || 2000).toString(),
    isConsumable: item.isConsumable,
    stockQuantity: item.stockQuantity?.toString() || '',
    minStock: item.minStock?.toString() || '',
  });

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  const handleSave = useCallback(async () => {
    if (!form.name || !form.value) {
      setError('Nom i valor són obligatoris');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category,
        watts: form.watts ? parseInt(form.watts, 10) : null,
        value: parseFloat(form.value) || 0,
        status: form.status,
        condition: form.condition,
        notes: form.notes.trim() || null,
        isConsumable: form.isConsumable,
        stockQuantity: form.stockQuantity ? parseInt(form.stockQuantity, 10) : null,
        minStock: form.minStock ? parseInt(form.minStock, 10) : null,
        purchaseDate: form.purchaseDate || null,
        purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : null,
        expectedLifeHours: form.expectedLifeHours ? parseFloat(form.expectedLifeHours) : null,
      };

      const res = await fetch(`/api/admin/inventory/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Error desant canvis');
      }

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconegut');
    } finally {
      setSaving(false);
    }
  }, [form, item.id, router]);

  const handleDelete = useCallback(async () => {
    if (!confirm('Segur que vols eliminar/retirar aquest element?')) return;

    try {
      const res = await fetch(`/api/admin/inventory/${item.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Error eliminant');
      }

      router.push('/admin/inventory');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconegut');
    }
  }, [item.id, router]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
          <p className="text-rose-300 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
          <p className="text-emerald-300 text-sm">Canvis desats correctament</p>
        </div>
      )}

      {/* Informació bàsica */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">Editar element</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs text-slate-400">Nom *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Estat</label>
            <div className="mt-1 flex gap-1.5 flex-wrap">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => updateField('status', s.value)}
                  className={`rounded-lg border px-2 py-1.5 text-[10px] font-medium transition-all ${
                    form.status === s.value
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                      : 'border-slate-700/50 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400">Descripció</label>
          <textarea
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs text-slate-400">Categoria</label>
            <select
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400">Condició</label>
            <div className="mt-1 flex gap-1.5">
              {CONDITIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => updateField('condition', c.value)}
                  className={`flex-1 rounded-lg border px-1 py-1.5 text-[10px] font-medium transition-all ${
                    form.condition === c.value
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                      : 'border-slate-700/50 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs text-slate-400">Potència (W)</label>
            <input
              type="number"
              value={form.watts}
              onChange={(e) => updateField('watts', e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Valor actual (€) *</label>
            <input
              type="number"
              value={form.value}
              onChange={(e) => updateField('value', e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Amortització */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">Amortització</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs text-slate-400">Preu compra (€)</label>
            <input
              type="number"
              value={form.purchasePrice}
              onChange={(e) => updateField('purchasePrice', e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Data compra</label>
            <input
              type="date"
              value={form.purchaseDate}
              onChange={(e) => updateField('purchaseDate', e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Vida útil (hores)</label>
            <input
              type="number"
              value={form.expectedLifeHours}
              onChange={(e) => updateField('expectedLifeHours', e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5">
        <label className="text-xs text-slate-400">Notes internes</label>
        <textarea
          value={form.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
        />
      </div>

      {/* Accions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !form.name || !form.value}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Desant...' : 'Desar canvis'}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 hover:bg-rose-500/20 transition-colors"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
