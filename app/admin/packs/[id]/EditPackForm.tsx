'use client';
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type EditorTab = 'economic' | 'content' | 'texts' | 'publish';

interface PackTranslation {
  locale: string;
  name: string;
  description: string | null;
  tagline: string | null;
  features: string[];
}

interface InventoryItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  category: string;
  purchasePrice: number | null;
  expectedLifeHours: number | null;
}

interface PackInventoryRow {
  itemId: string;
  quantity: number;
  isRequired: boolean;
}

interface Pack {
  id: string;
  slug: string;
  service: string | null;
  price: number;
  originalPrice: number | null;
  extraHourPrice: number;
  djHours: number;
  soundWatts: number;
  includesFog: boolean;
  includesMic: boolean;
  minGuests: number | null;
  maxGuests: number | null;
  isActive: boolean;
  isFeatured: boolean;
  order: number;
  translations: PackTranslation[];
  inventory: PackInventoryRow[];
}

type PricingHint = {
  recommendedPrice: number;
  recommendedExtraHourPrice: number;
  alertThreshold: number;
};

type PricingModel = {
  marginTargetPct: number;
  specialistCostPerHour: number;
  operatorCostPerHour: number;
  supportOperatorMinGuests: number;
  supportOperatorMinDjHours: number;
  supportOperatorMinWatts: number;
  fixedPackCost: number;
};

const TABS: Array<{ id: EditorTab; label: string; icon: string }> = [
  { id: 'economic', label: 'Economia', icon: '💰' },
  { id: 'content', label: 'Contingut', icon: '🎛️' },
  { id: 'texts', label: 'Textos', icon: '🌐' },
  { id: 'publish', label: 'Publicació', icon: '✅' },
];
const LOCALES = ['ca', 'es', 'en'] as const;

const round2 = (n: number) => Math.round(n * 100) / 100;
const calcCostHour = (price: number | null, life: number | null) =>
  !price || price <= 0 ? 0 : round2(price / (life && life > 0 ? life : 2000));
const divPct = (pub: number, rec: number) => (rec > 0 ? ((pub - rec) / rec) * 100 : 0);
const semClass = (d: number, t: number) => Math.abs(d) >= t ? 'border-rose-500/40 bg-rose-500/15 text-rose-200' : Math.abs(d) >= t * 0.5 ? 'border-amber-500/40 bg-amber-500/15 text-amber-200' : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200';

