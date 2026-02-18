'use client';

/**
 * NOU ELEMENT D'INVENTARI - Formulari de creació
 */

import { useCallback, useState } from 'react';
import Link from 'next/link';
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

type FormData = {
  code: string;
  name: string;
  description: string;
  category: string;
  watts: string;
  value: string;
  condition: string;
  isConsumable: boolean;
  stockQuantity: string;
  minStock: string;
  notes: string;
};

const INITIAL: FormData = {
  code: '',
  name: '',
  description: '',
  category: 'SOUND',
  watts: '',
  value: '',
  condition: 'GOOD',
  isConsumable: false,
  stockQuantity: '',
  minStock: '',
  notes: '',
};

export default function NewInventoryItemPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = useCallback(async () => {
    if (!form.code || !form.name || !form.value) {
      setError('Codi, nom i valor són obligatoris');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const body = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        category: form.category,
        watts: form.watts ? parseInt(form.watts, 10) : undefined,
        value: parseFloat(form.value) || 0,
        condition: form.condition,
        isConsumable: form.isConsumable,
        stockQuantity: form.stockQuantity ? parseInt(form.stockQuantity, 10) : undefined,
        minStock: form.minStock ? parseInt(form.minStock, 10) : undefined,
        notes: form.notes.trim() || undefined,
      };

      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Error creant element');
      }

      router.push('/admin/inventory');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconegut');
    } finally {
      setSubmitting(false);
    }
  }, [form, router]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Nou element</h1>
          <p className="text-sm text-slate-400 mt-1">Afegeix equipament a l&apos;inventari</p>
        </div>
        <Link
          href="/admin/inventory"
          className="rounded-xl border border-slate-600/50 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 hover:bg-slate-600/50 transition-colors"
        >
          ← Inventari
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
          <p className="text-rose-300 text-sm">{error}</p>
        </div>
      )}

      {/* Basic info */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">Informació bàsica</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs text-slate-400">Codi *</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => updateField('code', e.target.value)}
              placeholder="ALT-001"
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Nom *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Altaveu JBL PRX 15"
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400">Descripció</label>
          <textarea
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={2}
            placeholder="Descripció de l'equip..."
            className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
          />
        </div>
      </div>

      {/* Category */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">Categoria</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => updateField('category', cat.value)}
              className={`rounded-xl border px-2 py-2.5 text-xs font-medium transition-all ${
                form.category === cat.value
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                  : 'border-slate-700/50 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span className="text-base">{cat.icon}</span>
              <span className="block mt-0.5">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Technical details */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">Detalls tècnics</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs text-slate-400">Potència (W)</label>
            <input
              type="number"
              value={form.watts}
              onChange={(e) => updateField('watts', e.target.value)}
              placeholder="1000"
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Valor (€) *</label>
            <input
              type="number"
              value={form.value}
              onChange={(e) => updateField('value', e.target.value)}
              placeholder="500"
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Condició</label>
            <div className="mt-1 flex gap-1.5">
              {CONDITIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => updateField('condition', c.value)}
                  className={`flex-1 rounded-lg border px-1 py-2 text-[10px] font-medium transition-all ${
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

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isConsumable}
              onChange={(e) => updateField('isConsumable', e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-sm text-slate-300">Es consumible</span>
          </label>
        </div>

        {form.isConsumable && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-slate-400">Estoc actual</label>
              <input
                type="number"
                value={form.stockQuantity}
                onChange={(e) => updateField('stockQuantity', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Estoc mínim</label>
              <input
                type="number"
                value={form.minStock}
                onChange={(e) => updateField('minStock', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5">
        <label className="text-xs text-slate-400">Notes internes</label>
        <textarea
          value={form.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          rows={2}
          placeholder="Notes sobre manteniment, ubicació, etc."
          className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
        />
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pb-8">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !form.code || !form.name || !form.value}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Creant...' : 'Crear element'}
        </button>
        <Link
          href="/admin/inventory"
          className="rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-3 text-sm text-slate-300 hover:bg-slate-600/50 transition-colors"
        >
          Cancel·lar
        </Link>
      </div>
    </div>
  );
}
