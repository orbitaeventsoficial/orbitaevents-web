'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import { DEFAULT_EXPECTED_LIFE_HOURS, SUPPORTED_LOCALES, formatCurrencyExact } from '@/lib/constants';
import { ADMIN_PACK_EDITOR_TABS, type PackEditorTab } from '@/lib/constants/admin';
import type { InventoryBundle } from '@/lib/inventory-bundles-contract';
import { AdminHelpPanel } from '../../components/AdminHelpPanel';
import { log } from '@/lib/logger';

type EditorTab = PackEditorTab;

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
type RawBundleResponse = {
  id?: string | number | null;
  name?: string | null;
  itemIds?: Array<string | number | null>;
};

type ComposerMode = 'base' | 'pro';

const TABS = ADMIN_PACK_EDITOR_TABS;

const round2 = (n: number) => Math.round(n * 100) / 100;
const calcCostHour = (price: number | null, life: number | null) =>
  !price || price <= 0 ? 0 : round2(price / (life && life > 0 ? life : DEFAULT_EXPECTED_LIFE_HOURS));
const divPct = (pub: number, rec: number) => (rec > 0 ? ((pub - rec) / rec) * 100 : 0);
const semClass = (d: number, t: number) => Math.abs(d) >= t ? 'admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger' : Math.abs(d) >= t * 0.5 ? 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning' : 'admin-tone-border-success admin-tone-bg-success admin-tone-text-success';
const eur = formatCurrencyExact;

