import Link from 'next/link';
import { AdminPage } from '../components/AdminPage';
import { OwnerControlStrip } from '../components/OwnerControlStrip';
import { calculateCostPerHour } from '@/lib/inventory-utils';
import { computePackPricingHealth, getPackPricingModelConfig } from '@/lib/services/packPricingHealth';
import { prisma } from '@/lib/prisma';
import { CATALOG_TAB_META, formatCurrency } from '@/lib/constants';
import { pluralize } from '@/lib/utils/pluralize';
import { buildPackHref } from '@/lib/admin/packWorkspaceHref';

type CatalogTab = keyof typeof CATALOG_TAB_META;

function resolveTab(input?: string): CatalogTab {
  if (input === 'extras') return 'extras';
  if (input === 'inventory') return 'inventory';
  if (input === 'pricing') return 'pricing';
  return 'packs';
}

export const dynamic = 'force-dynamic';


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
      badgeClass: '',
      dotClass: '',
    };
  }
  if (marginPct >= warnMargin) {
    return {
      tone: 'amber',
      label: 'Vigilar',
      badgeClass: '',
      dotClass: '',
    };
  }
  return {
    tone: 'red',
    label: 'Crític',
    badgeClass: '',
    dotClass: '',
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

  const packsWithoutInventory = sortedRows.filter((row) => row.inventory.length === 0).length;
  const highDivergenceCount = sortedRows.filter((row) => Math.abs(row.divergencePct) >= 20).length;
  const topCriticalPack = sortedRows.find((row) => row.semaforo.tone === 'red');

  const stripSystemItems: string[] = [];
  if (sortedRows.length > 0) {
    stripSystemItems.push(
      `${sortedRows.length} packs actius · ${greenCount} sans · ${amberCount} vigilar · ${redCount} crítics`,
    );
    stripSystemItems.push(
      `Marge mitjà ${formatPct(avgMargin)} vs objectiu ${formatPct(targetMarginPct)}`,
    );
  } else if (!pricingConfig) {
    stripSystemItems.push('Sense model de preus configurat');
  } else {
    stripSystemItems.push('Catàleg buit — cap pack actiu');
  }

  const stripManualItems: string[] = [];
  if (redCount > 0) {
    stripManualItems.push(
      `${redCount} ${pluralize(redCount, 'pack crític', 'packs crítics')} (marge < objectiu −8pp)`,
    );
  }
  if (amberCount > 0) {
    stripManualItems.push(
      `${amberCount} ${pluralize(amberCount, 'pack a vigilar', 'packs a vigilar')} (marge proper al límit)`,
    );
  }
  if (packsWithoutInventory > 0) {
    stripManualItems.push(
      `${packsWithoutInventory} ${pluralize(packsWithoutInventory, 'pack sense', 'packs sense')} components d'inventari`,
    );
  }
  if (highDivergenceCount > 0) {
    stripManualItems.push(
      `${highDivergenceCount} ${pluralize(highDivergenceCount, 'pack amb desviació', 'packs amb desviació')} ≥20% vs preu recomanat`,
    );
  }

  const stripSystemTone: 'info' | 'warning' | 'success' =
    sortedRows.length === 0
      ? 'info'
      : redCount > 0
        ? 'warning'
        : avgMargin < targetMarginPct
          ? 'warning'
          : 'success';

  const stripManualTone: 'info' | 'warning' | 'success' =
    redCount > 0 || packsWithoutInventory > 0
      ? 'warning'
      : stripManualItems.length > 0
        ? 'info'
        : 'success';

  const stripNextStep = !pricingConfig
    ? {
        eyebrow: 'Següent pas · Configuració',
        title: 'Configurar model de preus',
        detail:
          'Sense `getPackPricingModelConfig` no es pot avaluar salut de packs. Configura el model abans de continuar amb catàleg.',
        href: '/admin/pricing',
        ctaLabel: 'Obrir preus',
      }
    : sortedRows.length === 0
      ? {
          eyebrow: 'Següent pas · Primer pack',
          title: 'Crear el primer pack actiu',
          detail:
            'El catàleg no té cap pack actiu. Crea el primer per poder oferir packs al web i començar a rebre reserves.',
          href: '/admin/packs/new',
          ctaLabel: 'Crear pack',
        }
      : redCount > 0
        ? {
            eyebrow: 'Següent pas · Crític',
            title: `Resol ${redCount} ${pluralize(redCount, 'pack crític', 'packs crítics')}`,
            detail: topCriticalPack
              ? `"${topCriticalPack.name}" té ${formatPct(topCriticalPack.marginPct)} marge (objectiu ${formatPct(targetMarginPct)}). Puja preu o redueix costos abans de vendre'l més.`
              : 'Hi ha packs amb marge sota llindar crític. Puja preu o redueix costos abans de vendre més.',
            href: '/admin/packs?focus=critical-margin',
            ctaLabel: 'Obrir packs crítics',
            secondaryAction: { href: '/admin/pricing', label: 'Gestor de preus' },
          }
        : packsWithoutInventory > 0
          ? {
              eyebrow: 'Següent pas · Inventari',
              title: `${packsWithoutInventory} ${pluralize(packsWithoutInventory, 'pack', 'packs')} sense components`,
              detail:
                'Sense inventari associat, el cost directe no inclou equipament real. Vincula elements d\'inventari per obtenir salut de preu fiable.',
              href: '/admin/packs?focus=without-inventory',
              ctaLabel: 'Obrir packs sense inventari',
            }
          : avgMargin < targetMarginPct
            ? {
                eyebrow: 'Següent pas · Marge',
                title: 'Marge mitjà per sota d\'objectiu',
                detail: `El marge mitjà és ${formatPct(avgMargin)} quan l'objectiu és ${formatPct(targetMarginPct)}. Revisa el gestor de preus per acostar-te al target.`,
                href: '/admin/pricing',
                ctaLabel: 'Obrir gestor de preus',
              }
            : {
                eyebrow: 'Següent pas',
                title: 'Catàleg saludable',
                detail: `${greenCount} packs sans · marge mitjà ${formatPct(avgMargin)}. Aprofita per crear un pack nou o revisar rendibilitat.`,
                href: '/admin/packs/new',
                ctaLabel: 'Crear pack nou',
                secondaryAction: { href: '/admin/economia', label: 'Revisar rendibilitat' },
              };

  return (
    <AdminPage
      title="Catàleg"
      subtitle="Punt únic per operar packs, extres, inventari i regles de preu."
      alert={pricingAlerts > 0 ? (
        <p className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold">
          ⚠ {pricingAlerts} alertes de divergència de preu en packs
        </p>
      ) : undefined}
    >
      <OwnerControlStrip
        system={{
          eyebrow: 'Automàtic · Catàleg',
          title:
            sortedRows.length === 0
              ? 'Sense packs actius'
              : redCount > 0
                ? 'Salut del catàleg amb risc'
                : 'Salut del catàleg',
          tone: stripSystemTone,
          items: stripSystemItems,
          emptyText: 'Sense packs al catàleg.',
        }}
        manual={{
          eyebrow: 'Manual · Backlog',
          title:
            stripManualItems.length === 0
              ? 'Cap senyal manual'
              : `${stripManualItems.length} ${pluralize(stripManualItems.length, 'senyal per revisar', 'senyals per revisar')}`,
          tone: stripManualTone,
          items: stripManualItems,
          emptyText: 'Cap pack crític, sense inventari ni amb desviació alta.',
        }}
        nextStep={stripNextStep}
      />

      <nav className="flex flex-wrap gap-2">
        {(Object.keys(CATALOG_TAB_META) as CatalogTab[]).map((tab) => {
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
              {CATALOG_TAB_META[tab].label}
            </Link>
          );
        })}
      </nav>

      <section className="ap-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold">{CATALOG_TAB_META[activeTab].title}</h2>
        <p className="mt-1 text-sm">{CATALOG_TAB_META[activeTab].description}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {activeTab === 'packs' && (
            <>
              <Link
                href="/admin/packs"
                className="rounded-xl border px-4 py-3 text-sm"
              >
                Obrir gestió de packs
              </Link>
              <Link
                href="/admin/packs/new"
                className="rounded-xl border px-4 py-3 text-sm"
              >
                Crear pack nou
              </Link>
              {sortedRows.length > 0 && (
                <div className="sm:col-span-2 mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {sortedRows.map((pack) => (
                    <Link
                      key={pack.id}
                      href={buildPackHref(pack.id)}
                      className="rounded-xl border px-4 py-3 text-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{pack.name}</p>
                          <p className="text-xs mt-0.5">{pack.slug} · {pack.service}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${pack.semaforo.badgeClass}`}>
                          <span className={`inline-block h-2 w-2 rounded-full ${pack.semaforo.dotClass}`} />
                          {pack.semaforo.label}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="">Preu</p>
                          <p className="font-semibold">{formatCurrency(pack.publicPrice)}</p>
                        </div>
                        <div>
                          <p className="">Benefici</p>
                          <p className={pack.profit >= 0 ? 'admin-tone-text-success font-semibold' : 'admin-tone-text-danger font-semibold'}>
                            {formatCurrency(pack.profit)}
                          </p>
                        </div>
                      </div>
                      {pack.inventory.length > 0 && (
                        <p className="mt-2 text-xs">
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
                className="rounded-xl border px-4 py-3 text-sm"
              >
                Obrir catàleg d&apos;extres
              </Link>
              <Link
                href="/admin/pricing"
                className="rounded-xl border px-4 py-3 text-sm"
              >
                Revisar vendes d&apos;extres
              </Link>
            </>
          )}
          {activeTab === 'inventory' && (
            <>
              <Link
                href="/admin/inventory"
                className="rounded-xl border px-4 py-3 text-sm"
              >
                Obrir inventari complet
              </Link>
              <Link
                href="/admin/inventory/new"
                className="rounded-xl border px-4 py-3 text-sm"
              >
                Afegir element nou
              </Link>
            </>
          )}
          {activeTab === 'pricing' && (
            <>
              <div className="sm:col-span-2 mt-1 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <article className="rounded-xl border px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide">Sa</p>
                  <p className="mt-1 text-2xl font-bold">{greenCount}</p>
                  <p className="text-xs">Marge &gt;= objectiu ({formatPct(targetMarginPct)})</p>
                </article>
                <article className="rounded-xl border px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide">Vigilar</p>
                  <p className="mt-1 text-2xl font-bold">{amberCount}</p>
                  <p className="text-xs">Marge proper al límit</p>
                </article>
                <article className="rounded-xl border px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide">Crític</p>
                  <p className="mt-1 text-2xl font-bold">{redCount}</p>
                  <p className="text-xs">Requereix pujar preu o baixar cost</p>
                </article>
                <article className="rounded-xl border px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide">Marge mitjà</p>
                  <p className="mt-1 text-2xl font-bold">{formatPct(avgMargin)}</p>
                  <p className="text-xs">Objectiu global: {formatPct(targetMarginPct)}</p>
                </article>
              </div>
              <Link
                href="/admin/pricing"
                className="rounded-xl border px-4 py-3 text-sm"
              >
                Obrir gestor de preus
              </Link>
              <Link
                href="/admin/economia"
                className="rounded-xl border px-4 py-3 text-sm"
              >
                Revisar rendibilitat
              </Link>
              <div className="sm:col-span-2 mt-1 ap-card overflow-hidden rounded-xl">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1120px] text-sm" aria-label="Catàleg de packs i extres">
                    <thead className="text-xs uppercase tracking-wide">
                      <tr>
                        <th scope="col" className="px-3 py-2 text-left">Pack</th>
                        <th scope="col" className="px-3 py-2 text-left">Semàfor</th>
                        <th scope="col" className="px-3 py-2 text-right">Preu</th>
                        <th scope="col" className="px-3 py-2 text-right">Cost estimat</th>
                        <th scope="col" className="px-3 py-2 text-right">Benefici</th>
                        <th scope="col" className="px-3 py-2 text-right">Marge</th>
                        <th scope="col" className="px-3 py-2 text-right">Ratio cost</th>
                        <th scope="col" className="px-3 py-2 text-right">Preu recomanat</th>
                        <th scope="col" className="px-3 py-2 text-right">Desviació</th>
                        <th scope="col" className="px-3 py-2 text-left">Components</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {sortedRows.map((row) => (
                        <tr key={row.id} className="">
                          <td className="px-3 py-2">
                            <Link href={buildPackHref(row.id)} className="font-semibold">
                              {row.name}
                            </Link>
                            <p className="text-xs">{row.slug} · {row.service}</p>
                            {row.features.length > 0 && (
                              <p className="text-xs mt-0.5">
                                {row.features.slice(0, 2).join(' · ')}
                                {row.features.length > 2 ? ` +${row.features.length - 2}` : ''}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${row.semaforo.badgeClass}`}>
                              <span className={`inline-block h-2 w-2 rounded-full ${row.semaforo.dotClass}`} />
                              {row.semaforo.label}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">{formatCurrency(row.publicPrice)}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(row.directCost)}</td>
                          <td className={`px-3 py-2 text-right font-semibold ${row.profit >= 0 ? 'admin-tone-text-success' : 'admin-tone-text-danger'}`}>
                            {formatCurrency(row.profit)}
                          </td>
                          <td className="px-3 py-2 text-right">{formatPct(row.marginPct)}</td>
                          <td className="px-3 py-2 text-right">{formatPct(row.costRatioPct)}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(row.recommendedPrice)}</td>
                          <td className={`px-3 py-2 text-right font-semibold ${Math.abs(row.divergencePct) >= 20 ? 'admin-tone-text-warning' : 'text-white/70'}`}>
                            {formatPct(row.divergencePct)}
                          </td>
                          <td className="px-3 py-2 text-xs">
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
    </AdminPage>
  );
}

