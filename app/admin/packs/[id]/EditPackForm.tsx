'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
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

interface InventoryBundle {
  id: string;
  name: string;
  itemIds: string[];
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
const eur = (v: number) => `${round2(v).toFixed(2)}€`;

function getMarginSignal(currentPrice: number, recommendedPrice: number, thresholdPct: number) {
  const diffPct = divPct(currentPrice, recommendedPrice);
  if (diffPct >= 0) {
    return {
      tone: 'green' as const,
      label: 'Verd',
      cardClass: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100',
      dotClass: 'bg-emerald-400',
      message: 'Dins del marge objectiu. Pots mantenir aquest preu.',
    };
  }
  if (diffPct >= -Math.abs(thresholdPct)) {
    return {
      tone: 'orange' as const,
      label: 'Taronja',
      cardClass: 'border-amber-500/45 bg-amber-500/10 text-amber-100',
      dotClass: 'bg-amber-400',
      message: 'Marge just. Recomanació: pujar una mica el preu.',
    };
  }
  return {
    tone: 'red' as const,
    label: 'Roig',
    cardClass: 'border-rose-500/45 bg-rose-500/10 text-rose-100',
    dotClass: 'bg-rose-400',
    message: 'Per sota del marge. Cal pujar preu o reduir cost.',
  };
}

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
  const [info, setInfo] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [search, setSearch] = useState('');
  const [dropZone, setDropZone] = useState<'available' | 'included' | null>(null);
  const [autoPricing, setAutoPricing] = useState(true);
  const [bundles, setBundles] = useState<InventoryBundle[]>([]);
  const [selectedBundleId, setSelectedBundleId] = useState('');

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
  const packSignal = getMarginSignal(Number(formData.price), recommended.pack || pricingHint.recommendedPrice, pricingHint.alertThreshold);
  const extraSignal = getMarginSignal(Number(formData.extraHourPrice), recommended.extra || pricingHint.recommendedExtraHourPrice, pricingHint.alertThreshold);
  const packDeltaEur = round2((recommended.pack || pricingHint.recommendedPrice) - Number(formData.price));
  const extraDeltaEur = round2((recommended.extra || pricingHint.recommendedExtraHourPrice) - Number(formData.extraHourPrice));
  const totalUnits = packInventory.reduce((acc, row) => acc + Math.max(1, Number(row.quantity || 1)), 0);
  const baseCostPack = round2((recommended.inventoryCostHour + recommended.laborCostHour) * Math.max(1, Number(formData.djHours || 1)) + pricingModel.fixedPackCost);

  useEffect(() => {
    if (!autoPricing) return;
    const nextPack = Math.max(1, round2(recommended.pack || pricingHint.recommendedPrice || 1));
    const nextExtra = Math.max(1, round2(recommended.extra || pricingHint.recommendedExtraHourPrice || 1));
    setFormData((prev) => ({
      ...prev,
      price: nextPack,
      extraHourPrice: nextExtra,
    }));
  }, [autoPricing, recommended.pack, recommended.extra, pricingHint.recommendedPrice, pricingHint.recommendedExtraHourPrice]);

  useEffect(() => {
    let cancelled = false;
    const loadBundles = async () => {
      try {
        const res = await fetch('/api/admin/inventory/bundles');
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        const next = Array.isArray(data?.bundles)
          ? data.bundles.map((b: any) => ({
              id: String(b.id || ''),
              name: String(b.name || ''),
              itemIds: Array.isArray(b.itemIds) ? b.itemIds.map((id: any) => String(id)) : [],
            })).filter((b: InventoryBundle) => b.id && b.name)
          : [];
        setBundles(next);
        if (!selectedBundleId && next.length > 0) {
          setSelectedBundleId(next[0].id);
        }
      } catch {
        // silent
      }
    };
    void loadBundles();
    return () => { cancelled = true; };
  }, [selectedBundleId]);

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

