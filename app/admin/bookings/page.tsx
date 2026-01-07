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
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black">Reserves</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona totes les reserves i events
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/bookings/new"
            className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-slate-100"
          >
            + Nova Reserva
          </Link>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Total</p>
          <p className="mt-2 text-3xl font-bold text-black">{bookings.length}</p>
          <p className="text-xs text-slate-400">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-yellow-600 uppercase">Pendents</p>
          <p className="mt-2 text-3xl font-bold text-yellow-700">
            {statsMap.PENDING?.count || 0}
          </p>
          <p className="text-xs text-yellow-600">{formatCurrency(statsMap.PENDING?.revenue || 0)}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-green-600 uppercase">Confirmades</p>
          <p className="mt-2 text-3xl font-bold text-green-700">
            {statsMap.CONFIRMED?.count || 0}
          </p>
          <p className="text-xs text-green-600">{formatCurrency(statsMap.CONFIRMED?.revenue || 0)}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-emerald-600 uppercase">Completades</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">
            {statsMap.COMPLETED?.count || 0}
          </p>
          <p className="text-xs text-emerald-600">{formatCurrency(statsMap.COMPLETED?.revenue || 0)}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-red-600 uppercase">Cancel·lades</p>
          <p className="mt-2 text-3xl font-bold text-red-700">
            {statsMap.CANCELLED?.count || 0}
          </p>
        </div>
      </section>

      {/* Info Alert */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>Auto-increment:</strong> Quan una reserva passa a <span className="font-semibold">COMPLETED</span>,
          les estadístiques públiques (events + persones) s&apos;actualitzen automàticament.
        </p>
      </div>

      {/* Bookings Table */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Ref.</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Client</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Tipus</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Data Event</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Ubicació</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Pack</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Total</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Estat</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Accions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">📅</span>
                      <p>Encara no hi ha reserves</p>
                      <p className="text-xs text-slate-400">Les reserves creades apareixeran aquí</p>
                    </div>
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
                      className={`hover:bg-slate-50 transition-colors ${isPast && booking.status !== 'COMPLETED' ? 'bg-amber-50/50' : ''}`}
                    >
                      {/* Referència */}
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                          {booking.reference}
                        </code>
                      </td>

                      {/* Client */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-black">{booking.clientName}</div>
                        <div className="text-xs text-slate-500">{booking.clientEmail}</div>
                      </td>

                      {/* Tipus */}
                      <td className="px-4 py-3 text-slate-700">{eventType}</td>

                      {/* Data Event */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-black">
                          {formatDate(booking.eventDate)}
                        </div>
                        {booking.eventStartTime && (
                          <div className="text-xs text-slate-500">
                            {booking.eventStartTime} - {booking.eventEndTime}
                          </div>
                        )}
                      </td>

                      {/* Ubicació */}
                      <td className="px-4 py-3">
                        <div className="text-slate-700 truncate max-w-[150px]">
                          {booking.eventLocation}
                        </div>
                      </td>

                      {/* Pack */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                          {booking.pack.translations[0]?.name || booking.pack.slug}
                        </span>
                        {booking._count.extras > 0 && (
                          <span className="ml-1 text-xs text-slate-400">
                            +{booking._count.extras} extras
                          </span>
                        )}
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3 font-medium text-black">
                        {formatCurrency(booking.total)}
                        {!booking.depositPaid && (
                          <span className="block text-xs text-red-500">Paga pendent</span>
                        )}
                      </td>

                      {/* Estat */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConf.bg} ${statusConf.text}`}
                        >
                          {statusConf.label}
                        </span>
                      </td>

                      {/* Accions */}
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
