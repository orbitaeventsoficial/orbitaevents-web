// app/admin/dashboard/page.tsx
import { log } from '@/lib/logger';
// Dashboard principal del panell d'administració - Nou model
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dashboard | Òrbita Admin',
};

// Obtenir dades del dashboard
async function getDashboardData() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  try {
    const [
      settings,
      totalLeads,
      newLeadsThisMonth,
      leadsByStatus,
      totalBookings,
      bookingsThisMonth,
      bookingsByStatus,
      upcomingBookings,
      revenueThisYear,
      inventoryStats,
      recentLeads,
    ] = await Promise.all([
      // Settings (stats públiques)
      prisma.setting.findMany({
        where: { category: 'stats' },
      }),

      // Total leads
      prisma.lead.count(),

      // Nous leads aquest mes
      prisma.lead.count({
        where: { createdAt: { gte: startOfMonth } },
      }),

      // Leads per estat
      prisma.lead.groupBy({
        by: ['status'],
        _count: true,
      }),

      // Total reserves
      prisma.booking.count(),

      // Reserves aquest mes
      prisma.booking.count({
        where: { createdAt: { gte: startOfMonth } },
      }),

      // Reserves per estat
      prisma.booking.groupBy({
        by: ['status'],
        _count: true,
      }),

      // Pròxims events
      prisma.booking.findMany({
        where: {
          eventDate: { gte: now },
          status: { in: ['CONFIRMED', 'PREPARING'] },
        },
        include: {
          pack: { include: { translations: { where: { locale: 'ca' } } } },
        },
        orderBy: { eventDate: 'asc' },
        take: 5,
      }),

      // Facturació aquest any
      prisma.booking.aggregate({
        where: {
          status: 'COMPLETED',
          eventDate: { gte: startOfYear },
        },
        _sum: { total: true },
      }),

      // Stats inventari
      prisma.inventoryItem.groupBy({
        by: ['status'],
        _count: true,
      }),

      // Últims leads
      prisma.lead.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Transformar settings
    const statsMap = settings.reduce((acc, s) => {
      acc[s.key] = s.type === 'NUMBER' ? parseInt(s.value) : s.value;
      return acc;
    }, {} as Record<string, string | number>);

    // Transformar leads per estat
    const leadsMap = leadsByStatus.reduce((acc, l) => {
      acc[l.status] = l._count;
      return acc;
    }, {} as Record<string, number>);

    // Transformar reserves per estat
    const bookingsMap = bookingsByStatus.reduce((acc, b) => {
      acc[b.status] = b._count;
      return acc;
    }, {} as Record<string, number>);

    // Transformar inventari
    const inventoryMap = inventoryStats.reduce((acc, i) => {
      acc[i.status] = i._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      stats: {
        totalEvents: statsMap.total_events || 0,
        totalPeople: statsMap.total_people || 0,
        satisfaction: statsMap.satisfaction_rate || '100%',
        since: statsMap.year_started || 2023,
      },
      leads: {
        total: totalLeads,
        thisMonth: newLeadsThisMonth,
        new: leadsMap.NEW || 0,
        contacted: leadsMap.CONTACTED || 0,
        quoteSent: leadsMap.QUOTE_SENT || 0,
        won: leadsMap.WON || 0,
        lost: leadsMap.LOST || 0,
      },
      bookings: {
        total: totalBookings,
        thisMonth: bookingsThisMonth,
        pending: bookingsMap.PENDING || 0,
        confirmed: bookingsMap.CONFIRMED || 0,
        completed: bookingsMap.COMPLETED || 0,
        cancelled: bookingsMap.CANCELLED || 0,
      },
      revenue: revenueThisYear._sum.total || 0,
      inventory: {
        available: inventoryMap.AVAILABLE || 0,
        inUse: inventoryMap.IN_USE || 0,
        maintenance: inventoryMap.MAINTENANCE || 0,
      },
      upcomingBookings,
      recentLeads,
    };
  } catch (error) {
    log.error('Error obtenint dades dashboard:', error);
    return null;
  }
}

// Formatador de moneda
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ca-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Formatador de data
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('ca-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500">Error carregant el dashboard. Assegura&apos;t que la base de dades està configurada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-700">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Resum d&apos;activitat i estadístiques en temps real
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/bookings/new"
            className="inline-flex items-center rounded-md bg-stone-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-stone-100"
          >
            + Nova Reserva
          </Link>
        </div>
      </header>

      {/* Stats Públiques (les del web) */}
      <section>
        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">
          Estadístiques Públiques (Web)
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-6">
            <p className="text-xs font-medium text-amber-700 uppercase">Events Realitzats</p>
            <p className="mt-2 text-4xl font-bold text-amber-900">{data.stats.totalEvents}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6">
            <p className="text-xs font-medium text-blue-700 uppercase">Persones Feliçes</p>
            <p className="mt-2 text-4xl font-bold text-blue-900">{Number(data.stats.totalPeople).toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-6">
            <p className="text-xs font-medium text-green-700 uppercase">Satisfacció</p>
            <p className="mt-2 text-4xl font-bold text-green-900">{data.stats.satisfaction}</p>
          </div>
          <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-6">
            <p className="text-xs font-medium text-purple-700 uppercase">Actius Des de</p>
            <p className="mt-2 text-4xl font-bold text-purple-900">{data.stats.since}</p>
          </div>
        </div>
      </section>

      {/* Leads i Reserves */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Leads Card */}
        <div className="rounded-xl border border-stone-200 bg-stone-50 shadow-sm">
          <div className="border-b border-stone-200 p-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700">Leads</h3>
            <Link href="/admin/leads" className="text-sm text-blue-600 hover:underline">
              Veure tots →
            </Link>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-3xl font-bold text-slate-700">{data.leads.total}</p>
              <p className="text-xs text-slate-500 mt-1">Total</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{data.leads.thisMonth}</p>
              <p className="text-xs text-slate-500 mt-1">Aquest mes</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-3xl font-bold text-yellow-600">{data.leads.new}</p>
              <p className="text-xs text-slate-500 mt-1">Per contactar</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{data.leads.won}</p>
              <p className="text-xs text-slate-500 mt-1">Convertits</p>
            </div>
          </div>
        </div>

        {/* Reserves Card */}
        <div className="rounded-xl border border-stone-200 bg-stone-50 shadow-sm">
          <div className="border-b border-stone-200 p-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700">Reserves</h3>
            <Link href="/admin/bookings" className="text-sm text-blue-600 hover:underline">
              Veure totes →
            </Link>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-3xl font-bold text-slate-700">{data.bookings.total}</p>
              <p className="text-xs text-slate-500 mt-1">Total</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{data.bookings.confirmed}</p>
              <p className="text-xs text-slate-500 mt-1">Confirmades</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <p className="text-3xl font-bold text-amber-600">{data.bookings.pending}</p>
              <p className="text-xs text-slate-500 mt-1">Pendents</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{data.bookings.completed}</p>
              <p className="text-xs text-slate-500 mt-1">Completades</p>
            </div>
          </div>
        </div>
      </section>

      {/* Facturació i Inventari */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Facturació */}
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6">
          <h3 className="text-sm font-medium text-emerald-700 uppercase">Facturació {new Date().getFullYear()}</h3>
          <p className="mt-4 text-4xl font-bold text-emerald-900">{formatCurrency(data.revenue)}</p>
          <p className="mt-1 text-sm text-emerald-600">Events completats</p>
        </div>

        {/* Inventari */}
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700">Inventari</h3>
            <Link href="/admin/inventory" className="text-sm text-blue-600 hover:underline">
              Gestionar →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 text-xl mb-2">
                ✓
              </span>
              <p className="text-2xl font-bold text-slate-700">{data.inventory.available}</p>
              <p className="text-xs text-slate-500">Disponibles</p>
            </div>
            <div className="text-center">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 text-xl mb-2">
                ⚡
              </span>
              <p className="text-2xl font-bold text-slate-700">{data.inventory.inUse}</p>
              <p className="text-xs text-slate-500">En ús</p>
            </div>
            <div className="text-center">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-600 text-xl mb-2">
                🔧
              </span>
              <p className="text-2xl font-bold text-slate-700">{data.inventory.maintenance}</p>
              <p className="text-xs text-slate-500">Manteniment</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pròxims Events i Últims Leads */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Pròxims Events */}
        <div className="rounded-xl border border-stone-200 bg-stone-50 shadow-sm">
          <div className="border-b border-stone-200 p-4">
            <h3 className="font-semibold text-slate-700">Pròxims Events</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {data.upcomingBookings.length === 0 ? (
              <p className="p-8 text-center text-slate-500">No hi ha events pròxims</p>
            ) : (
              data.upcomingBookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/admin/bookings/${booking.id}`}
                  className="block p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-700">{booking.clientName}</p>
                      <p className="text-sm text-slate-500">
                        {booking.pack.translations[0]?.name || booking.pack.slug}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-700">
                        {formatDate(booking.eventDate)}
                      </p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        booking.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {booking.status === 'CONFIRMED' ? 'Confirmat' : 'Preparant'}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{booking.eventLocation}</p>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Últims Leads */}
        <div className="rounded-xl border border-stone-200 bg-stone-50 shadow-sm">
          <div className="border-b border-stone-200 p-4">
            <h3 className="font-semibold text-slate-700">Últims Leads</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recentLeads.length === 0 ? (
              <p className="p-8 text-center text-slate-500">No hi ha leads encara</p>
            ) : (
              data.recentLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/admin/leads/${lead.id}`}
                  className="block p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-700">{lead.name}</p>
                      <p className="text-sm text-slate-500">{lead.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        lead.status === 'NEW'
                          ? 'bg-blue-100 text-blue-700'
                          : lead.status === 'WON'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-stone-100 text-slate-700'
                      }`}>
                        {lead.status === 'NEW' ? 'Nou'
                          : lead.status === 'CONTACTED' ? 'Contactat'
                          : lead.status === 'QUOTE_SENT' ? 'Pressupost'
                          : lead.status === 'WON' ? 'Guanyat'
                          : lead.status}
                      </span>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatDate(lead.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
