// app/admin/packs/page.tsx
import { log } from '@/lib/logger';
// Pàgina de gestió de packs
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Packs | Òrbita Admin',
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-700">Packs</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona els packs de serveis i els seus preus
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/packs/new"
            className="inline-flex items-center rounded-md bg-stone-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-stone-100"
          >
            + Nou Pack
          </Link>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Packs</p>
          <p className="mt-2 text-3xl font-bold text-slate-700">{packs.length}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-green-600 uppercase">Actius</p>
          <p className="mt-2 text-3xl font-bold text-green-700">
            {packs.filter((p) => p.isActive).length}
          </p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-orange-600 uppercase">Destacats</p>
          <p className="mt-2 text-3xl font-bold text-orange-700">
            {packs.filter((p) => p.isFeatured).length}
          </p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-blue-600 uppercase">Total Reserves</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">
            {packs.reduce((sum, p) => sum + p._count.bookings, 0)}
          </p>
        </div>
      </section>

      {/* Packs Grid */}
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {packs.map((pack) => {
          const translation = pack.translations.find((t) => t.locale === 'es') || pack.translations[0];
          return (
            <div
              key={pack.id}
              className={`rounded-xl border bg-stone-50 shadow-sm overflow-hidden ${
                pack.isFeatured ? 'border-orange-300 ring-2 ring-orange-100' : 'border-stone-200'
              }`}
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-700">
                      {translation?.name || pack.slug}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {pack.slug}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {pack.isFeatured && (
                      <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                        ⭐ Destacat
                      </span>
                    )}
                    {!pack.isActive && (
                      <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                        Inactiu
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Preu */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-bold text-slate-700">{pack.price}€</span>
                    {pack.originalPrice && (
                      <span className="ml-2 text-sm text-slate-400 line-through">
                        {pack.originalPrice}€
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-slate-500">
                    +{pack.extraHourPrice}€/hora extra
                  </span>
                </div>

                {/* Característiques */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span>🎵</span>
                    <span>{pack.djHours}h DJ</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <span>🔊</span>
                    <span>{pack.soundWatts}W</span>
                  </div>
                  {pack.includesFog && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <span>🌫️</span>
                      <span>Fum inclòs</span>
                    </div>
                  )}
                  {pack.includesMic && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <span>🎤</span>
                      <span>Micro inclòs</span>
                    </div>
                  )}
                </div>

                {/* Guests */}
                {(pack.minGuests || pack.maxGuests) && (
                  <div className="text-sm text-slate-500">
                    👥 {pack.minGuests || '?'} - {pack.maxGuests || '∞'} convidats
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                  <span>{pack._count.bookings} reserves</span>
                  <span>{pack.inventory.length} elements inventari</span>
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                <Link
                  href={`/admin/packs/${pack.id}`}
                  className="flex-1 inline-flex items-center justify-center rounded-md bg-stone-50 px-3 py-2 text-sm font-medium text-slate-700 border border-stone-200 hover:bg-slate-50"
                >
                  ✏️ Editar
                </Link>
                <Link
                  href={`/admin/packs/${pack.id}/inventory`}
                  className="flex-1 inline-flex items-center justify-center rounded-md bg-stone-50 px-3 py-2 text-sm font-medium text-slate-700 border border-stone-200 hover:bg-slate-50"
                >
                  📦 Inventari
                </Link>
              </div>
            </div>
          );
        })}
      </section>

      {packs.length === 0 && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-12 text-center">
          <span className="text-4xl">📦</span>
          <p className="mt-4 text-slate-600">No hi ha packs configurats</p>
          <p className="text-sm text-slate-400">Executa el seed per carregar dades inicials</p>
        </div>
      )}
    </div>
  );
}
