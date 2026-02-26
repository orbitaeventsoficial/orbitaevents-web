// app/admin/bookings/page.tsx
import { log } from '@/lib/logger';
// Pàgina de gestió de reserves
import { prisma } from '@/lib/prisma';
import { cachedQuery, CacheTTL } from '@/lib/query-cache';
import Link from 'next/link';
import { AdminPage } from '../components/AdminPage';
import BookingActions from './BookingActions';
import { BOOKING_STATUS_CONFIG as STATUS_CONFIG, EVENT_TYPE_LABELS, formatDate, formatDateShort, formatCurrency } from '@/lib/constants';
import { getMarginTone } from '@/lib/margin-utils';
import { getProfitabilityConfig } from '@/lib/services/profitabilityService';
import { computeSimpleMarginPct } from '@/lib/services/costEngine';
import ExportCsvButton from '../components/ExportCsvButton';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Reserves | Òrbita Admin',
};

async function getBookings(pageParam?: string) {
  try {
    const pageRaw = Number.parseInt(pageParam || '1', 10);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const pageSize = 25;

    const [bookings, stats, totalCount] = await cachedQuery(
      `admin:bookings:page:${page}:size:${pageSize}`,
      () => Promise.all([
        prisma.booking.findMany({
          orderBy: { eventDate: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            pack: { include: { translations: true } },
            lead: { select: { id: true, name: true, source: true, preferredLocale: true } },
            extras: { select: { price: true, quantity: true } },
            _count: { select: { extras: true } },
          },
        }),
        prisma.booking.groupBy({
          by: ['status'],
          _count: true,
          _sum: { total: true },
        }),
        prisma.booking.count(),
      ]),
      CacheTTL.VERY_SHORT
    );

    return {
      bookings,
      stats,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
      },
    };
  } catch (error) {
    log.error('Error obtenint reserves:', error);
    return {
      bookings: [],
      stats: [],
      pagination: { page: 1, pageSize: 25, total: 0, totalPages: 1 },
    };
  }
}

function getPackName(
  translations: Array<{ locale: string; name: string }>,
  fallback: string,
  locale?: string | null
) {
  const preferred = String(locale || 'ca').toLowerCase();
  return (
    translations.find((t) => t.locale === preferred)?.name ||
    translations.find((t) => t.locale === 'ca')?.name ||
    translations[0]?.name ||
    fallback
  );
}


