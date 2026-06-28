'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog, { useConfirmDialog } from '../../components/ConfirmDialog';
import { fetchWithCsrf } from '@/lib/csrf';
import {
  DEFAULT_EXPECTED_LIFE_HOURS,
  INVENTORY_CATEGORY_OPTIONS,
  INVENTORY_CONDITION_OPTIONS,
  INVENTORY_STATUS_OPTIONS,
  formatCurrencyExact,
} from '@/lib/constants';

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
  purchasePriceSource: string | null;
  expectedLifeHours: number | null;
  isConsumable: boolean;
  stockQuantity: number | null;
  minStock: number | null;
}

interface InventoryItemEditorProps {
  item?: ItemData;
  mode?: 'create' | 'edit';
}

const STATUS_TONE: Record<string, string> = {
  AVAILABLE: 'admin-tone-border-success admin-tone-bg-success admin-tone-text-success',
  IN_USE: 'admin-tone-border-cyan admin-tone-bg-cyan admin-tone-text-cyan',
  MAINTENANCE: 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning',
  RETIRED: 'admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger',
};

const CONDITION_TONE: Record<string, string> = {
  EXCELLENT: 'admin-tone-border-success admin-tone-bg-success admin-tone-text-success',
  GOOD: 'admin-tone-border-cyan admin-tone-bg-cyan admin-tone-text-cyan',
  FAIR: 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning',
  POOR: 'admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger',
};

const inputClass = 'adm-input mt-1';

