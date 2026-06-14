'use client';

import { useState } from 'react';
import Image from 'next/image';
import { fetchWithCsrf } from '@/lib/csrf';
import { ADMIN_COLLABORATOR_PRODUCT_EMPTY_FORM } from '@/lib/constants/admin';
import { formatCurrency } from '@/lib/constants';
import { resellPrice } from '@/lib/constants/pricing';
import { useToast } from '../components/ToastProvider';
import ConfirmDialog, { useConfirmDialog } from '../components/ConfirmDialog';

export interface CollaboratorProduct {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  crew: string | null;
  durationLabel: string | null;
  costPrice: number;
  sellPrice: number;
  imageUrl: string | null;
  includes: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface Props {
  collaboratorId: string;
  products: CollaboratorProduct[];
  onChanged: () => void;
}

function marginBadge(costPrice: number, sellPrice: number) {
  const net = sellPrice - costPrice;
  const markupPct = costPrice > 0 ? (net / costPrice) * 100 : 0;
  const cls = net > 0 ? 'ap-badge ap-badge--success' : net === 0 ? 'ap-badge ap-badge--warning' : 'ap-badge ap-badge--danger';
  return { net, markupPct, cls };
}

export default function CollaboratorProductsPanel({ collaboratorId, products, onChanged }: Props) {
  const toast = useToast();
  const { confirm, dialogProps } = useConfirmDialog();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(ADMIN_COLLABORATOR_PRODUCT_EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setForm(ADMIN_COLLABORATOR_PRODUCT_EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  // En escriure el cost, suggerim el PVP canònic (cost +20% arrodonit a l'alça a múltiple de 5). Editable.
  const handleCostChange = (raw: string) => {
    const cost: number | '' = raw === '' ? '' : Number(raw);
    setForm((prev) => {
      const next = { ...prev, costPrice: cost };
      const sellTouched = prev.sellPrice !== '' && prev.sellPrice !== resellPrice(Number(prev.costPrice));
      if (cost !== '' && !sellTouched) {
        next.sellPrice = resellPrice(Number(cost));
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('El nom del producte és obligatori');
      return;
    }
    if (form.costPrice === '' || form.sellPrice === '') {
      toast.error('Cost i PVP són obligatoris');
      return;
    }
    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/collaborators/${collaboratorId}/products/${editingId}`
        : `/api/admin/collaborators/${collaboratorId}/products`;
      const res = await fetchWithCsrf(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success(editingId ? 'Producte actualitzat' : 'Producte creat');
      resetForm();
      onChanged();
    } catch (err) {
      console.error('Error desant producte', err);
      toast.error('Error desant el producte');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p: CollaboratorProduct) => {
    setForm({
      name: p.name,
      description: p.description || '',
      category: p.category || '',
      crew: p.crew || '',
      durationLabel: p.durationLabel || '',
      costPrice: p.costPrice,
      sellPrice: p.sellPrice,
      includes: p.includes || '',
      imageUrl: p.imageUrl || '',
      isActive: p.isActive,
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (p: CollaboratorProduct) => {
    const ok = await confirm({ title: 'Eliminar producte', message: `Segur que vols eliminar "${p.name}"?`, variant: 'danger', confirmLabel: 'Eliminar' });
    if (!ok) return;
    try {
      const res = await fetchWithCsrf(`/api/admin/collaborators/${collaboratorId}/products/${p.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Producte eliminat');
      onChanged();
    } catch (err) {
      console.error('Error eliminant producte', err);
      toast.error('Error eliminant el producte');
    }
  };

  const liveMargin = form.costPrice !== '' && form.sellPrice !== ''
    ? marginBadge(Number(form.costPrice), Number(form.sellPrice))
    : null;

  return (
    <div className="mt-4 border-t pt-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold admin-tone-text-neutral">
          Catàleg de productes
          {products.length > 0 && <span className="ml-2 text-white/40">({products.length})</span>}
        </h4>
        <button
          type="button"
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(ADMIN_COLLABORATOR_PRODUCT_EMPTY_FORM); }}
          className="ap-btn ap-btn--secondary text-xs"
        >
          {showForm ? 'Cancel·lar' : '+ Producte'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="ap-card mb-4 space-y-3 rounded-xl p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="prod-name" className="mb-1 block text-xs admin-tone-text-neutral">Nom *</label>
              <input id="prod-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="ap-input w-full px-3 py-2" required />
            </div>
            <div>
              <label htmlFor="prod-category" className="mb-1 block text-xs admin-tone-text-neutral">Categoria</label>
              <input id="prod-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Animació infantil, Musical, Extra..." className="ap-input w-full px-3 py-2" />
            </div>
            <div>
              <label htmlFor="prod-crew" className="mb-1 block text-xs admin-tone-text-neutral">Equip / crew</label>
              <input id="prod-crew" value={form.crew} onChange={(e) => setForm({ ...form, crew: e.target.value })} placeholder="Animador + tècnic de so" className="ap-input w-full px-3 py-2" />
            </div>
            <div>
              <label htmlFor="prod-duration" className="mb-1 block text-xs admin-tone-text-neutral">Durada</label>
              <input id="prod-duration" value={form.durationLabel} onChange={(e) => setForm({ ...form, durationLabel: e.target.value })} placeholder="1h, 70 min..." className="ap-input w-full px-3 py-2" />
            </div>
            <div>
              <label htmlFor="prod-cost" className="mb-1 block text-xs admin-tone-text-neutral">Cost net (€) *</label>
              <input id="prod-cost" type="number" min={0} step={0.01} value={form.costPrice} onChange={(e) => handleCostChange(e.target.value)} className="ap-input w-full px-3 py-2" required />
            </div>
            <div>
              <label htmlFor="prod-sell" className="mb-1 block text-xs admin-tone-text-neutral">El nostre PVP (€) *</label>
              <input id="prod-sell" type="number" min={0} step={0.01} value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: e.target.value === '' ? '' : Number(e.target.value) })} className="ap-input w-full px-3 py-2" required />
            </div>
            <div>
              <label htmlFor="prod-image" className="mb-1 block text-xs admin-tone-text-neutral">Imatge (ruta)</label>
              <input id="prod-image" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="/img/collaborators/masquerade/..." className="ap-input w-full px-3 py-2" />
            </div>
            <div className="flex items-end gap-2">
              <label htmlFor="prod-active" className="flex items-center gap-2 text-xs admin-tone-text-neutral">
                <input id="prod-active" type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Actiu
              </label>
            </div>
          </div>
          <div>
            <label htmlFor="prod-description" className="mb-1 block text-xs admin-tone-text-neutral">
              Text del dossier
              <span className="ml-2 text-white/40">Narrativa que es mostra al capítol del dossier comercial</span>
            </label>
            <textarea id="prod-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Explica l'experiència en to comercial. La marca del proveïdor es neteja automàticament: tot es presenta com a Òrbita." className="ap-input w-full px-3 py-2" />
          </div>
          <div>
            <label htmlFor="prod-includes" className="mb-1 block text-xs admin-tone-text-neutral">Què inclou</label>
            <textarea id="prod-includes" value={form.includes} onChange={(e) => setForm({ ...form, includes: e.target.value })} rows={2} className="ap-input w-full px-3 py-2" />
          </div>
          <div className="flex items-center justify-between gap-4">
            {liveMargin && (
              <span className={liveMargin.cls}>
                Profit {formatCurrency(liveMargin.net)} (+{liveMargin.markupPct.toFixed(0)}% sobre cost)
              </span>
            )}
            <button type="submit" disabled={saving} className="ap-btn ap-btn--primary ml-auto">
              {saving ? 'Desant...' : editingId ? 'Desar' : 'Crear producte'}
            </button>
          </div>
        </form>
      )}

