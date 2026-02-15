// app/admin/analytics/page.tsx
import { log } from '@/lib/logger';
// Pàgina d'analytics i estadístiques
import { prisma } from '@/lib/prisma';
import { getUmamiReport } from '@/lib/analytics/umami';
import { getGa4Report, getGa4ConfigStatus } from '@/lib/analytics/ga4';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Analytics | Òrbita Admin',
};

async function getAnalyticsData() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastYear = new Date(now.getFullYear() - 1, 0, 1);
  const endLastYear = new Date(now.getFullYear() - 1, 11, 31);

  try {
    const [
      // Leads
      totalLeads,
      leadsThisYear,
      leadsThisMonth,
      leadsBySource,
      leadsByEventType,
      leadConversionByMonth,

      // Bookings
      totalBookings,
      bookingsThisYear,
      bookingsByEventType,
      bookingsByPack,

      // Revenue
      revenueThisYear,
      revenueLastYear,
      revenueByMonth,
      avgBookingValue,

      // Surveys
      avgNps,
      avgRating,
    ] = await Promise.all([
      // Leads totals
      prisma.lead.count(),
      prisma.lead.count({ where: { createdAt: { gte: startOfYear } } }),
      prisma.lead.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.lead.groupBy({ by: ['source'], _count: true }),
      prisma.lead.groupBy({ by: ['eventType'], _count: true }),
      prisma.lead.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startOfYear } },
        _count: true,
      }),

      // Bookings totals
      prisma.booking.count(),
      prisma.booking.count({ where: { createdAt: { gte: startOfYear } } }),
      prisma.booking.groupBy({ by: ['eventType'], _count: true }),
      prisma.booking.groupBy({ by: ['packId'], _count: true }),

      // Revenue
      prisma.booking.aggregate({
        where: {
          status: { in: ['COMPLETED', 'CONFIRMED'] },
          eventDate: { gte: startOfYear },
        },
        _sum: { total: true },
      }),
      prisma.booking.aggregate({
        where: {
          status: { in: ['COMPLETED', 'CONFIRMED'] },
          eventDate: { gte: lastYear, lt: endLastYear },
        },
        _sum: { total: true },
      }),
      prisma.booking.groupBy({
        by: ['eventDate'],
        where: {
          status: { in: ['COMPLETED', 'CONFIRMED'] },
          eventDate: { gte: startOfYear },
        },
        _sum: { total: true },
      }),
      prisma.booking.aggregate({
        where: { status: { in: ['COMPLETED', 'CONFIRMED'] } },
        _avg: { total: true },
      }),

      // Surveys
      prisma.clientSurvey.aggregate({ _avg: { npsScore: true } }),
      prisma.clientSurvey.aggregate({ _avg: { overallRating: true } }),
    ]);

    return {
      leads: {
        total: totalLeads,
        thisYear: leadsThisYear,
        thisMonth: leadsThisMonth,
        bySource: leadsBySource,
        byEventType: leadsByEventType,
        conversionByMonth: leadConversionByMonth,
      },
      bookings: {
        total: totalBookings,
        thisYear: bookingsThisYear,
        byEventType: bookingsByEventType,
        byPack: bookingsByPack,
      },
      revenue: {
        thisYear: revenueThisYear._sum.total || 0,
        lastYear: revenueLastYear._sum.total || 0,
        byMonth: revenueByMonth,
        avgBooking: avgBookingValue._avg.total || 0,
      },
      satisfaction: {
        nps: avgNps._avg.npsScore || 0,
        rating: avgRating._avg.overallRating || 0,
      },
    };
  } catch (error) {
    log.error('Error obtenint analytics:', error);
    return {
      leads: { total: 0, thisYear: 0, thisMonth: 0, bySource: [], byEventType: [], conversionByMonth: [] },
      bookings: { total: 0, thisYear: 0, byEventType: [], byPack: [] },
      revenue: { thisYear: 0, lastYear: 0, byMonth: [], avgBooking: 0 },
      satisfaction: { nps: 0, rating: 0 },
    };
  }
}

