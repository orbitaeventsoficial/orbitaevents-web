'use client';

/**
 * Formulari d'edició d'un element d'inventari (client component)
 */

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog, { useConfirmDialog } from '../../components/ConfirmDialog';
import { fetchWithCsrf } from '@/lib/csrf';

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

interface InventoryItemEditorProps {
  item?: ItemData;
  mode?: 'create' | 'edit';
}

export default function InventoryItemEditor({ item, mode = 'edit' }: InventoryItemEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { confirm, dialogProps } = useConfirmDialog();

  const [form, setForm] = useState({
    name: item?.name || '',
    description: item?.description || '',
    category: item?.category || 'SOUND',
    watts: item?.watts?.toString() || '',
    value: item?.value?.toString() || '',
    status: item?.status || 'AVAILABLE',
    condition: item?.condition || 'GOOD',
    notes: item?.notes || '',
    purchaseDate: item?.purchaseDate
      ? new Date(item.purchaseDate).toISOString().split('T')[0]
      : '',
    purchasePrice: item?.purchasePrice?.toString() || '',
    expectedLifeHours: (item?.expectedLifeHours || 2000).toString(),
    isConsumable: item?.isConsumable || false,
    stockQuantity: item?.stockQuantity?.toString() || '',
    minStock: item?.minStock?.toString() || '',
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

      const url = mode === 'create' ? '/api/admin/inventory' : `/api/admin/inventory/${item!.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const res = await fetchWithCsrf(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Error desant');
      }

      if (mode === 'create') {
        router.push('/admin/inventory');
      } else {
        setSuccess(true);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconegut');
    } finally {
      setSaving(false);
    }
  }, [form, item, mode, router]);

  const handleDelete = useCallback(async () => {
    if (mode === 'create' || !item) return;
    const ok = await confirm({ title: 'Eliminar element', message: 'Segur que vols eliminar/retirar aquest element?', confirmLabel: 'Eliminar', variant: 'danger' });
    if (!ok) return;

    try {
      const res = await fetchWithCsrf(`/api/admin/inventory/${item.id}`, {
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
  }, [item, mode, router, confirm]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border p-3">
          <p className="text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-xl border p-3">
          <p className="text-sm">Canvis desats correctament</p>
        </div>
      )}

      {/* Informació bàsica */}
      <div className="rounded-2xl border p-5 space-y-4">
        <h2 className="text-sm font-semibold">{mode === 'create' ? 'Nou element' : 'Editar element'}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="inv-name" className="text-xs">Nom *</label>
            <input
              id="inv-name"
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
            />
          </div>
          <div>
            <label className="text-xs">Estat</label>
            <div className="mt-1 flex gap-1.5 flex-wrap">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => updateField('status', s.value)}
                  className={`rounded-xl border px-2 py-1.5 text-[10px] font-medium transition-all ${
                    form.status === s.value
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                      : 'border-white/10 text-white/40 hover:bg-white/5'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="inv-description" className="text-xs">Descripció</label>
          <textarea
            id="inv-description"
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-1 resize-none"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="inv-category" className="text-xs">Categoria</label>
            <select
              id="inv-category"
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs">Condició</label>
            <div className="mt-1 flex gap-1.5">
              {CONDITIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => updateField('condition', c.value)}
                  className={`flex-1 rounded-xl border px-1 py-1.5 text-[10px] font-medium transition-all ${
                    form.condition === c.value
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                      : 'border-white/10 text-white/40 hover:bg-white/5'
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
            <label htmlFor="inv-watts" className="text-xs">Potència (W)</label>
            <input
              id="inv-watts"
              type="number"
              min={0}
              value={form.watts}
              onChange={(e) => updateField('watts', e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
            />
          </div>
          <div>
            <label htmlFor="inv-value" className="text-xs">Valor actual (€) *</label>
            <input
              id="inv-value"
              type="number"
              min={0}
              value={form.value}
              onChange={(e) => updateField('value', e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
            />
          </div>
        </div>
      </div>

      {/* Consumible + estoc */}
      <div className="rounded-2xl border p-5 space-y-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isConsumable}
              onChange={(e) => updateField('isConsumable', e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm">Es consumible</span>
          </label>
        </div>
        {form.isConsumable && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="inv-stock" className="text-xs">Estoc actual</label>
              <input
                id="inv-stock"
                type="number"
                min={0}
                value={form.stockQuantity}
                onChange={(e) => updateField('stockQuantity', e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
              />
            </div>
            <div>
              <label htmlFor="inv-min-stock" className="text-xs">Estoc mínim</label>
              <input
                id="inv-min-stock"
                type="number"
                min={0}
                value={form.minStock}
                onChange={(e) => updateField('minStock', e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
              />
            </div>
          </div>
        )}
      </div>

      {/* Amortització */}
      <div className="rounded-2xl border p-5 space-y-4">
        <h2 className="text-sm font-semibold">Amortització</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="inv-purchase-price" className="text-xs">Preu compra (€)</label>
            <input
              id="inv-purchase-price"
              type="number"
              min={0}
              value={form.purchasePrice}
              onChange={(e) => updateField('purchasePrice', e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
            />
          </div>
          <div>
            <label htmlFor="inv-purchase-date" className="text-xs">Data compra</label>
            <input
              id="inv-purchase-date"
              type="date"
              value={form.purchaseDate}
              onChange={(e) => updateField('purchaseDate', e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
            />
          </div>
          <div>
            <label htmlFor="inv-life-hours" className="text-xs">Vida útil (hores)</label>
            <input
              id="inv-life-hours"
              type="number"
              min={0}
              value={form.expectedLifeHours}
              onChange={(e) => updateField('expectedLifeHours', e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-2xl border p-5">
        <label htmlFor="inv-notes" className="text-xs">Notes internes</label>
        <textarea
          id="inv-notes"
          value={form.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-1 resize-none"
        />
      </div>

      {/* Accions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !form.name || !form.value}
          className="rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Desant...' : mode === 'create' ? 'Crear element' : 'Desar canvis'}
        </button>
        {mode === 'edit' && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-xl border px-4 py-3 text-sm transition-colors"
          >
            Eliminar
          </button>
        )}
        {mode === 'create' && (
          <button
            type="button"
            onClick={() => router.push('/admin/inventory')}
            className="rounded-xl border px-4 py-3 text-sm transition-colors"
          >
            Cancel·lar
          </button>
        )}
      </div>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