  const autoComposeInventory = (mode: 'base' | 'pro') => {
    const classify = (item: InventoryItem) => {
      const text = `${item.category} ${item.name} ${item.code} ${item.description || ''}`.toLowerCase();
      if (/altavoz|speaker|sub|woofer|sound|audio|pa\b/.test(text)) return 'sound';
      if (/light|led|foco|cabeza|moving|ilumin/.test(text)) return 'light';
      if (/cabina|booth|controladora|mixer|dj/.test(text)) return 'booth';
      if (/micro|mic/.test(text)) return 'mic';
      if (/humo|fum|bubble|burbuja|co2|confeti|spark|efect/.test(text)) return 'fx';
      return 'other';
    };

    const byType = {
      sound: [] as InventoryItem[],
      light: [] as InventoryItem[],
      booth: [] as InventoryItem[],
      mic: [] as InventoryItem[],
      fx: [] as InventoryItem[],
      other: [] as InventoryItem[],
    };

    inventoryItems.forEach((item) => {
      byType[classify(item)].push(item);
    });

    const pick = (arr: InventoryItem[], count: number) => arr.slice(0, count);
    const selected = [
      ...pick(byType.sound, mode === 'pro' ? 2 : 1),
      ...pick(byType.booth, 1),
      ...pick(byType.light, mode === 'pro' ? 3 : 2),
      ...pick(byType.mic, mode === 'pro' ? 2 : 1),
      ...pick(byType.fx, mode === 'pro' ? 2 : 1),
    ];

    const dedup = new Map<string, InventoryItem>();
    selected.forEach((item) => dedup.set(item.id, item));

    let finalItems = Array.from(dedup.values());
    if (finalItems.length === 0) {
      finalItems = inventoryItems.slice(0, mode === 'pro' ? 8 : 5);
    }

    const toQty = (item: InventoryItem) => {
      const text = `${item.name} ${item.code}`.toLowerCase();
      if (/altavoz|speaker|foco|cabeza|moving|micr[oó]fon|micro/.test(text)) return 2;
      return 1;
    };

    setPackInventory(finalItems.map((item) => ({
      itemId: item.id,
      quantity: toQty(item),
      isRequired: true,
    })));
    setInfo(`Compositor automàtic aplicat (${mode === 'pro' ? 'PRO' : 'BASE'}): ${finalItems.length} elements.`);
    setActiveTab('content');
  };