async function getOperationalKpis() {
  const now = new Date();
  const last7Days = new Date(now);
  last7Days.setDate(last7Days.getDate() - 6);

  try {
    const [leads7d, leadsWithQuote, totalLeads, proposalsAccepted, proposalsSentOrAccepted, contactedLeads] =
      await Promise.all([
        prisma.lead.count({ where: { createdAt: { gte: last7Days } } }),
        prisma.lead.count({ where: { status: { in: ['QUOTE_SENT', 'NEGOTIATING', 'WON'] } } }),
        prisma.lead.count(),
        prisma.proposal.count({ where: { status: 'ACCEPTED' } }),
        prisma.proposal.count({ where: { status: { in: ['SENT', 'ACCEPTED'] } } }),
        prisma.lead.findMany({
          where: { contactedAt: { not: null } },
          select: { createdAt: true, contactedAt: true },
          take: 2000,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    const conversionToQuotePct = totalLeads > 0 ? (leadsWithQuote / totalLeads) * 100 : 0;
    const proposalsAcceptedPct =
      proposalsSentOrAccepted > 0 ? (proposalsAccepted / proposalsSentOrAccepted) * 100 : 0;
    const avgFirstContactHours =
      contactedLeads.length > 0
        ? contactedLeads.reduce((sum, row) => {
            if (!row.contactedAt) return sum;
            return sum + (row.contactedAt.getTime() - row.createdAt.getTime()) / (1000 * 60 * 60);
          }, 0) / contactedLeads.length
        : 0;

    return {
      leads7d,
      conversionToQuotePct,
      proposalsAcceptedPct,
      avgFirstContactHours,
      last7Days,
    };
  } catch (error) {
    log.error('Error obtenint KPI operatius:', error);
    return {
      leads7d: 0,
      conversionToQuotePct: 0,
      proposalsAcceptedPct: 0,
      avgFirstContactHours: 0,
      last7Days,
    };
  }
}

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: 'Web',
  CONFIGURATOR: 'Configurador',
  PHONE: 'Telèfon',
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
  WALLAPOP: 'Wallapop',
  REFERRAL: 'Referit',
  GOOGLE: 'Google',
  OTHER: 'Altres',
};

const EVENT_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  WEDDING: { label: 'Bodes', icon: '💍' },
  BIRTHDAY: { label: 'Aniversaris', icon: '🎂' },
  CORPORATE: { label: 'Corporatius', icon: '💼' },
  COMMUNION: { label: 'Comunions', icon: '⛪' },
  PRIVATE_PARTY: { label: 'Festes privades', icon: '🎉' },
  OTHER: { label: 'Altres', icon: '📅' },
};

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();
  const ops = await getOperationalKpis();
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID || 'No configurat';
  const umamiDashboardUrl =
    process.env.NEXT_PUBLIC_UMAMI_DASHBOARD_URL || 'https://analytics.orbitaevents.com';
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? '';
  const umamiApiKey = process.env.UMAMI_API_KEY || '';
  const umamiBaseUrl = process.env.UMAMI_BASE_URL || 'https://cloud.umami.is';
  const umamiApiReady = Boolean(umamiApiKey) && Boolean(umamiWebsiteId);
  const umamiMissingVars = [
    !umamiWebsiteId ? 'NEXT_PUBLIC_UMAMI_WEBSITE_ID' : null,
    !umamiApiKey ? 'UMAMI_API_KEY' : null,
  ].filter(Boolean) as string[];
  const ga4PropertyId = process.env.GA4_PROPERTY_ID || '';
  const ga4Status = getGa4ConfigStatus();
  const yearGrowth = data.revenue.lastYear > 0
    ? ((data.revenue.thisYear - data.revenue.lastYear) / data.revenue.lastYear * 100).toFixed(1)
    : '100.0';
  const gtmReady = gtmId !== 'No configurat';
  const umamiReady = Boolean(umamiWebsiteId);
  const umami = umamiApiReady ? await getUmamiReport(umamiWebsiteId) : null;
  const ga4Ready = ga4Status.ready;
  let ga4 = null;
  let ga4Error: string | null = null;
  if (ga4Ready) {
    try {
      ga4 = await getGa4Report();
    } catch (error) {
      ga4Error = error instanceof Error ? error.message : 'GA4 error desconegut';
      log.error('GA4 report failed', error);
    }
  }
  const avgVisitMinutes = umami?.totals.totalTime
    ? Math.max(1, Math.round(umami.totals.totalTime / 60 / Math.max(umami.totals.visits, 1)))
    : 0;
  const avgSessionMinutes = ga4?.totals.avgSessionDuration
    ? Math.max(1, Math.round(ga4.totals.avgSessionDuration / 60))
    : 0;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 text-white">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -left-16 -bottom-24 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Òrbita Analytics</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Panell de rendiment</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Totes les mètriques essencials en un sol lloc: vendes, leads, qualitat i creixement.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-slate-600/50 bg-slate-700/50 px-3 py-1 text-xs">
              Any {new Date().getFullYear()}
            </span>
            <span className="rounded-full border border-slate-600/50 bg-slate-700/50 px-3 py-1 text-xs">
              {Number(yearGrowth) >= 0 ? '📈' : '📉'} {yearGrowth}% YoY
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Operativa comercial</p>
            <h2 className="mt-1 text-xl font-semibold">KPI accionables</h2>
          </div>
          <Link
            href={`/admin/leads?from=${ops.last7Days.toISOString().slice(0, 10)}&page=1`}
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20"
          >
            Veure leads d&apos;aquesta setmana
          </Link>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-600/50 bg-slate-700/30 p-4">
            <p className="text-xs uppercase text-slate-400">Leads 7 dies</p>
            <p className="mt-2 text-3xl font-semibold">{ops.leads7d}</p>
          </div>
          <div className="rounded-xl border border-slate-600/50 bg-slate-700/30 p-4">
            <p className="text-xs uppercase text-slate-400">% leads a pressupost</p>
            <p className="mt-2 text-3xl font-semibold">{ops.conversionToQuotePct.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl border border-slate-600/50 bg-slate-700/30 p-4">
            <p className="text-xs uppercase text-slate-400">% pressupostos acceptats</p>
            <p className="mt-2 text-3xl font-semibold">{ops.proposalsAcceptedPct.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl border border-slate-600/50 bg-slate-700/30 p-4">
            <p className="text-xs uppercase text-slate-400">1r contacte mitjà</p>
            <p className="mt-2 text-3xl font-semibold">{Math.max(0, Math.round(ops.avgFirstContactHours))}h</p>
          </div>
        </div>
      </section>

      {/* GA4 */}
      <section className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 text-white">
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">GA4</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Panell de control</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Dades de trànsit, pàgines i esdeveniments amb la GA4 Data API.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-slate-600/50 bg-slate-700/50 px-3 py-1 text-xs">
              ID propietat {ga4PropertyId || '—'}
            </span>
            <span
              className={`rounded-full border border-slate-600/50 px-3 py-1 text-xs ${
                ga4Ready ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {ga4Ready ? '● Actiu' : '● Pendent'}
            </span>
          </div>
        </div>

        {!ga4Ready && (
          <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            Configuració incompleta. {ga4Status.reason || 'Revisa les variables de GA4 a Railway.'}
          </div>
        )}

        {ga4Ready && ga4Error && (
          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            Error GA4: {ga4Error}
          </div>
        )}

        {ga4Ready && !ga4 && !ga4Error && (
          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            GA4 actiu però sense dades. Revisa permisos del compte de servei o la quota de l&apos;API.
          </div>
        )}

        {ga4 && (
          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-600/50 bg-slate-700/30 p-4">
              <p className="text-xs uppercase text-slate-400">Usuaris actius</p>
              <p className="mt-2 text-3xl font-semibold text-white">{ga4.totals.activeUsers}</p>
            </div>
            <div className="rounded-xl border border-slate-600/50 bg-slate-700/30 p-4">
              <p className="text-xs uppercase text-slate-400">Sessions</p>
              <p className="mt-2 text-3xl font-semibold text-white">{ga4.totals.sessions}</p>
            </div>
            <div className="rounded-xl border border-slate-600/50 bg-slate-700/30 p-4">
              <p className="text-xs uppercase text-slate-400">Pageviews</p>
              <p className="mt-2 text-3xl font-semibold text-white">{ga4.totals.pageViews}</p>
            </div>
            <div className="rounded-xl border border-slate-600/50 bg-slate-700/30 p-4">
              <p className="text-xs uppercase text-slate-400">Esdeveniments</p>
              <p className="mt-2 text-3xl font-semibold text-white">{ga4.totals.eventCount}</p>
            </div>
            <div className="rounded-xl border border-slate-600/50 bg-slate-700/30 p-4">
              <p className="text-xs uppercase text-slate-400">Temps mitjà (min)</p>
              <p className="mt-2 text-3xl font-semibold text-white">{avgSessionMinutes}</p>
            </div>
          </div>
        )}

        {ga4 && (
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-600/50 bg-slate-700/30">
              <div className="border-b border-slate-600/50 px-4 py-3 text-sm font-semibold text-slate-200">Pàgines principals</div>
              <div className="space-y-2 p-4 text-sm text-slate-300">
                {ga4.pages.map((row) => (
                  <div key={row.dimension} className="flex items-center justify-between">
                    <span className="truncate">{row.dimension}</span>
                    <span className="text-slate-400">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-600/50 bg-slate-700/30">
              <div className="border-b border-slate-600/50 px-4 py-3 text-sm font-semibold text-slate-200">Fonts</div>
              <div className="space-y-2 p-4 text-sm text-slate-300">
                {ga4.sources.map((row) => (
                  <div key={row.dimension} className="flex items-center justify-between">
                    <span className="truncate">{row.dimension}</span>
                    <span className="text-slate-400">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-600/50 bg-slate-700/30">
              <div className="border-b border-slate-600/50 px-4 py-3 text-sm font-semibold text-slate-200">
                Temps real (top)
              </div>
              <div className="space-y-2 p-4 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Actius ara</span>
                  <span className="text-cyan-300">{ga4.realtime.activeUsers}</span>
                </div>
                {ga4.realtime.pages.map((row) => (
                  <div key={row.dimension} className="flex items-center justify-between">
                    <span className="truncate">{row.dimension}</span>
                    <span className="text-slate-400">{row.value}</span>
                  </div>
                ))}
                {ga4.realtimeFallback && (
                  <p className="pt-2 text-xs text-amber-300">
                    Temps real parcial: només usuaris actius disponibles.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {ga4 && (
          <div className="mt-4 rounded-2xl border border-slate-600/50 bg-slate-700/30">
            <div className="border-b border-slate-600/50 px-4 py-3 text-sm font-semibold text-slate-200">
              Paraules de cerca (GA4)
            </div>
            <div className="space-y-2 p-4 text-sm text-slate-300">
              {ga4.searchTerms.length === 0 && (
                <p className="text-slate-400">Sense dades de cerca interna.</p>
              )}
              {ga4.searchTerms.map((row) => (
                <div key={`${row.dimension}-${row.value}`} className="flex items-center justify-between">
                  <span className="truncate">{row.dimension || '—'}</span>
                  <span className="text-slate-400">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-600/50 px-4 py-2 text-xs text-slate-500">
              GA4 mostra cerques internes (si existeixen). Per paraules SEO cal Search Console.
            </div>
          </div>
        )}
      </section>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 backdrop-blur-sm p-5">
          <div className="flex items-center justify-between text-xs font-medium uppercase text-slate-400">
            <span>Facturació any</span>
            <span className="text-cyan-400">Ingressos</span>
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-100">
            {data.revenue.thisYear.toLocaleString('ca-ES')}€
          </p>
          <p className={`mt-2 text-xs ${Number(yearGrowth) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {Number(yearGrowth) >= 0 ? '↑' : '↓'} {yearGrowth}% vs any anterior
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 backdrop-blur-sm p-5">
          <div className="flex items-center justify-between text-xs font-medium uppercase text-slate-400">
            <span>Reserves any</span>
            <span className="text-emerald-400">Reserves</span>
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-100">{data.bookings.thisYear}</p>
          <p className="mt-2 text-xs text-slate-500">{data.bookings.total} totals</p>
        </div>
        <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-sm p-5">
          <div className="flex items-center justify-between text-xs font-medium uppercase text-slate-400">
            <span>Tiquet mitjà</span>
            <span className="text-purple-400">AVG</span>
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-100">
            {data.revenue.avgBooking.toLocaleString('ca-ES', { maximumFractionDigits: 0 })}€
          </p>
        </div>
        <div className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-rose-600/5 backdrop-blur-sm p-5">
          <div className="flex items-center justify-between text-xs font-medium uppercase text-slate-400">
            <span>NPS Score</span>
            <span className="text-rose-400">Qualitat</span>
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-100">
            {data.satisfaction.nps.toFixed(1)}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            ⭐ {data.satisfaction.rating.toFixed(1)} valoració
          </p>
        </div>
      </section>

      {/* Leads Section */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Leads per Font */}
        <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm">
          <div className="border-b border-slate-700/50 bg-slate-700/30 p-4">
            <h3 className="font-semibold text-slate-100">Leads per origen</h3>
            <p className="mt-1 text-xs text-slate-400">{data.leads.thisYear} leads aquest any</p>
          </div>
          <div className="p-4 space-y-3">
            {data.leads.bySource.map((source) => {
              const percentage = data.leads.total > 0
                ? (source._count / data.leads.total * 100).toFixed(1)
                : '0';
              return (
                <div key={source.source}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-200">
                      {SOURCE_LABELS[source.source] || source.source}
                    </span>
                    <span className="text-slate-400">
                      {source._count} ({percentage}%)
                    </span>
                  </div>
                  <div className="mt-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {data.leads.bySource.length === 0 && (
              <p className="text-center text-slate-500 py-4">No hi ha dades</p>
            )}
          </div>
        </div>

        {/* Conversió Leads */}
        <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm">
          <div className="border-b border-slate-700/50 bg-slate-700/30 p-4">
            <h3 className="font-semibold text-slate-100">Conversió de Leads</h3>
            <p className="mt-1 text-xs text-slate-400">Estat dels leads</p>
          </div>
          <div className="p-4 space-y-3">
            {data.leads.conversionByMonth.map((status) => {
              const percentage = data.leads.thisYear > 0
                ? (status._count / data.leads.thisYear * 100).toFixed(1)
                : 0;
              const statusLabels: Record<string, { label: string; color: string }> = {
                NEW: { label: 'Nous', color: 'bg-blue-500' },
                CONTACTED: { label: 'Contactats', color: 'bg-yellow-500' },
                QUOTE_SENT: { label: 'Pressupost', color: 'bg-purple-500' },
                NEGOTIATING: { label: 'Negociant', color: 'bg-orange-500' },
                WON: { label: 'Guanyats', color: 'bg-emerald-500' },
                LOST: { label: 'Perduts', color: 'bg-slate-500' },
              };
              const config = statusLabels[status.status] || { label: status.status, color: 'bg-slate-500' };
              return (
                <div key={status.status}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-200">{config.label}</span>
                    <span className="text-slate-400">
                      {status._count} ({percentage}%)
                    </span>
                  </div>
                  <div className="mt-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${config.color} rounded-full`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {data.leads.conversionByMonth.length === 0 && (
              <p className="text-center text-slate-500 py-4">No hi ha dades</p>
            )}
          </div>
        </div>
      </section>

      {/* Events per Tipus */}
      <section className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm">
        <div className="border-b border-slate-700/50 bg-slate-700/30 p-4">
          <h3 className="font-semibold text-slate-100">Reserves per tipus d&apos;esdeveniment</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {data.bookings.byEventType.map((type) => {
              const config = EVENT_TYPE_LABELS[type.eventType] || { label: type.eventType, icon: '📅' };
              return (
                <div
                  key={type.eventType}
                  className="rounded-xl border border-slate-600/50 bg-slate-700/30 p-4 text-center"
                >
                  <span className="text-3xl">{config.icon}</span>
                  <p className="text-2xl font-bold text-slate-100 mt-2">{type._count}</p>
                  <p className="text-xs text-slate-400">{config.label}</p>
                </div>
              );
            })}
            {data.bookings.byEventType.length === 0 && (
              <p className="col-span-full text-center text-slate-500 py-4">No hi ha dades</p>
            )}
          </div>
        </div>
      </section>

      {/* GTM Control Center */}
      <section className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm">
        <div className="border-b border-slate-700/50 bg-slate-700/30 p-4">
          <h2 className="text-lg font-semibold text-slate-100">GTM · Centre de control</h2>
          <p className="text-xs text-slate-400">Gestió d&apos;etiquetes, activadors i accessos ràpids</p>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-600/50 bg-slate-700/30 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase text-slate-400">Container ID</p>
              <p className="mt-2 text-lg font-semibold text-slate-100">{gtmId}</p>
            </div>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                gtmReady ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {gtmReady ? '● Actiu' : '● Desactivat'}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href="https://tagmanager.google.com/"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-600/50 bg-slate-700/30 p-4 text-sm text-slate-200 hover:border-cyan-500/30 hover:text-cyan-300 transition"
            >
              Obrir Google Tag Manager
            </a>
            <a
              href="https://tagassistant.google.com/"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-600/50 bg-slate-700/30 p-4 text-sm text-slate-200 hover:border-cyan-500/30 hover:text-cyan-300 transition"
            >
              Tag Assistant (Preview)
            </a>
            <a
              href="https://support.google.com/tagmanager/answer/6102821"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-600/50 bg-slate-700/30 p-4 text-sm text-slate-200 hover:border-cyan-500/30 hover:text-cyan-300 transition"
            >
              Guia d&apos;etiquetes i activadors
            </a>
            <a
              href="https://support.google.com/tagmanager/answer/6107166"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-600/50 bg-slate-700/30 p-4 text-sm text-slate-200 hover:border-cyan-500/30 hover:text-cyan-300 transition"
            >
              Events i dataLayer
            </a>
          </div>

          <div className="rounded-lg border border-slate-600/50 bg-slate-700/30 p-4 text-sm text-slate-300">
            Les mètriques de trànsit i clics depenen del destí de Google Tag Manager (per exemple, GA4).
            Si vols veure analítica dins del panell, connecta un destí compatible o indica quin proveïdor vols usar.
          </div>
        </div>
      </section>

      {/* Umami Analytics */}
      <section className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm">
        <div className="border-b border-slate-700/50 bg-slate-700/30 p-4">
          <h2 className="text-lg font-semibold text-slate-100">Umami · Analítica</h2>
          <p className="text-xs text-slate-400">Panell principal i estat de configuració</p>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-600/50 bg-slate-700/30 p-4">
              <p className="text-xs font-medium uppercase text-slate-400">Dashboard</p>
              <p className="mt-2 text-sm font-semibold text-slate-200">{umamiDashboardUrl}</p>
            </div>
            <div className="rounded-xl border border-slate-600/50 bg-slate-700/30 p-4">
              <p className="text-xs font-medium uppercase text-slate-400">Website ID</p>
              <p className="mt-2 text-sm font-semibold text-slate-200">{umamiWebsiteId || 'No configurat'}</p>
            </div>
            <div className="flex flex-col justify-between rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 p-4">
              <p className="text-xs uppercase text-slate-400">Estat</p>
              <p className="mt-2 text-lg font-semibold text-slate-100">{umamiReady ? 'Actiu' : 'Pendent'}</p>
              <p className="mt-2 text-xs text-slate-400">
                {umamiApiReady ? 'Recollint dades' : `Falten variables: ${umamiMissingVars.join(', ')}`}
              </p>
            </div>
          </div>
            <div className="mt-4 rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">API base</p>
            <p className="mt-2 text-sm font-semibold text-slate-200">{umamiBaseUrl}</p>
          </div>
          {umamiApiReady && !umami && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
              No hem pogut carregar Umami. Revisa el token o torna-ho a provar més tard.
            </div>
          )}
          {umami && (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-600/50 bg-slate-700/30 p-4">
                <p className="text-xs font-medium uppercase text-slate-400">Pageviews</p>
                <p className="mt-2 text-2xl font-semibold text-slate-100">{umami.totals.pageviews}</p>
              </div>
              <div className="rounded-xl border border-slate-600/50 bg-slate-700/30 p-4">
                <p className="text-xs font-medium uppercase text-slate-400">Visitants</p>
                <p className="mt-2 text-2xl font-semibold text-slate-100">{umami.totals.visitors}</p>
              </div>
              <div className="rounded-xl border border-slate-600/50 bg-slate-700/30 p-4">
                <p className="text-xs font-medium uppercase text-slate-400">Visites</p>
                <p className="mt-2 text-2xl font-semibold text-slate-100">{umami.totals.visits}</p>
              </div>
              <div className="rounded-xl border border-slate-600/50 bg-slate-700/30 p-4">
                <p className="text-xs font-medium uppercase text-slate-400">Mitjana visita (min)</p>
                <p className="mt-2 text-2xl font-semibold text-slate-100">{avgVisitMinutes}</p>
              </div>
            </div>
          )}
          {umami && (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-600/50 bg-slate-700/30">
                <div className="border-b border-slate-600/50 bg-slate-600/30 px-4 py-3 text-sm font-semibold text-slate-200">
                  Pàgines principals
                </div>
                <div className="space-y-2 p-4 text-sm">
                  {umami.topPages.slice(0, 6).map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="truncate text-slate-200">{row.label}</span>
                      <span className="text-slate-400">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-600/50 bg-slate-700/30">
                <div className="border-b border-slate-600/50 bg-slate-600/30 px-4 py-3 text-sm font-semibold text-slate-200">
                  Referències
                </div>
                <div className="space-y-2 p-4 text-sm">
                  {umami.referrers.slice(0, 6).map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="truncate text-slate-200">{row.label}</span>
                      <span className="text-slate-400">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-600/50 bg-slate-700/30">
                <div className="border-b border-slate-600/50 bg-slate-600/30 px-4 py-3 text-sm font-semibold text-slate-200">
                  Països
                </div>
                <div className="space-y-2 p-4 text-sm">
                  {umami.countries.slice(0, 6).map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="truncate text-slate-200">{row.label}</span>
                      <span className="text-slate-400">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-600/50 bg-slate-700/30">
                <div className="border-b border-slate-600/50 bg-slate-600/30 px-4 py-3 text-sm font-semibold text-slate-200">
                  Dispositius
                </div>
                <div className="space-y-2 p-4 text-sm">
                  {umami.devices.slice(0, 6).map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="truncate text-slate-200">{row.label}</span>
                      <span className="text-slate-400">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-600/50 bg-slate-700/30">
                <div className="border-b border-slate-600/50 bg-slate-600/30 px-4 py-3 text-sm font-semibold text-slate-200">
                  Navegadors
                </div>
                <div className="space-y-2 p-4 text-sm">
                  {umami.browsers.slice(0, 6).map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="truncate text-slate-200">{row.label}</span>
                      <span className="text-slate-400">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-600/50 bg-slate-700/30">
                <div className="border-b border-slate-600/50 bg-slate-600/30 px-4 py-3 text-sm font-semibold text-slate-200">
                  Esdeveniments
                </div>
                <div className="space-y-2 p-4 text-sm">
                  {umami.events.slice(0, 6).map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="truncate text-slate-200">{row.label}</span>
                      <span className="text-slate-400">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={umamiDashboardUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-slate-600/50 bg-slate-700/30 px-4 py-2 text-sm font-medium text-slate-200 hover:border-cyan-500/30 hover:text-cyan-300 transition"
            >
              Obrir panell Umami
            </a>
            <a
              href="https://umami.is/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-slate-600/50 bg-slate-700/30 px-4 py-2 text-sm font-medium text-slate-200 hover:border-cyan-500/30 hover:text-cyan-300 transition"
            >
              Docs Umami
            </a>
          </div>
          <div className="rounded-lg border border-slate-600/50 bg-slate-700/30 p-4 text-sm text-slate-300">
            Aquesta és la font principal d&apos;analítica (trànsit, pàgines, esdeveniments i conversions) per al web.
            Si el Website ID no està configurat, revisa les variables d&apos;entorn.
          </div>
        </div>
      </section>
    </div>
  );
}
