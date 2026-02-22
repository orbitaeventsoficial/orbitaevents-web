import Link from 'next/link';
import { calculateCostPerHour } from '@/lib/inventory-utils';
import { computePackPricingHealth, getPackPricingModelConfig } from '@/lib/services/packPricingHealth';
import { prisma } from '@/lib/prisma';

type CatalogTab = 'packs' | 'extras' | 'inventory' | 'pricing';

const TAB_META: Record<CatalogTab, { label: string; title: string; description: string }> = {
  packs: {
    label: 'Packs',
    title: 'Packs de servei',
    description: 'Gestiona packs base, contingut i preus inicials.',
  },
  extras: {
    label: 'Extres',
    title: 'Catàleg d\'extres',
    description: 'Defineix extres comercials i compatibilitats per servei.',
  },
  inventory: {
    label: 'Inventari',
    title: 'Inventari operatiu',
    description: 'Controla estat, ús i disponibilitat del material.',
  },
  pricing: {
    label: 'Regles de preu',
    title: 'Preus i rendiment',
    description: 'Edita preus, revisa rendiment i ajusta marges.',
  },
};

function resolveTab(input?: string): CatalogTab {
  if (input === 'extras') return 'extras';
  if (input === 'inventory') return 'inventory';
  if (input === 'pricing') return 'pricing';
  return 'packs';
}

export const dynamic = 'force-dynamic';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

function resolvePackName(
  translations: Array<{ locale: string; name: string }>,
  fallback: string
): string {
  const preferred = translations.find((item) => item.locale === 'ca')
    || translations.find((item) => item.locale === 'es')
    || translations.find((item) => item.locale === 'en')
    || translations[0];
  return preferred?.name?.trim() || fallback;
}

type HealthTone = 'green' | 'amber' | 'red';

