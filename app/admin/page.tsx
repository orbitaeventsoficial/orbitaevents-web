import { prisma } from '@/lib/prisma';
import { MetricCard, Card, Button, Badge, StatusBadge, Avatar } from './components/ui';
import Link from 'next/link';

/**
 * 📊 DASHBOARD - Vista principal Admin (amb dades reals)
 */

// Tipus per a les dades (coincidint amb Prisma enum)
type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'QUOTE_SENT' | 'WON' | 'LOST';

// Mapeig d'estats per a StatusBadge (tipus del component UI)
type StatusBadgeStatus = 'new' | 'contacted' | 'quote_sent' | 'negotiating' | 'won' | 'lost';
const leadStatusMap: Record<LeadStatus, StatusBadgeStatus> = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'negotiating', // QUALIFIED mapeja a negotiating en el UI
  QUOTE_SENT: 'quote_sent',
  WON: 'won',
  LOST: 'lost',
};

// Mapeig de tipus d'event
const eventTypeLabels: Record<string, { label: string; icon: string; color: string }> = {
  WEDDING: { label: 'Boda', icon: '💍', color: 'pink' },
  CORPORATE: { label: 'Corporatiu', icon: '💼', color: 'blue' },
  BIRTHDAY: { label: 'Aniversari', icon: '🎂', color: 'orange' },
  PRIVATE_PARTY: { label: 'Festa privada', icon: '🎉', color: 'purple' },
  OTHER: { label: 'Altre', icon: '🎵', color: 'gray' },
};

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
  const days = ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'];
  const months = ['Gen', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Des'];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Obtenir totes les dades en paral·lel
  const [
    // Leads
    totalLeads,
    newLeadsThisMonth,
    newLeadsLastMonth,
    recentLeads,
    leadsWon,

    // Reserves
    confirmedBookings,
    confirmedLastMonth,
    upcomingBookings,

    // Facturació
    revenueThisMonth,
    revenueLastMonth,

    // Inventari
    inventoryStats,

    // Testimonis
    avgRating,

    // Activitat recent (AdminLog)
    recentActivity,

    // Settings (reserved for future stats config)
    _settings,
  ] = await Promise.all([
    // Total leads
    prisma.lead.count(),

    // Nous leads aquest mes
    prisma.lead.count({
      where: { createdAt: { gte: startOfMonth } },
    }),

    // Nous leads mes passat
    prisma.lead.count({
      where: { createdAt: { gte: lastMonth, lt: startOfMonth } },
    }),

    // Últims leads
    prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),

    // Leads guanyats
    prisma.lead.count({ where: { status: 'WON' } }),

    // Events confirmats
    prisma.booking.count({
      where: {
        status: { in: ['CONFIRMED', 'PREPARING'] },
        eventDate: { gte: now },
      },
    }),

    // Events confirmats mes passat
    prisma.booking.count({
      where: {
        status: { in: ['CONFIRMED', 'PREPARING'] },
        createdAt: { gte: lastMonth, lt: startOfMonth },
      },
    }),

    // Pròxims events
    prisma.booking.findMany({
      where: {
        eventDate: { gte: now },
        status: { in: ['CONFIRMED', 'PREPARING', 'PENDING'] },
      },
      include: {
        pack: { include: { translations: { where: { locale: 'ca' } } } },
      },
      orderBy: { eventDate: 'asc' },
      take: 5,
    }),

    // Facturació aquest mes
    prisma.booking.aggregate({
      where: {
        status: 'COMPLETED',
        eventDate: { gte: startOfMonth },
      },
      _sum: { total: true },
    }),

    // Facturació mes passat
    prisma.booking.aggregate({
      where: {
        status: 'COMPLETED',
        eventDate: { gte: lastMonth, lt: startOfMonth },
      },
      _sum: { total: true },
    }),

    // Inventari per estat
    prisma.inventoryItem.groupBy({
      by: ['status'],
      _count: true,
    }),

    // Valoració mitjana
    prisma.testimonial.aggregate({
      where: { isVerified: true },
      _avg: { rating: true },
    }),

    // Activitat recent
    prisma.adminLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),

    // Settings
    prisma.setting.findMany({
      where: { category: 'stats' },
    }),
  ]);

  // Calcular mètriques
  const revenueThisMonthVal = revenueThisMonth._sum.total || 0;
  const revenueLastMonthVal = revenueLastMonth._sum.total || 0;
  const revenueChange = revenueLastMonthVal > 0
    ? Math.round(((revenueThisMonthVal - revenueLastMonthVal) / revenueLastMonthVal) * 100)
    : 0;

  const leadsChange = newLeadsLastMonth > 0
    ? newLeadsThisMonth - newLeadsLastMonth
    : newLeadsThisMonth;

  const bookingsChange = confirmedLastMonth > 0
    ? confirmedBookings - confirmedLastMonth
    : confirmedBookings;

  const conversionRate = totalLeads > 0 ? Math.round((leadsWon / totalLeads) * 100) : 0;

  const inventoryActive = inventoryStats.find(s => s.status === 'AVAILABLE')?._count || 0;
  const inventoryMaintenance = inventoryStats.find(s => s.status === 'MAINTENANCE')?._count || 0;
  const inventoryTotal = inventoryStats.reduce((acc, s) => acc + s._count, 0);

  const rating = avgRating._avg.rating || 5.0;

  // Transformar activitat a format llegible
  const activityIcons: Record<string, string> = {
    CREATE: '➕',
    UPDATE: '✏️',
    DELETE: '🗑️',
    STATUS_CHANGE: '🔄',
    EMAIL_SENT: '📧',
    PAYMENT: '💰',
  };

  const activities = recentActivity.map(log => ({
    icon: activityIcons[log.action] || '📋',
    text: `${log.action} ${log.entity} ${log.entityId ? `#${log.entityId.slice(0, 8)}` : ''}`,
    time: timeAgo(log.createdAt),
  }));

  // Si no hi ha activitat, mostrar missatge
  if (activities.length === 0) {
    activities.push(
      { icon: '👋', text: 'Benvingut al panell d\'administració!', time: 'Ara' },
      { icon: '💡', text: 'Les accions es registraran aquí', time: '' },
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-neutral-500">Benvingut, Carles 👋</p>
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

      {/* Mètriques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon="💰"
          label="Facturat aquest mes"
          value={`${revenueThisMonthVal.toLocaleString('ca-ES')}€`}
          change={revenueChange !== 0 ? `${revenueChange > 0 ? '+' : ''}${revenueChange}%` : '-'}
          changeType={revenueChange >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          icon="📅"
          label="Events confirmats"
          value={confirmedBookings.toString()}
          change={bookingsChange !== 0 ? `${bookingsChange > 0 ? '+' : ''}${bookingsChange}` : '-'}
          changeType={bookingsChange >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          icon="👥"
          label="Leads nous"
          value={newLeadsThisMonth.toString()}
          change={leadsChange !== 0 ? `${leadsChange > 0 ? '+' : ''}${leadsChange}` : '-'}
          changeType={leadsChange >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          icon="⭐"
          label="Valoració mitjana"
          value={rating.toFixed(1)}
          change={`${conversionRate}% conv.`}
          changeType="up"
        />
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Calendari / Pròxims events */}
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
              <div className="divide-y divide-white/5">
                {upcomingBookings.map(booking => {
                  const eventType = eventTypeLabels[booking.eventType] || eventTypeLabels.OTHER;
                  return (
                    <Link
                      key={booking.id}
                      href={`/admin/bookings/${booking.id}`}
                      className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors group block"
                    >
                      {/* Icon tipus */}
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center text-xl
                        ${eventType.color === 'pink' ? 'bg-pink-500/10 text-pink-400' :
                          eventType.color === 'blue' ? 'bg-blue-500/10 text-blue-400' :
                          eventType.color === 'orange' ? 'bg-orange-500/10 text-orange-400' :
                          eventType.color === 'purple' ? 'bg-purple-500/10 text-purple-400' :
                          'bg-gray-500/10 text-gray-400'
                        }
                      `}>
                        {eventType.icon}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{booking.clientName}</span>
                          <Badge label={eventType.label} size="sm" />
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500">
                          <span>📅 {formatEventDate(booking.eventDate)}</span>
                          {booking.eventStartTime && <span>🕐 {booking.eventStartTime}</span>}
                        </div>
                        {booking.eventVenue && (
                          <p className="text-sm text-neutral-600 mt-1 truncate">📍 {booking.eventVenue}</p>
                        )}
                      </div>

                      {/* Status i accions */}
                      <div className="flex items-center gap-3">
                        <Badge
                          label={booking.status === 'CONFIRMED' ? 'Confirmat' :
                                 booking.status === 'PREPARING' ? 'Preparant' : 'Pendent'}
                          color={booking.status === 'CONFIRMED' ? 'green' :
                                 booking.status === 'PREPARING' ? 'blue' : 'yellow'}
                          icon={booking.status === 'CONFIRMED' ? '✓' :
                                booking.status === 'PREPARING' ? '⚙️' : '⏳'}
                        />
                        <span className="text-white font-medium">{booking.total}€</span>
                        <span className="p-2 rounded-lg text-neutral-400 opacity-0 group-hover:opacity-100 transition-all">
                          →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <p className="text-neutral-500">No hi ha events programats</p>
                <Link href="/admin/bookings" className="text-orange-400 hover:text-orange-300 text-sm mt-2 inline-block">
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
                    <p className="text-sm text-neutral-300">{activity.text}</p>
                    <p className="text-xs text-neutral-600 mt-0.5">{activity.time}</p>
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
        subtitle={`${totalLeads} leads totals`}
        action={
          <Link href="/admin/leads">
            <Button variant="secondary" icon="👥" label="Veure tots" />
          </Link>
        }
        noPadding
      >
        {recentLeads.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Estat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentLeads.map(lead => {
                    const eventType = eventTypeLabels[lead.eventType || 'OTHER'] || eventTypeLabels.OTHER;
                    return (
                      <tr key={lead.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={lead.name} />
                            <div>
                              <p className="text-white font-medium">{lead.name}</p>
                              <p className="text-neutral-500 text-sm">{lead.email || lead.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            label={eventType.label}
                            icon={eventType.icon}
                          />
                        </td>
                        <td className="px-6 py-4 text-neutral-400">
                          {lead.eventDate ? formatEventDate(lead.eventDate) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={leadStatusMap[lead.status as LeadStatus] || 'new'} />
                        </td>
                        <td className="px-6 py-4 text-white font-medium">
                          {lead.budget ? `${lead.budget}` : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/admin/leads/${lead.id}`}
                              className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                              title="Veure"
                            >
                              👁️
                            </Link>
                            {lead.phone && (
                              <a
                                href={`https://wa.me/34${lead.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                                title="WhatsApp"
                              >
                                💬
                              </a>
                            )}
                            {lead.email && (
                              <a
                                href={`mailto:${lead.email}`}
                                className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                                title="Email"
                              >
                                📧
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer taula */}
            <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
              <p className="text-sm text-neutral-500">Mostrant {recentLeads.length} de {totalLeads} leads</p>
              <Link href="/admin/leads">
                <Button variant="ghost" label="Veure tots els leads →" />
              </Link>
            </div>
          </>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-neutral-500">No hi ha leads encara</p>
            <p className="text-neutral-600 text-sm mt-1">Els leads del formulari de contacte apareixeran aquí</p>
          </div>
        )}
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
          <p className="text-green-400 text-sm font-medium">Taxa conversió</p>
          <p className="text-2xl font-bold text-white mt-1">{conversionRate}%</p>
          <p className="text-xs text-green-400/60 mt-1">{leadsWon} de {totalLeads} leads</p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
          <p className="text-blue-400 text-sm font-medium">Ticket mitjà</p>
          <p className="text-2xl font-bold text-white mt-1">
            {upcomingBookings.length > 0
              ? Math.round(upcomingBookings.reduce((acc, b) => acc + (b.total || 0), 0) / upcomingBookings.length)
              : 0}€
          </p>
          <p className="text-xs text-blue-400/60 mt-1">En reserves actives</p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
          <p className="text-purple-400 text-sm font-medium">Valoració</p>
          <p className="text-2xl font-bold text-white mt-1">⭐ {rating.toFixed(1)}</p>
          <p className="text-xs text-purple-400/60 mt-1">Mitjana de ressenyes</p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
          <p className="text-orange-400 text-sm font-medium">Inventari actiu</p>
          <p className="text-2xl font-bold text-white mt-1">{inventoryActive}/{inventoryTotal}</p>
          <p className="text-xs text-orange-400/60 mt-1">{inventoryMaintenance} en manteniment</p>
        </div>
      </div>
    </div>
  );
}
