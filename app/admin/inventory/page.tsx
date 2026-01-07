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
  AVAILABLE: { label: 'Disponible', bg: 'bg-green-100', text: 'text-green-700' },
  IN_USE: { label: 'En ús', bg: 'bg-blue-100', text: 'text-blue-700' },
  MAINTENANCE: { label: 'Manteniment', bg: 'bg-orange-100', text: 'text-orange-700' },
  BROKEN: { label: 'Avariat', bg: 'bg-red-100', text: 'text-red-700' },
  RETIRED: { label: 'Retirat', bg: 'bg-gray-100', text: 'text-gray-500' },
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
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800">Inventari</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona tot l&apos;equipament tècnic i material
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/inventory/new"
            className="inline-flex items-center rounded-md bg-stone-50 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-stone-100"
          >
            + Nou Element
          </Link>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Elements</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{items.length}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-green-600 uppercase">Disponibles</p>
          <p className="mt-2 text-3xl font-bold text-green-700">
            {items.filter((i) => i.status === 'AVAILABLE').length}
          </p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-orange-600 uppercase">En Manteniment</p>
          <p className="mt-2 text-3xl font-bold text-orange-700">
            {items.filter((i) => i.status === 'MAINTENANCE').length}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-amber-600 uppercase">Valor Total</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">
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
              className="rounded-xl border border-stone-200 bg-stone-50 p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{config.icon}</span>
                <div>
                  <p className="font-medium text-slate-800">{config.label}</p>
                  <p className="text-sm text-slate-500">
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
          <section key={category} className="rounded-xl border border-stone-200 bg-stone-50 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-stone-200 p-4">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <span>{config.icon}</span>
                {config.label}
                <span className="text-sm font-normal text-slate-500">
                  ({categoryItems.length} elements)
                </span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Codi</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Nom</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Watts</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Valor</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Estat</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Packs</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">Accions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categoryItems.map((item) => {
                    const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.AVAILABLE;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <code className="text-xs font-mono bg-stone-100 px-2 py-1 rounded">
                            {item.code}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-slate-500 truncate max-w-[200px]">
                              {item.description}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.watts ? `${item.watts}W` : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.value.toLocaleString('ca-ES')}€
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConf.bg} ${statusConf.text}`}
                          >
                            {statusConf.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {item.packItems.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {item.packItems.map((pi) => (
                                <span
                                  key={pi.id}
                                  className="text-xs bg-stone-100 px-2 py-0.5 rounded"
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
                            className="inline-flex items-center rounded-md bg-stone-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-stone-200"
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
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-12 text-center">
          <span className="text-4xl">📦</span>
          <p className="mt-4 text-slate-600">No hi ha elements a l&apos;inventari</p>
          <p className="text-sm text-slate-400">Executa el seed per carregar dades inicials</p>
        </div>
      )}
    </div>
  );
}
