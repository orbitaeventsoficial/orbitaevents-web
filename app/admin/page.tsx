import { prisma } from '@/lib/prisma';
import { getGa4Report } from '@/lib/analytics/ga4';
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
  let ga4 = null;
  try {
    ga4 = await getGa4Report();
  } catch {
    ga4 = null;
  }

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
  const ga4Sessions = ga4?.totals.sessions || 0;
  const ga4Users = ga4?.totals.activeUsers || 0;
  const ga4PageViews = ga4?.totals.pageViews || 0;
  const ga4AvgSessionMin = ga4?.totals.avgSessionDuration
    ? Math.max(1, Math.round(ga4.totals.avgSessionDuration / 60))
    : 0;

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-slate-100">Resum rapid</h1>
            <p className="text-slate-400 text-xs">Visio general del negoci</p>
          </div>
          <Link href="/admin/leads" className="sm:hidden">
            <Button variant="primary" icon="+" label="Nou" />
          </Link>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <Link href="/admin/analytics">
            <Button variant="secondary" icon="📈" label="Analytics" />
          </Link>
          <Link href="/admin/leads">
            <Button variant="primary" icon="+" label="Nou lead" />
          </Link>
        </div>
      </div>

      {testimonialsPending > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 sm:flex-row sm:items-center sm:justify-between shadow-[0_8px_24px_-18px_rgba(15,23,42,0.5)]">
          <div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Testimonis pendents</p>
            <p className="text-base sm:text-lg font-semibold text-slate-900">
              {testimonialsPending} pendent{testimonialsPending > 1 ? 's' : ''} d&apos;aprovacio
            </p>
          </div>
          <Link href="/admin/ressenyes" className="self-start sm:self-auto">
            <Button variant="secondary" icon="⭐" label="Revisar" />
          </Link>
        </div>
      )}

      {/* Mètriques essencials */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <MetricCard
          icon="📋"
          label="Reserves confirmades"
          value={bookingsConfirmed.toString()}
          change={bookingsThisMonth > 0 ? `+${bookingsThisMonth} aquest mes` : '-'}
          changeType="up"
        />
        <MetricCard
          icon="📨"
          label="Consultes mes"
          value={leadsThisMonth.toString()}
          change={`${leadsCount} totals`}
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
        <MetricCard
          icon="🌐"
          label="Sessions web (30d)"
          value={ga4Sessions || '-'}
          change={ga4Users ? `${ga4Users} usuaris` : 'GA4 pendent'}
          changeType="neutral"
        />
        <MetricCard
          icon="⏱️"
          label="Temps mitja web"
          value={ga4AvgSessionMin ? `${ga4AvgSessionMin} min` : '-'}
          change={ga4PageViews ? `${ga4PageViews} pagines` : 'GA4 pendent'}
          changeType="neutral"
        />
      </div>

      {/* Contingut principal - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Pròxims events */}
        <div className="lg:col-span-2">
          <Card
            title="Pròxims events"
            subtitle={`${upcomingBookings.length} programats`}
            action={
              <Link href="/admin/calendario">
                <Button variant="ghost" icon="📅" label="Calendari" />
              </Link>
            }
            noPadding
          >
            {upcomingBookings.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {upcomingBookings.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/admin/bookings/${booking.id}`}
                    className="px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                  >
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0">
                      <span className="text-slate-700 font-bold text-sm sm:text-base">
                        {new Date(booking.eventDate).getDate()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-900 font-medium text-sm sm:text-base truncate">{booking.clientName || 'Client'}</p>
                      <p className="text-slate-500 text-xs sm:text-sm truncate">
                        {formatEventDate(new Date(booking.eventDate))} · {booking.eventType || 'Event'}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-stone-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                <p className="text-slate-500 text-sm">No hi ha events programats</p>
                <Link href="/admin/bookings" className="text-cyan-600 hover:text-cyan-500 text-sm mt-2 inline-block font-medium">
                  Crear nova reserva →
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Activitat recent - Oculto en móvil muy pequeño */}
        <div className="hidden sm:block">
          <Card title="Activitat" subtitle="Últimes accions">
            <div className="space-y-3 sm:space-y-4">
              {activities.map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-base sm:text-lg mt-0.5">{activity.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-stone-600">{activity.text}</p>
                    {activity.time && (
                      <p className="text-[10px] sm:text-xs text-stone-400 mt-0.5">{activity.time}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Leads recents - Optimizado para móvil */}
      <Card
        title="Leads recents"
        subtitle={`${leadsCount} totals`}
        action={
          <Link href="/admin/leads">
            <Button variant="secondary" icon="👥" label="Tots" />
          </Link>
        }
        noPadding
      >
        {recentLeads.length > 0 ? (
          <div className="divide-y divide-slate-200">
            {recentLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/admin/leads/${lead.id}`}
                className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-700 font-medium text-sm sm:text-base shrink-0">
                    {lead.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-900 font-medium text-sm sm:text-base truncate">{lead.name}</p>
                    <p className="text-slate-500 text-xs sm:text-sm truncate hidden sm:block">{lead.email}</p>
                    <p className="text-slate-400 text-xs sm:hidden">{timeAgo(new Date(lead.createdAt))}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
                  <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                    lead.status === 'NEW' ? 'bg-sky-100 text-sky-700' :
                    lead.status === 'WON' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {lead.status}
                  </span>
                  <span className="text-slate-400 text-sm hidden sm:block">
                    {timeAgo(new Date(lead.createdAt))}
                  </span>
                  <svg className="w-4 h-4 text-stone-300 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-4 sm:px-6 py-8 sm:py-12 text-center">
            <p className="text-stone-500 text-sm">No hi ha leads encara</p>
            <p className="text-stone-400 text-xs mt-1">Els leads apareixeran aquí</p>
          </div>
        )}
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.5)]">
          <p className="text-slate-500 text-xs sm:text-sm font-medium">Conversio</p>
          <p className="text-xl sm:text-2xl font-semibold text-slate-900 mt-0.5 sm:mt-1">{conversionRate}%</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">{wonLeads}/{leadsCount} leads</p>
        </div>
        <div className="p-3 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.5)]">
          <p className="text-slate-500 text-xs sm:text-sm font-medium">Testimonis</p>
          <p className="text-xl sm:text-2xl font-semibold text-slate-900 mt-0.5 sm:mt-1">{testimonialsApproved + testimonialsPending}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">{testimonialsPending} pendents</p>
        </div>
        <div className="p-3 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.5)]">
          <p className="text-slate-500 text-xs sm:text-sm font-medium">Valoracio</p>
          <p className="text-xl sm:text-2xl font-semibold text-slate-900 mt-0.5 sm:mt-1">⭐ {rating}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">Mitjana</p>
        </div>
        <div className="p-3 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.5)]">
          <p className="text-slate-500 text-xs sm:text-sm font-medium">Inventari</p>
          <p className="text-xl sm:text-2xl font-semibold text-slate-900 mt-0.5 sm:mt-1">{inventoryActive}/{inventoryTotal}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">{inventoryMaintenance} mant.</p>
        </div>
      </div>
    </div>
  );
}