const formatEuro = formatCurrencyExact;

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
    purchasePriceSource: item?.purchasePriceSource || '',
    expectedLifeHours: (item?.expectedLifeHours || DEFAULT_EXPECTED_LIFE_HOURS).toString(),
    isConsumable: item?.isConsumable || false,
    stockQuantity: item?.stockQuantity?.toString() || '',
    minStock: item?.minStock?.toString() || '',
  });

  const categoryMeta = useMemo(
    () => INVENTORY_CATEGORY_OPTIONS.find((option) => option.value === form.category),
    [form.category]
  );
  const statusMeta = useMemo(
    () => INVENTORY_STATUS_OPTIONS.find((option) => option.value === form.status),
    [form.status]
  );
  const conditionMeta = useMemo(
    () => INVENTORY_CONDITION_OPTIONS.find((option) => option.value === form.condition),
    [form.condition]
  );

  const currentValue = Number(form.value || 0);
  const purchaseValue = Number(form.purchasePrice || 0);
  const expectedLifeHours = Number(form.expectedLifeHours || DEFAULT_EXPECTED_LIFE_HOURS);
  const hourlyCost = purchaseValue > 0
    ? purchaseValue / Math.max(1, expectedLifeHours)
    : 0;
  const stockQuantity = Number(form.stockQuantity || 0);
  const minStock = Number(form.minStock || 0);
  const stockSummary = form.isConsumable
    ? stockQuantity <= 0
      ? 'Sense estoc'
      : minStock > 0 && stockQuantity <= minStock
        ? 'Estoc crític'
        : 'Estoc correcte'
    : 'No aplica';

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  const handleSave = useCallback(async () => {
    if (!form.name || !form.value) {
      setError('Nom i valor són obligatoris');
      return;
    }
    if (form.purchasePrice && !form.purchasePriceSource.trim()) {
      setError('Si informes un preu de compra o reposició, cal indicar la font del preu');
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
        purchasePriceSource: form.purchasePrice ? form.purchasePriceSource.trim() : null,
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
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconegut');
    } finally {
      setSaving(false);
    }
  }, [form, item, mode, router]);

  const handleDelete = useCallback(async () => {
    if (mode === 'create' || !item) return;
    const ok = await confirm({
      title: 'Eliminar element',
      message: 'Segur que vols eliminar o retirar aquest element?',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
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
  }, [confirm, item, mode, router]);

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border admin-tone-border-cyan admin-tone-bg-cyan px-3 py-1 text-xs font-semibold admin-tone-text-cyan">
                {mode === 'create' ? 'Nou element' : 'Fitxa inventari'}
              </span>
              {statusMeta && (
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_TONE[form.status] || 'border-white/10 bg-white/5 text-white/80'}`}>
                  {statusMeta.label}
                </span>
              )}
              {conditionMeta && (
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${CONDITION_TONE[form.condition] || 'border-white/10 bg-white/5 text-white/80'}`}>
                  {conditionMeta.label}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-white">
                {form.name.trim() || (mode === 'create' ? 'Element nou sense nom encara' : 'Element sense nom')}
              </h1>
              <p className="mt-1 max-w-3xl text-sm text-white/70">
                {form.description.trim() || 'Defineix bé el material perquè packs, costos i operativa entenguin la mateixa veritat.'}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[28rem]">
            <div className="ap-card p-4">
              <p className="text-xs uppercase tracking-wide text-white/45">Categoria</p>
              <p className="mt-2 text-sm font-semibold text-white">{categoryMeta ? `${categoryMeta.icon} ${categoryMeta.label}` : form.category}</p>
            </div>
            <div className="ap-card p-4">
              <p className="text-xs uppercase tracking-wide text-white/45">Valor actual</p>
              <p className="mt-2 text-sm font-semibold text-white">{currentValue > 0 ? formatEuro(currentValue) : 'Per definir'}</p>
            </div>
            <div className="ap-card p-4">
              <p className="text-xs uppercase tracking-wide text-white/45">{form.isConsumable ? 'Estoc' : 'Cost/hora'}</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {form.isConsumable ? stockSummary : hourlyCost > 0 ? `${hourlyCost.toFixed(2)}€/h` : 'Sense amortització'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border admin-tone-border-danger admin-tone-bg-danger p-3 admin-tone-text-danger">
          <p className="text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-xl border admin-tone-border-success admin-tone-bg-success p-3 admin-tone-text-success">
          <p className="text-sm">Canvis desats correctament</p>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.85fr)]">
        <div className="space-y-4">
          <section className="ap-card p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-white">{mode === 'create' ? 'Identitat de l’element' : 'Dades principals'}</h2>
                <p className="mt-1 text-xs text-white/55">Això és el que consumirà la resta del sistema quan aquest material entri a packs o càlculs.</p>
              </div>
              {categoryMeta && (
                <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--panel)] px-3 py-1 text-xs text-white/70">
                  {categoryMeta.icon} {categoryMeta.label}
                </span>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="inv-name" className="text-xs">Nom *</label>
                <input
                  id="inv-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs">Estat</label>
                <div className="mt-1 flex gap-1.5 flex-wrap">
                  {INVENTORY_STATUS_OPTIONS.map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() => updateField('status', status.value)}
                      className={`rounded-xl border px-2 py-1.5 text-xs font-medium transition-all ${
                        form.status === status.value
                          ? 'admin-tone-border-cyan admin-tone-bg-cyan admin-tone-text-cyan'
                          : 'border-white/10 text-white/40 hover:bg-white/5'
                      }`}
                    >
                      {status.label}
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
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="inv-category" className="text-xs">Categoria</label>
                <select
                  id="inv-category"
                  value={form.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className={inputClass}
                >
                  {INVENTORY_CATEGORY_OPTIONS.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs">Condició</label>
                <div className="mt-1 flex gap-1.5 flex-wrap">
                  {INVENTORY_CONDITION_OPTIONS.map((condition) => (
                    <button
                      key={condition.value}
                      type="button"
                      onClick={() => updateField('condition', condition.value)}
                      className={`flex-1 rounded-xl border px-2 py-1.5 text-xs font-medium transition-all ${
                        form.condition === condition.value
                          ? 'admin-tone-border-cyan admin-tone-bg-cyan admin-tone-text-cyan'
                          : 'border-white/10 text-white/40 hover:bg-white/5'
                      }`}
                    >
                      {condition.label}
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
                  className={inputClass}
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
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <section className="ap-card p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Estoc i consum</h2>
                <p className="mt-1 text-xs text-white/55">Només activa aquesta part quan realment controles unitats fungibles o reposició.</p>
              </div>
              <label className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm text-white/85">
                <input
                  type="checkbox"
                  checked={form.isConsumable}
                  onChange={(e) => updateField('isConsumable', e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                Es consumible
              </label>
            </div>

            {form.isConsumable ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="inv-stock" className="text-xs">Estoc actual</label>
                  <input
                    id="inv-stock"
                    type="number"
                    min={0}
                    value={form.stockQuantity}
                    onChange={(e) => updateField('stockQuantity', e.target.value)}
                    className={inputClass}
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
                    className={inputClass}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--panel)] p-4 text-sm text-white/60">
                Aquest element no es controla per estoc. Si és reposició, consumible o material fungible, activa el toggle.
              </div>
            )}
          </section>

          <section className="ap-card p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Amortització i cost</h2>
              <p className="mt-1 text-xs text-white/55">La compra i la vida útil defineixen el cost/hora que després llegeixen els packs.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="inv-purchase-price" className="text-xs">Preu compra (€)</label>
                <input
                  id="inv-purchase-price"
                  type="number"
                  min={0}
                  value={form.purchasePrice}
                  onChange={(e) => updateField('purchasePrice', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="inv-purchase-source" className="text-xs">Font del preu *</label>
                <input
                  id="inv-purchase-source"
                  type="text"
                  value={form.purchasePriceSource}
                  onChange={(e) => updateField('purchasePriceSource', e.target.value)}
                  placeholder="URL de reposició, factura o cost indicat pel propietari"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="inv-purchase-date" className="text-xs">Data compra</label>
                <input
                  id="inv-purchase-date"
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => updateField('purchaseDate', e.target.value)}
                  className={inputClass}
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
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <section className="ap-card p-5">
            <label htmlFor="inv-notes" className="text-xs">Notes internes</label>
            <textarea
              id="inv-notes"
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </section>
        </div>

        <aside className="space-y-4">
          <section className="ap-card p-5">
            <h2 className="text-sm font-semibold text-white">Lectura ràpida</h2>
            <div className="mt-4 space-y-3">
              <div className="ap-card p-4">
                <p className="text-xs uppercase tracking-wide text-white/45">Cost per hora estimat</p>
                <p className="mt-2 text-lg font-semibold text-white">{hourlyCost > 0 ? `${hourlyCost.toFixed(2)}€/h` : 'No calculable'}</p>
                <p className="mt-1 text-xs text-white/55">Compra ÷ vida útil. Si queda buit, el marge dels packs serà menys fiable.</p>
              </div>
              <div className="ap-card p-4">
                <p className="text-xs uppercase tracking-wide text-white/45">Consum i estoc</p>
                <p className="mt-2 text-lg font-semibold text-white">{stockSummary}</p>
                <p className="mt-1 text-xs text-white/55">
                  {form.isConsumable
                    ? `Estoc actual ${stockQuantity || 0} · mínim ${minStock || 0}.`
                    : 'Sense control d’estoc perquè aquest element no és consumible.'}
                </p>
              </div>
              <div className="ap-card p-4">
                <p className="text-xs uppercase tracking-wide text-white/45">Categoria i estat</p>
                <p className="mt-2 text-sm font-semibold text-white">{categoryMeta ? `${categoryMeta.icon} ${categoryMeta.label}` : form.category}</p>
                <p className="mt-1 text-xs text-white/55">
                  {statusMeta?.label || form.status} · {conditionMeta?.label || form.condition}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border admin-tone-border-cyan admin-tone-bg-info p-5">
            <h2 className="text-sm font-semibold text-white">Checklist d’edició</h2>
            <ul className="mt-3 space-y-2 text-sm text-white/75">
              <li>Nom i descripció prou clars per identificar el material sense obrir cap altra pantalla.</li>
              <li>Estat i condició alineats amb la realitat física, no amb el que voldríem que fos.</li>
              <li>Compra, vida útil i valor revisats si l’element entra a packs o càlculs econòmics.</li>
              <li>Si és consumible, estoc i mínim omplerts perquè el sistema pugui avisar abans de quedar-se curt.</li>
            </ul>
          </section>
        </aside>
      </div>

      <div className="sticky bottom-2 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 admin-sticky-bar-bg p-3 backdrop-blur">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !form.name || !form.value}
          className="rounded-xl bg-[var(--o-info)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Desant...' : mode === 'create' ? 'Crear element' : 'Desar canvis'}
        </button>

        {mode === 'edit' && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-xl border admin-tone-border-danger px-4 py-3 text-sm admin-tone-text-danger transition-colors hover:bg-white/5"
          >
            Eliminar
          </button>
        )}

        {mode === 'create' && (
          <button
            type="button"
            onClick={() => router.push('/admin/inventory')}
            className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/80 transition-colors hover:bg-white/5"
          >
            Cancel·lar
          </button>
        )}
      </div>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
