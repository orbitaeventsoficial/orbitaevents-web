'use client';

/**
 * NOU ELEMENT D'INVENTARI - Formulari de creació
 * El codi s'auto-genera per la categoria si no es proporciona
 */

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminPage } from '../../components/AdminPage';

const CATEGORIES = [
  { value: 'SOUND', label: 'So', icon: '🔊', prefix: 'SON' },
  { value: 'LIGHTING', label: 'Il·luminació', icon: '💡', prefix: 'LUM' },
  { value: 'EFFECTS', label: 'Efectes', icon: '✨', prefix: 'EFX' },
  { value: 'STRUCTURE', label: 'Estructura', icon: '🏗️', prefix: 'EST' },
  { value: 'CABLING', label: 'Cablejat', icon: '🔌', prefix: 'CAB' },
  { value: 'TECH', label: 'Tecnologia', icon: '💻', prefix: 'TEC' },
  { value: 'DECORATION_HP', label: 'Deco HP', icon: '🎃', prefix: 'DHP' },
  { value: 'DECORATION_HW', label: 'Deco HW', icon: '🎄', prefix: 'DHW' },
  { value: 'DECORATION_GEN', label: 'Deco General', icon: '🎨', prefix: 'DGE' },
  { value: 'CONSUMABLE', label: 'Consumibles', icon: '📦', prefix: 'CON' },
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
  purchaseDate: string;
  purchasePrice: string;
  expectedLifeHours: string;
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
  purchaseDate: '',
  purchasePrice: '',
  expectedLifeHours: '2000',
};

export default function NewInventoryItemPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectedCat = CATEGORIES.find((c) => c.value === form.category);

  const handleSubmit = useCallback(async () => {
    if (!form.name || !form.value) {
      setError('Nom i valor són obligatoris');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
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

      // Codi: si es proporciona, enviar-lo; si no, s'auto-genera al backend
      if (form.code.trim()) {
        body.code = form.code.trim().toUpperCase();
      }

      // Camps d'amortització
      if (form.purchaseDate) body.purchaseDate = form.purchaseDate;
      if (form.purchasePrice) body.purchasePrice = parseFloat(form.purchasePrice);
      if (form.expectedLifeHours) body.expectedLifeHours = parseFloat(form.expectedLifeHours);

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
    <AdminPage
      title="Nou element"
      subtitle="Afegeix equipament a l'inventari"
      back={{ href: '/admin/inventory', label: 'Inventari' }}
      className="max-w-3xl"
    >
      {error && (
        <div className="rounded-xl border p-4">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Informació bàsica */}
      <div className="rounded-2xl border p-5 space-y-4">
        <h2 className="text-sm font-semibold">Informació bàsica</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs">
              Codi <span className="">(opcional, s&apos;auto-genera)</span>
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => updateField('code', e.target.value)}
              placeholder={selectedCat ? `${selectedCat.prefix}-001` : 'Auto'}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-1 font-mono"
            />
          </div>
          <div>
            <label className="text-xs">Nom *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Altaveu JBL PRX 15"
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-1"
            />
          </div>
        </div>
        <div>
          <label className="text-xs">Descripció</label>
          <textarea
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={2}
            placeholder="Descripció de l'equip..."
            className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-1 resize-none"
          />
        </div>
      </div>

      {/* Categoria */}
      <div className="rounded-2xl border p-5 space-y-4">
        <h2 className="text-sm font-semibold">Categoria</h2>
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

      {/* Detalls tècnics */}
      <div className="rounded-2xl border p-5 space-y-4">
        <h2 className="text-sm font-semibold">Detalls tècnics</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs">Potència (W)</label>
            <input
              type="number"
              value={form.watts}
              onChange={(e) => updateField('watts', e.target.value)}
              placeholder="1000"
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-1"
            />
          </div>
          <div>
            <label className="text-xs">Valor actual (€) *</label>
            <input
              type="number"
              value={form.value}
              onChange={(e) => updateField('value', e.target.value)}
              placeholder="500"
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-1"
            />
          </div>
          <div>
            <label className="text-xs">Condició</label>
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
              className="w-4 h-4 rounded"
            />
            <span className="text-sm">Es consumible</span>
          </label>
        </div>

        {form.isConsumable && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs">Estoc actual</label>
              <input
                type="number"
                value={form.stockQuantity}
                onChange={(e) => updateField('stockQuantity', e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-1"
              />
            </div>
            <div>
              <label className="text-xs">Estoc mínim</label>
              <input
                type="number"
                value={form.minStock}
                onChange={(e) => updateField('minStock', e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-1"
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
            <label className="text-xs">Preu de compra (€)</label>
            <input
              type="number"
              value={form.purchasePrice}
              onChange={(e) => updateField('purchasePrice', e.target.value)}
              placeholder="800"
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-1"
            />
          </div>
          <div>
            <label className="text-xs">Data de compra</label>
            <input
              type="date"
              value={form.purchaseDate}
              onChange={(e) => updateField('purchaseDate', e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-1"
            />
          </div>
          <div>
            <label className="text-xs">Vida útil (hores)</label>
            <input
              type="number"
              value={form.expectedLifeHours}
              onChange={(e) => updateField('expectedLifeHours', e.target.value)}
              placeholder="2000"
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-1"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-2xl border p-5">
        <label className="text-xs">Notes internes</label>
        <textarea
          value={form.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          rows={2}
          placeholder="Notes sobre manteniment, ubicació, etc."
          className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-1 resize-none"
        />
      </div>

      {/* Enviar */}
      <div className="flex items-center gap-3 pb-8">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !form.name || !form.value}
          className="rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Creant...' : 'Crear element'}
        </button>
        <Link
          href="/admin/inventory"
          className="rounded-xl border px-4 py-3 text-sm transition-colors"
        >
          Cancel·lar
        </Link>
      </div>
    </AdminPage>
  );
}
