// app/admin/inventory/[id]/page.tsx
// Fitxa de detall d'un element d'inventari (server component)
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  calculateCurrentValue,
  calculateCostPerHour,
  calculateLifeRemainingPercent,
  CATEGORY_CONFIG,
  STATUS_CONFIG,
  CONDITION_LABELS,
} from '@/lib/inventory-utils';
import InventoryItemEditor from './InventoryItemEditor';
import InventoryPhotoUpload from './InventoryPhotoUpload';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

async function getItem(id: string) {
  try {
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        packItems: {
          include: { pack: { include: { translations: true } } },
        },
        extraItems: {
          include: { extra: { include: { translations: true } } },
        },
        bookingItems: {
          include: {
            booking: {
              select: {
                id: true,
                reference: true,
                eventDate: true,
                clientName: true,
                status: true,
                eventStartTime: true,
                eventEndTime: true,
              },
            },
          },
          orderBy: { booking: { eventDate: 'desc' } },
        },
        usageHistory: {
          orderBy: { usedAt: 'desc' },
        },
      },
    });

    if (!item) return null;

    const totalHoursUsed = item.usageHistory.reduce(
      (sum, u) => sum + (u.hoursUsed || 0),
      0
    );

    return { ...item, totalHoursUsed };
  } catch (error) {
    log.error('Error obtenint element inventari:', error);
    return null;
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('ca-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendent',
  CONFIRMED: 'Confirmada',
  PREPARING: 'Preparant',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancel·lada',
};

export default async function InventoryItemPage({ params }: PageProps) {
  const item = await getItem(params.id);

  if (!item) {
    notFound();
  }

  const catConfig = CATEGORY_CONFIG[item.category] || { label: item.category, icon: '📦', color: 'gray' };
  const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.AVAILABLE;
  const conditionLabel = CONDITION_LABELS[item.condition] || item.condition;

  // KPIs d'amortització
  const currentValue = calculateCurrentValue(item.purchasePrice, item.totalHoursUsed, item.expectedLifeHours);
  const costPerHour = calculateCostPerHour(item.purchasePrice, item.expectedLifeHours);
  const lifeRemaining = calculateLifeRemainingPercent(item.totalHoursUsed, item.expectedLifeHours);
  const expectedLifeHours = item.expectedLifeHours || 2000;
  const remainingHours = Math.max(0, expectedLifeHours - item.totalHoursUsed);

  return (
    <div className="space-y-6">
      {/* Capçalera */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/inventory"
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              ← Inventari
            </Link>
            <code className="rounded-lg bg-cyan-500/20 border border-cyan-400/30 px-3 py-1 text-sm font-mono font-semibold text-cyan-200">
              {item.code}
            </code>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusConf.bg} ${statusConf.text}`}>
              {statusConf.label}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">
            {item.name}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {catConfig.icon} {catConfig.label} · {conditionLabel}
            {item.watts ? ` · ${item.watts}W` : ''}
          </p>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-4">
          <p className="text-xs font-medium text-slate-400 uppercase">Valor Actual</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">
            {item.purchasePrice ? `${currentValue.toLocaleString('ca-ES')}€` : `${item.value.toLocaleString('ca-ES')}€`}
          </p>
          {item.purchasePrice && (
            <p className="text-xs text-slate-500 mt-1">
              Compra: {item.purchasePrice.toLocaleString('ca-ES')}€
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 backdrop-blur-sm p-4">
          <p className="text-xs font-medium text-cyan-400 uppercase">Hores Acumulades</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">
            {item.totalHoursUsed.toLocaleString('ca-ES')}h
          </p>
          <p className="text-xs text-slate-500 mt-1">
            de {(item.expectedLifeHours || 2000).toLocaleString('ca-ES')}h vida útil
          </p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/5 backdrop-blur-sm p-4">
          <p className="text-xs font-medium text-amber-400 uppercase">Cost / Hora</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">
            {item.purchasePrice ? `${costPerHour.toLocaleString('ca-ES')}€` : '—'}
          </p>
          {item.purchasePrice && (
            <p className="text-xs text-slate-500 mt-1">
              {item.purchasePrice.toLocaleString('ca-ES')}€ / {expectedLifeHours.toLocaleString('ca-ES')}h
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 backdrop-blur-sm p-4">
          <p className="text-xs font-medium text-emerald-400 uppercase">Vida Restant</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">
            {lifeRemaining}%
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {remainingHours.toLocaleString('ca-ES')}h útils aproximades
          </p>
          {/* Barra de progrés */}
          <div className="mt-2 h-2 w-full rounded-full bg-slate-700">
            <div
              className={`h-2 rounded-full transition-all ${
                lifeRemaining > 50 ? 'bg-emerald-400' :
                lifeRemaining > 20 ? 'bg-amber-400' : 'bg-rose-400'
              }`}
              style={{ width: `${lifeRemaining}%` }}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-4">
        <h2 className="text-sm font-semibold text-slate-200">Com es calcula l&apos;amortització</h2>
        <div className="mt-2 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
          <p>Cost/hora = Cost de compra ÷ Vida útil (hores).</p>
          <p>Valor actual = Cost de compra × (% vida restant).</p>
          <p>Hores restants = Vida útil estimada − Hores acumulades.</p>
          <p>Aquest càlcul et dona una referència de cost real d&apos;ús per reserva.</p>
        </div>
      </section>

      {/* Foto + Edició en 2 columnes */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Foto */}
        <div className="lg:col-span-1">
          <InventoryPhotoUpload
            itemId={item.id}
            itemCode={item.code}
            currentImageUrl={item.imageUrl}
          />
        </div>

        {/* Formulari d'edició */}
        <div className="lg:col-span-2">
          <InventoryItemEditor item={item} />
        </div>
      </div>

      {/* Packs vinculats */}
      {item.packItems.length > 0 && (
        <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Packs vinculats</h2>
          <div className="flex flex-wrap gap-2">
            {item.packItems.map((pi) => {
              const packName = pi.pack.translations.find((t) => t.locale === 'ca')?.name
                || pi.pack.translations[0]?.name
                || pi.pack.slug;
              return (
                <span
                  key={pi.id}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm"
                >
                  <span className="text-amber-200 font-medium">{packName}</span>
                  <span className="text-amber-300/60">x{pi.quantity}</span>
                  {pi.isRequired && (
                    <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded">obligatori</span>
                  )}
                </span>
              );
            })}
          </div>
        </section>
      )}

      {/* Historial de bolos */}
      <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm overflow-hidden">
        <div className="bg-slate-700/30 border-b border-slate-700/50 p-4">
          <h2 className="font-semibold text-slate-100">
            Historial de bolos
            <span className="text-sm font-normal text-slate-400 ml-2">
              ({item.bookingItems.length} reserves)
            </span>
          </h2>
        </div>
        {item.bookingItems.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <p>Encara no s&apos;ha assignat a cap bolo</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-700/30 border-b border-slate-700/50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Referència</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Client</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Data</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Estat</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Checkout</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Checkin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {item.bookingItems.map((bi) => (
                  <tr key={bi.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/bookings/${bi.booking.id}`}
                        className="font-mono text-cyan-300 hover:underline"
                      >
                        {bi.booking.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-200">{bi.booking.clientName}</td>
                    <td className="px-4 py-3 text-slate-300">{formatDate(bi.booking.eventDate)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-400">
                        {BOOKING_STATUS_LABELS[bi.booking.status] || bi.booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {bi.checkedOut ? (
                        <span className="text-emerald-300 text-xs">Fet</span>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {bi.checkedIn ? (
                        <span className="text-emerald-300 text-xs">
                          Fet {bi.conditionAfter ? `(${CONDITION_LABELS[bi.conditionAfter] || bi.conditionAfter})` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Historial d'ús (hores) */}
      <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm overflow-hidden">
        <div className="bg-slate-700/30 border-b border-slate-700/50 p-4">
          <h2 className="font-semibold text-slate-100">
            Historial d&apos;ús
            <span className="text-sm font-normal text-slate-400 ml-2">
              ({item.usageHistory.length} registres · {item.totalHoursUsed.toLocaleString('ca-ES')}h total)
            </span>
          </h2>
        </div>
        {item.usageHistory.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <p>Sense registres d&apos;ús</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-700/30 border-b border-slate-700/50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Data</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Hores</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {item.usageHistory.map((usage) => (
                  <tr key={usage.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-slate-300">{formatDate(usage.usedAt)}</td>
                    <td className="px-4 py-3 text-slate-200 font-medium">
                      {usage.hoursUsed ? `${usage.hoursUsed}h` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{usage.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
