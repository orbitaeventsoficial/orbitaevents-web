// app/admin/analytics/page.tsx
import { log } from '@/lib/logger';
// Pàgina d'analytics i estadístiques
import { prisma } from '@/lib/prisma';
import { getGa4Report, getGa4ConfigStatus } from '@/lib/analytics/ga4';
import { getGoogleAdsConfigStatus, getGoogleAdsReport } from '@/lib/analytics/google-ads';
import Link from 'next/link';
import { EVENT_TYPE_PLAIN, EVENT_TYPE_ICONS, SOURCE_LABELS } from '@/lib/constants';
import { AdminPage } from '../components/AdminPage';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Analítica | Òrbita Admin',
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
      // Revenue by month placeholder (data not displayed in UI yet)
      Promise.resolve([]),
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


const ANALYTICS_EVENT_LABELS: Record<string, { label: string; icon: string }> = Object.fromEntries(
  Object.keys(EVENT_TYPE_PLAIN).map((k) => [k, { label: EVENT_TYPE_PLAIN[k], icon: EVENT_TYPE_ICONS[k] || '📅' }])
);

function pctDelta(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('ca-ES', {
    style: 'currency',
    currency: currency || 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();
  const ops = await getOperationalKpis();
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID || 'No configurat';
  const ga4PropertyId = process.env.GA4_PROPERTY_ID || '';
  const ga4Status = getGa4ConfigStatus();
  const googleAdsStatus = await getGoogleAdsConfigStatus();
  const yearGrowth = data.revenue.lastYear > 0
    ? ((data.revenue.thisYear - data.revenue.lastYear) / data.revenue.lastYear * 100).toFixed(1)
    : '100.0';
  const gtmReady = gtmId !== 'No configurat';
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
  let googleAds = null;
  let googleAdsError: string | null = null;
  if (googleAdsStatus.ready) {
    try {
      googleAds = await getGoogleAdsReport();
    } catch (error) {
      googleAdsError = error instanceof Error ? error.message : 'Google Ads error desconegut';
      log.error('Google Ads report failed', error);
    }
  }
  const avgSessionMinutes = ga4?.totals.avgSessionDuration
    ? Math.max(1, Math.round(ga4.totals.avgSessionDuration / 60))
    : 0;
  const ga4Deltas = ga4
    ? {
        users: pctDelta(ga4.totals.activeUsers, ga4.previousTotals.activeUsers) ?? 0,
        sessions: pctDelta(ga4.totals.sessions, ga4.previousTotals.sessions) ?? 0,
        pageViews: pctDelta(ga4.totals.pageViews, ga4.previousTotals.pageViews) ?? 0,
        events: pctDelta(ga4.totals.eventCount, ga4.previousTotals.eventCount) ?? 0,
      }
    : null;
  const ga4SeriesMax = ga4
    ? Math.max(1, ...ga4.timeseries.map((row) => Math.max(row.sessions, row.activeUsers)))
    : 1;
  const adsCost = (googleAds?.totals.costMicros || 0) / 1_000_000;
  const adsPrevCost = (googleAds?.previousTotals.costMicros || 0) / 1_000_000;
  const adsCurrency = googleAds?.currencyCode || 'EUR';
  const adsDeltas = googleAds
    ? {
        clicks: pctDelta(googleAds.totals.clicks, googleAds.previousTotals.clicks) ?? 0,
        impressions: pctDelta(googleAds.totals.impressions, googleAds.previousTotals.impressions) ?? 0,
        conversions: pctDelta(googleAds.totals.conversions, googleAds.previousTotals.conversions) ?? 0,
        cost: pctDelta(adsCost, adsPrevCost) ?? 0,
      }
    : null;
  const adsSeriesMax =
    googleAds && googleAds.timeseries.length > 0
      ? Math.max(1, ...googleAds.timeseries.map((row) => row.clicks))
      : 1;

  return (
    <AdminPage
      title="Panell de rendiment"
      subtitle="Totes les mètriques essencials en un sol lloc: vendes, entrades, qualitat i creixement."
      actions={
        <div className="flex items-center gap-3">
          <span className="rounded-full border px-3 py-1 text-xs">
            Any {new Date().getFullYear()}
          </span>
          <span className="rounded-full border px-3 py-1 text-xs">
            {Number(yearGrowth) >= 0 ? '📈' : '📉'} {yearGrowth}% YoY
          </span>
        </div>
      }
    >

      <section className="rounded-2xl border bg-black p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em]">Operativa comercial</p>
            <h2 className="mt-1 text-xl font-semibold">KPI accionables</h2>
          </div>
          <Link
            href={`/admin/leads?from=${ops.last7Days.toISOString().slice(0, 10)}&page=1`}
            className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
          >
            Veure entrades d&apos;aquesta setmana
          </Link>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-4">
          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase">Entrades 7 dies</p>
            <p className="mt-2 text-3xl font-semibold">{ops.leads7d}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase">% entrades a pressupost</p>
            <p className="mt-2 text-3xl font-semibold">{ops.conversionToQuotePct.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase">% pressupostos acceptats</p>
            <p className="mt-2 text-3xl font-semibold">{ops.proposalsAcceptedPct.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase">1r contacte mitjà</p>
            <p className="mt-2 text-3xl font-semibold">{Math.max(0, Math.round(ops.avgFirstContactHours))}h</p>
          </div>
        </div>
      </section>

      {/* GA4 */}
      <section className="overflow-hidden rounded-2xl border bg-black p-6 text-white">
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em]">GA4</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Panell de control</h2>
            <p className="mt-2 max-w-xl text-sm">
              Dades de trànsit, pàgines i esdeveniments amb la GA4 Data API.
            </p>
          </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full border px-3 py-1 text-xs">
                ID propietat {ga4PropertyId || '—'}
              </span>
              <Link
                href="#google-ads"
                className="rounded-full border px-3 py-1 text-xs font-semibold"
              >
                Google Ads
              </Link>
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
          <div className="mt-6 rounded-xl border p-4 text-sm">
            Configuració incompleta. {ga4Status.reason || 'Revisa les variables de GA4 a Railway.'}
          </div>
        )}

        {ga4Ready && ga4Error && (
          <div className="mt-6 rounded-xl border p-4 text-sm">
            Error GA4: {ga4Error}
          </div>
        )}

        {ga4Ready && !ga4 && !ga4Error && (
          <div className="mt-6 rounded-xl border p-4 text-sm">
            GA4 actiu però sense dades. Revisa permisos del compte de servei o la quota de l&apos;API.
          </div>
        )}

        {ga4 && (
          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            <div className="rounded-xl border p-4">
              <p className="text-xs uppercase">Usuaris actius</p>
              <p className="mt-2 text-3xl font-semibold text-white">{ga4.totals.activeUsers}</p>
              {ga4Deltas && (
                <p className={`mt-1 text-xs ${ga4Deltas.users >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {ga4Deltas.users >= 0 ? '↑' : '↓'} {Math.abs(ga4Deltas.users).toFixed(1)}% vs 30d anterior
                </p>
              )}
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs uppercase">Sessions</p>
              <p className="mt-2 text-3xl font-semibold text-white">{ga4.totals.sessions}</p>
              {ga4Deltas && (
                <p className={`mt-1 text-xs ${ga4Deltas.sessions >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {ga4Deltas.sessions >= 0 ? '↑' : '↓'} {Math.abs(ga4Deltas.sessions).toFixed(1)}% vs 30d anterior
                </p>
              )}
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs uppercase">Pageviews</p>
              <p className="mt-2 text-3xl font-semibold text-white">{ga4.totals.pageViews}</p>
              {ga4Deltas && (
                <p className={`mt-1 text-xs ${ga4Deltas.pageViews >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {ga4Deltas.pageViews >= 0 ? '↑' : '↓'} {Math.abs(ga4Deltas.pageViews).toFixed(1)}% vs 30d anterior
                </p>
              )}
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs uppercase">Esdeveniments</p>
              <p className="mt-2 text-3xl font-semibold text-white">{ga4.totals.eventCount}</p>
              {ga4Deltas && (
                <p className={`mt-1 text-xs ${ga4Deltas.events >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {ga4Deltas.events >= 0 ? '↑' : '↓'} {Math.abs(ga4Deltas.events).toFixed(1)}% vs 30d anterior
                </p>
              )}
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs uppercase">Temps mitjà (min)</p>
              <p className="mt-2 text-3xl font-semibold text-white">{avgSessionMinutes}</p>
            </div>
          </div>
        )}

        {ga4 && ga4.timeseries.length > 0 && (
          <div className="mt-4 rounded-2xl border p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold">Tendència 30 dies</p>
              <p className="text-xs">Sessions (cyan) · Usuaris (amber)</p>
            </div>
            <div className="flex h-28 items-end gap-1">
              {ga4.timeseries.map((row) => {
                const sessionsH = Math.max(3, Math.round((row.sessions / ga4SeriesMax) * 100));
                const usersH = Math.max(3, Math.round((row.activeUsers / ga4SeriesMax) * 100));
                return (
                  <div key={row.date} className="flex flex-1 items-end gap-[2px]">
                    <div className="w-1.5 rounded-sm" style={{ height: `${sessionsH}%` }} />
                    <div className="w-1.5 rounded-sm" style={{ height: `${usersH}%` }} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {ga4 && (
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border">
              <div className="border-b px-4 py-3 text-sm font-semibold">Pàgines principals</div>
              <div className="space-y-2 p-4 text-sm">
                {ga4.pages.map((row) => (
                  <div key={row.dimension} className="flex items-center justify-between">
                    <span className="truncate">{row.dimension}</span>
                    <span className="">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border">
              <div className="border-b px-4 py-3 text-sm font-semibold">Fonts</div>
              <div className="space-y-2 p-4 text-sm">
                {ga4.sources.map((row) => (
                  <div key={row.dimension} className="flex items-center justify-between">
                    <span className="truncate">{row.dimension}</span>
                    <span className="">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border">
              <div className="border-b px-4 py-3 text-sm font-semibold">
                Temps real (top)
              </div>
              <div className="space-y-2 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span>Actius ara</span>
                  <span className="">{ga4.realtime.activeUsers}</span>
                </div>
                {ga4.realtime.pages.map((row) => (
                  <div key={row.dimension} className="flex items-center justify-between">
                    <span className="truncate">{row.dimension}</span>
                    <span className="">{row.value}</span>
                  </div>
                ))}
                {ga4.realtimeFallback && (
                  <p className="pt-2 text-xs">
                    Temps real parcial: només usuaris actius disponibles.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {ga4 && (
          <div className="mt-4 rounded-2xl border">
            <div className="border-b px-4 py-3 text-sm font-semibold">
              Paraules de cerca (GA4)
            </div>
            <div className="space-y-2 p-4 text-sm">
              {ga4.searchTerms.length === 0 && (
                <p className="">Sense dades de cerca interna.</p>
              )}
              {ga4.searchTerms.map((row) => (
                <div key={`${row.dimension}-${row.value}`} className="flex items-center justify-between">
                  <span className="truncate">{row.dimension || '—'}</span>
                  <span className="">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="border-t px-4 py-2 text-xs">
              GA4 mostra cerques internes (si existeixen). Per paraules SEO cal Search Console.
            </div>
          </div>
        )}
      </section>

      {/* Google Ads */}
      <section id="google-ads" className="overflow-hidden rounded-2xl border bg-black p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em]">Google Ads</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Paid media</h2>
            <p className="mt-2 text-sm">Dades de campanyes, cost i conversions dins del mateix panell.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={process.env.NEXT_PUBLIC_GOOGLE_ADS_URL || 'https://ads.google.com'}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
            >
              Obrir Google Ads
            </a>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                googleAdsStatus.ready ? 'bg-emerald-700 text-emerald-100' : 'bg-amber-700 text-amber-100'
              }`}
            >
              {googleAdsStatus.ready ? 'API preparada' : 'Config pendent'}
            </span>
          </div>
        </div>

        {!googleAdsStatus.ready && (
          <div className="mt-4 rounded-xl border p-4 text-sm">
            {googleAdsStatus.reason}: {googleAdsStatus.missing.join(', ')}
          </div>
        )}

        {googleAdsError && (
          <div className="mt-4 rounded-xl border p-4 text-sm">
            Error Google Ads: {googleAdsError}
          </div>
        )}

        {googleAds && (
          <>
            <div className="mt-4 grid gap-4 lg:grid-cols-4">
              <div className="rounded-xl border p-4">
                <p className="text-xs uppercase">Clicks (30d)</p>
                <p className="mt-2 text-3xl font-semibold">{googleAds.totals.clicks}</p>
                <p className={`mt-1 text-xs ${adsDeltas && adsDeltas.clicks >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {adsDeltas && adsDeltas.clicks >= 0 ? '↑' : '↓'} {Math.abs(adsDeltas?.clicks || 0).toFixed(1)}%
                </p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs uppercase">Impressions (30d)</p>
                <p className="mt-2 text-3xl font-semibold">{googleAds.totals.impressions}</p>
                <p className={`mt-1 text-xs ${adsDeltas && adsDeltas.impressions >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {adsDeltas && adsDeltas.impressions >= 0 ? '↑' : '↓'} {Math.abs(adsDeltas?.impressions || 0).toFixed(1)}%
                </p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs uppercase">Cost (30d)</p>
                <p className="mt-2 text-3xl font-semibold">{formatCurrency(adsCost, adsCurrency)}</p>
                <p className={`mt-1 text-xs ${adsDeltas && adsDeltas.cost <= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {adsDeltas && adsDeltas.cost <= 0 ? '↓' : '↑'} {Math.abs(adsDeltas?.cost || 0).toFixed(1)}%
                </p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs uppercase">Conversions (30d)</p>
                <p className="mt-2 text-3xl font-semibold">{googleAds.totals.conversions.toFixed(1)}</p>
                <p className={`mt-1 text-xs ${adsDeltas && adsDeltas.conversions >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {adsDeltas && adsDeltas.conversions >= 0 ? '↑' : '↓'} {Math.abs(adsDeltas?.conversions || 0).toFixed(1)}%
                </p>
              </div>
            </div>

            {googleAds.timeseries.length > 0 && (
              <div className="mt-4 rounded-xl border p-4">
                <p className="mb-2 text-sm font-semibold">Tendència clicks (30 dies)</p>
                <div className="flex h-24 items-end gap-1">
                  {googleAds.timeseries.map((row) => {
                    const h = Math.max(4, Math.round((row.clicks / adsSeriesMax) * 100));
                    return <div key={row.date} className="flex-1 rounded-sm" style={{ height: `${h}%` }} />;
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border p-5">
          <div className="flex items-center justify-between text-xs font-medium uppercase">
            <span>Facturació any</span>
            <span className="">Ingressos</span>
          </div>
          <p className="mt-3 text-3xl font-semibold">
            {data.revenue.thisYear.toLocaleString('ca-ES')}€
          </p>
          <p className={`mt-2 text-xs ${Number(yearGrowth) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {Number(yearGrowth) >= 0 ? '↑' : '↓'} {yearGrowth}% vs any anterior
          </p>
        </div>
        <div className="rounded-2xl border p-5">
          <div className="flex items-center justify-between text-xs font-medium uppercase">
            <span>Reserves any</span>
            <span className="">Reserves</span>
          </div>
          <p className="mt-3 text-3xl font-semibold">{data.bookings.thisYear}</p>
          <p className="mt-2 text-xs">{data.bookings.total} totals</p>
        </div>
        <div className="rounded-2xl border p-5">
          <div className="flex items-center justify-between text-xs font-medium uppercase">
            <span>Tiquet mitjà</span>
            <span className="">AVG</span>
          </div>
          <p className="mt-3 text-3xl font-semibold">
            {data.revenue.avgBooking.toLocaleString('ca-ES', { maximumFractionDigits: 0 })}€
          </p>
        </div>
        <div className="rounded-2xl border p-5">
          <div className="flex items-center justify-between text-xs font-medium uppercase">
            <span>NPS Score</span>
            <span className="">Qualitat</span>
          </div>
          <p className="mt-3 text-3xl font-semibold">
            {data.satisfaction.nps.toFixed(1)}
          </p>
          <p className="mt-2 text-xs">
            ⭐ {data.satisfaction.rating.toFixed(1)} valoració
          </p>
        </div>
      </section>

      {/* Entrades Section */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Entrades per Font */}
        <div className="overflow-hidden rounded-2xl border">
          <div className="border-b p-4">
            <h3 className="font-semibold">Entrades per origen</h3>
            <p className="mt-1 text-xs">{data.leads.thisYear} entrades aquest any</p>
          </div>
          <div className="p-4 space-y-3">
            {data.leads.bySource.map((source) => {
              const percentage = data.leads.total > 0
                ? (source._count / data.leads.total * 100).toFixed(1)
                : '0';
              return (
                <div key={source.source}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="">
                      {SOURCE_LABELS[source.source] || source.source}
                    </span>
                    <span className="">
                      {source._count} ({percentage}%)
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {data.leads.bySource.length === 0 && (
              <p className="text-center py-4">No hi ha dades</p>
            )}
          </div>
        </div>

        {/* Conversió d'entrades */}
        <div className="overflow-hidden rounded-2xl border">
          <div className="border-b p-4">
            <h3 className="font-semibold">Conversió d&apos;entrades</h3>
            <p className="mt-1 text-xs">Estat de les entrades</p>
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
                    <span className="">{config.label}</span>
                    <span className="">
                      {status._count} ({percentage}%)
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${config.color} rounded-full`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {data.leads.conversionByMonth.length === 0 && (
              <p className="text-center py-4">No hi ha dades</p>
            )}
          </div>
        </div>
      </section>

      {/* Esdeveniments per tipus */}
      <section className="overflow-hidden rounded-2xl border">
        <div className="border-b p-4">
          <h3 className="font-semibold">Reserves per tipus d&apos;esdeveniment</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {data.bookings.byEventType.map((type) => {
              const config = ANALYTICS_EVENT_LABELS[type.eventType] || { label: type.eventType, icon: '📅' };
              return (
                <div
                  key={type.eventType}
                  className="rounded-xl border p-4 text-center"
                >
                  <span className="text-3xl">{config.icon}</span>
                  <p className="text-2xl font-bold mt-2">{type._count}</p>
                  <p className="text-xs">{config.label}</p>
                </div>
              );
            })}
            {data.bookings.byEventType.length === 0 && (
              <p className="col-span-full text-center py-4">No hi ha dades</p>
            )}
          </div>
        </div>
      </section>

      {/* GTM Control Center */}
      <section className="overflow-hidden rounded-2xl border">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">GTM · Centre de control</h2>
          <p className="text-xs">Gestió d&apos;etiquetes, activadors i accessos ràpids</p>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase">Container ID</p>
              <p className="mt-2 text-lg font-semibold">{gtmId}</p>
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
              className="rounded-lg border p-4 text-sm transition"
            >
              Obrir Google Tag Manager
            </a>
            <a
              href="https://tagassistant.google.com/"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border p-4 text-sm transition"
            >
              Tag Assistant (Preview)
            </a>
            <a
              href="https://support.google.com/tagmanager/answer/6102821"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border p-4 text-sm transition"
            >
              Guia d&apos;etiquetes i activadors
            </a>
            <a
              href="https://support.google.com/tagmanager/answer/6107166"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border p-4 text-sm transition"
            >
              Esdeveniments i dataLayer
            </a>
          </div>

          <div className="rounded-lg border p-4 text-sm">
            Les mètriques de trànsit i clics depenen del destí de Google Tag Manager (per exemple, GA4).
            Si vols veure analítica dins del panell, connecta un destí compatible o indica quin proveïdor vols usar.
          </div>
        </div>
      </section>

    </AdminPage>
  );
}
