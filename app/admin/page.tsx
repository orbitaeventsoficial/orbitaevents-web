import { prisma } from '@/lib/prisma';
import { MetricCard, Card, Button } from './components/ui';
import Link from 'next/link';

/**
 * 📊 DASHBOARD - Òrbita Admin
 * Vista principal amb dades reals de Prisma + Supabase
 */

export const dynamic = 'force-dynamic';

// Formatejador de temps relatiu
function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `Fa ${diffMins}min`;
  if (diffHours < 24) return `Fa ${diffHours}h`;
  if (diffDays < 7) return `Fa ${diffDays}d`;
  return date.toLocaleDateString('ca-ES');
}

// Formatejador de data
function formatEventDate(date: Date): string {
  const days = ['Dg', 'Dl', 'Dm', 'Dc', 'Dj', 'Dv', 'Ds'];
  const months = ['Gen', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Des'];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

export default async function AdminDashboard() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Obtenir totes les dades en paral·lel (optimitzat)
  const [
    leadsCount,
    leadsThisMonth,
    bookingsConfirmed,
    bookingsThisMonth,
    customersCount,
    testimonialsPending,
    testimonialsApproved,
    recentLeads,
    upcomingBookings,
    inventoryStats,
    avgRating,
    wonLeads,
  ] = await Promise.all([
    // Total leads
    prisma.lead.count().catch(() => 0),
    // Leads aquest mes
    prisma.lead.count({
      where: { createdAt: { gte: startOfMonth } }
    }).catch(() => 0),
    // Reserves confirmades
    prisma.booking.count({
      where: { status: 'CONFIRMED' }
    }).catch(() => 0),
    // Reserves aquest mes
    prisma.booking.count({
      where: { createdAt: { gte: startOfMonth } }
    }).catch(() => 0),
    // Total clients
    prisma.customer.count().catch(() => 0),
    // Testimonis pendents
    prisma.customerTestimonial.count({
      where: { isApproved: false }
    }).catch(() => 0),
    // Testimonis aprovats
    prisma.customerTestimonial.count({
      where: { isApproved: true }
    }).catch(() => 0),
    // Últims leads
    prisma.lead.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        eventType: true,
        status: true,
        createdAt: true,
      }
    }).catch(() => []),
    // Pròximes reserves
    prisma.booking.findMany({
      where: {
        eventDate: { gte: now },
        status: 'CONFIRMED'
      },
      take: 5,
      orderBy: { eventDate: 'asc' },
      select: {
        id: true,
        clientName: true,
        eventDate: true,
        eventType: true,
      }
    }).catch(() => []),
    // Inventari
    prisma.inventoryItem.groupBy({
      by: ['status'],
      _count: true
    }).catch(() => []),
    // Valoració mitjana (ara dins del Promise.all)
    prisma.customerTestimonial.aggregate({
      where: { isApproved: true },
      _avg: { rating: true }
    }).catch(() => ({ _avg: { rating: null } })),
    // Leads guanyats (ara dins del Promise.all)
    prisma.lead.count({ where: { status: 'WON' } }).catch(() => 0),
  ]);

  // Calcular estadístiques inventari
  const inventoryActive = inventoryStats.find((s: { status: string; _count: number }) => s.status === 'ACTIVE')?._count || 0;
  const inventoryTotal = inventoryStats.reduce((acc: number, s: { _count: number }) => acc + s._count, 0);
  const inventoryMaintenance = inventoryStats.find((s: { status: string; _count: number }) => s.status === 'MAINTENANCE')?._count || 0;

  const rating = avgRating._avg.rating ? avgRating._avg.rating.toFixed(1) : '5.0';
  const conversionRate = leadsCount > 0 ? Math.round((wonLeads / leadsCount) * 100) : 0;

  // Activitat recent
  const activities = [
    { icon: '👋', text: "Benvingut al panell d'administració!", time: 'Ara' },
    ...(recentLeads.length > 0 ? [{
      icon: '👥',
      text: `Nou lead: ${recentLeads[0]?.name || 'Desconegut'}`,
      time: recentLeads[0]?.createdAt ? timeAgo(new Date(recentLeads[0].createdAt)) : ''
    }] : []),
    ...(testimonialsPending > 0 ? [{
      icon: '⭐',
      text: `${testimonialsPending} testimoni${testimonialsPending > 1 ? 's' : ''} pendent${testimonialsPending > 1 ? 's' : ''} d'aprovar`,
      time: ''
    }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-700">Dashboard</h1>
          <p className="text-neutral-500">Benvingut al panell d&apos;administració 👋</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/bookings">
            <Button variant="secondary" icon="📅" label="Reserves" />
          </Link>
          <Link href="/admin/leads">
            <Button variant="primary" icon="+" label="Nou lead" />
          </Link>
        </div>
      </div>

      {testimonialsPending > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
          <div>
            <p className="text-sm text-amber-600 font-medium">Testimonis pendents</p>
            <p className="text-lg font-semibold text-stone-700">
              {testimonialsPending} pendent{testimonialsPending > 1 ? 's' : ''} d&apos;aprovació
            </p>
          </div>
          <Link href="/admin/ressenyes">
            <Button variant="secondary" icon="⭐" label="Revisar testimonis" />
          </Link>
        </div>
      )}

      {/* Mètriques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon="💰"
          label="Reserves confirmades"
          value={bookingsConfirmed.toString()}
          change={bookingsThisMonth > 0 ? `+${bookingsThisMonth} aquest mes` : '-'}
          changeType="up"
        />
        <MetricCard
          icon="👥"
          label="Leads totals"
          value={leadsCount.toString()}
          change={leadsThisMonth > 0 ? `+${leadsThisMonth} aquest mes` : '-'}
          changeType="up"
        />
        <MetricCard
          icon="🏆"
          label="Clients"
          value={customersCount.toString()}
          change={`${conversionRate}% conversió`}
          changeType="up"
        />
        <MetricCard
          icon="⭐"
          label="Valoració mitjana"
          value={rating}
          change={`${testimonialsApproved} ressenyes`}
          changeType="up"
        />
      </div>

      {/* Contingut principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pròxims events */}
        <div className="lg:col-span-2">
          <Card
            title="Pròxims events"
            subtitle={`${upcomingBookings.length} events programats`}
            action={
              <Link href="/admin/calendario">
                <Button variant="ghost" icon="📅" label="Veure calendari" />
              </Link>
            }
            noPadding
          >
            {upcomingBookings.length > 0 ? (
              <div className="divide-y divide-amber-100">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="px-6 py-4 flex items-center justify-between hover:bg-amber-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                        <span className="text-orange-600 font-bold">
                          {new Date(booking.eventDate).getDate()}
                        </span>
                      </div>
                      <div>
                        <p className="text-stone-700 font-medium">{booking.clientName || 'Client'}</p>
                        <p className="text-stone-500 text-sm">
                          {formatEventDate(new Date(booking.eventDate))} · {booking.eventType || 'Event'}
                        </p>
                      </div>
                    </div>
                    <Link href={`/admin/bookings/${booking.id}`}>
                      <Button variant="ghost" label="Veure" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <p className="text-stone-500">No hi ha events programats</p>
                <Link href="/admin/bookings" className="text-orange-500 hover:text-orange-600 text-sm mt-2 inline-block font-medium">
                  Crear nova reserva →
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Activitat recent */}
        <div>
          <Card title="Activitat recent" subtitle="Últimes accions">
            <div className="space-y-4">
              {activities.map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">{activity.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-600">{activity.text}</p>
                    {activity.time && (
                      <p className="text-xs text-stone-400 mt-0.5">{activity.time}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Leads recents */}
      <Card
        title="Leads recents"
        subtitle={`${leadsCount} leads totals`}
        action={
          <Link href="/admin/leads">
            <Button variant="secondary" icon="👥" label="Veure tots" />
          </Link>
        }
        noPadding
      >
        {recentLeads.length > 0 ? (
          <div className="divide-y divide-amber-100">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="px-6 py-4 flex items-center justify-between hover:bg-amber-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-orange-600 font-medium">
                    {lead.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-stone-700 font-medium">{lead.name}</p>
                    <p className="text-stone-500 text-sm">{lead.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    lead.status === 'NEW' ? 'bg-sky-100 text-sky-700' :
                    lead.status === 'WON' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {lead.status}
                  </span>
                  <span className="text-stone-400 text-sm">
                    {timeAgo(new Date(lead.createdAt))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-stone-500">No hi ha leads encara</p>
            <p className="text-stone-400 text-sm mt-1">Els leads del formulari de contacte apareixeran aquí</p>
          </div>
        )}
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200">
          <p className="text-emerald-600 text-sm font-medium">Taxa conversió</p>
          <p className="text-2xl font-bold text-stone-800 mt-1">{conversionRate}%</p>
          <p className="text-xs text-emerald-500 mt-1">{wonLeads} de {leadsCount} leads</p>
        </div>
        <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200">
          <p className="text-sky-600 text-sm font-medium">Testimonis</p>
          <p className="text-2xl font-bold text-stone-800 mt-1">{testimonialsApproved + testimonialsPending}</p>
          <p className="text-xs text-sky-500 mt-1">{testimonialsPending} pendents</p>
        </div>
        <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200">
          <p className="text-violet-600 text-sm font-medium">Valoració</p>
          <p className="text-2xl font-bold text-stone-800 mt-1">⭐ {rating}</p>
          <p className="text-xs text-violet-500 mt-1">Mitjana de ressenyes</p>
        </div>
        <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
          <p className="text-orange-600 text-sm font-medium">Inventari actiu</p>
          <p className="text-2xl font-bold text-stone-800 mt-1">{inventoryActive}/{inventoryTotal}</p>
          <p className="text-xs text-orange-500 mt-1">{inventoryMaintenance} en manteniment</p>
        </div>
      </div>
    </div>
  );
}