      {products.length === 0 ? (
        <p className="text-xs admin-tone-text-slate">Encara no hi ha productes en aquest catàleg.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const m = marginBadge(p.costPrice, p.sellPrice);
            return (
              <div key={p.id} className={`ap-card overflow-hidden rounded-xl ${p.isActive ? '' : 'opacity-50'}`}>
                {p.imageUrl && (
                  <div className="relative aspect-square w-full bg-black/20">
                    <Image src={p.imageUrl} alt={p.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                  </div>
                )}
                <div className="space-y-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{p.name}</p>
                      {p.category && <p className="text-xs text-amber-400/80">{p.category}</p>}
                    </div>
                    {!p.isActive && <span className="ap-badge">Inactiu</span>}
                  </div>
                  {(p.crew || p.durationLabel) && (
                    <p className="text-xs admin-tone-text-slate">
                      {[p.crew, p.durationLabel].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="admin-tone-text-neutral">Cost {formatCurrency(p.costPrice)}</span>
                    <span className="font-bold text-white">PVP {formatCurrency(p.sellPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={m.cls}>+{formatCurrency(m.net)} (+{m.markupPct.toFixed(0)}% sobre cost)</span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => handleEdit(p)} className="ap-btn ap-btn--secondary text-xs" aria-label={`Editar ${p.name}`}>Editar</button>
                      <button type="button" onClick={() => handleDelete(p)} className="ap-btn ap-btn--danger text-xs" aria-label={`Eliminar ${p.name}`}>×</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