function resolveHealthTone(marginPct: number, targetMarginPct: number): {
  tone: HealthTone;
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  const warnMargin = targetMarginPct - 8;
  if (marginPct >= targetMarginPct) {
    return {
      tone: 'green',
      label: 'Sa',
      badgeClass: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200',
      dotClass: 'bg-emerald-400',
    };
  }
  if (marginPct >= warnMargin) {
    return {
      tone: 'amber',
      label: 'Vigilar',
      badgeClass: 'border-amber-500/45 bg-amber-500/15 text-amber-100',
      dotClass: 'bg-amber-400',
    };
  }
  return {
    tone: 'red',
    label: 'Crític',
    badgeClass: 'border-rose-500/45 bg-rose-500/15 text-rose-100',
    dotClass: 'bg-rose-400',
  };
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const activeTab = resolveTab(searchParams?.tab);
  const [pricingConfig, packsData] = await Promise.all([
    getPackPricingModelConfig().catch(() => null),
    prisma.pack.findMany({
      where: { isActive: true },
      orderBy: [{ service: 'asc' }, { price: 'asc' }],
      select: {
        id: true,
        slug: true,
        service: true,
        price: true,
        extraHourPrice: true,
        djHours: true,
        maxGuests: true,
        soundWatts: true,
        translations: {
          select: {
            locale: true,
            name: true,
            features: true,
          },
        },
        inventory: {
          select: {
            quantity: true,
            item: {
              select: {
                id: true,
                code: true,
                name: true,
                purchasePrice: true,
                expectedLifeHours: true,
              },
            },
          },
          orderBy: {
            item: { name: 'asc' },
          },
        },
      },
    }).catch(() => []),
  ]);

  const targetMarginPct = (pricingConfig?.marginTargetPct ?? 0.55) * 100;

  const packRows = pricingConfig
    ? packsData.map((pack) => {
        const health = computePackPricingHealth(pack, pricingConfig);
        const inventoryCostPerHour = pack.inventory.reduce((sum, row) => {
          const itemCostPerHour = calculateCostPerHour(row.item.purchasePrice, row.item.expectedLifeHours);
          return sum + (itemCostPerHour * Math.max(1, row.quantity));
        }, 0);
        const directCost = (inventoryCostPerHour * Math.max(1, pack.djHours))
          + (health.laborCostPerHourUsed * Math.max(1, pack.djHours))
          + pricingConfig.fixedPackCost;
        const profit = health.publicPrice - directCost;
        const marginPct = health.publicPrice > 0 ? (profit / health.publicPrice) * 100 : 0;
        const costRatioPct = health.publicPrice > 0 ? (directCost / health.publicPrice) * 100 : 0;
        const semaforo = resolveHealthTone(marginPct, targetMarginPct);
        return {
          id: pack.id,
          slug: pack.slug,
          service: pack.service || 'general',
          name: resolvePackName(pack.translations, pack.slug),
          features: pack.translations.find((row) => row.locale === 'ca')?.features
            || pack.translations.find((row) => row.locale === 'es')?.features
            || pack.translations[0]?.features
            || [],
          publicPrice: health.publicPrice,
          recommendedPrice: health.recommendedPrice,
          divergencePct: health.divergencePct,
          directCost,
          profit,
          marginPct,
          costRatioPct,
          semaforo,
          inventory: pack.inventory.map((row) => ({
            id: row.item.id,
            label: `${row.item.name}${row.quantity > 1 ? ` ×${row.quantity}` : ''}`,
            code: row.item.code || '',
          })),
        };
      })
    : [];

  const sortedRows = [...packRows].sort((a, b) => {
    const toneOrder: Record<HealthTone, number> = { red: 0, amber: 1, green: 2 };
    const byTone = toneOrder[a.semaforo.tone] - toneOrder[b.semaforo.tone];
    if (byTone !== 0) return byTone;
    return a.marginPct - b.marginPct;
  });
  const pricingAlerts = sortedRows.filter((row) => row.semaforo.tone === 'red').length;
  const greenCount = sortedRows.filter((row) => row.semaforo.tone === 'green').length;
  const amberCount = sortedRows.filter((row) => row.semaforo.tone === 'amber').length;
  const redCount = sortedRows.filter((row) => row.semaforo.tone === 'red').length;
  const avgMargin = sortedRows.length > 0
    ? sortedRows.reduce((sum, row) => sum + row.marginPct, 0) / sortedRows.length
    : 0;

  return (
    <div className="admin-catalog-page space-y-6">
      <header className="rounded-2xl border border-white/10 bg-slate-950/60 p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-100">Catàleg</h1>
        <p className="mt-1 text-sm text-slate-400">
          Punt únic per operar packs, extres, inventari i regles de preu.
        </p>
        {pricingAlerts > 0 && (
          <p className="mt-2 inline-flex rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-200">
            ⚠ {pricingAlerts} alertes de divergència de preu en packs
          </p>
        )}
      </header>

      <nav className="flex flex-wrap gap-2">
        {(Object.keys(TAB_META) as CatalogTab[]).map((tab) => {
          const isActive = tab === activeTab;
          return (
            <Link
              key={tab}
              href={`/admin/catalog?tab=${tab}`}
              className={`admin-catalog-tab rounded-full border px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'admin-catalog-tab--active'
                  : 'admin-catalog-tab--idle'
              }`}
            >
              {TAB_META[tab].label}
            </Link>
          );
        })}
      </nav>

      <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-100">{TAB_META[activeTab].title}</h2>
        <p className="mt-1 text-sm text-slate-400">{TAB_META[activeTab].description}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {activeTab === 'packs' && (
            <>
              <Link
                href="/admin/packs"
                className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800/70"
              >
                Obrir gestió de packs
              </Link>
              <Link
                href="/admin/packs/new"
                className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800/70"
              >
                Crear pack nou
              </Link>
              {sortedRows.length > 0 && (
                <div className="sm:col-span-2 mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {sortedRows.map((pack) => (
                    <Link
                      key={pack.id}
                      href={`/admin/packs/${pack.id}`}
                      className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800/70"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-100">{pack.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{pack.slug} · {pack.service}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${pack.semaforo.badgeClass}`}>
                          <span className={`inline-block h-2 w-2 rounded-full ${pack.semaforo.dotClass}`} />
                          {pack.semaforo.label}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-slate-400">Preu</p>
                          <p className="text-cyan-200 font-semibold">{formatCurrency(pack.publicPrice)}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Benefici</p>
                          <p className={pack.profit >= 0 ? 'text-emerald-200 font-semibold' : 'text-rose-200 font-semibold'}>
                            {formatCurrency(pack.profit)}
                          </p>
                        </div>
                      </div>
                      {pack.inventory.length > 0 && (
                        <p className="mt-2 text-xs text-slate-300">
                          Components: {pack.inventory.slice(0, 2).map((item) => item.label).join(' · ')}
                          {pack.inventory.length > 2 ? ` +${pack.inventory.length - 2}` : ''}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
          {activeTab === 'extras' && (
            <>
              <Link
                href="/admin/packs/extras"
                className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800/70"
              >
                Obrir catàleg d&apos;extres
              </Link>
              <Link
                href="/admin/pricing"
                className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800/70"
              >
                Revisar vendes d&apos;extres
              </Link>
            </>
          )}
          {activeTab === 'inventory' && (
            <>
              <Link
                href="/admin/inventory"
                className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800/70"
              >
                Obrir inventari complet
              </Link>
              <Link
                href="/admin/inventory/new"
                className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800/70"
              >
                Afegir element nou
              </Link>
            </>
          )}
          {activeTab === 'pricing' && (
            <>
              <div className="sm:col-span-2 mt-1 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <article className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">Sa</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-100">{greenCount}</p>
                  <p className="text-xs text-emerald-200/80">Marge &gt;= objectiu ({formatPct(targetMarginPct)})</p>
                </article>
                <article className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-100">Vigilar</p>
                  <p className="mt-1 text-2xl font-bold text-amber-100">{amberCount}</p>
                  <p className="text-xs text-amber-100/80">Marge proper al límit</p>
                </article>
                <article className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-100">Crític</p>
                  <p className="mt-1 text-2xl font-bold text-rose-100">{redCount}</p>
                  <p className="text-xs text-rose-100/80">Requereix pujar preu o baixar cost</p>
                </article>
                <article className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100">Marge mitjà</p>
                  <p className="mt-1 text-2xl font-bold text-cyan-100">{formatPct(avgMargin)}</p>
                  <p className="text-xs text-cyan-100/80">Objectiu global: {formatPct(targetMarginPct)}</p>
                </article>
              </div>
              <Link
                href="/admin/pricing"
                className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800/70"
              >
                Obrir gestor de preus
              </Link>
              <Link
                href="/admin/economia"
                className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800/70"
              >
                Revisar rendibilitat
              </Link>
              <div className="sm:col-span-2 mt-1 overflow-hidden rounded-xl border border-white/10">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1120px] text-sm">
                    <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-3 py-2 text-left">Pack</th>
                        <th className="px-3 py-2 text-left">Semàfor</th>
                        <th className="px-3 py-2 text-right">Preu</th>
                        <th className="px-3 py-2 text-right">Cost estimat</th>
                        <th className="px-3 py-2 text-right">Benefici</th>
                        <th className="px-3 py-2 text-right">Marge</th>
                        <th className="px-3 py-2 text-right">Ratio cost</th>
                        <th className="px-3 py-2 text-right">Preu recomanat</th>
                        <th className="px-3 py-2 text-right">Desviació</th>
                        <th className="px-3 py-2 text-left">Components</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 bg-slate-950/40">
                      {sortedRows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-900/50">
                          <td className="px-3 py-2">
                            <Link href={`/admin/packs/${row.id}`} className="font-semibold text-slate-100 hover:text-cyan-200">
                              {row.name}
                            </Link>
                            <p className="text-xs text-slate-400">{row.slug} · {row.service}</p>
                            {row.features.length > 0 && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                {row.features.slice(0, 2).join(' · ')}
                                {row.features.length > 2 ? ` +${row.features.length - 2}` : ''}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${row.semaforo.badgeClass}`}>
                              <span className={`inline-block h-2 w-2 rounded-full ${row.semaforo.dotClass}`} />
                              {row.semaforo.label}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right text-cyan-100">{formatCurrency(row.publicPrice)}</td>
                          <td className="px-3 py-2 text-right text-slate-200">{formatCurrency(row.directCost)}</td>
                          <td className={`px-3 py-2 text-right font-semibold ${row.profit >= 0 ? 'text-emerald-200' : 'text-rose-200'}`}>
                            {formatCurrency(row.profit)}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-100">{formatPct(row.marginPct)}</td>
                          <td className="px-3 py-2 text-right text-slate-300">{formatPct(row.costRatioPct)}</td>
                          <td className="px-3 py-2 text-right text-slate-200">{formatCurrency(row.recommendedPrice)}</td>
                          <td className={`px-3 py-2 text-right font-semibold ${Math.abs(row.divergencePct) >= 20 ? 'text-amber-200' : 'text-slate-300'}`}>
                            {formatPct(row.divergencePct)}
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-300">
                            {row.inventory.length > 0
                              ? `${row.inventory.slice(0, 2).map((item) => item.label).join(' · ')}${row.inventory.length > 2 ? ` +${row.inventory.length - 2}` : ''}`
                              : 'Sense components'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
