// app/admin/packs/page.tsx
import { log } from '@/lib/logger';
// Pàgina de gestió de packs
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import SyncButton from './SyncButton';
import { getAllPacks } from '@/config/packs-config';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Packs | Òrbita Admin',
};

const SERVICE_ORDER = ['bodas', 'fiestas', 'discomovil', 'empresas', 'produccion', 'alquiler'];
const SERVICE_LABELS: Record<string, string> = {
  bodas: 'Bodes',
  fiestas: 'Festes',
  discomovil: 'Discomòbil',
  empresas: 'Empreses',
  produccion: 'Producció',
  alquiler: 'Lloguer',
};

async function getPacks() {
  try {
    const packs = await prisma.pack.findMany({
      orderBy: { order: 'asc' },
      include: {
        translations: true,
        inventory: {
          include: { item: { select: { code: true, name: true } } },
        },
        _count: {
          select: { bookings: true },
        },
      },
    });

    return packs;
  } catch (error) {
    log.error('Error obtenint packs:', error);
    return [];
  }
}

export default async function PacksPage() {
  const packs = await getPacks();
  const configPacks = getAllPacks();
  const packsInSync = packs.length === configPacks.length;
  const packsByService = SERVICE_ORDER.map((service) => ({
    service,
    label: SERVICE_LABELS[service] || service,
    packs: packs.filter((pack) => pack.service === service),
  })).filter((group) => group.packs.length > 0);
  const otherPacks = packs.filter((pack) => !pack.service || !SERVICE_ORDER.includes(pack.service));

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Packs</h1>
          <p className="mt-1 text-sm text-slate-400">
            Gestiona els packs de serveis i els seus preus
          </p>
          {!packsInSync && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-slate-700/50 px-3 py-1 text-sm text-slate-300 border border-slate-600/50">
              ℹ️ Packs en BD: {packs.length} · Packs al config (seed): {configPacks.length}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <SyncButton />
          <Link
            href="/admin/packs/new"
            className="inline-flex items-center rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600/50 transition-colors"
          >
            + Nou Pack
          </Link>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2">
        <Link
          href="/admin/packs"
          className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200"
        >
          Packs
        </Link>
        <Link
          href="/admin/packs/extras"
          className="inline-flex items-center rounded-full border border-slate-600/50 bg-slate-700/40 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600/50"
        >
          Extres
        </Link>
      </nav>

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-4">
          <p className="text-xs font-medium text-slate-400 uppercase">Total Packs</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{packs.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 backdrop-blur-sm p-4">
          <p className="text-xs font-medium text-emerald-400 uppercase">Actius</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">
            {packs.filter((p) => p.isActive).length}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/5 backdrop-blur-sm p-4">
          <p className="text-xs font-medium text-amber-400 uppercase">Destacats</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">
            {packs.filter((p) => p.isFeatured).length}
          </p>
        </div>
        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 backdrop-blur-sm p-4">
          <p className="text-xs font-medium text-cyan-400 uppercase">Total Reserves</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">
            {packs.reduce((sum, p) => sum + p._count.bookings, 0)}
          </p>
        </div>
      </section>

      {/* Packs per categoria */}
      {packsByService.map((group) => (
        <section key={group.service} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">{group.label}</h2>
            <span className="text-xs text-slate-400">{group.packs.length} packs</span>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {group.packs.map((pack) => {
              const translation = pack.translations.find((t) => t.locale === 'es') || pack.translations[0];
              return (
                <div
                  key={pack.id}
                  className={`rounded-2xl border backdrop-blur-sm overflow-hidden ${
                    pack.isFeatured
                      ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5'
                      : 'border-slate-700/50 bg-slate-800/60'
                  }`}
                >
                  <div className="p-4 border-b border-slate-700/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-100">
                          {translation?.name || pack.slug}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {pack.slug}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {pack.isFeatured && (
                          <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
                            ⭐ Destacat
                          </span>
                        )}
                        {!pack.isActive && (
                          <span className="inline-flex items-center rounded-full bg-slate-500/20 px-2 py-0.5 text-xs font-medium text-slate-400">
                            Inactiu
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-2xl font-bold text-slate-100">{pack.price}€</span>
                        {pack.originalPrice && (
                          <span className="ml-2 text-sm text-slate-500 line-through">
                            {pack.originalPrice}€
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-slate-400">
                        +{pack.extraHourPrice}€/hora extra
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-300">
                        <span>🎵</span>
                        <span>{pack.djHours}h DJ</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <span>🔊</span>
                        <span>{pack.soundWatts}W</span>
                      </div>
                      {pack.includesFog && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <span>🌫️</span>
                          <span>Fum inclòs</span>
                        </div>
                      )}
                      {pack.includesMic && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <span>🎤</span>
                          <span>Micro inclòs</span>
                        </div>
                      )}
                    </div>

                    {(pack.minGuests || pack.maxGuests) && (
                      <div className="text-sm text-slate-400">
                        👥 {pack.minGuests || '?'} - {pack.maxGuests || '∞'} convidats
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-700/30">
                      <span>{pack._count.bookings} reserves</span>
                      <span>{pack.inventory.length} elements inventari</span>
                    </div>
                  </div>

                  <div className="px-4 py-3 bg-slate-700/30 border-t border-slate-700/30 flex gap-2">
                    <Link
                      href={`/admin/packs/${pack.id}`}
                      className="flex-1 inline-flex items-center justify-center rounded-xl bg-slate-600/50 px-3 py-2 text-sm font-medium text-slate-200 border border-slate-500/50 hover:bg-slate-500/50 transition-colors"
                    >
                      ✏️ Editar
                    </Link>
                    <Link
                      href={`/admin/packs/${pack.id}/inventory`}
                      className="flex-1 inline-flex items-center justify-center rounded-xl bg-slate-600/50 px-3 py-2 text-sm font-medium text-slate-200 border border-slate-500/50 hover:bg-slate-500/50 transition-colors"
                    >
                      📦 Inventari
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {otherPacks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Altres</h2>
            <span className="text-xs text-slate-400">{otherPacks.length} packs</span>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {otherPacks.map((pack) => {
              const translation = pack.translations.find((t) => t.locale === 'es') || pack.translations[0];
              return (
                <div
                  key={pack.id}
                  className={`rounded-2xl border backdrop-blur-sm overflow-hidden ${
                    pack.isFeatured
                      ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5'
                      : 'border-slate-700/50 bg-slate-800/60'
                  }`}
                >
                  <div className="p-4 border-b border-slate-700/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-100">
                          {translation?.name || pack.slug}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {pack.slug}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {pack.isFeatured && (
                          <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
                            ⭐ Destacat
                          </span>
                        )}
                        {!pack.isActive && (
                          <span className="inline-flex items-center rounded-full bg-slate-500/20 px-2 py-0.5 text-xs font-medium text-slate-400">
                            Inactiu
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-2xl font-bold text-slate-100">{pack.price}€</span>
                        {pack.originalPrice && (
                          <span className="ml-2 text-sm text-slate-500 line-through">
                            {pack.originalPrice}€
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-slate-400">
                        +{pack.extraHourPrice}€/hora extra
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-300">
                        <span>🎵</span>
                        <span>{pack.djHours}h DJ</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <span>🔊</span>
                        <span>{pack.soundWatts}W</span>
                      </div>
                      {pack.includesFog && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <span>🌫️</span>
                          <span>Fum inclòs</span>
                        </div>
                      )}
                      {pack.includesMic && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <span>🎤</span>
                          <span>Micro inclòs</span>
                        </div>
                      )}
                    </div>

                    {(pack.minGuests || pack.maxGuests) && (
                      <div className="text-sm text-slate-400">
                        👥 {pack.minGuests || '?'} - {pack.maxGuests || '∞'} convidats
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-700/30">
                      <span>{pack._count.bookings} reserves</span>
                      <span>{pack.inventory.length} elements inventari</span>
                    </div>
                  </div>

                  <div className="px-4 py-3 bg-slate-700/30 border-t border-slate-700/30 flex gap-2">
                    <Link
                      href={`/admin/packs/${pack.id}`}
                      className="flex-1 inline-flex items-center justify-center rounded-xl bg-slate-600/50 px-3 py-2 text-sm font-medium text-slate-200 border border-slate-500/50 hover:bg-slate-500/50 transition-colors"
                    >
                      ✏️ Editar
                    </Link>
                    <Link
                      href={`/admin/packs/${pack.id}/inventory`}
                      className="flex-1 inline-flex items-center justify-center rounded-xl bg-slate-600/50 px-3 py-2 text-sm font-medium text-slate-200 border border-slate-500/50 hover:bg-slate-500/50 transition-colors"
                    >
                      📦 Inventari
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {packs.length === 0 && (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-12 text-center">
          <span className="text-4xl">📦</span>
          <p className="mt-4 text-slate-300">No hi ha packs configurats</p>
          <p className="text-sm text-slate-500">Executa el seed per carregar dades inicials</p>
        </div>
      )}
    </div>
  );
}
