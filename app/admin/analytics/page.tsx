// app/admin/analytics/page.tsx
import { log } from '@/lib/logger';
// Pàgina d'analytics i estadístiques
import { prisma } from '@/lib/prisma';
import { getGa4Report } from '@/lib/analytics/ga4';

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
  let ga4 = null;
  try {
    ga4 = await getGa4Report();
  } catch (error) {
    log.error('Error obtenint GA4 report:', error);
  }
  const yearGrowth = data.revenue.lastYear > 0
    ? ((data.revenue.thisYear - data.revenue.lastYear) / data.revenue.lastYear * 100).toFixed(1)
    : '100.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-700">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">
          Estadístiques i mètriques del negoci
        </p>
      </header>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Facturació Any</p>
          <p className="mt-2 text-3xl font-bold text-slate-700">
            {data.revenue.thisYear.toLocaleString('ca-ES')}€
          </p>
          <p className={`text-xs mt-1 ${Number(yearGrowth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {Number(yearGrowth) >= 0 ? '↑' : '↓'} {yearGrowth}% vs any anterior
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Reserves Any</p>
          <p className="mt-2 text-3xl font-bold text-slate-700">{data.bookings.thisYear}</p>
          <p className="text-xs text-slate-400 mt-1">{data.bookings.total} totals</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Ticket Mitjà</p>
          <p className="mt-2 text-3xl font-bold text-slate-700">
            {data.revenue.avgBooking.toLocaleString('ca-ES', { maximumFractionDigits: 0 })}€
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">NPS Score</p>
          <p className="mt-2 text-3xl font-bold text-slate-700">
            {data.satisfaction.nps.toFixed(1)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            ⭐ {data.satisfaction.rating.toFixed(1)} valoració
          </p>
        </div>
      </section>

      {/* Leads Section */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Leads per Font */}
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-stone-200 p-4">
            <h3 className="font-semibold text-slate-700">Leads per Font</h3>
            <p className="text-xs text-slate-500 mt-1">{data.leads.thisYear} leads aquest any</p>
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
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-stone-200 p-4">
            <h3 className="font-semibold text-slate-700">Conversió de Leads</h3>
            <p className="text-xs text-slate-500 mt-1">Estat dels leads</p>
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
      <section className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-stone-200 p-4">
          <h3 className="font-semibold text-slate-700">Reserves per Tipus d&apos;Event</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {data.bookings.byEventType.map((type) => {
              const config = EVENT_TYPE_LABELS[type.eventType] || { label: type.eventType, icon: '📅' };
              return (
                <div
                  key={type.eventType}
                  className="p-4 rounded-xl bg-slate-50 text-center"
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

      {/* Nota */}
      <section className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-700">
          💡 <strong>Consell:</strong> Google Analytics es mostra a continuació si la integració GA4 està activa.
        </p>
      </section>

      {/* GA4 Web Analytics */}
      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-700">Web Analytics (GA4)</h2>
            <p className="text-xs text-slate-500">Últims 30 dies</p>
          </div>
          {!ga4 && (
            <span className="text-xs text-red-600">
              GA4 no configurat (revisa GA4_PROPERTY_ID/CLIENT_EMAIL/PRIVATE_KEY)
            </span>
          )}
        </header>

        {ga4 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase">Usuaris actius</p>
                <p className="mt-2 text-3xl font-bold text-slate-700">{ga4.totals.activeUsers}</p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase">Sessions</p>
                <p className="mt-2 text-3xl font-bold text-slate-700">{ga4.totals.sessions}</p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase">Page Views</p>
                <p className="mt-2 text-3xl font-bold text-slate-700">{ga4.totals.pageViews}</p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase">Events</p>
                <p className="mt-2 text-3xl font-bold text-slate-700">{ga4.totals.eventCount}</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-stone-200 p-4">
                  <h3 className="font-semibold text-slate-700">Pàgines top</h3>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  {ga4.pages.map((row) => (
                    <div key={row.dimension} className="flex items-center justify-between">
                      <span className="text-slate-700 truncate max-w-[70%]">{row.dimension}</span>
                      <span className="text-slate-500">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-stone-200 p-4">
                  <h3 className="font-semibold text-slate-700">Fonts (channel)</h3>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  {ga4.sources.map((row) => (
                    <div key={row.dimension} className="flex items-center justify-between">
                      <span className="text-slate-700">{row.dimension}</span>
                      <span className="text-slate-500">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-stone-200 p-4">
                  <h3 className="font-semibold text-slate-700">Events top</h3>
                </div>
                <div className="p-4 space-y-2 text-sm">
                  {ga4.events.map((row) => (
                    <div key={row.dimension} className="flex items-center justify-between">
                      <span className="text-slate-700">{row.dimension}</span>
                      <span className="text-slate-500">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-stone-200 p-4">
                  <h3 className="font-semibold text-slate-700">Dispositius</h3>
                </div>
                <div className="p-4 space-y-2 text-sm">
                  {ga4.devices.map((row) => (
                    <div key={row.dimension} className="flex items-center justify-between">
                      <span className="text-slate-700">{row.dimension}</span>
                      <span className="text-slate-500">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-stone-200 p-4">
                  <h3 className="font-semibold text-slate-700">Ubicació</h3>
                </div>
                <div className="p-4 space-y-2 text-sm">
                  {ga4.locations.map((row) => (
                    <div key={`${row.dimension}-${row.secondary}`} className="flex items-center justify-between">
                      <span className="text-slate-700">
                        {row.dimension}{row.secondary ? ` · ${row.secondary}` : ''}
                      </span>
                      <span className="text-slate-500">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-stone-200 p-4">
                <h3 className="font-semibold text-slate-700">Temps real</h3>
              </div>
              <div className="p-4 text-sm text-slate-600">
                <p className="mb-3">Usuaris actius ara mateix: <strong>{ga4.realtime.activeUsers}</strong></p>
                <div className="space-y-2">
                  {ga4.realtime.pages.map((row) => (
                    <div key={row.dimension} className="flex items-center justify-between">
                      <span className="text-slate-700">{row.dimension}</span>
                      <span className="text-slate-500">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
