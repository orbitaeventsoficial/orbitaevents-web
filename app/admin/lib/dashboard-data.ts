import { prisma } from '@/lib/prisma';
import { getGa4Report, getGa4ConfigStatus } from '@/lib/analytics/ga4';
import { cachedQuery, CacheTTL } from '@/lib/query-cache';
import { generateDailyChecklistTasks } from '@/lib/services/dailyChecklist';
import { getProfitabilityConfig } from '@/lib/services/profitabilityService';
import { computeSimpleMarginPct } from '@/lib/services/costEngine';
import { buildCashFlowForecast } from '@/lib/services/cashFlowForecast';
import { buildPipelineForecast } from '@/lib/services/pipelineForecast';
import { formatDateSimple } from '@/lib/constants';
import { getBookingChecklist, DEFAULT_BOOKING_CHECKLIST_ITEMS } from '@/lib/services/bookingChecklistService';

// ─── Helpers ────────────────────────────────────────────────────────────────

export function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `Fa ${diffMins}min`;
  if (diffHours < 24) return `Fa ${diffHours}h`;
  if (diffDays < 7) return `Fa ${diffDays}d`;
  return formatDateSimple(date);
}

export function formatEventDate(date: Date): string {
  const days = ['Dg', 'Dl', 'Dm', 'Dc', 'Dj', 'Dv', 'Ds'];
  const months = ['Gen', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Des'];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

function buildDateBuckets(days: number): Date[] {
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

function toDateKey(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function timeoutPromise(ms: number): Promise<null> {
  return new Promise((resolve) => setTimeout(() => resolve(null), ms));
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DashboardAlert {
  type: string;
  title: string;
  description: string;
  href: string;
  action: string;
}

export interface DashboardData {
  // KPIs
  leadsCount: number;
  leadsThisMonth: number;
  bookingsConfirmed: number;
  bookingsThisMonth: number;
  customersCount: number;
  testimonialsPending: number;
  testimonialsApproved: number;
  wonLeads: number;
  conversionRate: number;
  rating: string;
  staleLeadsCount: number;
  hotLeadsCount: number;
  quotesInFlightCount: number;
  postEventPending: number;
  // Checklist
  checklistTodayDoneCount: number;
  checklistTodayPendingCount: number;
  // Inventari
  inventoryAvailable: number;
  inventoryInUse: number;
  inventoryTotal: number;
  inventoryMaintenance: number;
  inventoryBroken: number;
  // GA4
  ga4Sessions: number;
  ga4Users: number;
  ga4PageViews: number;
  ga4AvgSessionMin: number;
  ga4SessionsSeries: number[];
  ga4UsersSeries: number[];
  ga4Available: boolean;
  ga4RealtimeFallback: boolean;
  // Series
  leadsSeries: number[];
  leadsWonSeries: number[];
  bookingsSeries: number[];
  revenueSeries: number[];
  revenueTotal30: number;
  // Lists
  recentLeads: { id: string; name: string; email: string; eventType: string | null; status: string; createdAt: Date }[];
  upcomingBookings: { id: string; clientName: string; eventDate: Date; eventType: string | null }[];
  upcomingTasks: { id: string; title: string; dueDate: Date | null; status: string; lead: { id: string; name: string } | null }[];
  commandLeads: { id: string; name: string; status: string; priority: string; createdAt: Date }[];
  commandBookings: { id: string; reference: string | null; clientName: string; status: string; eventDate: Date }[];
  recentAdminLogs: { id: string; action: string; entity: string; createdAt: Date }[];
  // Margin
  avgMarginPct: number;
  // Financial forecasts
  cashFlowNet30: number;
  pipelineWeighted30: number;
  pendingPayments: number;
  // Next event ("pròxim bolo")
  nextEvent: {
    id: string;
    reference: string;
    clientName: string;
    eventDate: Date;
    eventStartTime: string | null;
    eventLocation: string;
    eventVenue: string | null;
    eventType: string | null;
    total: number;
    depositPaid: boolean;
    remainingPaid: boolean;
    status: string;
    packName: string;
    daysUntil: number;
    checklistDone: number;
    checklistTotal: number;
  } | null;
  // Monthly revenue
  revenueThisMonth: number;
  revenueTarget: number;
  revenueMonthPct: number;
  // Monthly revenue (12 months)
  monthlyRevenue: { label: string; current: number; previous: number }[];
  // Event type distribution
  eventTypeDistribution: { label: string; value: number; color: string }[];
  // Computed
  timeline: { id: string; icon: string; text: string; time: string; ts: number; href: string }[];
  alerts: DashboardAlert[];
  activities: { icon: string; text: string; time: string }[];
  healthItems: { label: string; status: string }[];
  cronMap: Record<string, string>;
}

// ─── Main fetch ──────────────────────────────────────────────────────────────

export async function fetchDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const dayKey = now.toISOString().slice(0, 10);

  void cachedQuery(
    `admin:dashboard:daily-checklist-sync:${dayKey}`,
    async () => { await generateDailyChecklistTasks().catch(() => null); return true; },
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
  const sentryConfigured = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
  const smtpConfigured = Boolean(
    process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM
  );

  const [ga4, profitConfig] = await Promise.all([
    Promise.race([getGa4Report().catch(() => null), timeoutPromise(3000)]),
    getProfitabilityConfig(),
  ]);

  const [
    leadsCount, leadsThisMonth, bookingsConfirmed, bookingsThisMonth,
    customersCount, testimonialsPending, testimonialsApproved,
    recentLeads, upcomingBookings, inventoryStats, avgRating, wonLeads,
    leadsRecent30, bookingsRecent30, postEventPending, cronSettings, dbHealthy,
    recentLeadsTimeline, recentBookingsTimeline, recentCustomerActivity, recentAdminLogs,
    upcomingTasks, staleLeadsCount, hotLeadsCount, quotesInFlightCount,
    checklistTodayDoneCount, checklistTodayPendingCount, commandLeads, commandBookings,
    marginBookings,
  ] = await Promise.all([
    cachedQuery('admin:dashboard:leads:count', () => prisma.lead.count(), CacheTTL.SHORT).catch(() => 0),
    cachedQuery(`admin:dashboard:leads:month:${startOfMonth.toISOString().slice(0, 10)}`, () => prisma.lead.count({ where: { createdAt: { gte: startOfMonth } } }), CacheTTL.SHORT).catch(() => 0),
    cachedQuery('admin:dashboard:bookings:confirmed', () => prisma.booking.count({ where: { status: 'CONFIRMED' } }), CacheTTL.SHORT).catch(() => 0),
    cachedQuery(`admin:dashboard:bookings:month:${startOfMonth.toISOString().slice(0, 10)}`, () => prisma.booking.count({ where: { createdAt: { gte: startOfMonth } } }), CacheTTL.SHORT).catch(() => 0),
    cachedQuery('admin:dashboard:customers:count', () => prisma.customer.count(), CacheTTL.MEDIUM).catch(() => 0),
    cachedQuery('admin:dashboard:testimonials:pending', () => prisma.customerTestimonial.count({ where: { isApproved: false } }), CacheTTL.SHORT).catch(() => 0),
    cachedQuery('admin:dashboard:testimonials:approved', () => prisma.customerTestimonial.count({ where: { isApproved: true } }), CacheTTL.SHORT).catch(() => 0),
    cachedQuery('admin:dashboard:recent-leads:5', () => prisma.lead.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, email: true, eventType: true, status: true, createdAt: true } }), CacheTTL.SHORT).catch(() => []),
    cachedQuery('admin:dashboard:upcoming-bookings:5', () => prisma.booking.findMany({ where: { eventDate: { gte: now }, status: 'CONFIRMED' }, take: 5, orderBy: { eventDate: 'asc' }, select: { id: true, clientName: true, eventDate: true, eventType: true } }), CacheTTL.SHORT).catch(() => []),
    cachedQuery('admin:dashboard:inventory:group-status', () => prisma.inventoryItem.groupBy({ by: ['status'], _count: true }), CacheTTL.SHORT).catch(() => []),
    cachedQuery('admin:dashboard:testimonials:avg-rating', () => prisma.customerTestimonial.aggregate({ where: { isApproved: true }, _avg: { rating: true } }), CacheTTL.SHORT).catch(() => ({ _avg: { rating: null } })),
    cachedQuery('admin:dashboard:leads:won', () => prisma.lead.count({ where: { status: 'WON' } }), CacheTTL.SHORT).catch(() => 0),
    cachedQuery(`admin:dashboard:leads:series:${seriesStart.toISOString().slice(0, 10)}`, () => prisma.lead.findMany({ where: { createdAt: { gte: seriesStart } }, select: { createdAt: true, status: true } }), CacheTTL.SHORT).catch(() => []),
    cachedQuery(`admin:dashboard:bookings:series:${seriesStart.toISOString().slice(0, 10)}`, () => prisma.booking.findMany({ where: { eventDate: { gte: seriesStart } }, select: { eventDate: true, status: true, total: true } }), CacheTTL.SHORT).catch(() => []),
    cachedQuery(`admin:dashboard:post-event:pending:${dayKey}`, () => prisma.booking.count({ where: { status: 'COMPLETED', eventDate: { lte: twoDaysAgo }, postEventEmailSent: false, clientEmail: { not: { contains: '@leads.orbitaevents.local' } } } }), CacheTTL.SHORT).catch(() => 0),
    cachedQuery('admin:dashboard:cron:settings', () => prisma.setting.findMany({ where: { key: { in: ['emails.cron.lastRun', 'emails.cron.lastStatus', 'emails.cron.lastSummary', 'emails.cron.lastMessage', 'automation.commercial.lastRun', 'automation.commercial.lastStatus'] } } }), CacheTTL.SHORT).catch(() => []),
    prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
    cachedQuery('admin:dashboard:timeline:leads', () => prisma.lead.findMany({ take: 6, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, createdAt: true, status: true } }), CacheTTL.SHORT).catch(() => []),
    cachedQuery('admin:dashboard:timeline:bookings', () => prisma.booking.findMany({ take: 6, orderBy: { createdAt: 'desc' }, select: { id: true, clientName: true, reference: true, createdAt: true, status: true } }), CacheTTL.SHORT).catch(() => []),
    cachedQuery('admin:dashboard:timeline:activity', () => prisma.customerActivity.findMany({ take: 6, orderBy: { createdAt: 'desc' }, select: { id: true, action: true, createdAt: true, customer: { select: { name: true } } } }), CacheTTL.SHORT).catch(() => []),
    cachedQuery('admin:dashboard:timeline:admin-logs', () => prisma.adminLog.findMany({ take: 6, orderBy: { createdAt: 'desc' }, select: { id: true, action: true, entity: true, createdAt: true } }), CacheTTL.SHORT).catch(() => []),
    cachedQuery('admin:dashboard:tasks:upcoming', () => prisma.task.findMany({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }, take: 6, orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }], select: { id: true, title: true, dueDate: true, status: true, lead: { select: { id: true, name: true } } } }), CacheTTL.SHORT).catch(() => []),
    cachedQuery(`admin:dashboard:leads:stale:${dayKey}`, () => prisma.lead.count({ where: { status: { in: ['NEW', 'CONTACTED'] }, createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } }), CacheTTL.SHORT).catch(() => 0),
    cachedQuery('admin:dashboard:leads:hot', () => prisma.lead.count({ where: { status: { in: ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] }, priority: { in: ['HIGH', 'URGENT'] } } }), CacheTTL.SHORT).catch(() => 0),
    cachedQuery('admin:dashboard:leads:quotes-in-flight', () => prisma.lead.count({ where: { status: { in: ['QUOTE_SENT', 'NEGOTIATING'] } } }), CacheTTL.SHORT).catch(() => 0),
    cachedQuery(`admin:dashboard:checklist:done:${dayKey}`, () => prisma.task.count({ where: { createdBy: 'system:daily-checklist', createdAt: { gte: todayStart, lte: todayEnd }, status: 'DONE' } }), CacheTTL.SHORT).catch(() => 0),
    cachedQuery(`admin:dashboard:checklist:pending:${dayKey}`, () => prisma.task.count({ where: { createdBy: 'system:daily-checklist', createdAt: { gte: todayStart, lte: todayEnd }, status: { in: ['OPEN', 'IN_PROGRESS'] } } }), CacheTTL.SHORT).catch(() => 0),
    cachedQuery('admin:dashboard:command:leads', () => prisma.lead.findMany({ where: { status: { in: ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] } }, orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }], take: 6, select: { id: true, name: true, status: true, priority: true, createdAt: true } }), CacheTTL.SHORT).catch(() => []),
    cachedQuery('admin:dashboard:command:bookings', () => prisma.booking.findMany({ where: { status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] } }, orderBy: [{ eventDate: 'asc' }, { createdAt: 'desc' }], take: 6, select: { id: true, reference: true, clientName: true, status: true, eventDate: true } }), CacheTTL.SHORT).catch(() => []),
    cachedQuery('admin:dashboard:margin:avg', () => prisma.booking.findMany({
      where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
      select: { total: true, travelCost: true, pack: { select: { price: true } }, extras: { select: { price: true, quantity: true } } },
    }), CacheTTL.SHORT).catch(() => []),
  ]);

  // ─── Processat ───────────────────────────────────────────────────────────

  const inventoryAvailable = inventoryStats.find((s: { status: string; _count: number }) => s.status === 'AVAILABLE')?._count || 0;
  const inventoryInUse = inventoryStats.find((s: { status: string; _count: number }) => s.status === 'IN_USE')?._count || 0;
  const inventoryTotal = inventoryStats.reduce((acc: number, s: { _count: number }) => acc + s._count, 0);
  const inventoryMaintenance = inventoryStats.find((s: { status: string; _count: number }) => s.status === 'MAINTENANCE')?._count || 0;
  const inventoryBroken = inventoryStats.find((s: { status: string; _count: number }) => s.status === 'BROKEN')?._count || 0;

  const rating = avgRating._avg.rating ? avgRating._avg.rating.toFixed(1) : '5.0';
  const conversionRate = leadsCount > 0 ? Math.round((wonLeads / leadsCount) * 100) : 0;

  // Marge mitjà de reserves confirmades/completades
  const marginPcts = (marginBookings as Array<{ total: number; travelCost: number | null; pack: { price: number }; extras: Array<{ price: number; quantity: number }> }>)
    .filter((b) => b.total > 0)
    .map((b) => {
      const extrasTotal = b.extras.reduce((sum, e) => sum + e.price * e.quantity, 0);
      return computeSimpleMarginPct(
        {
          total: b.total,
          packPrice: b.pack.price,
          extrasTotal,
          extraHours: 0,
          extraHourPrice: 0,
          distanceKm: 0,
          travelCost: b.travelCost ?? 0,
        },
        profitConfig,
      );
    });
  const avgMarginPct = marginPcts.length > 0
    ? Math.round(marginPcts.reduce((a, b) => a + b, 0) / marginPcts.length)
    : 0;

  const ga4Sessions = ga4?.totals.sessions || 0;
  const ga4Users = ga4?.totals.activeUsers || 0;
  const ga4PageViews = ga4?.totals.pageViews || 0;
  const ga4AvgSessionMin = ga4?.totals.avgSessionDuration ? Math.max(1, Math.round(ga4.totals.avgSessionDuration / 60)) : 0;

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
    ga4ByDate.set(`${yyyy}-${mm}-${dd}`, { sessions: row.sessions, users: row.activeUsers });
  });
  const ga4SessionsSeries = buckets.map((d) => ga4ByDate.get(toDateKey(d))?.sessions || 0);
  const ga4UsersSeries = buckets.map((d) => ga4ByDate.get(toDateKey(d))?.users || 0);

  const cronMap = (cronSettings || []).reduce((acc: Record<string, string>, s: { key: string; value: string }) => {
    acc[s.key] = s.value;
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
    ...recentLeadsTimeline.map((lead) => ({ id: `lead-${lead.id}`, icon: '👥', text: `Nou lead: ${lead.name}`, time: timeAgo(new Date(lead.createdAt)), ts: new Date(lead.createdAt).getTime(), href: `/admin/leads/${lead.id}` })),
    ...recentBookingsTimeline.map((booking) => ({ id: `booking-${booking.id}`, icon: '📋', text: `Reserva ${booking.reference} · ${booking.clientName}`, time: timeAgo(new Date(booking.createdAt)), ts: new Date(booking.createdAt).getTime(), href: `/admin/bookings/${booking.id}` })),
    ...recentCustomerActivity.map((activity) => ({ id: `activity-${activity.id}`, icon: '⭐', text: `${activity.action} · ${activity.customer?.name || 'Client'}`, time: timeAgo(new Date(activity.createdAt)), ts: new Date(activity.createdAt).getTime(), href: '/admin/emails' })),
    ...recentAdminLogs.map((logItem) => ({ id: `adminlog-${logItem.id}`, icon: '🛠️', text: `${logItem.action} · ${logItem.entity}`, time: timeAgo(new Date(logItem.createdAt)), ts: new Date(logItem.createdAt).getTime(), href: '/admin/settings' })),
  ].sort((a, b) => b.ts - a.ts).slice(0, 10);

  const alerts: DashboardAlert[] = [
    ...(!ga4Status.ready ? [{ type: 'error', title: 'GA4 pendent', description: ga4Status.reason || 'Configura GA4 al panell d\'analítica', href: '/admin/analytics', action: 'Configurar' }] : []),
    ...(ga4Status.ready && !ga4 ? [{ type: 'warning', title: 'GA4 sense dades', description: 'No podem carregar mètriques. Revisa permisos o quota.', href: '/admin/analytics', action: 'Revisar' }] : []),
    ...(ga4?.realtimeFallback ? [{ type: 'warning', title: 'Realtime parcial', description: 'Algunes mètriques realtime no estan disponibles.', href: '/admin/analytics', action: 'Veure' }] : []),
    ...(!imapConfigured ? [{ type: 'info', title: 'IMAP no configurat', description: 'L\'inbox encara no està connectat.', href: '/admin/inbox/settings', action: 'Configurar' }] : []),
    ...(postEventPending > 0 ? [{ type: 'warning', title: 'Emails post-event pendents', description: `${postEventPending} esdeveniments sense correu enviat.`, href: '/admin/emails', action: 'Gestionar' }] : []),
    ...((inventoryMaintenance + inventoryBroken) > 0 ? [{ type: 'warning', title: 'Equip requereix atenció', description: `${inventoryMaintenance} en manteniment${inventoryBroken > 0 ? `, ${inventoryBroken} avariat` : ''}.`, href: '/admin/inventory', action: 'Revisar' }] : []),
  ];

  const activitiesRaw = [
    ...(recentLeads.length > 0 ? [{ icon: '👥', text: `Nou lead: ${recentLeads[0]?.name || 'Desconegut'}`, time: recentLeads[0]?.createdAt ? timeAgo(new Date(recentLeads[0].createdAt)) : '' }] : []),
    ...(testimonialsPending > 0 ? [{ icon: '⭐', text: `${testimonialsPending} testimoni${testimonialsPending > 1 ? 's' : ''} pendent${testimonialsPending > 1 ? 's' : ''} d'aprovar`, time: '' }] : []),
  ];
  const activities = activitiesRaw.length > 0 ? activitiesRaw : [{ icon: '✅', text: 'Tot al dia, sense activitat pendent', time: 'Ara' }];

  // Financial forecasts (en paral·lel, resilients)
  const [cashFlowResult, pipelineResult, pendingBookingsResult] = await Promise.all([
    cachedQuery('admin:dashboard:cashflow', () => buildCashFlowForecast(2), CacheTTL.SHORT).catch(() => []),
    cachedQuery('admin:dashboard:pipeline', () => buildPipelineForecast(2), CacheTTL.SHORT).catch(() => []),
    cachedQuery(`admin:dashboard:pending-payments:${dayKey}`, () => prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PREPARING'] },
        OR: [{ depositPaid: false }, { remainingPaid: false }],
      },
      select: { total: true, depositAmount: true, depositPaid: true, remainingPaid: true },
    }), CacheTTL.SHORT).catch(() => []),
  ]);

  const cashFlowNet30 = cashFlowResult.length > 0 ? cashFlowResult[0].netFlow : 0;
  const pipelineWeighted30 = pipelineResult.length > 0 ? pipelineResult[0].combined : 0;
  let pendingPayments = 0;
  for (const b of pendingBookingsResult) {
    const deposit = Number(b.depositAmount) || 0;
    const total = Number(b.total) || 0;
    if (!b.depositPaid && deposit > 0) pendingPayments += deposit;
    if (!b.remainingPaid) pendingPayments += Math.max(0, total - deposit);
  }

  // Pròxim bolo: la reserva confirmada més propera
  const [nextEventRaw, monthlyRevenue, revenueTargetSetting] = await Promise.all([
    cachedQuery(`admin:dashboard:next-event:${dayKey}`, () => prisma.booking.findFirst({
      where: { eventDate: { gte: now }, status: { in: ['CONFIRMED', 'PREPARING'] } },
      orderBy: { eventDate: 'asc' },
      select: {
        id: true, reference: true, clientName: true, eventDate: true,
        eventStartTime: true, eventLocation: true, eventVenue: true, eventType: true,
        total: true, depositPaid: true, remainingPaid: true, status: true,
        pack: { select: { translations: { where: { locale: 'ca' }, select: { name: true } } } },
      },
    }), CacheTTL.SHORT).catch(() => null),
    cachedQuery(`admin:dashboard:revenue-month:${startOfMonth.toISOString().slice(0, 10)}`, () => prisma.booking.aggregate({
      where: { status: { in: ['CONFIRMED', 'COMPLETED'] }, eventDate: { gte: startOfMonth } },
      _sum: { total: true },
    }), CacheTTL.SHORT).catch(() => ({ _sum: { total: null } })),
    cachedQuery('admin:dashboard:revenue-target', () => prisma.setting.findUnique({
      where: { key: 'dashboard.revenueTarget' },
    }), CacheTTL.MEDIUM).catch(() => null),
  ]);

  let nextEvent: DashboardData['nextEvent'] = null;
  if (nextEventRaw) {
    const diffMs = new Date(nextEventRaw.eventDate).getTime() - now.getTime();
    const daysUntil = Math.max(0, Math.ceil(diffMs / 86400000));
    // Checklist state for next event
    const checklistItems = await cachedQuery(
      `admin:dashboard:checklist-setting:${nextEventRaw.id}`,
      () => getBookingChecklist(nextEventRaw.id),
      CacheTTL.SHORT
    ).catch(() => DEFAULT_BOOKING_CHECKLIST_ITEMS);
    const checklistTotal = checklistItems.length;
    const checklistDone = checklistItems.filter((item) => item.checked).length;
    nextEvent = {
      id: nextEventRaw.id,
      reference: nextEventRaw.reference,
      clientName: nextEventRaw.clientName,
      eventDate: nextEventRaw.eventDate,
      eventStartTime: nextEventRaw.eventStartTime,
      eventLocation: nextEventRaw.eventLocation,
      eventVenue: nextEventRaw.eventVenue,
      eventType: nextEventRaw.eventType,
      total: nextEventRaw.total,
      depositPaid: nextEventRaw.depositPaid,
      remainingPaid: nextEventRaw.remainingPaid,
      status: nextEventRaw.status,
      packName: nextEventRaw.pack?.translations?.[0]?.name || '—',
      daysUntil,
      checklistDone,
      checklistTotal,
    };
  }

  const revenueThisMonth = Number(monthlyRevenue?._sum?.total) || 0;
  const revenueTargetRaw = Number(revenueTargetSetting?.value);
  const revenueTarget = Number.isFinite(revenueTargetRaw) && revenueTargetRaw > 0 ? revenueTargetRaw : 3000;
  const revenueMonthPct = revenueTarget > 0 ? Math.min(100, Math.round((revenueThisMonth / revenueTarget) * 100)) : 0;

  // ─── Monthly revenue bars (12 months current + previous year) ──────
  const monthLabels = ['Gen', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Des'];
  const [monthlyRevenueData, eventTypeData] = await Promise.all([
    cachedQuery('admin:dashboard:monthly-revenue-12', async () => {
      const currentYear = now.getFullYear();
      // Totes les 24 queries en paral·lel (12 mesos × 2 anys)
      const allQueries = Array.from({ length: 12 }, (_, m) => {
        const curStart = new Date(currentYear, m, 1);
        const curEnd = new Date(currentYear, m + 1, 0, 23, 59, 59, 999);
        const prevStart = new Date(currentYear - 1, m, 1);
        const prevEnd = new Date(currentYear - 1, m + 1, 0, 23, 59, 59, 999);
        return Promise.all([
          prisma.booking.aggregate({ where: { status: { in: ['CONFIRMED', 'COMPLETED'] }, eventDate: { gte: curStart, lte: curEnd } }, _sum: { total: true } }),
          prisma.booking.aggregate({ where: { status: { in: ['CONFIRMED', 'COMPLETED'] }, eventDate: { gte: prevStart, lte: prevEnd } }, _sum: { total: true } }),
        ]);
      });
      const results = await Promise.all(allQueries);
      return results.map(([cur, prev], m) => ({
        label: monthLabels[m],
        current: Number(cur._sum.total) || 0,
        previous: Number(prev._sum.total) || 0,
      }));
    }, CacheTTL.MEDIUM).catch(() => monthLabels.map((l) => ({ label: l, current: 0, previous: 0 }))),
    cachedQuery('admin:dashboard:event-type-dist', async () => {
      const groups = await prisma.booking.groupBy({
        by: ['eventType'],
        where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
        _count: true,
      });
      const colorMap: Record<string, string> = {
        BODA: '#f472b6', FIESTA: '#fbbf24', EMPRESA: '#60a5fa', DISCOTECA_MOVIL: '#a78bfa',
      };
      return groups.map((g) => ({
        label: g.eventType || 'Altres',
        value: g._count,
        color: (g.eventType && colorMap[g.eventType]) || '#34d399',
      }));
    }, CacheTTL.MEDIUM).catch(() => []),
  ]);

  // ─── Smart alerts (PAS 4: avisos intel·ligents) ────────────────────
  // Checklist low + event imminent
  if (nextEvent && nextEvent.daysUntil <= 1 && nextEvent.checklistTotal > 0) {
    const checklistPct = Math.round((nextEvent.checklistDone / nextEvent.checklistTotal) * 100);
    if (checklistPct < 50) {
      alerts.push({
        type: 'error',
        title: 'Checklist massa baix!',
        description: `El bolo de ${nextEvent.clientName} és ${nextEvent.daysUntil === 0 ? 'AVUI' : 'DEMÀ'} i la checklist està al ${checklistPct}%.`,
        href: `/admin/bookings/${nextEvent.id}`,
        action: 'Completar checklist',
      });
    }
  }
  // Unpaid + event in 3 days
  if (nextEvent && nextEvent.daysUntil <= 3 && !nextEvent.depositPaid) {
    alerts.push({
      type: 'warning',
      title: 'Pagament pendent imminent',
      description: `${nextEvent.clientName} no ha pagat la paga i senyal i el bolo és ${nextEvent.daysUntil === 0 ? 'avui' : `d'aquí ${nextEvent.daysUntil} dies`}.`,
      href: `/admin/bookings/${nextEvent.id}`,
      action: 'Gestionar pagament',
    });
  }
  // Hot leads without response >48h
  if (hotLeadsCount > 0) {
    const hotStale = await cachedQuery(`admin:dashboard:hot-stale:${dayKey}`, () => prisma.lead.count({
      where: {
        status: { in: ['NEW', 'CONTACTED'] },
        priority: { in: ['HIGH', 'URGENT'] },
        createdAt: { lt: new Date(now.getTime() - 48 * 60 * 60 * 1000) },
      },
    }), CacheTTL.SHORT).catch(() => 0);
    if (hotStale > 0) {
      alerts.push({
        type: 'error',
        title: 'Lead HOT sense resposta!',
        description: `${hotStale} lead${hotStale > 1 ? 's' : ''} de prioritat alta/urgent porta${hotStale > 1 ? 'en' : ''} més de 48h sense avançar.`,
        href: '/admin/leads',
        action: 'Respondre ara',
      });
    }
  }

  return {
    leadsCount, leadsThisMonth, bookingsConfirmed, bookingsThisMonth,
    customersCount, testimonialsPending, testimonialsApproved,
    wonLeads, conversionRate, rating,
    staleLeadsCount, hotLeadsCount, quotesInFlightCount, postEventPending,
    checklistTodayDoneCount, checklistTodayPendingCount,
    inventoryAvailable, inventoryInUse, inventoryTotal, inventoryMaintenance, inventoryBroken,
    ga4Sessions, ga4Users, ga4PageViews, ga4AvgSessionMin,
    ga4SessionsSeries, ga4UsersSeries,
    ga4Available: Boolean(ga4),
    ga4RealtimeFallback: Boolean(ga4?.realtimeFallback),
    avgMarginPct,
    cashFlowNet30,
    pipelineWeighted30,
    pendingPayments,
    nextEvent,
    revenueThisMonth,
    revenueTarget,
    revenueMonthPct,
    monthlyRevenue: monthlyRevenueData,
    eventTypeDistribution: eventTypeData,
    leadsSeries, leadsWonSeries, bookingsSeries, revenueSeries, revenueTotal30,
    recentLeads, upcomingBookings, upcomingTasks,
    commandLeads, commandBookings, recentAdminLogs,
    timeline, alerts, activities, healthItems, cronMap,
  };
}

