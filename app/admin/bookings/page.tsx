// app/admin/bookings/page.tsx
import { log } from '@/lib/logger';
// Pàgina de gestió de reserves
import { prisma } from '@/lib/prisma';
import { cachedQuery, CacheTTL } from '@/lib/query-cache';
import Link from 'next/link';
import BookingActions from './BookingActions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Reserves | Òrbita Admin',
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING: { label: 'Pendent', bg: 'bg-yellow-500/20', text: 'text-yellow-300' },
  CONFIRMED: { label: 'Confirmada', bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  PREPARING: { label: 'Preparant', bg: 'bg-blue-500/20', text: 'text-blue-300' },
  COMPLETED: { label: 'Completada', bg: 'bg-teal-500/20', text: 'text-teal-300' },
  CANCELLED: { label: 'Cancel·lada', bg: 'bg-rose-500/20', text: 'text-rose-300' },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: '💍 Boda',
  BIRTHDAY: '🎂 Aniversari',
  CORPORATE: '🎯 Corporatiu',
  COMMUNION: '⛪ Comunió',
  BAPTISM: '👶 Bateig',
  GRADUATION: '🎓 Graduació',
  ANNIVERSARY: '💑 Aniversari',
  PRIVATE_PARTY: '🎉 Festa Privada',
  OTHER: '📋 Altre',
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

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('ca-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ca-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const { bookings, stats, pagination } = await getBookings(searchParams?.page);

  // Transformar stats
  const statsMap = stats.reduce((acc, s) => {
    acc[s.status] = { count: s._count, revenue: s._sum.total || 0 };
    return acc;
  }, {} as Record<string, { count: number; revenue: number }>);

  const totalRevenue = stats.reduce((sum, s) => sum + (s._sum.total || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Mobile optimized */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-100">Reserves</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {pagination.total} esdeveniments · {formatCurrency(totalRevenue)}
          </p>
        </div>
        <Link
          href="/admin/bookings/new"
          className="inline-flex items-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98] transition-all shadow-lg shadow-cyan-500/20"
        >
          + Nova
        </Link>
      </header>

      {/* Stats Cards - Scrollable horizontal en móvil */}
      <section className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:overflow-visible">
        <div className="shrink-0 w-28 sm:w-auto rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-3 sm:p-5">
          <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase">Total</p>
          <p className="mt-1 text-xl sm:text-3xl font-bold text-slate-100">{pagination.total}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 truncate">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="shrink-0 w-28 sm:w-auto rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/5 backdrop-blur-sm p-3 sm:p-5">
          <p className="text-[10px] sm:text-xs font-medium text-amber-400 uppercase">Pendents</p>
          <p className="mt-1 text-xl sm:text-3xl font-bold text-slate-100">{statsMap.PENDING?.count || 0}</p>
        </div>
        <div className="shrink-0 w-28 sm:w-auto rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 backdrop-blur-sm p-3 sm:p-5">
          <p className="text-[10px] sm:text-xs font-medium text-emerald-400 uppercase">Confirmades</p>
          <p className="mt-1 text-xl sm:text-3xl font-bold text-slate-100">{statsMap.CONFIRMED?.count || 0}</p>
        </div>
        <div className="shrink-0 w-28 sm:w-auto rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-500/10 to-teal-600/5 backdrop-blur-sm p-3 sm:p-5">
          <p className="text-[10px] sm:text-xs font-medium text-teal-400 uppercase">Completades</p>
          <p className="mt-1 text-xl sm:text-3xl font-bold text-slate-100">{statsMap.COMPLETED?.count || 0}</p>
        </div>
        <div className="shrink-0 w-28 sm:w-auto rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-rose-600/5 backdrop-blur-sm p-3 sm:p-5">
          <p className="text-[10px] sm:text-xs font-medium text-rose-400 uppercase">Cancel·lades</p>
          <p className="mt-1 text-xl sm:text-3xl font-bold text-slate-100">{statsMap.CANCELLED?.count || 0}</p>
        </div>
      </section>

      {/* Info Alert - Compacto en móvil */}
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-blue-600/5 backdrop-blur-sm p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-slate-200">
          <strong>Auto:</strong> Quan passa a <span className="font-semibold text-cyan-400">COMPLETED</span>, les stats públiques s&apos;actualitzen.
        </p>
      </div>

      {/* Mobile Card View */}
      <section className="lg:hidden space-y-3">
        {bookings.length === 0 ? (
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-8 text-center">
            <span className="text-4xl">📅</span>
            <p className="mt-2 text-slate-300">Encara no hi ha reserves</p>
            <Link href="/admin/bookings/new" className="text-cyan-400 hover:text-cyan-300 text-sm mt-2 inline-block font-medium">
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
                    ? 'border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-orange-600/5'
                    : 'border-slate-700/50 bg-slate-800/60 hover:bg-slate-700/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/bookings/${booking.id}`}>
                        <code className="text-[10px] font-mono bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded">{booking.reference}</code>
                      </Link>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusConf.bg} ${statusConf.text}`}>
                        {statusConf.label}
                      </span>
                    </div>
                    {booking.customerId ? (
                      <Link
                        href={`/admin/contactes/${booking.customerId}`}
                        className="font-medium text-slate-100 mt-2 truncate block hover:text-cyan-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {booking.clientName} 👤
                      </Link>
                    ) : (
                      <p className="font-medium text-slate-100 mt-2 truncate">{booking.clientName}</p>
                    )}
                    <p className="text-xs text-slate-400 truncate">{booking.eventLocation}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-100">{formatCurrency(booking.total)}</p>
                    {!booking.depositPaid && (
                      <p className="text-[10px] text-rose-400 font-medium">Paga pendent</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300">{eventType}</span>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-medium">
                      {getPackName(booking.pack.translations, booking.pack.slug, booking.lead?.preferredLocale)}
                    </span>
                  </div>
                  <span className="text-slate-400 font-medium">
                    {new Date(booking.eventDate).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' })}
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
      <section className="hidden lg:block rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-700/30 border-b border-slate-700/50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Ref.</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Client</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Tipus</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Data</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Pack</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Total</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Estat</th>
                <th scope="col" className="px-4 py-3 text-right font-medium text-slate-300">Accions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
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
                      <td className="px-4 py-3">
                        <Link href={`/admin/bookings/${booking.id}`} className="hover:opacity-80 transition-opacity">
                          <code className="text-xs font-mono bg-slate-700/50 text-cyan-300 px-2 py-1 rounded cursor-pointer">{booking.reference}</code>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {booking.customerId ? (
                          <Link href={`/admin/contactes/${booking.customerId}`} className="font-medium text-slate-100 hover:text-cyan-300">
                            {booking.clientName}
                          </Link>
                        ) : (
                          <div className="font-medium text-slate-100">{booking.clientName}</div>
                        )}
                        <div className="text-xs text-slate-400 truncate max-w-[150px]">{booking.eventLocation}</div>
                        {booking.lead && (
                          <Link href={`/admin/leads/${booking.lead.id}`} className="text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline">
                            Entrada: {booking.lead.name}
                          </Link>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs">{eventType}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-200 text-xs">{formatDate(booking.eventDate)}</div>
                        {booking.eventStartTime && (
                          <div className="text-xs text-slate-500">{booking.eventStartTime}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-medium text-cyan-300">
                          {getPackName(booking.pack.translations, booking.pack.slug, booking.lead?.preferredLocale)}
                        </span>
                        {booking._count.extras > 0 && (
                          <span className="ml-1 text-xs text-slate-500">+{booking._count.extras}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-100">
                        {formatCurrency(booking.total)}
                        {!booking.depositPaid && (
                          <span className="block text-xs text-rose-400">Paga pendent</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusConf.bg} ${statusConf.text}`}>
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
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
        <section className="flex items-center justify-between rounded-2xl border border-slate-700/50 bg-slate-800/60 p-3 text-xs text-slate-300">
          <span>
            Pàgina {pagination.page} de {pagination.totalPages}
          </span>
          <div className="flex items-center gap-2">
            {pagination.page > 1 ? (
              <Link
                href={`/admin/bookings?page=${pagination.page - 1}`}
                className="rounded-lg border border-slate-600/50 px-3 py-1 hover:bg-slate-700/50"
              >
                ← Anterior
              </Link>
            ) : (
              <span className="rounded-lg border border-slate-700/50 px-3 py-1 text-slate-500">← Anterior</span>
            )}
            {pagination.page < pagination.totalPages ? (
              <Link
                href={`/admin/bookings?page=${pagination.page + 1}`}
                className="rounded-lg border border-slate-600/50 px-3 py-1 hover:bg-slate-700/50"
              >
                Següent →
              </Link>
            ) : (
              <span className="rounded-lg border border-slate-700/50 px-3 py-1 text-slate-500">Següent →</span>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