function getMarginSignal(currentPrice: number, recommendedPrice: number, thresholdPct: number) {
  const diffPct = divPct(currentPrice, recommendedPrice);
  if (diffPct >= 0) {
    return {
      tone: 'green' as const,
      label: 'Verd',
      cardClass: 'admin-tone-border-success admin-tone-bg-success admin-tone-text-success',
      dotClass: '',
      message: 'Dins del marge objectiu. Pots mantenir aquest preu.',
    };
  }
  if (diffPct >= -Math.abs(thresholdPct)) {
    return {
      tone: 'orange' as const,
      label: 'Taronja',
      cardClass: 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning',
      dotClass: '',
      message: 'Marge just. Recomanació: pujar una mica el preu.',
    };
  }
  return {
    tone: 'red' as const,
    label: 'Roig',
    cardClass: 'admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger',
    dotClass: '',
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
    SUPPORTED_LOCALES.map((locale) => pack.translations.find((t) => t.locale === locale) || { locale, name: '', description: '', tagline: '', features: [] })
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

  const input = 'adm-input sm:text-sm';
  const packDiv = divPct(Number(formData.price), recommended.pack || pricingHint.recommendedPrice);
  const extraDiv = divPct(Number(formData.extraHourPrice), recommended.extra || pricingHint.recommendedExtraHourPrice);
  const packSignal = getMarginSignal(Number(formData.price), recommended.pack || pricingHint.recommendedPrice, pricingHint.alertThreshold);
  const extraSignal = getMarginSignal(Number(formData.extraHourPrice), recommended.extra || pricingHint.recommendedExtraHourPrice, pricingHint.alertThreshold);
  const packDeltaEur = round2((recommended.pack || pricingHint.recommendedPrice) - Number(formData.price));
  const extraDeltaEur = round2((recommended.extra || pricingHint.recommendedExtraHourPrice) - Number(formData.extraHourPrice));
  const totalUnits = packInventory.reduce((acc, row) => acc + Math.max(1, Number(row.quantity || 1)), 0);
  const baseCostPack = round2((recommended.inventoryCostHour + recommended.laborCostHour) * Math.max(1, Number(formData.djHours || 1)) + pricingModel.fixedPackCost);
  const bundlePreview = useMemo(
    () => bundles.find((bundle) => bundle.id === selectedBundleId) || null,
    [bundles, selectedBundleId]
  );
  const composerSummary = useMemo(
    () => ({
      base: {
        title: 'BASE',
        description: 'Intenta muntar un pack curt però funcional: so, cabina, llum i un toc extra.',
        picks: '1 so · 1 cabina · 2 llums · 1 micro · 1 efecte',
      },
      pro: {
        title: 'PRO',
        description: 'Puja la càrrega de so, llum i microfonia per a un muntatge més complet.',
        picks: '2 so · 1 cabina · 3 llums · 2 micros · 2 efectes',
      },
    }),
    []
  );

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
        const res = await fetchWithCsrf('/api/admin/inventory/bundles');
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        const next = Array.isArray(data?.bundles)
          ? data.bundles.map((b: RawBundleResponse) => ({
              id: String(b.id || ''),
              name: String(b.name || ''),
              itemIds: Array.isArray(b.itemIds) ? b.itemIds.map((id) => String(id)) : [],
            })).filter((b: InventoryBundle) => b.id && b.name)
          : [];
        setBundles(next);
        if (!selectedBundleId && next.length > 0) {
          setSelectedBundleId(next[0].id);
        }
      } catch (error) {
        log.error('[EditPackForm] Error carregant bundles', error);
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

  const autoComposeInventory = (mode: ComposerMode) => {
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
        throw new Error('El pack no es pot desar buit. Afegeix inventari manualment o amb el compositor automàtic.');
      }
      if (Number(formData.price) <= 0 || Number(formData.extraHourPrice) <= 0) {
        throw new Error('Els preus han de ser superiors a 0€.');
      }

      const response = await fetchWithCsrf(`/api/admin/packs/${pack.id}`, {
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
      <section className="rounded-2xl border border-white/10 p-5">
        <h2 className="text-xl font-bold">Editor pro de pack</h2>
        <p className="mt-1 text-sm">Drag & drop d'inventari dins/fora + autocalcul de preus recomanats.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-4">{TABS.map((t) => <button key={t.id} type="button" onClick={() => setActiveTab(t.id)} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${activeTab === t.id ? 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning' : 'border-white/10 bg-white/[0.02] text-white/60'}`}>{t.icon} {t.label}</button>)}</div>
      </section>

      {error && <div className="rounded-xl border p-4 text-sm">Error: {error}</div>}

      <AdminHelpPanel
        title="Com treballar aquest pack"
        description="Aquí prepares què inclou el servei i el sistema et diu si el preu aguanta bé el cost."
        items={[
          {
            title: 'Equip',
            body: 'Afegeix el material que realment necessita el pack. Això fa que el cost sigui més real.',
          },
          {
            title: 'Preu',
            body: 'El sistema et proposa un preu orientatiu segons hores, equip i suport necessari.',
          },
          {
            title: 'Semàfor',
            body: 'Verd vol dir que el preu va bé. Taronja que va just. Roig que s\'hauria de revisar.',
          },
        ]}
      />
      {info && <div className="rounded-xl border p-4 text-sm">Info: {info}</div>}
      {success && <div className="rounded-xl border p-4 text-sm">Pack actualitzat correctament</div>}

      {activeTab === 'economic' && (
        <section className="rounded-2xl border p-6">
          <h3 className="mb-4 text-lg font-semibold">Economia i semàfors</h3>

          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border p-3">
              <p className="text-xs">Preu recomanat pack</p>
              <p className="text-lg font-semibold">{eur(recommended.pack)}</p>
            </div>
            <div className="rounded-xl border p-3">
              <p className="text-xs">Hora extra recomanada</p>
              <p className="text-lg font-semibold">{eur(recommended.extra)}</p>
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
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${autoPricing ? 'admin-tone-border-success admin-tone-bg-success admin-tone-text-success' : 'border-white/10 bg-white/5/70 text-white/80'}`}
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
              className="rounded-xl border px-3 py-1.5 text-xs font-semibold"
            >
              Aplicar recomanat ara
            </button>
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border p-3">
              <p className="text-xs">Hores DJ (contador)</p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, djHours: Math.max(1, Number(prev.djHours) - 1) }))}
                  className="h-8 w-8 rounded-xl border"
                >
                  -
                </button>
                <div className="min-w-[64px] text-center text-lg font-semibold">{formData.djHours}h</div>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, djHours: Math.min(24, Number(prev.djHours) + 1) }))}
                  className="h-8 w-8 rounded-xl border"
                >
                  +
                </button>
              </div>
            </div>
            <div className="rounded-xl border p-3">
              <p className="text-xs">Aforament max</p>
              <input
                type="number"
                min={0}
                value={Number(formData.maxGuests || 0)}
                onChange={(e) => setFormData({ ...formData, maxGuests: Number(e.target.value) || 0 })}
                className={`${input} mt-2`}
              />
            </div>
            <div className="rounded-xl border p-3">
              <p className="text-xs">Potència so (W)</p>
              <input
                type="number"
                min={0}
                value={Number(formData.soundWatts || 0)}
                onChange={(e) => setFormData({ ...formData, soundWatts: Number(e.target.value) || 0 })}
                className={`${input} mt-2`}
              />
            </div>
            <div className="rounded-xl border p-3">
              <p className="text-xs">Cost base estimat pack</p>
              <p className="mt-2 text-lg font-semibold">{eur(baseCostPack)}</p>
              <p className="mt-1 text-xs text-white/55">És el cost mínim estimat abans de deixar marge.</p>
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
                min={0}
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
                min={0}
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

          <div className="mt-4 rounded-xl border px-4 py-2.5 text-sm">
            Cost inventari/h {eur(recommended.inventoryCostHour)} · Cost humà/h {eur(recommended.laborCostHour)}
          </div>

          <div className="mt-4 rounded-xl border p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Composició visual del pack</p>
              <p className="text-xs">{included.length} elements</p>
            </div>
            {included.length === 0 ? (
              <p className="text-sm">Aquest pack encara no té inventari assignat.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {included.map(({ row, item }) => (
                  <article key={item.id} className="flex items-center gap-3 rounded-xl border p-2">
                    <NextImage
                      src={item.imageUrl || '/placeholder.png'}
                      alt={item.name}
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-md border object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <p className="text-xs">{item.code}</p>
                      <p className="text-xs">x{row.quantity} · {eur(calcCostHour(item.purchasePrice, item.expectedLifeHours))}/h</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

            {activeTab === 'content' && (
        <section className="rounded-2xl border p-6">
          <h3 className="mb-4 text-lg font-semibold">Inventari del pack</h3>
          <p className="mb-3 text-xs">
            Compon el pack com una peça operativa real: què hi entra, què és obligatori i quin cost base estàs arrossegant.
          </p>

          <div className="mb-4 rounded-2xl border admin-tone-border-cyan admin-tone-bg-cyan p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide admin-tone-text-cyan">Flux de treball</p>
                <p className="mt-1 text-sm text-white/80">Primer decideix si comences manualment, des d'un lot o amb el compositor. Després revisa quantitats i marca com a obligatori només allò que realment defineix el pack.</p>
              </div>
              <span className="inline-flex items-center rounded-full border admin-tone-border-cyan admin-tone-bg-cyan px-3 py-1 text-xs font-semibold admin-tone-text-cyan">
                {included.length} elements · {totalUnits} unitats
              </span>
            </div>
          </div>

          <div className="mb-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border p-3">
              <p className="text-xs">Elements</p>
              <p className="text-lg font-semibold">{included.length}</p>
            </div>
            <div className="rounded-xl border p-3">
              <p className="text-xs">Unitats totals</p>
              <p className="text-lg font-semibold">{totalUnits}</p>
            </div>
            <div className="rounded-xl border p-3">
              <p className="text-xs">Cost inventari/h</p>
              <p className="text-lg font-semibold">{eur(recommended.inventoryCostHour)}</p>
            </div>
          </div>

          <div className="mb-3 grid gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Compositor automàtic</p>
                  <h4 className="mt-1 text-sm font-semibold text-white">Punt de partida, no decisió final</h4>
                  <p className="mt-1 text-sm text-white/70">El compositor classifica per nom, codi, categoria i descripció. T'estalvia arrencar de zero, però sempre has de revisar el resultat abans de desar.</p>
                </div>
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70">
                  Revisa quantitats i obligatorietat després
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(Object.entries(composerSummary) as Array<[ComposerMode, typeof composerSummary.base]>).map(([mode, details]) => (
                  <div key={mode} className={`rounded-2xl border p-4 ${mode === 'base' ? 'admin-tone-border-cyan admin-tone-bg-cyan' : 'admin-tone-border-warning admin-tone-bg-warning'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{details.title}</p>
                        <p className="mt-1 text-xs text-white/60">{details.picks}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => autoComposeInventory(mode)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${mode === 'base' ? 'admin-tone-border-cyan admin-tone-bg-cyan admin-tone-text-cyan' : 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning'}`}
                      >
                        Aplicar {details.title}
                      </button>
                    </div>
                    <p className="mt-3 text-sm text-white/70">{details.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Lots reutilitzables</p>
              <h4 className="mt-1 text-sm font-semibold text-white">Afegeix peces que sempre viatgen juntes</h4>
              <p className="mt-1 text-sm text-white/70">Els lots serveixen quan el pack repeteix una combinació real. Redueixen errors i acceleren la composició.</p>
              {bundlePreview ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-sm font-semibold text-white">{bundlePreview.name}</p>
                  <p className="mt-1 text-xs text-white/60">{bundlePreview.itemIds.length} elements al lot seleccionat.</p>
                  <button
                    type="button"
                    onClick={() => addBundleToPack(bundlePreview.id)}
                    className="mt-4 rounded-xl border px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    disabled={!bundlePreview.id}
                  >
                    Afegir aquest lot al pack
                  </button>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-white/60">
                  Encara no hi ha cap lot seleccionat.
                </div>
              )}
            </div>
          </div>

          {bundles.length > 0 && (
            <div className="mb-3 rounded-2xl border admin-card-glass p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide">Lots d'equip</p>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {bundles.map((bundle) => {
                  const active = selectedBundleId === bundle.id;
                  return (
                    <button
                      key={bundle.id}
                      type="button"
                      onClick={() => setSelectedBundleId(bundle.id)}
                      className={`rounded-xl border px-3 py-2 text-left transition-colors ${active ? 'admin-tone-border-violet admin-tone-bg-violet admin-tone-text-violet' : 'border-white/15 bg-white/5 text-white/80 hover:bg-white/10'}`}
                    >
                      <p className="text-sm font-semibold">{bundle.name}</p>
                      <p className="text-xs opacity-80">{bundle.itemIds.length} elements</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => { setPackInventory([]); setInfo('Inventari del pack netejat.'); }}
              className="rounded-xl border admin-tone-border-danger admin-tone-bg-danger px-3 py-1.5 text-xs font-semibold admin-tone-text-danger"
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
              className={`rounded-xl border p-3 transition-all ${dropZone === 'available' ? 'admin-drop-active admin-tone-border-danger admin-tone-bg-danger' : 'border-white/10 bg-white/[0.03]'}`}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Disponibles ({available.length})</p>
                <span className="text-xs text-white/45">Arrossega cap a inclosos</span>
              </div>
              <div className="max-h-[26rem] space-y-2 overflow-auto pr-1">
                {available.map((i) => (
                  <article key={i.id} draggable aria-label={`${i.name} · arrossega per afegir al pack`} onDragStart={(e) => onDragStart(e, i.id, 'available')} className="admin-drag-item cursor-grab rounded-xl border p-2">
                    <div className="flex items-start gap-3">
                      <NextImage src={i.imageUrl || '/placeholder.png'} alt={i.name} width={56} height={56} className="h-14 w-14 rounded-md border object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{i.name}</p>
                        <p className="text-xs">{i.code}</p>
                        <p className="line-clamp-2 text-xs">{i.description || 'Sense descripció'}</p>
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
              className={`rounded-xl border p-3 transition-all ${dropZone === 'included' ? 'admin-drop-active admin-tone-border-success admin-tone-bg-success' : 'border-white/10 bg-white/[0.03]'}`}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Inclosos ({included.length})</p>
                <span className="text-xs text-white/45">Revisa quantitats i obligatorietat</span>
              </div>
              <div className="max-h-[26rem] space-y-2 overflow-auto pr-1">
                {included.map(({ row, item }) => (
                  <article key={item.id} draggable aria-label={`${item.name} · arrossega per treure del pack`} onDragStart={(e) => onDragStart(e, item.id, 'included')} className="admin-drag-item cursor-grab rounded-xl border p-2">
                    <div className="flex items-start gap-3">
                      <NextImage
                        src={item.imageUrl || '/placeholder.png'}
                        alt={item.name}
                        width={56}
                        height={56}
                        className="h-14 w-14 rounded-md border object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold">{item.name}</p>
                          {row.isRequired ? (
                            <span className="rounded-full border admin-tone-border-success admin-tone-bg-success px-2 py-0.5 text-[10px] font-semibold admin-tone-text-success">
                              Obligatori
                            </span>
                          ) : (
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-white/60">
                              Opcional
                            </span>
                          )}
                        </div>
                        <p className="text-xs">{item.code} · {calcCostHour(item.purchasePrice, item.expectedLifeHours).toFixed(2)}€/h</p>
                        <p className="line-clamp-2 text-xs">{item.description || 'Sense descripció'}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={row.quantity}
                            onChange={(e) => setPackInventory((prev) => prev.map((x) => x.itemId === item.id ? { ...x, quantity: Math.max(1, Number(e.target.value) || 1) } : x))}
                            className="w-20 rounded border px-2 py-1 text-xs"
                          />
                          <label className="text-xs">
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
                            className="ml-auto rounded-md border px-2 py-1 text-xs"
                          >
                            Treure
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
                {included.length === 0 && (
                  <div className="admin-drag-placeholder rounded-xl p-4 text-center text-sm">
                    Arrossega aquí els elements del pack.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'texts' && (
        <section className="rounded-2xl border p-6">
          <h3 className="mb-4 text-lg font-semibold">Textos</h3>
          <p className="mb-3 text-xs">Nom del pack editable + tagline + features per idioma.</p>
          <div className="grid gap-4">
            {SUPPORTED_LOCALES.map((locale) => {
              const tr = translations.find((t) => t.locale === locale)!;
              const featuresValue = (tr.features || []).join('\n');
              return (
                <div key={locale} className="rounded-xl border p-4">
                  <h4 className="mb-2 text-sm font-semibold">{locale.toUpperCase()}</h4>
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

      {activeTab === 'publish' && <section className="rounded-2xl border p-6"><h3 className="mb-4 text-lg font-semibold">Publicació</h3><div className="grid gap-4 sm:grid-cols-3"><label className="text-sm"><input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} /> Actiu</label><label className="text-sm"><input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })} /> Destacat</label><input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) || 0 })} className={input} placeholder="Ordre" /></div></section>}

      <div className="sticky bottom-2 z-10 flex flex-wrap justify-end gap-3 rounded-xl border p-3 backdrop-blur">
        <Link href="/admin/packs" className="rounded-xl border px-4 py-2 text-sm font-medium">Cancel·lar</Link>
        <button type="submit" disabled={loading} className="rounded-xl px-6 py-2 text-sm font-medium text-white disabled:opacity-50">{loading ? 'Desant...' : 'Desar canvis'}</button>
      </div>
    </form>
  );
}