export default function EditPackForm({
  pack,
  inventoryItems,
  pricingHint,
  pricingModel,
}: {
  pack: Pack;
  inventoryItems: InventoryItem[];
  pricingHint: PricingHint;
  pricingModel: PricingModel;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<EditorTab>('economic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [search, setSearch] = useState('');
  const [dropZone, setDropZone] = useState<'available' | 'included' | null>(null);

  const [formData, setFormData] = useState({
    slug: pack.slug,
    service: pack.service || '',
    price: pack.price,
    originalPrice: pack.originalPrice || '',
    extraHourPrice: pack.extraHourPrice,
    djHours: pack.djHours,
    soundWatts: pack.soundWatts,
    includesFog: pack.includesFog,
    includesMic: pack.includesMic,
    minGuests: pack.minGuests || '',
    maxGuests: pack.maxGuests || '',
    isActive: pack.isActive,
    isFeatured: pack.isFeatured,
    order: pack.order,
  });
  const [packInventory, setPackInventory] = useState<PackInventoryRow[]>(pack.inventory || []);
  const [translations, setTranslations] = useState<PackTranslation[]>(
    LOCALES.map((locale) => pack.translations.find((t) => t.locale === locale) || { locale, name: '', description: '', tagline: '', features: [] })
  );

  const itemById = useMemo(() => new Map(inventoryItems.map((i) => [i.id, i])), [inventoryItems]);
  const includedIds = useMemo(() => new Set(packInventory.map((r) => r.itemId)), [packInventory]);
  const included = useMemo(() => packInventory.map((r) => ({ row: r, item: itemById.get(r.itemId) })).filter((x): x is { row: PackInventoryRow; item: InventoryItem } => Boolean(x.item)), [packInventory, itemById]);
  const available = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inventoryItems.filter((i) => !includedIds.has(i.id) && (!q || `${i.name} ${i.code} ${i.description || ''}`.toLowerCase().includes(q)));
  }, [inventoryItems, includedIds, search]);

  const recommended = useMemo(() => {
    const inventoryCostHour = included.reduce((s, x) => s + calcCostHour(x.item.purchasePrice, x.item.expectedLifeHours) * Math.max(1, x.row.quantity), 0);
    const h = Math.max(1, Number(formData.djHours || 1));
    const guests = Number(formData.maxGuests || 0);
    const watts = Number(formData.soundWatts || 0);
    const withOperator = h >= pricingModel.supportOperatorMinDjHours || guests >= pricingModel.supportOperatorMinGuests || watts >= pricingModel.supportOperatorMinWatts;
    const laborCostHour = pricingModel.specialistCostPerHour + (withOperator ? pricingModel.operatorCostPerHour : 0);
    const marginBase = Math.max(0.1, 1 - pricingModel.marginTargetPct);
    return {
      pack: round2(((inventoryCostHour + laborCostHour) * h + pricingModel.fixedPackCost) / marginBase),
      extra: round2((inventoryCostHour + laborCostHour) / marginBase),
      inventoryCostHour: round2(inventoryCostHour),
      laborCostHour: round2(laborCostHour),
    };
  }, [included, formData.djHours, formData.maxGuests, formData.soundWatts, pricingModel]);

  const input = 'block w-full rounded-xl border border-slate-600/50 bg-slate-800/80 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 sm:text-sm';
  const packDiv = divPct(Number(formData.price), recommended.pack || pricingHint.recommendedPrice);
  const extraDiv = divPct(Number(formData.extraHourPrice), recommended.extra || pricingHint.recommendedExtraHourPrice);

  const onDragStart = (e: React.DragEvent<HTMLElement>, itemId: string, source: 'available' | 'included') => {
    e.dataTransfer.setData('application/json', JSON.stringify({ itemId, source }));
    e.dataTransfer.effectAllowed = 'move';
  };
  const dropIn = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDropZone(null);
    const d = JSON.parse(e.dataTransfer.getData('application/json') || '{}') as { itemId?: string };
    const itemId = typeof d.itemId === 'string' ? d.itemId : '';
    if (!itemId) return;
    setPackInventory((prev) => {
      const i = prev.findIndex((r) => r.itemId === itemId);
      if (i >= 0) return prev.map((r, idx) => idx === i ? { ...r, quantity: r.quantity + 1 } : r);
      return [...prev, { itemId, quantity: 1, isRequired: true }];
    });
  };
  const dropOut = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDropZone(null);
    const d = JSON.parse(e.dataTransfer.getData('application/json') || '{}') as { itemId?: string; source?: string };
    const itemId = typeof d.itemId === 'string' ? d.itemId : '';
    if (!itemId || d.source !== 'included') return;
    setPackInventory((prev) => prev.filter((r) => r.itemId !== itemId));
  };

  const updateTranslation = (locale: string, field: keyof PackTranslation, value: string | string[]) =>
    setTranslations((prev) => prev.map((t) => t.locale === locale ? { ...t, [field]: value } : t));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(null); setSuccess(false);
    try {
      const response = await fetch(`/api/admin/packs/${pack.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: formData.slug,
          service: formData.service || null,
          price: Number(formData.price),
          originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
          extraHourPrice: Number(formData.extraHourPrice),
          djHours: Number(formData.djHours),
          soundWatts: Number(formData.soundWatts),
          includesFog: formData.includesFog,
          includesMic: formData.includesMic,
          minGuests: formData.minGuests ? Number(formData.minGuests) : null,
          maxGuests: formData.maxGuests ? Number(formData.maxGuests) : null,
          isActive: formData.isActive,
          isFeatured: formData.isFeatured,
          order: Number(formData.order),
          translations,
          inventory: packInventory,
        }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Error actualitzant pack');
      setSuccess(true); router.refresh(); setTimeout(() => router.push('/admin/packs'), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconegut');
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
        <h2 className="text-xl font-bold text-slate-100">Editor pro de pack</h2>
        <p className="mt-1 text-sm text-slate-400">Drag & drop d'inventari dins/fora + autocalcul de preus recomanats.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-4">{TABS.map((t) => <button key={t.id} type="button" onClick={() => setActiveTab(t.id)} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${activeTab === t.id ? 'border-amber-400/50 bg-amber-500/15 text-amber-200' : 'border-slate-700/60 bg-slate-900/60 text-slate-300'}`}>{t.icon} {t.label}</button>)}</div>
      </section>

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">❌ {error}</div>}
      {success && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">✅ Pack actualitzat correctament</div>}

      {activeTab === 'economic' && <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6"><h3 className="mb-4 text-lg font-semibold text-slate-100">💰 Economia i semàfors</h3><div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-3"><p className="text-xs text-slate-400">Preu recomanat pack</p><p className="text-lg font-semibold text-cyan-200">{recommended.pack.toFixed(2)}€</p></div><div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-3"><p className="text-xs text-slate-400">Hora extra recomanada</p><p className="text-lg font-semibold text-cyan-200">{recommended.extra.toFixed(2)}€</p></div><div className={`rounded-xl border p-3 ${semClass(packDiv, pricingHint.alertThreshold)}`}><p className="text-xs font-semibold">Semàfor pack</p><p className="text-sm font-bold">{packDiv >= 0 ? '+' : ''}{packDiv.toFixed(1)}%</p></div><div className={`rounded-xl border p-3 ${semClass(extraDiv, pricingHint.alertThreshold)}`}><p className="text-xs font-semibold">Semàfor hora extra</p><p className="text-sm font-bold">{extraDiv >= 0 ? '+' : ''}{extraDiv.toFixed(1)}%</p></div></div><div className="grid gap-4 sm:grid-cols-3"><div><label className="mb-1 block text-sm text-slate-300">PVP pack</label><input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) || 0 })} className={input} /></div><div><label className="mb-1 block text-sm text-slate-300">PVP hora extra</label><input type="number" step="0.01" value={formData.extraHourPrice} onChange={(e) => setFormData({ ...formData, extraHourPrice: Number(e.target.value) || 0 })} className={input} /></div><div><label className="mb-1 block text-sm text-slate-300">Cost inventari/h</label><div className="rounded-xl border border-slate-700/60 bg-slate-900/70 px-4 py-2.5 text-sm text-slate-100">{recommended.inventoryCostHour.toFixed(2)}€ · Cost humà/h {recommended.laborCostHour.toFixed(2)}€</div></div></div></section>}

      {activeTab === 'content' && <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6"><h3 className="mb-4 text-lg font-semibold text-slate-100">🧩 Inventari del pack</h3><div className="mb-3 grid gap-3 sm:grid-cols-3"><input className={input} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca element..." /><input className={input} value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="Slug" /><input className={input} value={formData.service} onChange={(e) => setFormData({ ...formData, service: e.target.value })} placeholder="Servei intern" /></div><div className="grid gap-4 lg:grid-cols-2"><div onDragOver={(e) => { e.preventDefault(); setDropZone('available'); }} onDragLeave={() => setDropZone((p) => p === 'available' ? null : p)} onDrop={dropOut} className={`rounded-xl border p-3 ${dropZone === 'available' ? 'border-rose-400/60 bg-rose-500/10' : 'border-slate-700/60 bg-slate-900/50'}`}><p className="mb-2 text-sm font-semibold text-slate-100">Disponibles ({available.length})</p><div className="max-h-[26rem] space-y-2 overflow-auto pr-1">{available.map((i) => <article key={i.id} draggable onDragStart={(e) => onDragStart(e, i.id, 'available')} className="cursor-grab rounded-lg border border-slate-700/60 bg-slate-950/70 p-2"><div className="flex items-start gap-3"><img src={i.imageUrl || '/placeholder.png'} alt={i.name} className="h-14 w-14 rounded-md border border-slate-700/60 bg-slate-900 object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-100">{i.name}</p><p className="text-xs text-slate-400">{i.code}</p><p className="line-clamp-2 text-xs text-slate-300">{i.description || 'Sense descripció'}</p></div></div></article>)}</div></div><div onDragOver={(e) => { e.preventDefault(); setDropZone('included'); }} onDragLeave={() => setDropZone((p) => p === 'included' ? null : p)} onDrop={dropIn} className={`rounded-xl border p-3 ${dropZone === 'included' ? 'border-emerald-400/60 bg-emerald-500/10' : 'border-slate-700/60 bg-slate-900/50'}`}><p className="mb-2 text-sm font-semibold text-slate-100">Inclosos ({included.length})</p><div className="max-h-[26rem] space-y-2 overflow-auto pr-1">{included.map(({ row, item }) => <article key={item.id} draggable onDragStart={(e) => onDragStart(e, item.id, 'included')} className="cursor-grab rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2"><div className="flex items-start gap-3"><img src={item.imageUrl || '/placeholder.png'} alt={item.name} className="h-14 w-14 rounded-md border border-slate-700/60 bg-slate-900 object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-100">{item.name}</p><p className="text-xs text-slate-300">{item.code} · {calcCostHour(item.purchasePrice, item.expectedLifeHours).toFixed(2)}€/h</p><p className="line-clamp-2 text-xs text-slate-300">{item.description || 'Sense descripció'}</p><div className="mt-2 flex flex-wrap items-center gap-2"><input type="number" min={1} value={row.quantity} onChange={(e) => setPackInventory((prev) => prev.map((x) => x.itemId === item.id ? { ...x, quantity: Math.max(1, Number(e.target.value) || 1) } : x))} className="w-20 rounded border border-slate-600/60 bg-slate-950 px-2 py-1 text-xs text-slate-100" /><label className="text-xs text-slate-300"><input type="checkbox" checked={row.isRequired} onChange={(e) => setPackInventory((prev) => prev.map((x) => x.itemId === item.id ? { ...x, isRequired: e.target.checked } : x))} /> Obligatori</label><button type="button" onClick={() => setPackInventory((prev) => prev.filter((x) => x.itemId !== item.id))} className="ml-auto rounded-md border border-rose-400/50 bg-rose-500/15 px-2 py-1 text-xs text-rose-100">Treure</button></div></div></div></article>)}{included.length === 0 && <p className="rounded-lg border border-dashed border-slate-700/60 p-4 text-center text-sm text-slate-400">Arrossega aquí els elements del pack.</p>}</div></div></div></section>}

      {activeTab === 'texts' && <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6"><h3 className="mb-4 text-lg font-semibold text-slate-100">🌐 Textos</h3><div className="grid gap-4">{LOCALES.map((locale) => { const tr = translations.find((t) => t.locale === locale)!; return <div key={locale} className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4"><h4 className="mb-2 text-sm font-semibold text-slate-100">{locale.toUpperCase()}</h4><input value={tr.name} onChange={(e) => updateTranslation(locale, 'name', e.target.value)} className={input} placeholder="Nom" /><textarea rows={3} value={tr.description || ''} onChange={(e) => updateTranslation(locale, 'description', e.target.value)} className={`${input} mt-2`} placeholder="Descripció" /></div>; })}</div></section>}

      {activeTab === 'publish' && <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6"><h3 className="mb-4 text-lg font-semibold text-slate-100">✅ Publicació</h3><div className="grid gap-4 sm:grid-cols-3"><label className="text-sm text-slate-300"><input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} /> Actiu</label><label className="text-sm text-slate-300"><input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })} /> Destacat</label><input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) || 0 })} className={input} placeholder="Ordre" /></div></section>}

      <div className="sticky bottom-2 z-10 flex flex-wrap justify-end gap-3 rounded-xl border border-slate-700/60 bg-slate-950/90 p-3 backdrop-blur">
        <Link href="/admin/packs" className="rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-2 text-sm font-medium text-slate-300">Cancel·lar</Link>
        <button type="submit" disabled={loading} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-sm font-medium text-white disabled:opacity-50">{loading ? 'Guardant...' : 'Desar canvis'}</button>
      </div>
    </form>
  );
}
