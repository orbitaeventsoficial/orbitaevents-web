// app/admin/analytics/page.tsx
import { log } from '@/lib/logger';
// Pàgina d'analytics i estadístiques
import { prisma } from '@/lib/prisma';
import { getUmamiReport } from '@/lib/analytics/umami';
import { getGa4Report, getGa4ConfigStatus } from '@/lib/analytics/ga4';

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

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: 'Web',
  CONFIGURATOR: 'Configurador',
  PHONE: 'Telèfon',
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
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
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID || 'No configurat';
  const umamiDashboardUrl =
    process.env.NEXT_PUBLIC_UMAMI_DASHBOARD_URL || 'https://analytics.orbitaevents.com';
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? '';
  const umamiApiReady = Boolean(process.env.UMAMI_API_KEY) && Boolean(umamiWebsiteId);
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
      <section className="relative overflow-hidden rounded-2xl border border-stone-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 text-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.8)]">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="absolute -left-16 -bottom-24 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-orange-200">Orbita Analytics</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Panell premium de rendiment</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-200">
              Totes les mètriques essencials en un sol lloc: vendes, leads, qualitat i creixement.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs">
              Any {new Date().getFullYear()}
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs">
              {Number(yearGrowth) >= 0 ? '📈' : '📉'} {yearGrowth}% YoY
            </span>
          </div>
        </div>
      </section>

      {/* GA4 Starfleet Control */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-white shadow-[0_30px_80px_-40px_rgba(2,6,23,0.9)]">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 20%, rgba(255,255,255,0.2) 0 2px, transparent 2px),' +
              'radial-gradient(circle at 85% 30%, rgba(255,255,255,0.18) 0 1.5px, transparent 1.5px),' +
              'radial-gradient(circle at 55% 70%, rgba(255,255,255,0.12) 0 1px, transparent 1px)',
          }}
        />
        <div className="absolute -left-24 -top-32 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -right-24 -bottom-28 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">GA4 · Enterprise Bridge</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Panell de control galactic</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-200">
              Dades en temps real, trafic, pagines i events. Alimentat per GA4 Data API.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs">
              Property ID {ga4PropertyId || '—'}
            </span>
            <span
              className={`rounded-full border border-white/20 px-3 py-1 text-xs ${
                ga4Ready ? 'bg-emerald-400/20 text-emerald-100' : 'bg-rose-400/20 text-rose-100'
              }`}
            >
              {ga4Ready ? '● Actiu' : '● Pendent'}
            </span>
          </div>
        </div>

        {!ga4Ready && (
          <div className="mt-6 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
            Configuracio incompleta. {ga4Status.reason || 'Revisa variables GA4 a Railway.'}
          </div>
        )}

        {ga4Ready && ga4Error && (
          <div className="mt-6 rounded-xl border border-amber-300/30 bg-amber-400/10 p-4 text-sm text-amber-100">
            Error GA4: {ga4Error}
          </div>
        )}

        {ga4Ready && !ga4 && !ga4Error && (
          <div className="mt-6 rounded-xl border border-amber-300/30 bg-amber-400/10 p-4 text-sm text-amber-100">
            GA4 actiu pero sense dades. Revisa permisos del service account o quota de l&apos;API.
          </div>
        )}

        {ga4 && (
          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase text-slate-300">Usuaris actius</p>
              <p className="mt-2 text-3xl font-semibold text-white">{ga4.totals.activeUsers}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase text-slate-300">Sessions</p>
              <p className="mt-2 text-3xl font-semibold text-white">{ga4.totals.sessions}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase text-slate-300">Pageviews</p>
              <p className="mt-2 text-3xl font-semibold text-white">{ga4.totals.pageViews}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase text-slate-300">Events</p>
              <p className="mt-2 text-3xl font-semibold text-white">{ga4.totals.eventCount}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase text-slate-300">Temps mitja (min)</p>
              <p className="mt-2 text-3xl font-semibold text-white">{avgSessionMinutes}</p>
            </div>
          </div>
        )}

        {ga4 && (
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5">
              <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold text-slate-200">Top Pages</div>
              <div className="space-y-2 p-4 text-sm text-slate-200">
                {ga4.pages.map((row) => (
                  <div key={row.dimension} className="flex items-center justify-between">
                    <span className="truncate">{row.dimension}</span>
                    <span className="text-slate-300">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5">
              <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold text-slate-200">Sources</div>
              <div className="space-y-2 p-4 text-sm text-slate-200">
                {ga4.sources.map((row) => (
                  <div key={row.dimension} className="flex items-center justify-between">
                    <span className="truncate">{row.dimension}</span>
                    <span className="text-slate-300">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5">
              <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold text-slate-200">
                Realtime (top)
              </div>
              <div className="space-y-2 p-4 text-sm text-slate-200">
                <div className="flex items-center justify-between">
                  <span>Actius ara</span>
                  <span className="text-cyan-200">{ga4.realtime.activeUsers}</span>
                </div>
                {ga4.realtime.pages.map((row) => (
                  <div key={row.dimension} className="flex items-center justify-between">
                    <span className="truncate">{row.dimension}</span>
                    <span className="text-slate-300">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {ga4 && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5">
            <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold text-slate-200">
              Paraules de cerca (GA4)
            </div>
            <div className="space-y-2 p-4 text-sm text-slate-200">
              {ga4.searchTerms.length === 0 && (
                <p className="text-slate-300">Sense dades de cerca interna.</p>
              )}
              {ga4.searchTerms.map((row) => (
                <div key={`${row.dimension}-${row.value}`} className="flex items-center justify-between">
                  <span className="truncate">{row.dimension || '—'}</span>
                  <span className="text-slate-300">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 px-4 py-2 text-xs text-slate-400">
              GA4 mostra cerques internes (si existeixen). Per paraules SEO cal Search Console.
            </div>
          </div>
        )}
      </section>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.5)]">
          <div className="flex items-center justify-between text-xs font-medium uppercase text-slate-500">
            <span>Facturacio Any</span>
            <span className="text-orange-500">Revenue</span>
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {data.revenue.thisYear.toLocaleString('ca-ES')}€
          </p>
          <p className={`mt-2 text-xs ${Number(yearGrowth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {Number(yearGrowth) >= 0 ? '↑' : '↓'} {yearGrowth}% vs any anterior
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.5)]">
          <div className="flex items-center justify-between text-xs font-medium uppercase text-slate-500">
            <span>Reserves Any</span>
            <span className="text-emerald-500">Bookings</span>
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{data.bookings.thisYear}</p>
          <p className="mt-2 text-xs text-slate-400">{data.bookings.total} totals</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.5)]">
          <div className="flex items-center justify-between text-xs font-medium uppercase text-slate-500">
            <span>Ticket Mitja</span>
            <span className="text-indigo-500">AVG</span>
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {data.revenue.avgBooking.toLocaleString('ca-ES', { maximumFractionDigits: 0 })}€
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.5)]">
          <div className="flex items-center justify-between text-xs font-medium uppercase text-slate-500">
            <span>NPS Score</span>
            <span className="text-rose-500">Qualitat</span>
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {data.satisfaction.nps.toFixed(1)}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            ⭐ {data.satisfaction.rating.toFixed(1)} valoracio
          </p>
        </div>
      </section>

      {/* Leads Section */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Leads per Font */}
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_18px_45px_-30px_rgba(15,23,42,0.6)]">
          <div className="border-b border-stone-200 bg-gradient-to-r from-slate-50 to-white p-4">
            <h3 className="font-semibold text-slate-800">Leads per Font</h3>
            <p className="mt-1 text-xs text-slate-500">{data.leads.thisYear} leads aquest any</p>
          </div>
          <div className="p-4 space-y-3">
            {data.leads.bySource.map((source) => {
              const percentage = data.leads.total > 0
                ? (source._count / data.leads.total * 100).toFixed(1)
                : '0';
              return (
                <div key={source.source}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">
                      {SOURCE_LABELS[source.source] || source.source}
                    </span>
                    <span className="text-slate-500">
                      {source._count} ({percentage}%)
                    </span>
                  </div>
                  <div className="mt-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {data.leads.bySource.length === 0 && (
              <p className="text-center text-slate-400 py-4">No hi ha dades</p>
            )}
          </div>
        </div>

        {/* Conversió Leads */}
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_18px_45px_-30px_rgba(15,23,42,0.6)]">
          <div className="border-b border-stone-200 bg-gradient-to-r from-slate-50 to-white p-4">
            <h3 className="font-semibold text-slate-800">Conversió de Leads</h3>
            <p className="mt-1 text-xs text-slate-500">Estat dels leads</p>
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
                WON: { label: 'Guanyats', color: 'bg-green-500' },
                LOST: { label: 'Perduts', color: 'bg-red-500' },
              };
              const config = statusLabels[status.status] || { label: status.status, color: 'bg-slate-500' };
              return (
                <div key={status.status}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{config.label}</span>
                    <span className="text-slate-500">
                      {status._count} ({percentage}%)
                    </span>
                  </div>
                  <div className="mt-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${config.color} rounded-full`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {data.leads.conversionByMonth.length === 0 && (
              <p className="text-center text-slate-400 py-4">No hi ha dades</p>
            )}
          </div>
        </div>
      </section>

      {/* Events per Tipus */}
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_20px_50px_-30px_rgba(15,23,42,0.6)]">
        <div className="border-b border-stone-200 bg-gradient-to-r from-slate-50 to-white p-4">
          <h3 className="font-semibold text-slate-800">Reserves per Tipus d&apos;Event</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {data.bookings.byEventType.map((type) => {
              const config = EVENT_TYPE_LABELS[type.eventType] || { label: type.eventType, icon: '📅' };
              return (
                <div
                  key={type.eventType}
                  className="rounded-xl border border-stone-200 bg-white p-4 text-center shadow-[0_12px_24px_-18px_rgba(15,23,42,0.4)]"
                >
                  <span className="text-3xl">{config.icon}</span>
                  <p className="text-2xl font-bold text-slate-700 mt-2">{type._count}</p>
                  <p className="text-xs text-slate-500">{config.label}</p>
                </div>
              );
            })}
            {data.bookings.byEventType.length === 0 && (
              <p className="col-span-full text-center text-slate-400 py-4">No hi ha dades</p>
            )}
          </div>
        </div>
      </section>

      {/* GTM Control Center */}
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_20px_50px_-30px_rgba(15,23,42,0.6)]">
        <div className="border-b border-stone-200 bg-gradient-to-r from-slate-50 to-white p-4">
          <h2 className="text-lg font-semibold text-slate-800">GTM · Centre de control</h2>
          <p className="text-xs text-slate-500">Gestio de tags, triggers i accessos rapids</p>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-gradient-to-r from-white to-slate-50 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Container ID</p>
              <p className="mt-2 text-lg font-semibold text-slate-800">{gtmId}</p>
            </div>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                gtmReady ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
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
              className="rounded-lg border border-stone-200 bg-white p-4 text-sm text-slate-700 hover:border-orange-300 hover:text-orange-700 transition"
            >
              Obrir Google Tag Manager
            </a>
            <a
              href="https://tagassistant.google.com/"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-stone-200 bg-white p-4 text-sm text-slate-700 hover:border-orange-300 hover:text-orange-700 transition"
            >
              Tag Assistant (Preview)
            </a>
            <a
              href="https://support.google.com/tagmanager/answer/6102821"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-stone-200 bg-white p-4 text-sm text-slate-700 hover:border-orange-300 hover:text-orange-700 transition"
            >
              Guia de tags i triggers
            </a>
            <a
              href="https://support.google.com/tagmanager/answer/6107166"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-stone-200 bg-white p-4 text-sm text-slate-700 hover:border-orange-300 hover:text-orange-700 transition"
            >
              Events i dataLayer
            </a>
          </div>

          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-slate-600">
            Les metrics de traffic i clicks depenen del desti de Google Tag Manager (per exemple GA4).
            Si vols veure analytics dins del panell, connecta un desti compatible o digues-me
            quin proveidor vols usar.
          </div>
        </div>
      </section>

      {/* Umami Analytics */}
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_20px_50px_-30px_rgba(15,23,42,0.6)]">
        <div className="border-b border-stone-200 bg-gradient-to-r from-slate-50 to-white p-4">
          <h2 className="text-lg font-semibold text-slate-800">Umami · Analytics</h2>
          <p className="text-xs text-slate-500">Panell principal i estat de configuracio</p>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.4)]">
              <p className="text-xs font-medium uppercase text-slate-500">Dashboard</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{umamiDashboardUrl}</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.4)]">
              <p className="text-xs font-medium uppercase text-slate-500">Website ID</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{umamiWebsiteId || 'No configurat'}</p>
            </div>
            <div className="flex flex-col justify-between rounded-xl border border-stone-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-4 text-white shadow-[0_18px_32px_-20px_rgba(15,23,42,0.8)]">
              <p className="text-xs uppercase text-slate-300">Estat</p>
              <p className="mt-2 text-lg font-semibold">{umamiReady ? 'Actiu' : 'Pendent'}</p>
              <p className="mt-2 text-xs text-slate-300">
                {umamiApiReady ? 'Recollint dades' : 'Falta API Key'}
              </p>
            </div>
          </div>
          {umamiApiReady && !umami && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              No hem pogut carregar Umami. Revisa el token o torna-ho a provar mes tard.
            </div>
          )}
          {umami && (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.4)]">
                <p className="text-xs font-medium uppercase text-slate-500">Pageviews</p>
                <p className="mt-2 text-2xl font-semibold text-slate-800">{umami.totals.pageviews}</p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.4)]">
                <p className="text-xs font-medium uppercase text-slate-500">Visitors</p>
                <p className="mt-2 text-2xl font-semibold text-slate-800">{umami.totals.visitors}</p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.4)]">
                <p className="text-xs font-medium uppercase text-slate-500">Visits</p>
                <p className="mt-2 text-2xl font-semibold text-slate-800">{umami.totals.visits}</p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.4)]">
                <p className="text-xs font-medium uppercase text-slate-500">Avg. visit (min)</p>
                <p className="mt-2 text-2xl font-semibold text-slate-800">{avgVisitMinutes}</p>
              </div>
            </div>
          )}
          {umami && (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-stone-200 bg-white shadow-[0_12px_26px_-18px_rgba(15,23,42,0.35)]">
                <div className="border-b border-stone-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  Top Pages
                </div>
                <div className="space-y-2 p-4 text-sm">
                  {umami.topPages.slice(0, 6).map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="truncate text-slate-700">{row.label}</span>
                      <span className="text-slate-500">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white shadow-[0_12px_26px_-18px_rgba(15,23,42,0.35)]">
                <div className="border-b border-stone-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  Referrers
                </div>
                <div className="space-y-2 p-4 text-sm">
                  {umami.referrers.slice(0, 6).map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="truncate text-slate-700">{row.label}</span>
                      <span className="text-slate-500">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white shadow-[0_12px_26px_-18px_rgba(15,23,42,0.35)]">
                <div className="border-b border-stone-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  Countries
                </div>
                <div className="space-y-2 p-4 text-sm">
                  {umami.countries.slice(0, 6).map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="truncate text-slate-700">{row.label}</span>
                      <span className="text-slate-500">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white shadow-[0_12px_26px_-18px_rgba(15,23,42,0.35)]">
                <div className="border-b border-stone-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  Devices
                </div>
                <div className="space-y-2 p-4 text-sm">
                  {umami.devices.slice(0, 6).map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="truncate text-slate-700">{row.label}</span>
                      <span className="text-slate-500">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white shadow-[0_12px_26px_-18px_rgba(15,23,42,0.35)]">
                <div className="border-b border-stone-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  Browsers
                </div>
                <div className="space-y-2 p-4 text-sm">
                  {umami.browsers.slice(0, 6).map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="truncate text-slate-700">{row.label}</span>
                      <span className="text-slate-500">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white shadow-[0_12px_26px_-18px_rgba(15,23,42,0.35)]">
                <div className="border-b border-stone-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  Events
                </div>
                <div className="space-y-2 p-4 text-sm">
                  {umami.events.slice(0, 6).map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="truncate text-slate-700">{row.label}</span>
                      <span className="text-slate-500">{row.value}</span>
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
              className="inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-orange-300 hover:text-orange-700 transition"
            >
              Obrir panel Umami
            </a>
            <a
              href="https://umami.is/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-orange-300 hover:text-orange-700 transition"
            >
              Docs Umami
            </a>
          </div>
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-slate-600">
            Aquesta es la font principal d&apos;analytics (traffic, pagines, events i conversions) per a la web.
            Si el Website ID no esta configurat, revisa les variables d&apos;entorn.
          </div>
        </div>
      </section>
    </div>
  );
}
