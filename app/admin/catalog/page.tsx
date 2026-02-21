import Link from 'next/link';
import { getPackPricingAlertsCount } from '@/lib/services/packPricingHealth';

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

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const activeTab = resolveTab(searchParams?.tab);
  const pricingAlerts = await getPackPricingAlertsCount();

  return (
    <div className="space-y-6">
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
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                  : 'border-slate-700/70 bg-slate-900/50 text-slate-300 hover:bg-slate-800/70'
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
            </>
          )}
        </div>
      </section>
    </div>
  );
}