  const addBundleToPack = (bundleId: string) => {
    const bundle = bundles.find((b) => b.id === bundleId);
    if (!bundle) {
      setInfo('Lot no trobat.');
      return;
    }
    const ids = bundle.itemIds.filter(Boolean);
    if (ids.length === 0) {
      setInfo('Aquest lot no té elements.');
      return;
    }
    const existing = new Set(packInventory.map((r) => r.itemId));
    const toAdd = ids.filter((id) => !existing.has(id));
    if (toAdd.length === 0) {
      setInfo(`Lot "${bundle.name}" ja està completament dins del pack.`);
      return;
    }
    setPackInventory((prev) => [
      ...prev,
      ...toAdd.map((itemId) => ({ itemId, quantity: 1, isRequired: true })),
    ]);
    setInfo(`Lot "${bundle.name}" afegit al pack (${toAdd.length} elements).`);
    setActiveTab('content');
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(null); setInfo(null); setSuccess(false);
    try {
      if (packInventory.length === 0) {
        throw new Error('El pack no es pot guardar buit. Afegeix inventari (manual o compositor automàtic).');
      }
      if (Number(formData.price) <= 0 || Number(formData.extraHourPrice) <= 0) {
        throw new Error('Els preus han de ser superiors a 0€.');
      }

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
      {info && <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-cyan-200">ℹ️ {info}</div>}
      {success && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">✅ Pack actualitzat correctament</div>}

      {activeTab === 'economic' && (
        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-100">💰 Economia i semàfors</h3>

          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-3">
              <p className="text-xs text-slate-400">Preu recomanat pack</p>
              <p className="text-lg font-semibold text-cyan-200">{eur(recommended.pack)}</p>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-3">
              <p className="text-xs text-slate-400">Hora extra recomanada</p>
              <p className="text-lg font-semibold text-cyan-200">{eur(recommended.extra)}</p>
            </div>
            <div className={`rounded-xl border p-3 ${semClass(packDiv, pricingHint.alertThreshold)}`}>
              <p className="text-xs font-semibold">Semàfor pack</p>
              <p className="text-sm font-bold">{packDiv >= 0 ? '+' : ''}{packDiv.toFixed(1)}%</p>
            </div>
            <div className={`rounded-xl border p-3 ${semClass(extraDiv, pricingHint.alertThreshold)}`}>
              <p className="text-xs font-semibold">Semàfor hora extra</p>
              <p className="text-sm font-bold">{extraDiv >= 0 ? '+' : ''}{extraDiv.toFixed(1)}%</p>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoPricing((v) => !v)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${autoPricing ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-100' : 'border-slate-600/50 bg-slate-800/70 text-slate-200'}`}
            >
              Preu automàtic {autoPricing ? 'ON' : 'OFF'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAutoPricing(false);
                setFormData((prev) => ({ ...prev, price: Math.max(1, round2(recommended.pack)), extraHourPrice: Math.max(1, round2(recommended.extra)) }));
                setInfo('Preus recomanats aplicats una vegada.');
              }}
              className="rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-100"
            >
              Aplicar recomanat ara
            </button>
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-3">
              <p className="text-xs text-slate-400">Hores DJ (contador)</p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, djHours: Math.max(1, Number(prev.djHours) - 1) }))}
                  className="h-8 w-8 rounded-lg border border-slate-600/50 bg-slate-800/80 text-slate-200"
                >
                  -
                </button>
                <div className="min-w-[64px] text-center text-lg font-semibold text-slate-100">{formData.djHours}h</div>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, djHours: Math.min(24, Number(prev.djHours) + 1) }))}
                  className="h-8 w-8 rounded-lg border border-slate-600/50 bg-slate-800/80 text-slate-200"
                >
                  +
                </button>
              </div>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-3">
              <p className="text-xs text-slate-400">Aforament max</p>
              <input
                type="number"
                min={0}
                value={Number(formData.maxGuests || 0)}
                onChange={(e) => setFormData({ ...formData, maxGuests: Number(e.target.value) || 0 })}
                className={`${input} mt-2`}
              />
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-3">
              <p className="text-xs text-slate-400">Potència so (W)</p>
              <input
                type="number"
                min={0}
                value={Number(formData.soundWatts || 0)}
                onChange={(e) => setFormData({ ...formData, soundWatts: Number(e.target.value) || 0 })}
                className={`${input} mt-2`}
              />
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-3">
              <p className="text-xs text-slate-400">Cost base estimat pack</p>
              <p className="mt-2 text-lg font-semibold text-slate-100">{eur(baseCostPack)}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className={`rounded-xl border p-4 ${packSignal.cardClass}`}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">PVP pack</p>
                <span className="inline-flex items-center gap-2 rounded-full border border-current/40 px-2 py-0.5 text-xs font-semibold">
                  <span className={`h-2 w-2 rounded-full ${packSignal.dotClass}`} />
                  {packSignal.label}
                </span>
              </div>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => {
                  setAutoPricing(false);
                  setFormData({ ...formData, price: Number(e.target.value) || 0 });
                }}
                className={input}
              />
              <p className="mt-2 text-xs">{packSignal.message}</p>
              {packDeltaEur > 0 && (
                <p className="mt-1 text-xs font-semibold">Suport: puja almenys {eur(packDeltaEur)} per entrar en marge.</p>
              )}
            </div>

            <div className={`rounded-xl border p-4 ${extraSignal.cardClass}`}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">PVP hora extra</p>
                <span className="inline-flex items-center gap-2 rounded-full border border-current/40 px-2 py-0.5 text-xs font-semibold">
                  <span className={`h-2 w-2 rounded-full ${extraSignal.dotClass}`} />
                  {extraSignal.label}
                </span>
              </div>
              <input
                type="number"
                step="0.01"
                value={formData.extraHourPrice}
                onChange={(e) => {
                  setAutoPricing(false);
                  setFormData({ ...formData, extraHourPrice: Number(e.target.value) || 0 });
                }}
                className={input}
              />
              <p className="mt-2 text-xs">{extraSignal.message}</p>
              {extraDeltaEur > 0 && (
                <p className="mt-1 text-xs font-semibold">Suport: puja almenys {eur(extraDeltaEur)} per entrar en marge.</p>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-700/60 bg-slate-900/70 px-4 py-2.5 text-sm text-slate-100">
            Cost inventari/h {eur(recommended.inventoryCostHour)} · Cost humà/h {eur(recommended.laborCostHour)}
          </div>

          <div className="mt-4 rounded-xl border border-slate-700/60 bg-slate-900/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-100">Composició visual del pack</p>
              <p className="text-xs text-slate-400">{included.length} elements</p>
            </div>
            {included.length === 0 ? (
              <p className="text-sm text-slate-400">Aquest pack encara no té inventari assignat.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {included.map(({ row, item }) => (
                  <article key={item.id} className="flex items-center gap-3 rounded-lg border border-slate-700/60 bg-slate-950/60 p-2">
                    <img
                      src={item.imageUrl || '/placeholder.png'}
                      alt={item.name}
                      className="h-14 w-14 rounded-md border border-slate-700/60 bg-slate-900 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-100">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.code}</p>
                      <p className="text-xs text-cyan-200">x{row.quantity} · {eur(calcCostHour(item.purchasePrice, item.expectedLifeHours))}/h</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

            {activeTab === 'content' && (
        <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-100">🧩 Inventari del pack</h3>
          <p className="mb-3 text-xs text-slate-400">
            Visual amb foto + drag and drop: arrossega de "Disponibles" a "Inclosos" per composar el pack.
          </p>

          <div className="mb-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-700/60 bg-slate-900/70 p-3">
              <p className="text-xs text-slate-400">Elements</p>
              <p className="text-lg font-semibold text-slate-100">{included.length}</p>
            </div>
            <div className="rounded-lg border border-slate-700/60 bg-slate-900/70 p-3">
              <p className="text-xs text-slate-400">Unitats totals</p>
              <p className="text-lg font-semibold text-slate-100">{totalUnits}</p>
            </div>
            <div className="rounded-lg border border-slate-700/60 bg-slate-900/70 p-3">
              <p className="text-xs text-slate-400">Cost inventari/h</p>
              <p className="text-lg font-semibold text-cyan-200">{eur(recommended.inventoryCostHour)}</p>
            </div>
          </div>

          {bundles.length > 0 && (
            <div className="mb-3 rounded-xl border border-indigo-400 bg-indigo-950/40 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-200">Lots d'equip</p>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {bundles.map((bundle) => {
                  const active = selectedBundleId === bundle.id;
                  return (
                    <button
                      key={bundle.id}
                      type="button"
                      onClick={() => setSelectedBundleId(bundle.id)}
                      className={`rounded-lg border px-3 py-2 text-left transition-colors ${active ? 'border-indigo-300 bg-indigo-700 text-white' : 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
                    >
                      <p className="text-sm font-semibold">{bundle.name}</p>
                      <p className="text-xs opacity-80">{bundle.itemIds.length} elements</p>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => addBundleToPack(selectedBundleId)}
                  disabled={!selectedBundleId}
                  className="rounded-lg border border-indigo-300 bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-600 disabled:opacity-50"
                >
                  + Afegir lot seleccionat al pack
                </button>
              </div>
            </div>
          )}

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => autoComposeInventory('base')}
              className="rounded-lg border border-cyan-300 bg-cyan-700 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Compositor automàtic BASE
            </button>
            <button
              type="button"
              onClick={() => autoComposeInventory('pro')}
              className="rounded-lg border border-violet-300 bg-violet-700 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Compositor automàtic PRO
            </button>
            <button
              type="button"
              onClick={() => { setPackInventory([]); setInfo('Inventari del pack netejat.'); }}
              className="rounded-lg border border-rose-300 bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Buidar composició
            </button>
          </div>

          <div className="mb-3 grid gap-3 sm:grid-cols-3">
            <input className={input} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca element..." />
            <input className={input} value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="Slug" />
            <input className={input} value={formData.service} onChange={(e) => setFormData({ ...formData, service: e.target.value })} placeholder="Servei intern" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div
              onDragOver={(e) => { e.preventDefault(); setDropZone('available'); }}
              onDragLeave={() => setDropZone((p) => p === 'available' ? null : p)}
              onDrop={dropOut}
              className={`rounded-xl border p-3 ${dropZone === 'available' ? 'border-rose-400/60 bg-rose-500/10' : 'border-slate-700/60 bg-slate-900/50'}`}
            >
              <p className="mb-2 text-sm font-semibold text-slate-100">Disponibles ({available.length})</p>
              <div className="max-h-[26rem] space-y-2 overflow-auto pr-1">
                {available.map((i) => (
                  <article key={i.id} draggable onDragStart={(e) => onDragStart(e, i.id, 'available')} className="cursor-grab rounded-lg border border-slate-700/60 bg-slate-950/70 p-2">
                    <div className="flex items-start gap-3">
                      <img src={i.imageUrl || '/placeholder.png'} alt={i.name} className="h-14 w-14 rounded-md border border-slate-700/60 bg-slate-900 object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-100">{i.name}</p>
                        <p className="text-xs text-slate-400">{i.code}</p>
                        <p className="line-clamp-2 text-xs text-slate-300">{i.description || 'Sense descripció'}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDropZone('included'); }}
              onDragLeave={() => setDropZone((p) => p === 'included' ? null : p)}
              onDrop={dropIn}
              className={`rounded-xl border p-3 ${dropZone === 'included' ? 'border-emerald-400/60 bg-emerald-500/10' : 'border-slate-700/60 bg-slate-900/50'}`}
            >
              <p className="mb-2 text-sm font-semibold text-slate-100">Inclosos ({included.length})</p>
              <div className="max-h-[26rem] space-y-2 overflow-auto pr-1">
                {included.map(({ row, item }) => (
                  <article key={item.id} draggable onDragStart={(e) => onDragStart(e, item.id, 'included')} className="cursor-grab rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2">
                    <div className="flex items-start gap-3">
                      <img src={item.imageUrl || '/placeholder.png'} alt={item.name} className="h-14 w-14 rounded-md border border-slate-700/60 bg-slate-900 object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-100">{item.name}</p>
                        <p className="text-xs text-slate-300">{item.code} · {calcCostHour(item.purchasePrice, item.expectedLifeHours).toFixed(2)}€/h</p>
                        <p className="line-clamp-2 text-xs text-slate-300">{item.description || 'Sense descripció'}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={row.quantity}
                            onChange={(e) => setPackInventory((prev) => prev.map((x) => x.itemId === item.id ? { ...x, quantity: Math.max(1, Number(e.target.value) || 1) } : x))}
                            className="w-20 rounded border border-slate-600/60 bg-slate-950 px-2 py-1 text-xs text-slate-100"
                          />
                          <label className="text-xs text-slate-300">
                            <input
                              type="checkbox"
                              checked={row.isRequired}
                              onChange={(e) => setPackInventory((prev) => prev.map((x) => x.itemId === item.id ? { ...x, isRequired: e.target.checked } : x))}
                            />{' '}
                            Obligatori
                          </label>
                          <button
                            type="button"
                            onClick={() => setPackInventory((prev) => prev.filter((x) => x.itemId !== item.id))}
                            className="ml-auto rounded-md border border-rose-400/50 bg-rose-500/15 px-2 py-1 text-xs text-rose-100"
                          >
                            Treure
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
                {included.length === 0 && (
                  <p className="rounded-lg border border-dashed border-slate-700/60 p-4 text-center text-sm text-slate-400">
                    Arrossega aquí els elements del pack.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'texts' && (
        <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-100">🌐 Textos</h3>
          <p className="mb-3 text-xs text-slate-400">Nom del pack editable + tagline + features per idioma.</p>
          <div className="grid gap-4">
            {LOCALES.map((locale) => {
              const tr = translations.find((t) => t.locale === locale)!;
              const featuresValue = (tr.features || []).join('\n');
              return (
                <div key={locale} className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4">
                  <h4 className="mb-2 text-sm font-semibold text-slate-100">{locale.toUpperCase()}</h4>
                  <input
                    value={tr.name}
                    onChange={(e) => updateTranslation(locale, 'name', e.target.value)}
                    className={input}
                    placeholder="Nom del pack"
                  />
                  <input
                    value={tr.tagline || ''}
                    onChange={(e) => updateTranslation(locale, 'tagline', e.target.value)}
                    className={`${input} mt-2`}
                    placeholder="Tagline"
                  />
                  <textarea
                    rows={3}
                    value={tr.description || ''}
                    onChange={(e) => updateTranslation(locale, 'description', e.target.value)}
                    className={`${input} mt-2`}
                    placeholder="Descripció"
                  />
                  <textarea
                    rows={4}
                    value={featuresValue}
                    onChange={(e) => updateTranslation(locale, 'features', e.target.value.split('\n').map((f) => f.trim()).filter(Boolean))}
                    className={`${input} mt-2`}
                    placeholder={'Feature 1\nFeature 2\nFeature 3'}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === 'publish' && <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6"><h3 className="mb-4 text-lg font-semibold text-slate-100">✅ Publicació</h3><div className="grid gap-4 sm:grid-cols-3"><label className="text-sm text-slate-300"><input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} /> Actiu</label><label className="text-sm text-slate-300"><input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })} /> Destacat</label><input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) || 0 })} className={input} placeholder="Ordre" /></div></section>}

      <div className="sticky bottom-2 z-10 flex flex-wrap justify-end gap-3 rounded-xl border border-slate-700/60 bg-slate-950/90 p-3 backdrop-blur">
        <Link href="/admin/packs" className="rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-2 text-sm font-medium text-slate-300">Cancel·lar</Link>
        <button type="submit" disabled={loading} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-sm font-medium text-white disabled:opacity-50">{loading ? 'Guardant...' : 'Desar canvis'}</button>
      </div>
    </form>
  );
}

