import { prisma } from '@/lib/prisma';
import { getGa4Report, getGa4ConfigStatus } from '@/lib/analytics/ga4';
import { cachedQuery, CacheTTL } from '@/lib/query-cache';
import { MetricCard, Card, Button } from './components/ui';
import { MiniLineChart } from './components/Charts';
import Link from 'next/link';
import QuickActions from './components/QuickActions';
import { generateDailyChecklistTasks } from '@/lib/services/dailyChecklist';
import LeadStatusQuickActions from './components/LeadStatusQuickActions';
import BookingStatusQuickActions from './components/BookingStatusQuickActions';

/**
 * Dashboard - Òrbita Admin
 * Dark elegant theme
 */

export const dynamic = 'force-dynamic';

function timeoutPromise(ms: number): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(null), ms);
  });
}

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

function buildDateBuckets(days: number) {
  const dates: Date[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    dates.push(d);
  }
  return dates;
}

function toDateKey(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default async function AdminDashboard() {
  await generateDailyChecklistTasks().catch(() => null);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const seriesStart = new Date(now);
  seriesStart.setDate(now.getDate() - 30);
  seriesStart.setHours(0, 0, 0, 0);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const ga4Status = getGa4ConfigStatus();
  const imapConfigured = Boolean(process.env.IMAP_HOST && process.env.IMAP_PORT && process.env.IMAP_USER && process.env.IMAP_PASS);
  const smtpConfigured = Boolean(
    process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM
  );
  const ga4 = await Promise.race([
    getGa4Report().catch(() => null),
    timeoutPromise(1200),
  ]);

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
    leadsRecent30,
    bookingsRecent30,
    postEventPending,
    cronSettings,
    dbHealthy,
    recentLeadsTimeline,
    recentBookingsTimeline,
    recentCustomerActivity,
    recentAdminLogs,
    upcomingTasks,
    staleLeadsCount,
    hotLeadsCount,
    quotesInFlightCount,
    checklistTodayDoneCount,
    checklistTodayPendingCount,
    commandLeads,
    commandBookings,
  ] = await Promise.all([
    // Total leads
    cachedQuery('admin:dashboard:leads:count', () => prisma.lead.count(), CacheTTL.SHORT).catch(() => 0),
    // Leads aquest mes
    cachedQuery(
      `admin:dashboard:leads:month:${startOfMonth.toISOString().slice(0, 10)}`,
      () => prisma.lead.count({ where: { createdAt: { gte: startOfMonth } } }),
      CacheTTL.SHORT
    ).catch(() => 0),
    // Reserves confirmades
    cachedQuery(
      'admin:dashboard:bookings:confirmed',
      () => prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      CacheTTL.SHORT
    ).catch(() => 0),
    // Reserves aquest mes
    cachedQuery(
      `admin:dashboard:bookings:month:${startOfMonth.toISOString().slice(0, 10)}`,
      () => prisma.booking.count({ where: { createdAt: { gte: startOfMonth } } }),
      CacheTTL.SHORT
    ).catch(() => 0),
    // Total clients
    cachedQuery('admin:dashboard:customers:count', () => prisma.customer.count(), CacheTTL.MEDIUM).catch(() => 0),
    // Testimonis pendents
    prisma.customerTestimonial.count({
      where: { isApproved: false }
    }).catch(() => 0),
    // Testimonis aprovats
    prisma.customerTestimonial.count({
      where: { isApproved: true }
    }).catch(() => 0),
    // Últims leads
    cachedQuery(
      'admin:dashboard:recent-leads:5',
      () => prisma.lead.findMany({
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
      }),
      CacheTTL.VERY_SHORT
    ).catch(() => []),
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
    cachedQuery(
      'admin:dashboard:inventory:group-status',
      () => prisma.inventoryItem.groupBy({
        by: ['status'],
        _count: true
      }),
      CacheTTL.SHORT
    ).catch(() => []),
    // Valoració mitjana (ara dins del Promise.all)
    prisma.customerTestimonial.aggregate({
      where: { isApproved: true },
      _avg: { rating: true }
    }).catch(() => ({ _avg: { rating: null } })),
    // Leads guanyats (ara dins del Promise.all)
    cachedQuery(
      'admin:dashboard:leads:won',
      () => prisma.lead.count({ where: { status: 'WON' } }),
      CacheTTL.SHORT
    ).catch(() => 0),
    cachedQuery(
      `admin:dashboard:leads:series:${seriesStart.toISOString().slice(0, 10)}`,
      () => prisma.lead.findMany({
        where: { createdAt: { gte: seriesStart } },
        select: { createdAt: true, status: true },
      }),
      CacheTTL.SHORT
    ).catch(() => []),
    cachedQuery(
      `admin:dashboard:bookings:series:${seriesStart.toISOString().slice(0, 10)}`,
      () => prisma.booking.findMany({
        where: { eventDate: { gte: seriesStart } },
        select: { eventDate: true, status: true, total: true },
      }),
      CacheTTL.SHORT
    ).catch(() => []),
    prisma.booking.count({
      where: {
        status: 'COMPLETED',
        eventDate: { lte: twoDaysAgo },
        postEventEmailSent: false,
        clientEmail: { not: { contains: '@leads.orbitaevents.local' } },
      },
    }).catch(() => 0),
    prisma.setting.findMany({
      where: {
        key: {
          in: [
            'emails.cron.lastRun',
            'emails.cron.lastStatus',
            'emails.cron.lastSummary',
            'emails.cron.lastMessage',
            'automation.commercial.lastRun',
            'automation.commercial.lastStatus',
          ],
        },
      },
    }).catch(() => []),
    prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
    prisma.lead.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, createdAt: true, status: true },
    }).catch(() => []),
    prisma.booking.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: { id: true, clientName: true, reference: true, createdAt: true, status: true },
    }).catch(() => []),
    prisma.customerActivity.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: { id: true, action: true, createdAt: true, customer: { select: { name: true } } },
    }).catch(() => []),
    prisma.adminLog.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: { id: true, action: true, entity: true, createdAt: true },
    }).catch(() => []),
    prisma.leadTask.findMany({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      take: 6,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        dueDate: true,
        status: true,
        lead: { select: { id: true, name: true } },
      },
    }).catch(() => []),
    prisma.lead.count({
      where: {
        status: { in: ['NEW', 'CONTACTED'] },
        createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    }).catch(() => 0),
    prisma.lead.count({
      where: {
        status: { in: ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] },
        priority: { in: ['HIGH', 'URGENT'] },
      },
    }).catch(() => 0),
    prisma.lead.count({
      where: {
        status: { in: ['QUOTE_SENT', 'NEGOTIATING'] },
      },
    }).catch(() => 0),
    prisma.task.count({
      where: {
        createdBy: 'system:daily-checklist',
        createdAt: { gte: todayStart, lte: todayEnd },
        status: 'DONE',
      },
    }).catch(() => 0),
    prisma.task.count({
      where: {
        createdBy: 'system:daily-checklist',
        createdAt: { gte: todayStart, lte: todayEnd },
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
    }).catch(() => 0),
    prisma.lead.findMany({
      where: {
        status: { in: ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 6,
      select: {
        id: true,
        name: true,
        status: true,
        priority: true,
        createdAt: true,
      },
    }).catch(() => []),
    prisma.booking.findMany({
      where: {
        status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] },
      },
      orderBy: [{ eventDate: 'asc' }, { createdAt: 'desc' }],
      take: 6,
      select: {
        id: true,
        reference: true,
        clientName: true,
        status: true,
        eventDate: true,
      },
    }).catch(() => []),
  ]);

  // Calcular estadístiques inventari
  const inventoryAvailable = inventoryStats.find((s: { status: string; _count: number }) => s.status === 'AVAILABLE')?._count || 0;
  const inventoryInUse = inventoryStats.find((s: { status: string; _count: number }) => s.status === 'IN_USE')?._count || 0;
  const inventoryTotal = inventoryStats.reduce((acc: number, s: { _count: number }) => acc + s._count, 0);
  const inventoryMaintenance = inventoryStats.find((s: { status: string; _count: number }) => s.status === 'MAINTENANCE')?._count || 0;
  const inventoryBroken = inventoryStats.find((s: { status: string; _count: number }) => s.status === 'BROKEN')?._count || 0;

  const rating = avgRating._avg.rating ? avgRating._avg.rating.toFixed(1) : '5.0';
  const conversionRate = leadsCount > 0 ? Math.round((wonLeads / leadsCount) * 100) : 0;
  const ga4Sessions = ga4?.totals.sessions || 0;
  const ga4Users = ga4?.totals.activeUsers || 0;
  const ga4PageViews = ga4?.totals.pageViews || 0;
  const ga4AvgSessionMin = ga4?.totals.avgSessionDuration
    ? Math.max(1, Math.round(ga4.totals.avgSessionDuration / 60))
    : 0;

  const buckets = buildDateBuckets(30);
  const leadTotals = new Map<string, { total: number; won: number }>();
  leadsRecent30.forEach((lead) => {
    const key = toDateKey(new Date(lead.createdAt));
    const current = leadTotals.get(key) || { total: 0, won: 0 };
    current.total += 1;
    if (lead.status === 'WON') current.won += 1;
    leadTotals.set(key, current);
  });

  const bookingTotals = new Map<string, { count: number; revenue: number }>();
  bookingsRecent30.forEach((booking) => {
    const key = toDateKey(new Date(booking.eventDate));
    const current = bookingTotals.get(key) || { count: 0, revenue: 0 };
    if (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') {
      current.count += 1;
      current.revenue += Number(booking.total || 0);
    }
    bookingTotals.set(key, current);
  });

  const leadsSeries = buckets.map((d) => leadTotals.get(toDateKey(d))?.total || 0);
  const leadsWonSeries = buckets.map((d) => leadTotals.get(toDateKey(d))?.won || 0);
  const bookingsSeries = buckets.map((d) => bookingTotals.get(toDateKey(d))?.count || 0);
  const revenueSeries = buckets.map((d) => bookingTotals.get(toDateKey(d))?.revenue || 0);
  const revenueTotal30 = Math.round(revenueSeries.reduce((acc, v) => acc + v, 0));

  const ga4Series = ga4?.timeseries || [];
  const ga4ByDate = new Map<string, { sessions: number; users: number }>();
  ga4Series.forEach((row) => {
    if (!row.date) return;
    const yyyy = row.date.slice(0, 4);
    const mm = row.date.slice(4, 6);
    const dd = row.date.slice(6, 8);
    const key = `${yyyy}-${mm}-${dd}`;
    ga4ByDate.set(key, { sessions: row.sessions, users: row.activeUsers });
  });
  const ga4SessionsSeries = buckets.map((d) => ga4ByDate.get(toDateKey(d))?.sessions || 0);
  const ga4UsersSeries = buckets.map((d) => ga4ByDate.get(toDateKey(d))?.users || 0);
  const cronMap = (cronSettings || []).reduce((acc: Record<string, string>, setting: { key: string; value: string }) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {});

  const healthItems = [
    { label: 'DB', status: dbHealthy ? 'OK' : 'ERROR' },
    { label: 'SMTP', status: smtpConfigured ? 'OK' : 'PENDENT' },
    { label: 'IMAP', status: imapConfigured ? 'OK' : 'PENDENT' },
    { label: 'GA4', status: ga4Status.ready ? 'OK' : 'PENDENT' },
    { label: 'Cron', status: cronMap['emails.cron.lastStatus'] || '—' },
    { label: 'Auto', status: cronMap['automation.commercial.lastStatus'] || '—' },
  ];

  const timeline = [
    ...recentLeadsTimeline.map((lead) => ({
      id: `lead-${lead.id}`,
      icon: '👥',
      text: `Nou lead: ${lead.name}`,
      time: timeAgo(new Date(lead.createdAt)),
      ts: new Date(lead.createdAt).getTime(),
      href: `/admin/leads/${lead.id}`,
    })),
    ...recentBookingsTimeline.map((booking) => ({
      id: `booking-${booking.id}`,
      icon: '📋',
      text: `Reserva ${booking.reference} · ${booking.clientName}`,
      time: timeAgo(new Date(booking.createdAt)),
      ts: new Date(booking.createdAt).getTime(),
      href: `/admin/bookings/${booking.id}`,
    })),
    ...recentCustomerActivity.map((activity) => ({
      id: `activity-${activity.id}`,
      icon: '⭐',
      text: `${activity.action} · ${activity.customer?.name || 'Client'}`,
      time: timeAgo(new Date(activity.createdAt)),
      ts: new Date(activity.createdAt).getTime(),
      href: '/admin/emails',
    })),
    ...recentAdminLogs.map((logItem) => ({
      id: `adminlog-${logItem.id}`,
      icon: '🛠️',
      text: `${logItem.action} · ${logItem.entity}`,
      time: timeAgo(new Date(logItem.createdAt)),
      ts: new Date(logItem.createdAt).getTime(),
      href: '/admin/settings',
    })),
  ]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 10);

  const alerts = [
    ...(!ga4Status.ready ? [{
      type: 'error',
      title: 'GA4 pendent',
      description: ga4Status.reason || 'Configura GA4 al panell d’analítica',
      href: '/admin/analytics',
      action: 'Configurar',
    }] : []),
    ...(ga4Status.ready && !ga4 ? [{
      type: 'warning',
      title: 'GA4 sense dades',
      description: 'No podem carregar mètriques. Revisa permisos o quota.',
      href: '/admin/analytics',
      action: 'Revisar',
    }] : []),
    ...(ga4?.realtimeFallback ? [{
      type: 'warning',
      title: 'Realtime parcial',
      description: 'Algunes mètriques realtime no estan disponibles.',
      href: '/admin/analytics',
      action: 'Veure',
    }] : []),
    ...(!imapConfigured ? [{
      type: 'info',
      title: 'IMAP no configurat',
      description: 'L’inbox encara no està connectat.',
      href: '/admin/inbox/settings',
      action: 'Configurar',
    }] : []),
    ...(postEventPending > 0 ? [{
      type: 'warning',
      title: 'Emails post-event pendents',
      description: `${postEventPending} esdeveniments sense correu enviat.`,
      href: '/admin/emails',
      action: 'Gestionar',
    }] : []),
    ...((inventoryMaintenance + inventoryBroken) > 0 ? [{
      type: 'warning',
      title: 'Equip requereix atenció',
      description: `${inventoryMaintenance} en manteniment${inventoryBroken > 0 ? `, ${inventoryBroken} avariat` : ''}.`,
      href: '/admin/inventory',
      action: 'Revisar',
    }] : []),
  ];

  // Activitat recent
  const activitiesRaw = [
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
  const activities = activitiesRaw.length > 0 ? activitiesRaw : [{ icon: '✅', text: 'Tot al dia, sense activitat pendent', time: 'Ara' }];

  const pilotToday = [
    {
      id: 'leads',
      step: 'Pas 1',
      title: 'Respondre entrades',
      description: leadsThisMonth > 0 ? `${leadsThisMonth} consultes aquest mes` : 'No hi ha noves consultes',
      href: '/admin/leads',
      cta: 'Anar a entrades',
      tone: leadsThisMonth > 0 ? 'amber' : 'emerald',
    },
    {
      id: 'tasks',
      step: 'Pas 2',
      title: 'Executar tasques',
      description: upcomingTasks.length > 0 ? `${upcomingTasks.length} tasques obertes` : 'Cap tasca pendent',
      href: '/admin/tasks',
      cta: 'Veure tasques',
      tone: upcomingTasks.length > 0 ? 'amber' : 'emerald',
    },
    {
      id: 'postevent',
      step: 'Pas 3',
      title: 'Tancar post-esdeveniment',
      description: postEventPending > 0 ? `${postEventPending} correus pendents` : 'Post-esdeveniment al dia',
      href: '/admin/emails',
      cta: 'Gestionar',
      tone: postEventPending > 0 ? 'rose' : 'emerald',
    },
    {
      id: 'bookings',
      step: 'Pas 4',
      title: 'Preparar reserves',
      description: bookingsConfirmed > 0 ? `${bookingsConfirmed} reserves confirmades` : 'Sense reserves confirmades',
      href: '/admin/bookings',
      cta: 'Veure reserves',
      tone: 'sky',
    },
  ] as const;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-slate-100">Resum ràpid</h1>
            <p className="text-slate-400 text-xs">Visió general del negoci</p>
          </div>
          <Link href="/admin/leads" className="sm:hidden">
            <Button variant="primary" icon="+" label="Nou" />
          </Link>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <Link href="/admin/analytics">
            <Button variant="secondary" icon="📈" label="Analítica" />
          </Link>
          <Link href="/admin/leads">
            <Button variant="primary" icon="+" label="Nou lead" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Link href="/admin/inbox" className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-3 text-xs text-slate-300 hover:border-cyan-500/40 hover:text-cyan-200 transition-colors">
            📥 Inbox (IMAP)
          </Link>
          <Link href="/admin/emails" className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-3 text-xs text-slate-300 hover:border-cyan-500/40 hover:text-cyan-200 transition-colors">
            🤖 Correus automàtics
          </Link>
          <Link href="/admin/bookings" className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-3 text-xs text-slate-300 hover:border-cyan-500/40 hover:text-cyan-200 transition-colors">
            📋 Reserves
          </Link>
          <Link href="/admin/economia" className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-3 text-xs text-slate-300 hover:border-cyan-500/40 hover:text-cyan-200 transition-colors">
            💶 Economia
          </Link>
          <Link href="/admin/calendario" className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-3 text-xs text-slate-300 hover:border-cyan-500/40 hover:text-cyan-200 transition-colors">
            📅 Calendari
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/12 to-cyan-500/8 p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">Mode Solo</p>
            <h2 className="text-base sm:text-lg font-semibold text-slate-100">Pilot automàtic d&apos;avui</h2>
            <p className="mt-1 text-xs text-slate-300">No és lineal: pots començar directament pel pas 2 o pas 3.</p>
          </div>
          <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-200">
            4 passos clars
          </span>
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          <Link href="/admin/tasks" className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
            Comença per pas 2
          </Link>
          <Link href="/admin/emails" className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-200">
            Comença per pas 3
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {pilotToday.map((item) => {
            const toneClasses = item.tone === 'rose'
              ? 'border-rose-500/30 bg-rose-500/10'
              : item.tone === 'amber'
                ? 'border-amber-500/30 bg-amber-500/10'
                : item.tone === 'sky'
                  ? 'border-sky-500/30 bg-sky-500/10'
                  : 'border-emerald-500/30 bg-emerald-500/10';
            return (
              <Link key={item.id} href={item.href} className={`rounded-xl border p-3 transition-colors hover:border-cyan-400/50 ${toneClasses}`}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{item.step}</p>
                <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                <p className="mt-1 text-xs text-slate-300">{item.description}</p>
                <span className="mt-3 inline-flex text-xs font-semibold text-white underline decoration-dotted">
                  {item.cta}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/10 to-slate-900/40 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300">Checklist d&apos;avui</p>
            <h2 className="text-base sm:text-lg font-semibold text-slate-100">Control diari de feina</h2>
            <p className="mt-1 text-xs text-slate-400">Marca les tasques com a fetes i avança sense perdre el fil.</p>
          </div>
          <Link
            href="/admin/tasks?status=OPEN"
            className="inline-flex items-center rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs sm:text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20"
          >
            Obrir tasques pendents
          </Link>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-xs text-slate-400">Pendents</p>
            <p className="mt-1 text-2xl font-bold text-amber-300">{checklistTodayPendingCount}</p>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
            <p className="text-xs text-slate-400">Fetes</p>
            <p className="mt-1 text-2xl font-bold text-emerald-300">{checklistTodayDoneCount}</p>
          </div>
          <div className="rounded-xl border border-slate-600/50 bg-slate-800/60 p-3">
            <p className="text-xs text-slate-400">Progrés</p>
            <p className="mt-1 text-2xl font-bold text-slate-100">
              {checklistTodayDoneCount + checklistTodayPendingCount > 0
                ? `${Math.round((checklistTodayDoneCount / (checklistTodayDoneCount + checklistTodayPendingCount)) * 100)}%`
                : '0%'}
            </p>
          </div>
        </div>
      </section>


      <section className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 to-slate-900/40 p-4 sm:p-5">
        <div className="mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-300">Centre de comandament</p>
          <h2 className="text-base sm:text-lg font-semibold text-slate-100">Mou estats sense canviar de pantalla</h2>
          <p className="mt-1 text-xs text-slate-400">Accions ràpides de Leads i Reserves des del tauler principal.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Leads actius</p>
              <Link href="/admin/leads" className="text-[11px] text-cyan-300 hover:underline">Obrir Entrades</Link>
            </div>
            <div className="space-y-2">
              {commandLeads.length === 0 ? (
                <p className="text-xs text-slate-500">Sense leads actius.</p>
              ) : (
                commandLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-700/50 bg-slate-900/50 px-2 py-2">
                    <div className="min-w-0">
                      <Link href={`/admin/leads/${lead.id}`} className="block truncate text-sm text-slate-100 hover:text-cyan-300">
                        {lead.name}
                      </Link>
                      <p className="text-[11px] text-slate-500">Prioritat {lead.priority.toLowerCase()} · {timeAgo(new Date(lead.createdAt))}</p>
                    </div>
                    <LeadStatusQuickActions
                      leadId={lead.id}
                      currentStatus={lead.status as 'NEW' | 'CONTACTED' | 'QUOTE_SENT' | 'NEGOTIATING' | 'WON' | 'LOST'}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Reserves actives</p>
              <Link href="/admin/bookings" className="text-[11px] text-cyan-300 hover:underline">Obrir Reserves</Link>
            </div>
            <div className="space-y-2">
              {commandBookings.length === 0 ? (
                <p className="text-xs text-slate-500">Sense reserves actives.</p>
              ) : (
                commandBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-700/50 bg-slate-900/50 px-2 py-2">
                    <div className="min-w-0">
                      <Link href={`/admin/bookings/${booking.id}`} className="block truncate text-sm text-slate-100 hover:text-cyan-300">
                        {booking.reference} · {booking.clientName}
                      </Link>
                      <p className="text-[11px] text-slate-500">{formatEventDate(new Date(booking.eventDate))}</p>
                    </div>
                    <BookingStatusQuickActions
                      bookingId={booking.id}
                      currentStatus={booking.status as 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'COMPLETED' | 'CANCELLED'}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4 sm:p-5">
        <div className="mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300">Radar d&apos;execució</p>
          <h2 className="text-base sm:text-lg font-semibold text-slate-100">On posar el focus avui</h2>
          <p className="mt-1 text-xs text-slate-400">Semàfors simples: vermell = urgent, groc = important, verd = controlat.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/admin/leads" className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-3 hover:border-rose-500/40">
            <p className="text-xs text-slate-400">Temps sense resposta</p>
            <p className={`mt-1 text-xl font-bold ${staleLeadsCount > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>{staleLeadsCount}</p>
            <p className="mt-1 text-xs text-slate-300">Leads amb més de 24h sense avançar. Primer punt a netejar cada dia.</p>
          </Link>
          <Link href="/admin/leads" className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-3 hover:border-amber-500/40">
            <p className="text-xs text-slate-400">Leads calents</p>
            <p className={`mt-1 text-xl font-bold ${hotLeadsCount > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>{hotLeadsCount}</p>
            <p className="mt-1 text-xs text-slate-300">Prioritat alta/urgent. Són els que poden tancar abans.</p>
          </Link>
          <Link href="/admin/presupuestos" className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-3 hover:border-cyan-500/40">
            <p className="text-xs text-slate-400">Pressupostos en joc</p>
            <p className={`mt-1 text-xl font-bold ${quotesInFlightCount > 0 ? 'text-cyan-300' : 'text-emerald-300'}`}>{quotesInFlightCount}</p>
            <p className="mt-1 text-xs text-slate-300">Enviats o negociant. Seguiment curt per convertir-los en reserva.</p>
          </Link>
        </div>
      </section>

      {testimonialsPending > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-3 sm:p-4 sm:flex-row sm:items-center sm:justify-between backdrop-blur-sm">
          <div>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">Testimonis pendents</p>
            <p className="text-base sm:text-lg font-semibold text-slate-100">
              {testimonialsPending} pendent{testimonialsPending > 1 ? 's' : ''} d&apos;aprovació
            </p>
          </div>
          <Link href="/admin/ressenyes" className="self-start sm:self-auto">
            <Button variant="secondary" icon="⭐" label="Revisar" />
          </Link>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {alerts.map((alert, index) => {
            const palette = alert.type === 'error'
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
              : alert.type === 'warning'
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                : 'border-sky-500/30 bg-sky-500/10 text-sky-200';
            return (
              <div key={`${alert.title}-${index}`} className={`rounded-2xl border p-4 ${palette}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{alert.title}</p>
                    <p className="text-xs text-slate-300 mt-1">{alert.description}</p>
                  </div>
                  <Link href={alert.href} className="text-xs text-slate-100 underline decoration-dotted hover:text-white">
                    {alert.action}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <QuickActions />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-4">
          <p className="text-xs uppercase text-slate-400">Salut sistema</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            {healthItems.map((item) => (
              <div key={item.label} className="rounded-lg border border-slate-700/50 bg-slate-900/50 px-2 py-2 text-center">
                <p className="text-[10px] text-slate-500">{item.label}</p>
                <p className={`text-xs font-semibold ${item.status === 'OK' ? 'text-emerald-300' : item.status === 'ERROR' ? 'text-rose-300' : 'text-amber-300'}`}>
                  {item.status}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-slate-500">
            Últim cron: {cronMap['emails.cron.lastRun'] ? new Date(cronMap['emails.cron.lastRun']).toLocaleString('ca-ES') : 'Mai'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-4">
          <p className="text-xs uppercase text-slate-400">Tasques pendents</p>
          <div className="mt-3 space-y-2 text-xs">
            {upcomingTasks.length === 0 ? (
              <p className="text-slate-500">Sense tasques pendents</p>
            ) : (
              upcomingTasks.map((task) => (
                <Link key={task.id} href={`/admin/leads/${task.lead.id}`} className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-900/50 px-2 py-2 text-slate-200 hover:border-cyan-500/40">
                  <span className="truncate">{task.title}</span>
                  <span className="text-[10px] text-slate-500">{task.lead.name}</span>
                </Link>
              ))
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-4">
          <p className="text-xs uppercase text-slate-400">Timeline</p>
          <div className="mt-3 space-y-2 text-xs">
            {timeline.length === 0 ? (
              <p className="text-slate-500">Cap activitat recent</p>
            ) : (
              timeline.map((item) => (
                <Link key={item.id} href={item.href} className="flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-900/50 px-2 py-2 text-slate-200 hover:border-cyan-500/40">
                  <span>{item.icon}</span>
                  <span className="flex-1 truncate">{item.text}</span>
                  <span className="text-[10px] text-slate-500">{item.time}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Mètriques essencials */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <MetricCard
          icon="📋"
          label="Reserves confirmades"
          value={bookingsConfirmed.toString()}
          change={bookingsThisMonth > 0 ? `+${bookingsThisMonth} aquest mes` : '-'}
          changeType="up"
          accent="emerald"
        />
        <MetricCard
          icon="📨"
          label="Consultes del mes"
          value={leadsThisMonth.toString()}
          change={`${leadsCount} totals`}
          changeType="up"
          accent="sky"
        />
        <MetricCard
          icon="🏆"
          label="Clients"
          value={customersCount.toString()}
          change={`${conversionRate}% de conversió`}
          changeType="up"
          accent="purple"
        />
        <MetricCard
          icon="⭐"
          label="Valoració mitjana"
          value={rating}
          change={`${testimonialsApproved} ressenyes`}
          changeType="up"
          accent="amber"
        />
        <MetricCard
          icon="🌐"
          label="Sessions web (30d)"
          value={ga4Sessions || '-'}
          change={ga4Users ? `${ga4Users} usuaris` : 'GA4 pendent'}
          changeType="neutral"
          accent="cyan"
        />
        <MetricCard
          icon="⏱️"
          label="Temps mitjà web"
          value={ga4AvgSessionMin ? `${ga4AvgSessionMin} min` : '-'}
          change={ga4PageViews ? `${ga4PageViews} pàgines` : 'GA4 pendent'}
          changeType="neutral"
          accent="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card title="Trànsit web (30 dies)" subtitle="Sessions i usuaris" noPadding>
          <div className="p-4 sm:p-6">
            <MiniLineChart
              series={[
                { data: ga4SessionsSeries, stroke: '#22d3ee', label: 'Sessions', value: ga4Sessions || '-' },
                { data: ga4UsersSeries, stroke: '#60a5fa', label: 'Usuaris', value: ga4Users || '-' },
              ]}
            />
            {!ga4 && (
              <p className="mt-2 text-xs text-slate-500">GA4 pendent o sense dades.</p>
            )}
          </div>
        </Card>
        <Card title="Entrades i conversió" subtitle="Consultes i tancaments" noPadding>
          <div className="p-4 sm:p-6">
            <MiniLineChart
              series={[
                { data: leadsSeries, stroke: '#34d399', label: 'Entrades', value: leadsThisMonth },
                { data: leadsWonSeries, stroke: '#fbbf24', label: 'Guanyats', value: wonLeads },
              ]}
            />
          </div>
        </Card>
        <Card title="Reserves i facturació" subtitle="Esdeveniments confirmats" noPadding>
          <div className="p-4 sm:p-6">
            <MiniLineChart
              series={[
                { data: bookingsSeries, stroke: '#f472b6', label: 'Reserves', value: bookingsConfirmed },
                { data: revenueSeries, stroke: '#a78bfa', label: '€', value: revenueTotal30 },
              ]}
            />
          </div>
        </Card>
      </div>

      {/* Contingut principal - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Pròxims esdeveniments */}
        <div className="lg:col-span-2">
          <Card
            title="Pròxims esdeveniments"
            subtitle={`${upcomingBookings.length} programats`}
            action={
              <Link href="/admin/calendario">
                <Button variant="ghost" icon="📅" label="Calendari" />
              </Link>
            }
            noPadding
          >
            {upcomingBookings.length > 0 ? (
              <div className="divide-y divide-slate-700/30">
                {upcomingBookings.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/admin/bookings/${booking.id}`}
                    className="px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4 hover:bg-slate-700/30 active:bg-slate-700/50 transition-colors"
                  >
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
                      <span className="text-slate-100 font-bold text-sm sm:text-base">
                        {new Date(booking.eventDate).getDate()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-100 font-medium text-sm sm:text-base truncate">{booking.clientName || 'Client'}</p>
                      <p className="text-slate-400 text-xs sm:text-sm truncate">
                        {formatEventDate(new Date(booking.eventDate))} · {booking.eventType || 'Esdeveniment'}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                <p className="text-slate-400 text-sm">No hi ha esdeveniments programats</p>
                <Link href="/admin/bookings" className="text-cyan-400 hover:text-cyan-300 text-sm mt-2 inline-block font-medium">
                  Crear nova reserva →
                </Link>
              </div>
            )}
          </Card>
        </div>

      {/* Activitat recent */}
        <div className="hidden sm:block">
          <Card title="Activitat" subtitle="Últimes accions">
            <div className="space-y-3 sm:space-y-4">
              {activities.map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-base sm:text-lg mt-0.5">{activity.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-slate-300">{activity.text}</p>
                    {activity.time && (
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{activity.time}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Entrades recents */}
      <Card
        title="Entrades recents"
        subtitle={`${leadsCount} totals`}
        action={
          <Link href="/admin/leads">
            <Button variant="secondary" icon="👥" label="Tots" />
          </Link>
        }
        noPadding
      >
        {recentLeads.length > 0 ? (
          <div className="divide-y divide-slate-700/30">
            {recentLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/admin/leads/${lead.id}`}
                className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-slate-700/30 active:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-slate-600/50 to-slate-700/50 border border-slate-600/50 flex items-center justify-center text-slate-200 font-medium text-sm sm:text-base shrink-0">
                    {lead.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-100 font-medium text-sm sm:text-base truncate">{lead.name}</p>
                    <p className="text-slate-400 text-xs sm:text-sm truncate hidden sm:block">{lead.email}</p>
                    <p className="text-slate-500 text-xs sm:hidden">{timeAgo(new Date(lead.createdAt))}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
                  <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                    lead.status === 'NEW' ? 'bg-sky-500/20 text-sky-300' :
                    lead.status === 'WON' ? 'bg-emerald-500/20 text-emerald-300' :
                    'bg-slate-500/20 text-slate-300'
                  }`}>
                    {lead.status}
                  </span>
                  <span className="text-slate-500 text-sm hidden sm:block">
                    {timeAgo(new Date(lead.createdAt))}
                  </span>
                  <svg className="w-4 h-4 text-slate-500 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-4 sm:px-6 py-8 sm:py-12 text-center">
            <p className="text-slate-400 text-sm">Encara no hi ha entrades</p>
            <p className="text-slate-500 text-xs mt-1">Les entrades apareixeran aquí</p>
          </div>
        )}
      </Card>

      {/* Estadístiques ràpides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3 sm:p-5 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-sm">
          <p className="text-slate-400 text-xs sm:text-sm font-medium">Conversió</p>
          <p className="text-xl sm:text-2xl font-semibold text-slate-100 mt-0.5 sm:mt-1">{conversionRate}%</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">{wonLeads}/{leadsCount} entrades</p>
        </div>
        <div className="p-3 sm:p-5 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/5 backdrop-blur-sm">
          <p className="text-slate-400 text-xs sm:text-sm font-medium">Testimonis</p>
          <p className="text-xl sm:text-2xl font-semibold text-slate-100 mt-0.5 sm:mt-1">{testimonialsApproved + testimonialsPending}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">{testimonialsPending} pendents</p>
        </div>
        <div className="p-3 sm:p-5 rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-rose-600/5 backdrop-blur-sm">
          <p className="text-slate-400 text-xs sm:text-sm font-medium">Valoració</p>
          <p className="text-xl sm:text-2xl font-semibold text-slate-100 mt-0.5 sm:mt-1">⭐ {rating}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">Mitjana</p>
        </div>
        <Link href="/admin/inventory" className="p-3 sm:p-5 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 backdrop-blur-sm hover:border-cyan-400/40 transition-colors">
          <p className="text-slate-400 text-xs sm:text-sm font-medium">Inventari</p>
          <p className="text-xl sm:text-2xl font-semibold text-slate-100 mt-0.5 sm:mt-1">{inventoryAvailable}/{inventoryTotal}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">
            {inventoryInUse > 0 && `${inventoryInUse} en ús · `}{inventoryMaintenance > 0 && `${inventoryMaintenance} mant.`}{inventoryBroken > 0 && ` · ${inventoryBroken} avariat`}{inventoryInUse === 0 && inventoryMaintenance === 0 && inventoryBroken === 0 && 'Tot disponible'}
          </p>
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-700/30">
          <h3 className="text-sm font-semibold text-slate-100">🧾 Auditoria recent</h3>
          <p className="text-xs text-slate-400">Últimes accions d'admin</p>
        </div>
        {recentAdminLogs.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">Sense activitat recent</div>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {recentAdminLogs.map((logItem) => (
              <div key={logItem.id} className="px-4 py-3 flex items-center justify-between text-xs text-slate-300">
                <span className="truncate">{logItem.action} · {logItem.entity}</span>
                <span className="text-slate-500">{timeAgo(new Date(logItem.createdAt))}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
