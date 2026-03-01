// app/admin/inventory/[id]/page.tsx
// Fitxa de detall d'un element d'inventari (server component)
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AdminPage } from '../../components/AdminPage';
import {
  calculateCurrentValue,
  calculateCostPerHour,
  calculateLifeRemainingPercent,
  CATEGORY_CONFIG,
  STATUS_CONFIG,
  CONDITION_LABELS,
} from '@/lib/inventory-utils';
import { formatDate, formatNumber } from '@/lib/constants';
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
    <AdminPage
      title={item.name}
      subtitle={<>{catConfig.icon} {catConfig.label} · {conditionLabel}{item.watts ? ` · ${item.watts}W` : ''} · <code className="text-xs font-mono">{item.code}</code> · <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusConf.bg} ${statusConf.text}`}>{statusConf.label}</span></>}
      back={{ href: '/admin/inventory', label: 'Inventari' }}
    >

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border backdrop-blur-sm p-4">
          <p className="text-xs font-medium uppercase">Valor Actual</p>
          <p className="mt-2 text-3xl font-bold">
            {item.purchasePrice ? `${formatNumber(currentValue)}€` : `${formatNumber(item.value)}€`}
          </p>
          {item.purchasePrice && (
            <p className="text-xs mt-1">
              Compra: {formatNumber(item.purchasePrice)}€
            </p>
          )}
        </div>
        <div className="rounded-2xl border backdrop-blur-sm p-4">
          <p className="text-xs font-medium uppercase">Hores Acumulades</p>
          <p className="mt-2 text-3xl font-bold">
            {formatNumber(item.totalHoursUsed)}h
          </p>
          <p className="text-xs mt-1">
            de {formatNumber(item.expectedLifeHours || 2000)}h vida útil
          </p>
        </div>
        <div className="rounded-2xl border backdrop-blur-sm p-4">
          <p className="text-xs font-medium uppercase">Cost / Hora</p>
          <p className="mt-2 text-3xl font-bold">
            {item.purchasePrice ? `${formatNumber(costPerHour)}€` : '—'}
          </p>
          {item.purchasePrice && (
            <p className="text-xs mt-1">
              {formatNumber(item.purchasePrice)}€ / {formatNumber(expectedLifeHours)}h
            </p>
          )}
        </div>
        <div className="rounded-2xl border backdrop-blur-sm p-4">
          <p className="text-xs font-medium uppercase">Vida Restant</p>
          <p className="mt-2 text-3xl font-bold">
            {lifeRemaining}%
          </p>
          <p className="text-xs mt-1">
            {formatNumber(remainingHours)}h útils aproximades
          </p>
          {/* Barra de progrés */}
          <div className="mt-2 h-2 w-full rounded-full">
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

      <section className="rounded-2xl border p-4">
        <h2 className="text-sm font-semibold">Com es calcula l&apos;amortització</h2>
        <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
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
        <section className="rounded-2xl border backdrop-blur-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Packs vinculats</h2>
          <div className="flex flex-wrap gap-2">
            {item.packItems.map((pi) => {
              const packName = pi.pack.translations.find((t) => t.locale === 'ca')?.name
                || pi.pack.translations[0]?.name
                || pi.pack.slug;
              return (
                <Link
                  key={pi.id}
                  href={`/admin/packs/${pi.pack.id}`}
                  className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors hover:bg-white/5"
                >
                  <span className="font-medium underline decoration-white/20">{packName}</span>
                  <span className="">x{pi.quantity}</span>
                  {pi.isRequired && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded">obligatori</span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Historial de bolos */}
      <section className="rounded-2xl border backdrop-blur-sm overflow-hidden">
        <div className="border-b p-4">
          <h2 className="font-semibold">
            Historial de bolos
            <span className="text-sm font-normal ml-2">
              ({item.bookingItems.length} reserves)
            </span>
          </h2>
        </div>
        {item.bookingItems.length === 0 ? (
          <div className="p-8 text-center">
            <p>Encara no s&apos;ha assignat a cap bolo</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Referència</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Client</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Data</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Estat</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Checkout</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Checkin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {item.bookingItems.map((bi) => (
                  <tr key={bi.id} className="transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/bookings/${bi.booking.id}`}
                        className="font-mono hover:underline"
                      >
                        {bi.booking.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{bi.booking.clientName}</td>
                    <td className="px-4 py-3">{formatDate(bi.booking.eventDate)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs">
                        {BOOKING_STATUS_LABELS[bi.booking.status] || bi.booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {bi.checkedOut ? (
                        <span className="text-xs">Fet</span>
                      ) : (
                        <span className="text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {bi.checkedIn ? (
                        <span className="text-xs">
                          Fet {bi.conditionAfter ? `(${CONDITION_LABELS[bi.conditionAfter] || bi.conditionAfter})` : ''}
                        </span>
                      ) : (
                        <span className="text-xs">—</span>
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
      <section className="rounded-2xl border backdrop-blur-sm overflow-hidden">
        <div className="border-b p-4">
          <h2 className="font-semibold">
            Historial d&apos;ús
            <span className="text-sm font-normal ml-2">
              ({item.usageHistory.length} registres · {formatNumber(item.totalHoursUsed)}h total)
            </span>
          </h2>
        </div>
        {item.usageHistory.length === 0 ? (
          <div className="p-8 text-center">
            <p>Sense registres d&apos;ús</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Data</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Hores</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {item.usageHistory.map((usage) => (
                  <tr key={usage.id} className="transition-colors">
                    <td className="px-4 py-3">{formatDate(usage.usedAt)}</td>
                    <td className="px-4 py-3 font-medium">
                      {usage.hoursUsed ? `${usage.hoursUsed}h` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs">{usage.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminPage>
  );
}
