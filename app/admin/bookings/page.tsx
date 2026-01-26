// app/admin/bookings/page.tsx
import { log } from '@/lib/logger';
// Pàgina de gestió de reserves
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import BookingActions from './BookingActions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Reserves | Òrbita Admin',
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING: { label: 'Pendent', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  CONFIRMED: { label: 'Confirmada', bg: 'bg-green-100', text: 'text-green-700' },
  PREPARING: { label: 'Preparant', bg: 'bg-blue-100', text: 'text-blue-700' },
  COMPLETED: { label: 'Completada', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  CANCELLED: { label: 'Cancel·lada', bg: 'bg-red-100', text: 'text-red-700' },
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

async function getBookings() {
  try {
    const [bookings, stats] = await Promise.all([
      prisma.booking.findMany({
        orderBy: { eventDate: 'desc' },
        take: 100,
        include: {
          pack: { include: { translations: { where: { locale: 'ca' } } } },
          lead: { select: { id: true, name: true, source: true } },
          _count: { select: { extras: true } },
        },
      }),
      prisma.booking.groupBy({
        by: ['status'],
        _count: true,
        _sum: { total: true },
      }),
    ]);

    return { bookings, stats };
  } catch (error) {
    log.error('Error obtenint reserves:', error);
    return { bookings: [], stats: [] };
  }
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

export default async function BookingsPage() {
  const { bookings, stats } = await getBookings();

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
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-800">Reserves</h1>
          <p className="text-xs sm:text-sm text-stone-500">
            {bookings.length} events · {formatCurrency(totalRevenue)}
          </p>
        </div>
        <Link
          href="/admin/bookings/new"
          className="inline-flex items-center rounded-xl bg-gradient-to-r from-orange-400 to-amber-500 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:from-orange-500 hover:to-amber-600 active:scale-[0.98] transition-all shadow-sm"
        >
          + Nova
        </Link>
      </header>

      {/* Stats Cards - Scrollable horizontal en móvil */}
      <section className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:overflow-visible">
        <div className="shrink-0 w-28 sm:w-auto rounded-2xl border border-amber-100 bg-white p-3 sm:p-5 shadow-sm">
          <p className="text-[10px] sm:text-xs font-medium text-stone-500 uppercase">Total</p>
          <p className="mt-1 text-xl sm:text-3xl font-bold text-stone-800">{bookings.length}</p>
          <p className="text-[10px] sm:text-xs text-stone-400 truncate">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="shrink-0 w-28 sm:w-auto rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-3 sm:p-5 shadow-sm">
          <p className="text-[10px] sm:text-xs font-medium text-amber-600 uppercase">Pendents</p>
          <p className="mt-1 text-xl sm:text-3xl font-bold text-amber-700">{statsMap.PENDING?.count || 0}</p>
        </div>
        <div className="shrink-0 w-28 sm:w-auto rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-3 sm:p-5 shadow-sm">
          <p className="text-[10px] sm:text-xs font-medium text-emerald-600 uppercase">Confirmades</p>
          <p className="mt-1 text-xl sm:text-3xl font-bold text-emerald-700">{statsMap.CONFIRMED?.count || 0}</p>
        </div>
        <div className="shrink-0 w-28 sm:w-auto rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 p-3 sm:p-5 shadow-sm">
          <p className="text-[10px] sm:text-xs font-medium text-teal-600 uppercase">Completades</p>
          <p className="mt-1 text-xl sm:text-3xl font-bold text-teal-700">{statsMap.COMPLETED?.count || 0}</p>
        </div>
        <div className="shrink-0 w-28 sm:w-auto rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-red-50 p-3 sm:p-5 shadow-sm">
          <p className="text-[10px] sm:text-xs font-medium text-rose-600 uppercase">Cancel·lades</p>
          <p className="mt-1 text-xl sm:text-3xl font-bold text-rose-700">{statsMap.CANCELLED?.count || 0}</p>
        </div>
      </section>

      {/* Info Alert - Compacto en móvil */}
      <div className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-sky-800">
          <strong>Auto:</strong> Quan passa a <span className="font-semibold">COMPLETED</span>, les stats públiques s&apos;actualitzen.
        </p>
      </div>

      {/* Mobile Card View */}
      <section className="lg:hidden space-y-3">
        {bookings.length === 0 ? (
          <div className="rounded-2xl border border-amber-100 bg-white p-8 text-center">
            <span className="text-4xl">📅</span>
            <p className="mt-2 text-stone-500">Encara no hi ha reserves</p>
            <Link href="/admin/bookings/new" className="text-orange-500 hover:text-orange-600 text-sm mt-2 inline-block font-medium">
              Crear primera reserva →
            </Link>
          </div>
        ) : (
          bookings.map((booking) => {
            const statusConf = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
            const eventType = EVENT_TYPE_LABELS[booking.eventType] || booking.eventType;
            const isPast = new Date(booking.eventDate) < new Date();

            return (
              <Link
                key={booking.id}
                href={`/admin/bookings/${booking.id}`}
                className={`block rounded-2xl border border-amber-100 bg-white p-4 shadow-sm hover:bg-amber-50/50 active:bg-amber-100/50 transition-colors ${isPast && booking.status !== 'COMPLETED' ? 'border-orange-200 bg-orange-50/30' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] font-mono bg-stone-100 px-1.5 py-0.5 rounded">{booking.reference}</code>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusConf.bg} ${statusConf.text}`}>
                        {statusConf.label}
                      </span>
                    </div>
                    <p className="font-medium text-stone-800 mt-2 truncate">{booking.clientName}</p>
                    <p className="text-xs text-stone-500 truncate">{booking.eventLocation}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-stone-800">{formatCurrency(booking.total)}</p>
                    {!booking.depositPaid && (
                      <p className="text-[10px] text-rose-500 font-medium">Paga pendent</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-amber-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-600">{eventType}</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-medium">
                      {booking.pack.translations[0]?.name || booking.pack.slug}
                    </span>
                  </div>
                  <span className="text-stone-500 font-medium">
                    {new Date(booking.eventDate).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </section>

      {/* Desktop Table View */}
      <section className="hidden lg:block rounded-2xl border border-amber-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-amber-50/50 to-transparent border-b border-amber-100">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-medium text-stone-600">Ref.</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-stone-600">Client</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-stone-600">Tipus</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-stone-600">Data</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-stone-600">Pack</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-stone-600">Total</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-stone-600">Estat</th>
                <th scope="col" className="px-4 py-3 text-right font-medium text-stone-600">Accions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-stone-500">
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
                      className={`hover:bg-amber-50/50 transition-colors ${isPast && booking.status !== 'COMPLETED' ? 'bg-orange-50/30' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono bg-stone-100 px-2 py-1 rounded">{booking.reference}</code>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-stone-700">{booking.clientName}</div>
                        <div className="text-xs text-stone-500 truncate max-w-[150px]">{booking.eventLocation}</div>
                      </td>
                      <td className="px-4 py-3 text-stone-600 text-xs">{eventType}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-stone-700 text-xs">{formatDate(booking.eventDate)}</div>
                        {booking.eventStartTime && (
                          <div className="text-xs text-stone-400">{booking.eventStartTime}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          {booking.pack.translations[0]?.name || booking.pack.slug}
                        </span>
                        {booking._count.extras > 0 && (
                          <span className="ml-1 text-xs text-stone-400">+{booking._count.extras}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-stone-700">
                        {formatCurrency(booking.total)}
                        {!booking.depositPaid && (
                          <span className="block text-xs text-rose-500">Paga pendent</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusConf.bg} ${statusConf.text}`}>
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <BookingActions id={booking.id} status={booking.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
