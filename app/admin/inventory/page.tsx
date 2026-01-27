// app/admin/inventory/page.tsx
import { log } from '@/lib/logger';
// Pàgina de gestió d'inventari
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Inventari | Òrbita Admin',
};

// Configuració de categories
const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  SOUND: { label: 'So', icon: '🔊', color: 'blue' },
  LIGHTING: { label: 'Il·luminació', icon: '💡', color: 'yellow' },
  EFFECTS: { label: 'Efectes', icon: '✨', color: 'purple' },
  STRUCTURE: { label: 'Estructura', icon: '🏗️', color: 'gray' },
  CABLING: { label: 'Cablejat', icon: '🔌', color: 'orange' },
  TECH: { label: 'Tecnologia', icon: '💻', color: 'indigo' },
  DECORATION_HP: { label: 'Deco HP', icon: '🎃', color: 'orange' },
  DECORATION_HW: { label: 'Deco HW', icon: '🎄', color: 'red' },
  DECORATION_GEN: { label: 'Deco General', icon: '🎨', color: 'pink' },
  CONSUMABLE: { label: 'Consumibles', icon: '📦', color: 'green' },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  AVAILABLE: { label: 'Disponible', bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  IN_USE: { label: 'En ús', bg: 'bg-blue-500/20', text: 'text-blue-300' },
  MAINTENANCE: { label: 'Manteniment', bg: 'bg-orange-500/20', text: 'text-orange-300' },
  BROKEN: { label: 'Avariat', bg: 'bg-rose-500/20', text: 'text-rose-300' },
  RETIRED: { label: 'Retirat', bg: 'bg-slate-500/20', text: 'text-slate-400' },
};

async function getInventory() {
  try {
    const [items, stats] = await Promise.all([
      prisma.inventoryItem.findMany({
        orderBy: [{ category: 'asc' }, { code: 'asc' }],
        include: {
          packItems: {
            include: { pack: { select: { slug: true } } },
          },
          _count: {
            select: { bookingItems: true },
          },
        },
      }),
      prisma.inventoryItem.groupBy({
        by: ['category'],
        _count: true,
        _sum: { value: true },
      }),
    ]);

    const totalValue = items.reduce((sum, item) => sum + item.value, 0);

    return { items, stats, totalValue };
  } catch (error) {
    log.error('Error obtenint inventari:', error);
    return { items: [], stats: [], totalValue: 0 };
  }
}

export default async function InventoryPage() {
  const { items, stats, totalValue } = await getInventory();

  // Agrupar per categoria
  const itemsByCategory = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Inventari</h1>
          <p className="mt-1 text-sm text-slate-400">
            Gestiona tot l&apos;equipament tècnic i material
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/inventory/new"
            className="inline-flex items-center rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600/50 transition-colors"
          >
            + Nou Element
          </Link>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-4">
          <p className="text-xs font-medium text-slate-400 uppercase">Total Elements</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{items.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 backdrop-blur-sm p-4">
          <p className="text-xs font-medium text-emerald-400 uppercase">Disponibles</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">
            {items.filter((i) => i.status === 'AVAILABLE').length}
          </p>
        </div>
        <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-600/5 backdrop-blur-sm p-4">
          <p className="text-xs font-medium text-orange-400 uppercase">En Manteniment</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">
            {items.filter((i) => i.status === 'MAINTENANCE').length}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/5 backdrop-blur-sm p-4">
          <p className="text-xs font-medium text-amber-400 uppercase">Valor Total</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">
            {totalValue.toLocaleString('ca-ES')}€
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => {
          const config = CATEGORY_CONFIG[stat.category] || {
            label: stat.category,
            icon: '📦',
            color: 'gray',
          };
          return (
            <div
              key={stat.category}
              className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{config.icon}</span>
                <div>
                  <p className="font-medium text-slate-100">{config.label}</p>
                  <p className="text-sm text-slate-400">
                    {stat._count} elements · {stat._sum.value?.toLocaleString('ca-ES')}€
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Inventory Table by Category */}
      {Object.entries(itemsByCategory).map(([category, categoryItems]) => {
        const config = CATEGORY_CONFIG[category] || {
          label: category,
          icon: '📦',
          color: 'gray',
        };
        return (
          <section key={category} className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm overflow-hidden">
            <div className="bg-slate-700/30 border-b border-slate-700/50 p-4">
              <h2 className="font-semibold text-slate-100 flex items-center gap-2">
                <span>{config.icon}</span>
                {config.label}
                <span className="text-sm font-normal text-slate-400">
                  ({categoryItems.length} elements)
                </span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-700/30 border-b border-slate-700/50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Codi</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Nom</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Watts</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Valor</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Estat</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Packs</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium text-slate-300">Accions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {categoryItems.map((item) => {
                    const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.AVAILABLE;
                    return (
                      <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3">
                          <code className="text-xs font-mono bg-slate-700/50 text-slate-300 px-2 py-1 rounded">
                            {item.code}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-100">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-slate-400 truncate max-w-[200px]">
                              {item.description}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {item.watts ? `${item.watts}W` : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {item.value.toLocaleString('ca-ES')}€
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConf.bg} ${statusConf.text}`}
                          >
                            {statusConf.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {item.packItems.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {item.packItems.map((pi) => (
                                <span
                                  key={pi.id}
                                  className="text-xs bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded"
                                >
                                  {pi.pack.slug}
                                </span>
                              ))}
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/inventory/${item.id}`}
                            className="inline-flex items-center rounded-lg bg-slate-700/50 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-600/50 transition-colors"
                          >
                            Editar
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      {items.length === 0 && (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-12 text-center">
          <span className="text-4xl">📦</span>
          <p className="mt-4 text-slate-300">No hi ha elements a l&apos;inventari</p>
          <p className="text-sm text-slate-500">Executa el seed per carregar dades inicials</p>
        </div>
      )}
    </div>
  );
}
