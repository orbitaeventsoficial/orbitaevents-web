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
  const now = new Date();
  const dayKey = now.toISOString().slice(0, 10);
  // No bloqueja el primer render del dashboard.
  void cachedQuery(
    `admin:dashboard:daily-checklist-sync:${dayKey}`,
    async () => {
      await generateDailyChecklistTasks().catch(() => null);
      return true;
    },
    CacheTTL.MEDIUM
  ).catch(() => false);

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
  const sentryConfigured = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
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
    cachedQuery(
      'admin:dashboard:testimonials:pending',
      () => prisma.customerTestimonial.count({ where: { isApproved: false } }),
      CacheTTL.SHORT
    ).catch(() => 0),
    // Testimonis aprovats
    cachedQuery(
      'admin:dashboard:testimonials:approved',
      () => prisma.customerTestimonial.count({ where: { isApproved: true } }),
      CacheTTL.SHORT
    ).catch(() => 0),
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
    cachedQuery(
      'admin:dashboard:upcoming-bookings:5',
      () =>
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
        }),
      CacheTTL.VERY_SHORT
    ).catch(() => []),
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
    cachedQuery(
      'admin:dashboard:testimonials:avg-rating',
      () =>
        prisma.customerTestimonial.aggregate({
          where: { isApproved: true },
          _avg: { rating: true }
        }),
      CacheTTL.SHORT
    ).catch(() => ({ _avg: { rating: null } })),
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
    cachedQuery(
      `admin:dashboard:post-event:pending:${dayKey}`,
      () =>
        prisma.booking.count({
          where: {
            status: 'COMPLETED',
            eventDate: { lte: twoDaysAgo },
            postEventEmailSent: false,
            clientEmail: { not: { contains: '@leads.orbitaevents.local' } },
          },
        }),
      CacheTTL.SHORT
    ).catch(() => 0),
    cachedQuery(
      'admin:dashboard:cron:settings',
      () =>
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
        }),
      CacheTTL.SHORT
    ).catch(() => []),
    prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
    cachedQuery(
      'admin:dashboard:timeline:leads',
      () =>
        prisma.lead.findMany({
          take: 6,
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, createdAt: true, status: true },
        }),
      CacheTTL.VERY_SHORT
    ).catch(() => []),
    cachedQuery(
      'admin:dashboard:timeline:bookings',
      () =>
        prisma.booking.findMany({
          take: 6,
          orderBy: { createdAt: 'desc' },
          select: { id: true, clientName: true, reference: true, createdAt: true, status: true },
        }),
      CacheTTL.VERY_SHORT
    ).catch(() => []),
    cachedQuery(
      'admin:dashboard:timeline:activity',
      () =>
        prisma.customerActivity.findMany({
          take: 6,
          orderBy: { createdAt: 'desc' },
          select: { id: true, action: true, createdAt: true, customer: { select: { name: true } } },
        }),
      CacheTTL.VERY_SHORT
    ).catch(() => []),
    cachedQuery(
      'admin:dashboard:timeline:',
      () =>
        prisma.adminLog.findMany({
          take: 6,
          orderBy: { createdAt: 'desc' },
          select: { id: true, action: true, entity: true, createdAt: true },
        }),
      CacheTTL.VERY_SHORT
    ).catch(() => []),
    cachedQuery(
      'admin:dashboard:tasks:upcoming',
      () =>
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
        }),
      CacheTTL.VERY_SHORT
    ).catch(() => []),
    cachedQuery(
      `admin:dashboard:leads:stale:${dayKey}`,
      () =>
        prisma.lead.count({
          where: {
            status: { in: ['NEW', 'CONTACTED'] },
            createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
          },
        }),
      CacheTTL.SHORT
    ).catch(() => 0),
    cachedQuery(
      'admin:dashboard:leads:hot',
      () =>
        prisma.lead.count({
          where: {
            status: { in: ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] },
            priority: { in: ['HIGH', 'URGENT'] },
          },
        }),
      CacheTTL.SHORT
    ).catch(() => 0),
    cachedQuery(
      'admin:dashboard:leads:quotes-in-flight',
      () =>
        prisma.lead.count({
          where: {
            status: { in: ['QUOTE_SENT', 'NEGOTIATING'] },
          },
        }),
      CacheTTL.SHORT
    ).catch(() => 0),
    cachedQuery(
      `admin:dashboard:checklist:done:${dayKey}`,
      () =>
        prisma.task.count({
          where: {
            createdBy: 'system:daily-checklist',
            createdAt: { gte: todayStart, lte: todayEnd },
            status: 'DONE',
          },
        }),
      CacheTTL.SHORT
    ).catch(() => 0),
    cachedQuery(
      `admin:dashboard:checklist:pending:${dayKey}`,
      () =>
        prisma.task.count({
          where: {
            createdBy: 'system:daily-checklist',
            createdAt: { gte: todayStart, lte: todayEnd },
            status: { in: ['OPEN', 'IN_PROGRESS'] },
          },
        }),
      CacheTTL.SHORT
    ).catch(() => 0),
    cachedQuery(
      'admin:dashboard:command:leads',
      () =>
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
        }),
      CacheTTL.VERY_SHORT
    ).catch(() => []),
    cachedQuery(
      'admin:dashboard:command:bookings',
      () =>
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
        }),
      CacheTTL.VERY_SHORT
    ).catch(() => []),
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
    { label: 'Sentry', status: sentryConfigured ? 'OK' : 'PENDENT' },
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
    <div className="space-y-4">
      {/* Header */}
      <div className="">
        <div className="">
          <div>
            <h1 className="">Resum ràpid</h1>
            <p className="">Visió general del negoci</p>
          </div>
          <Link href="/admin/leads" className="">
            <Button variant="primary" icon="+" label="Nou" />
          </Link>
        </div>
        <div className="">
          <Link href="/admin/analytics">
            <Button variant="secondary" icon="📈" label="Analítica" />
          </Link>
          <Link href="/admin/leads">
            <Button variant="primary" icon="+" label="Nou lead" />
          </Link>
        </div>
        <div className="">
          <Link href="/admin/inbox" className="">
            📥 Inbox (IMAP)
          </Link>
          <Link href="/admin/emails" className="">
            🤖 Correus automàtics
          </Link>
          <Link href="/admin/bookings" className="">
            📋 Reserves
          </Link>
          <Link href="/admin/economia" className="">
            💶 Economia
          </Link>
          <Link href="/admin/calendario" className="">
            📅 Calendari
          </Link>
        </div>
      </div>

      <section className="">
        <div className="">
          <div>
            <p className="">Mode Solo</p>
            <h2 className="">Pilot automàtic d&apos;avui</h2>
            <p className="">No és lineal: pots començar directament pel pas 2 o pas 3.</p>
          </div>
          <span className="">
            4 passos clars
          </span>
        </div>
        <div className="">
          <Link href="/admin/tasks" className="">
            Comença per pas 2
          </Link>
          <Link href="/admin/emails" className="">
            Comença per pas 3
          </Link>
        </div>
        <div className="">
          {pilotToday.map((item) => {
            const toneClasses = item.tone === 'rose'
              ? ''
              : item.tone === 'amber'
                ? ''
                : item.tone === 'sky'
                  ? ''
                  : '';
            return (
              <Link key={item.id} href={item.href} className={`${toneClasses}`}>
                <p className="">{item.step}</p>
                <p className="">{item.title}</p>
                <p className="">{item.description}</p>
                <span className="">
                  {item.cta}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="">
        <div className="">
          <div>
            <p className="">Checklist d&apos;avui</p>
            <h2 className="">Control diari de feina</h2>
            <p className="">Marca les tasques com a fetes i avança sense perdre el fil.</p>
          </div>
          <Link
            href="/admin/tasks?status=OPEN"
            className=""
          >
            Obrir tasques pendents
          </Link>
        </div>
        <div className="">
          <div className="">
            <p className="">Pendents</p>
            <p className="">{checklistTodayPendingCount}</p>
          </div>
          <div className="">
            <p className="">Fetes</p>
            <p className="">{checklistTodayDoneCount}</p>
          </div>
          <div className="">
            <p className="">Progrés</p>
            <p className="">
              {checklistTodayDoneCount + checklistTodayPendingCount > 0
                ? `${Math.round((checklistTodayDoneCount / (checklistTodayDoneCount + checklistTodayPendingCount)) * 100)}%`
                : '0%'}
            </p>
          </div>
        </div>
      </section>


      <section className="">
        <div className="">
          <p className="">Centre de comandament</p>
          <h2 className="">Mou estats sense canviar de pantalla</h2>
          <p className="">Accions ràpides de Leads i Reserves des del tauler principal.</p>
        </div>
        <div className="">
          <div className="">
            <div className="">
              <p className="">Leads actius</p>
              <Link href="/admin/leads" className="">Obrir Entrades</Link>
            </div>
            <div className="">
              {commandLeads.length === 0 ? (
                <p className="">Sense leads actius.</p>
              ) : (
                commandLeads.map((lead) => (
                  <div key={lead.id} className="">
                    <div className="">
                      <Link href={`/admin/leads/${lead.id}`} className="">
                        {lead.name}
                      </Link>
                      <p className="">Prioritat {lead.priority.toLowerCase()} · {timeAgo(new Date(lead.createdAt))}</p>
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
          <div className="">
            <div className="">
              <p className="">Reserves actives</p>
              <Link href="/admin/bookings" className="">Obrir Reserves</Link>
            </div>
            <div className="">
              {commandBookings.length === 0 ? (
                <p className="">Sense reserves actives.</p>
              ) : (
                commandBookings.map((booking) => (
                  <div key={booking.id} className="">
                    <div className="">
                      <Link href={`/admin/bookings/${booking.id}`} className="">
                        {booking.reference} · {booking.clientName}
                      </Link>
                      <p className="">{formatEventDate(new Date(booking.eventDate))}</p>
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

      <section className="">
        <div className="">
          <p className="">Radar d&apos;execució</p>
          <h2 className="">On posar el focus avui</h2>
          <p className="">Semàfors simples: vermell = urgent, groc = important, verd = controlat.</p>
        </div>
        <div className="">
          <Link href="/admin/leads" className="">
            <p className="">Temps sense resposta</p>
            <p className={`${staleLeadsCount > 0 ? '' : ''}`}>{staleLeadsCount}</p>
            <p className="">Leads amb més de 24h sense avançar. Primer punt a netejar cada dia.</p>
          </Link>
          <Link href="/admin/leads" className="">
            <p className="">Leads calents</p>
            <p className={`${hotLeadsCount > 0 ? '' : ''}`}>{hotLeadsCount}</p>
            <p className="">Prioritat alta/urgent. Són els que poden tancar abans.</p>
          </Link>
          <Link href="/admin/presupuestos" className="">
            <p className="">Pressupostos en joc</p>
            <p className={`${quotesInFlightCount > 0 ? '' : ''}`}>{quotesInFlightCount}</p>
            <p className="">Enviats o negociant. Seguiment curt per convertir-los en reserva.</p>
          </Link>
        </div>
      </section>

      {testimonialsPending > 0 && (
        <div className="">
          <div>
            <p className="">Testimonis pendents</p>
            <p className="">
              {testimonialsPending} pendent{testimonialsPending > 1 ? 's' : ''} d&apos;aprovació
            </p>
          </div>
          <Link href="/admin/ressenyes" className="">
            <Button variant="secondary" icon="⭐" label="Revisar" />
          </Link>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="">
          {alerts.map((alert, index) => {
            const palette = alert.type === 'error'
              ? ' '
              : alert.type === 'warning'
                ? ' '
                : ' ';
            return (
              <div key={`${alert.title}-${index}`} className={palette}>
                <div className="">
                  <div>
                    <p className="">{alert.title}</p>
                    <p className="">{alert.description}</p>
                  </div>
                  <Link href={alert.href} className="">
                    {alert.action}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <QuickActions />

      <section className="">
        <div className="">
          <p className="">Salut sistema</p>
          <div className="">
            {healthItems.map((item) => (
              <div key={item.label} className="">
                <p className="">{item.label}</p>
                <p className={`${item.status === 'OK' ? '' : item.status === 'ERROR' ? '' : ''}`}>
                  {item.status}
                </p>
              </div>
            ))}
          </div>
          <p className="">
            Últim cron: {cronMap['emails.cron.lastRun'] ? new Date(cronMap['emails.cron.lastRun']).toLocaleString('ca-ES') : 'Mai'}
          </p>
        </div>
        <div className="">
          <p className="">Tasques pendents</p>
          <div className="">
            {upcomingTasks.length === 0 ? (
              <p className="">Sense tasques pendents</p>
            ) : (
              upcomingTasks.map((task) => (
                <Link key={task.id} href={`/admin/leads/${task.lead.id}`} className="">
                  <span className="">{task.title}</span>
                  <span className="">{task.lead.name}</span>
                </Link>
              ))
            )}
          </div>
        </div>
        <div className="">
          <p className="">Timeline</p>
          <div className="">
            {timeline.length === 0 ? (
              <p className="">Cap activitat recent</p>
            ) : (
              timeline.map((item) => (
                <Link key={item.id} href={item.href} className="">
                  <span>{item.icon}</span>
                  <span className="">{item.text}</span>
                  <span className="">{item.time}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Mètriques essencials */}
      <div className="">
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

      <div className="">
        <Card title="Trànsit web (30 dies)" subtitle="Sessions i usuaris" noPadding>
          <div className="">
            <MiniLineChart
              series={[
                { data: ga4SessionsSeries, stroke: '#22d3ee', label: 'Sessions', value: ga4Sessions || '-' },
                { data: ga4UsersSeries, stroke: '#60a5fa', label: 'Usuaris', value: ga4Users || '-' },
              ]}
            />
            {!ga4 && (
              <p className="">GA4 pendent o sense dades.</p>
            )}
          </div>
        </Card>
        <Card title="Entrades i conversió" subtitle="Consultes i tancaments" noPadding>
          <div className="">
            <MiniLineChart
              series={[
                { data: leadsSeries, stroke: '#34d399', label: 'Entrades', value: leadsThisMonth },
                { data: leadsWonSeries, stroke: '#fbbf24', label: 'Guanyats', value: wonLeads },
              ]}
            />
          </div>
        </Card>
        <Card title="Reserves i facturació" subtitle="Esdeveniments confirmats" noPadding>
          <div className="">
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
      <div className="">
        {/* Pròxims esdeveniments */}
        <div className="">
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
              <div className="">
                {upcomingBookings.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/admin/bookings/${booking.id}`}
                    className=""
                  >
                    <div className="">
                      <span className="">
                        {new Date(booking.eventDate).getDate()}
                      </span>
                    </div>
                    <div className="">
                      <p className="">{booking.clientName || 'Client'}</p>
                      <p className="">
                        {formatEventDate(new Date(booking.eventDate))} · {booking.eventType || 'Esdeveniment'}
                      </p>
                    </div>
                    <svg className="" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="">
                <p className="">No hi ha esdeveniments programats</p>
                <Link href="/admin/bookings" className="">
                  Crear nova reserva →
                </Link>
              </div>
            )}
          </Card>
        </div>

      {/* Activitat recent */}
        <div className="">
          <Card title="Activitat" subtitle="Últimes accions">
            <div className="">
              {activities.map((activity, i) => (
                <div key={i} className="">
                  <span className="">{activity.icon}</span>
                  <div className="">
                    <p className="">{activity.text}</p>
                    {activity.time && (
                      <p className="">{activity.time}</p>
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
          <div className="">
            {recentLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/admin/leads/${lead.id}`}
                className=""
              >
                <div className="">
                  <div className="">
                    {lead.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="">
                    <p className="">{lead.name}</p>
                    <p className="">{lead.email}</p>
                    <p className="">{timeAgo(new Date(lead.createdAt))}</p>
                  </div>
                </div>
                <div className="">
                  <span className={`${
                    lead.status === 'NEW' ? '' :
                    lead.status === 'WON' ? '' :
                    ''
                  }`}>
                    {lead.status}
                  </span>
                  <span className="">
                    {timeAgo(new Date(lead.createdAt))}
                  </span>
                  <svg className="" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="">
            <p className="">Encara no hi ha entrades</p>
            <p className="">Les entrades apareixeran aquí</p>
          </div>
        )}
      </Card>

      {/* Estadístiques ràpides */}
      <div className="">
        <div className="">
          <p className="">Conversió</p>
          <p className="">{conversionRate}%</p>
          <p className="">{wonLeads}/{leadsCount} entrades</p>
        </div>
        <div className="">
          <p className="">Testimonis</p>
          <p className="">{testimonialsApproved + testimonialsPending}</p>
          <p className="">{testimonialsPending} pendents</p>
        </div>
        <div className="">
          <p className="">Valoració</p>
          <p className="">⭐ {rating}</p>
          <p className="">Mitjana</p>
        </div>
        <Link href="/admin/inventory" className="">
          <p className="">Inventari</p>
          <p className="">{inventoryAvailable}/{inventoryTotal}</p>
          <p className="">
            {inventoryInUse > 0 && `${inventoryInUse} en ús ·`}{inventoryMaintenance > 0 && `${inventoryMaintenance} mant.`}{inventoryBroken > 0 && ` · ${inventoryBroken} avariat`}{inventoryInUse === 0 && inventoryMaintenance === 0 && inventoryBroken === 0 && 'Tot disponible'}
          </p>
        </Link>
      </div>

      <section className="">
        <div className="">
          <h3 className="">🧾 Auditoria recent</h3>
          <p className="">Últimes accions d'admin</p>
        </div>
        {recentAdminLogs.length === 0 ? (
          <div className="">Sense activitat recent</div>
        ) : (
          <div className="">
            {recentAdminLogs.map((logItem) => (
              <div key={logItem.id} className="">
                <span className="">{logItem.action} · {logItem.entity}</span>
                <span className="">{timeAgo(new Date(logItem.createdAt))}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