export default async function BookingsPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const [{ bookings, stats, pagination }, profitConfig] = await Promise.all([
    getBookings(searchParams?.page),
    getProfitabilityConfig(),
  ]);

  // Transformar stats
  const statsMap = stats.reduce((acc, s) => {
    acc[s.status] = { count: s._count, revenue: s._sum.total || 0 };
    return acc;
  }, {} as Record<string, { count: number; revenue: number }>);

  const totalRevenue = stats.reduce((sum, s) => sum + (s._sum.total || 0), 0);

  return (
    <AdminPage
      title="Reserves"
      subtitle={<>{pagination.total} esdeveniments · {formatCurrency(totalRevenue)}</>}
      actions={<div className="flex gap-2">
        <ExportCsvButton
          filename="reserves"
          headers={['Referència', 'Client', 'Data', 'Tipus', 'Estat', 'Total (€)']}
          rows={bookings.map((b) => [
            b.reference,
            b.clientName,
            formatDate(b.eventDate),
            EVENT_TYPE_LABELS[b.eventType] || b.eventType,
            b.status,
            String(b.total),
          ])}
        />
        <Link href="/admin/bookings/new" className="ap-btn ap-btn--primary">+ Nova</Link>
      </div>}
    >

      {/* Stats Cards - Scrollable horizontal en móvil */}
      <section className="admin-bookings-stats flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:overflow-visible">
        <div className="admin-bookings-stat admin-bookings-stat--total shrink-0 w-28 sm:w-auto rounded-2xl border backdrop-blur-sm p-3 sm:p-5">
          <p className="text-[10px] sm:text-xs font-medium uppercase text-center">Total</p>
          <p className="mt-1 text-xl sm:text-3xl font-bold text-center">{pagination.total}</p>
          <p className="text-[10px] sm:text-xs truncate text-center">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="admin-bookings-stat admin-bookings-stat--pending shrink-0 w-28 sm:w-auto rounded-2xl border backdrop-blur-sm p-3 sm:p-5">
          <p className="text-[10px] sm:text-xs font-medium uppercase text-center">Pendents</p>
          <p className="mt-1 text-xl sm:text-3xl font-bold text-center">{statsMap.PENDING?.count || 0}</p>
        </div>
        <div className="admin-bookings-stat admin-bookings-stat--confirmed shrink-0 w-28 sm:w-auto rounded-2xl border backdrop-blur-sm p-3 sm:p-5">
          <p className="text-[10px] sm:text-xs font-medium uppercase text-center">Confirmades</p>
          <p className="mt-1 text-xl sm:text-3xl font-bold text-center">{statsMap.CONFIRMED?.count || 0}</p>
        </div>
        <div className="admin-bookings-stat admin-bookings-stat--completed shrink-0 w-28 sm:w-auto rounded-2xl border backdrop-blur-sm p-3 sm:p-5">
          <p className="text-[10px] sm:text-xs font-medium uppercase text-center">Completades</p>
          <p className="mt-1 text-xl sm:text-3xl font-bold text-center">{statsMap.COMPLETED?.count || 0}</p>
        </div>
        <div className="admin-bookings-stat admin-bookings-stat--cancelled shrink-0 w-28 sm:w-auto rounded-2xl border backdrop-blur-sm p-3 sm:p-5">
          <p className="text-[10px] sm:text-xs font-medium uppercase text-center">Cancel·lades</p>
          <p className="mt-1 text-xl sm:text-3xl font-bold text-center">{statsMap.CANCELLED?.count || 0}</p>
        </div>
      </section>

      {/* Info Alert - Compacto en móvil */}
      <div className="rounded-2xl border backdrop-blur-sm p-3 text-center sm:p-4">
        <p className="text-xs sm:text-sm">
          <strong>Auto:</strong> Quan passa a <span className="font-semibold">COMPLETED</span>, les stats públiques s&apos;actualitzen.
        </p>
      </div>

      {/* Mobile Card View */}
      <section className="lg:hidden space-y-3">
        {bookings.length === 0 ? (
          <div className="rounded-2xl border backdrop-blur-sm p-8 text-center">
            <span className="text-4xl">📅</span>
            <p className="mt-2">Encara no hi ha reserves</p>
            <Link href="/admin/bookings/new" className="text-sm mt-2 inline-block font-medium">
              Crear primera reserva →
            </Link>
          </div>
        ) : (
          bookings.map((booking) => {
            const statusConf = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
            const eventType = EVENT_TYPE_LABELS[booking.eventType] || booking.eventType;
            const isPast = new Date(booking.eventDate) < new Date();

            return (
              <article
                key={booking.id}
                className={`block rounded-2xl border backdrop-blur-sm p-4 transition-colors ${
                  isPast && booking.status !== 'COMPLETED'
                    ? 'border-orange-500/30'
                    : 'border-slate-700/50 bg-slate-800/60 hover:bg-slate-700/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/bookings/${booking.id}`}>
                        <code className="text-[10px] font-mono px-1.5 py-0.5 rounded">{booking.reference}</code>
                      </Link>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusConf.bg} ${statusConf.text}`}>
                        {statusConf.label}
                      </span>
                    </div>
                    {booking.customerId ? (
                      <Link
                        href={`/admin/clientes/${booking.customerId}`}
                        className="font-medium mt-2 truncate block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {booking.clientName} 👤
                      </Link>
                    ) : (
                      <p className="font-medium mt-2 truncate">{booking.clientName}</p>
                    )}
                    <p className="text-xs truncate">{booking.eventLocation}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold">{formatCurrency(booking.total)}</p>
                    {!booking.depositPaid && (
                      <p className="text-[10px] font-medium">Paga pendent</p>
                    )}
                    {(() => {
                      const extrasTotal = booking.extras.reduce((sum, e) => sum + e.price * e.quantity, 0);
                      const marginPct = computeSimpleMarginPct(
                        {
                          total: booking.total,
                          packPrice: booking.pack.price,
                          extrasTotal,
                          extraHours: 0,
                          extraHourPrice: 0,
                          distanceKm: 0,
                          travelCost: booking.travelCost ?? 0,
                        },
                        profitConfig,
                      );
                      const tone = getMarginTone(marginPct);
                      return (
                        <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold mt-1 ${tone.bg} ${tone.color}`}>
                          {marginPct.toFixed(0)}% marge
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="">{eventType}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium">
                      {getPackName(booking.pack.translations, booking.pack.slug, booking.lead?.preferredLocale)}
                    </span>
                  </div>
                  <span className="font-medium">
                    {formatDateShort(booking.eventDate)}
                  </span>
                </div>
                <div className="mt-3">
                  <BookingActions
                    id={booking.id}
                    status={booking.status}
                    eventDate={booking.eventDate.toISOString()}
                    customerId={booking.customerId}
                  />
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* Desktop Table View */}
      <section className="hidden lg:block rounded-2xl border backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] text-sm">
            <thead className="border-b">
              <tr>
                <th scope="col" className="px-4 py-3 text-center font-medium whitespace-nowrap">Ref.</th>
                <th scope="col" className="px-4 py-3 text-center font-medium whitespace-nowrap">Client</th>
                <th scope="col" className="px-4 py-3 text-center font-medium whitespace-nowrap">Tipus</th>
                <th scope="col" className="px-4 py-3 text-center font-medium whitespace-nowrap">Data</th>
                <th scope="col" className="px-4 py-3 text-center font-medium whitespace-nowrap">Pack</th>
                <th scope="col" className="px-4 py-3 text-center font-medium whitespace-nowrap">Total</th>
                <th scope="col" className="px-4 py-3 text-center font-medium whitespace-nowrap">Marge</th>
                <th scope="col" className="px-4 py-3 text-center font-medium whitespace-nowrap">Estat</th>
                <th scope="col" className="px-4 py-3 text-center font-medium whitespace-nowrap">Accions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <span className="text-4xl">📅</span>
                    <p className="mt-2">Encara no hi ha reserves</p>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const statusConf = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
                  const eventType = EVENT_TYPE_LABELS[booking.eventType] || booking.eventType;
                  const isPast = new Date(booking.eventDate) < new Date();

                  return (
                    <tr
                      key={booking.id}
                      className={`transition-colors ${
                        isPast && booking.status !== 'COMPLETED'
                          ? 'bg-orange-500/5'
                          : 'hover:bg-slate-700/30'
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        <Link href={`/admin/bookings/${booking.id}`} className="hover:opacity-80 transition-opacity">
                          <code className="text-xs font-mono px-2 py-1 rounded cursor-pointer">{booking.reference}</code>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {booking.customerId ? (
                          <Link href={`/admin/clientes/${booking.customerId}`} className="font-medium">
                            {booking.clientName}
                          </Link>
                        ) : (
                          <div className="font-medium">{booking.clientName}</div>
                        )}
                        <div className="text-xs truncate max-w-[150px]">{booking.eventLocation}</div>
                        {booking.lead && (
                          <Link href={`/admin/leads/${booking.lead.id}`} className="text-[10px] hover:underline">
                            Entrada: {booking.lead.name}
                          </Link>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-center whitespace-nowrap">{eventType}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="font-medium text-xs">{formatDate(booking.eventDate)}</div>
                        {booking.eventStartTime && (
                          <div className="text-xs">{booking.eventStartTime}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium">
                          {getPackName(booking.pack.translations, booking.pack.slug, booking.lead?.preferredLocale)}
                        </span>
                        {booking._count.extras > 0 && (
                          <span className="ml-1 text-xs">+{booking._count.extras}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-center">
                        {formatCurrency(booking.total)}
                        {!booking.depositPaid && (
                          <span className="block text-xs">Paga pendent</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(() => {
                          const extrasTotal = booking.extras.reduce((sum, e) => sum + e.price * e.quantity, 0);
                          const marginPct = computeSimpleMarginPct(
                            {
                              total: booking.total,
                              packPrice: booking.pack.price,
                              extrasTotal,
                              extraHours: 0,
                              extraHourPrice: 0,
                              distanceKm: 0,
                              travelCost: booking.travelCost ?? 0,
                            },
                            profitConfig,
                          );
                          const tone = getMarginTone(marginPct);
                          return (
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${tone.bg} ${tone.color}`}>
                              {marginPct.toFixed(0)}%
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusConf.bg} ${statusConf.text}`}>
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <BookingActions
                          id={booking.id}
                          status={booking.status}
                          eventDate={booking.eventDate.toISOString()}
                          customerId={booking.customerId}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {pagination.totalPages > 1 && (
        <section className="flex flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-xs sm:flex-row sm:justify-between">
          <span>
            Pàgina {pagination.page} de {pagination.totalPages}
          </span>
          <div className="flex items-center gap-2">
            {pagination.page > 1 ? (
              <Link
                href={`/admin/bookings?page=${pagination.page - 1}`}
                className="rounded-lg border px-3 py-1"
              >
                ← Anterior
              </Link>
            ) : (
              <span className="rounded-lg border px-3 py-1">← Anterior</span>
            )}
            {pagination.page < pagination.totalPages ? (
              <Link
                href={`/admin/bookings?page=${pagination.page + 1}`}
                className="rounded-lg border px-3 py-1"
              >
                Següent →
              </Link>
            ) : (
              <span className="rounded-lg border px-3 py-1">Següent →</span>
            )}
          </div>
        </section>
      )}
    </AdminPage>
  );
}
