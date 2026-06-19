// app/admin/bookings/page.tsx
import './[id]/booking-detail.css';
import { log } from '@/lib/logger';
// Pàgina de gestió de reserves
import { prisma } from '@/lib/prisma';
import { cachedQuery, CacheTTL } from '@/lib/query-cache';
import Link from 'next/link';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { Prisma } from '@prisma/client';
import { AdminPage } from '../components/AdminPage';
import { AdminHelpPanel } from '../components/AdminHelpPanel';
import BookingActions from './BookingActions';
import BookingFilters from './BookingFilters';
import { BOOKING_OVERVIEW_STATUS_CARDS, formatDate, formatDateShort, formatCurrency, getBookingStatusDisplay, getEventLabel } from '@/lib/constants';
import { getMarginTone } from '@/lib/margin-utils';
import { getProfitabilityConfig } from '@/lib/services/profitabilityService';
import { computeSimpleMarginPct } from '@/lib/services/costEngine';
import { getTranslatedPackName } from '@/lib/pack-name';
import ExportCsvButton from '../components/ExportCsvButton';
import dynamicImport from 'next/dynamic';
import { ADMIN_BOOKING_PAYMENT_FILTER_OPTIONS } from '@/lib/constants/admin';
import { buildCustomerBookingListHref, buildCustomerWorkspaceTabHref, buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
import { OwnerControlStrip } from '../components/OwnerControlStrip';

const BookingPipelineViewWrapper = dynamicImport(
  () => import('./BookingPipelineView'),
  { ssr: false, loading: () => <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" /></div> },
);

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Reserves | Òrbita Admin',
};

type BookingPaymentFilter = 'deposit-pending' | 'overdue' | 'due-soon';

interface BookingSearchParams {
  page?: string;
  status?: string;
  eventType?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  view?: string;
  payment?: string;
  customerId?: string;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function resolvePaymentFilter(value?: string): BookingPaymentFilter | null {
  switch (value) {
    case 'deposit-pending':
    case 'overdue':
    case 'due-soon':
      return value;
    default:
      return null;
  }
}

function getPaymentFilterLabel(value: BookingPaymentFilter | null) {
  if (!value) return null;
  const match = ADMIN_BOOKING_PAYMENT_FILTER_OPTIONS.find((option) => option.id === value);
  return match?.label ?? null;
}

function buildBookingsWhere(params: BookingSearchParams) {
  const now = new Date();
  const paymentFilter = resolvePaymentFilter(params.payment);
  const overdueEventDateLimit = addDays(now, 30);
  const overdueRemainingDateLimit = addDays(now, 7);
  const dueSoonDepositFrom = addDays(now, 30);
  const dueSoonDepositTo = addDays(now, 37);
  const dueSoonRemainingFrom = addDays(now, 7);
  const dueSoonRemainingTo = addDays(now, 14);

  const andClauses: Prisma.BookingWhereInput[] = [];
  if (params.status) {
    andClauses.push({
      status: params.status as Prisma.BookingWhereInput['status'],
    });
  }
  if (params.eventType) {
    andClauses.push({
      eventType: params.eventType as Prisma.BookingWhereInput['eventType'],
    });
  }
  if (params.fromDate || params.toDate) {
    const eventDate: Prisma.DateTimeFilter = {};
    if (params.fromDate) {
      eventDate.gte = new Date(params.fromDate);
    }
    if (params.toDate) {
      eventDate.lte = new Date(params.toDate + 'T23:59:59');
    }
    andClauses.push({ eventDate });
  }
  if (params.search) {
    const q = params.search;
    andClauses.push({
      OR: [
        { clientName: { contains: q, mode: 'insensitive' } },
        { reference: { contains: q, mode: 'insensitive' } },
        { eventLocation: { contains: q, mode: 'insensitive' } },
        { clientEmail: { contains: q, mode: 'insensitive' } },
      ],
    });
  }
  if (params.customerId) {
    andClauses.push({ customerId: params.customerId });
  }
  if (paymentFilter === 'deposit-pending') {
    andClauses.push({ depositPaid: false });
  }
  if (paymentFilter === 'overdue') {
    andClauses.push({
      OR: [
        { depositPaid: false, eventDate: { lt: overdueEventDateLimit } },
        { remainingPaid: false, eventDate: { lt: overdueRemainingDateLimit } },
      ],
    });
  }
  if (paymentFilter === 'due-soon') {
    andClauses.push({
      OR: [
        {
          depositPaid: false,
          eventDate: {
            gte: dueSoonDepositFrom,
            lte: dueSoonDepositTo,
          },
        },
        {
          remainingPaid: false,
          eventDate: {
            gte: dueSoonRemainingFrom,
            lte: dueSoonRemainingTo,
          },
        },
      ],
    });
  }

  return {
    paymentFilter,
    where: andClauses.length > 0 ? { AND: andClauses } : {},
  } satisfies { paymentFilter: BookingPaymentFilter | null; where: Prisma.BookingWhereInput };
}

async function getBookings(params: BookingSearchParams) {
  try {
    const pageRaw = Number.parseInt(params.page || '1', 10);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const pageSize = 25;
    const { paymentFilter, where } = buildBookingsWhere(params);

    const cacheKey = `admin:bookings:${JSON.stringify({ page, pageSize, ...params })}`;

    const [bookings, stats, totalCount, exportRows] = await cachedQuery(
      cacheKey,
      () => Promise.all([
        prisma.booking.findMany({
          where,
          orderBy: { eventDate: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            pack: { include: { translations: true } },
            lead: { select: { id: true, name: true, source: true, preferredLocale: true } },
            extras: { select: { price: true, quantity: true } },
            _count: { select: { extras: true } },
          },
        }),
        prisma.booking.groupBy({
          by: ['status'],
          where,
          _count: true,
          _sum: { total: true },
        }),
        prisma.booking.count({ where }),
        prisma.booking.findMany({
          where,
          orderBy: { eventDate: 'desc' },
          select: {
            reference: true,
            clientName: true,
            eventDate: true,
            eventType: true,
            status: true,
            total: true,
          },
        }),
      ]),
      CacheTTL.VERY_SHORT
    );

    return {
      bookings,
      stats,
      exportRows,
      paymentFilter,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
      },
    };
  } catch (error) {
    log.error('Error obtenint reserves:', error);
    return {
      bookings: [],
      stats: [],
      exportRows: [],
      paymentFilter: null,
      pagination: { page: 1, pageSize: 25, total: 0, totalPages: 1 },
    };
  }
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams?: BookingSearchParams;
}) {
  const sp = searchParams || {};
  const isKanban = sp.view === 'kanban';
  const customerId = sp.customerId && sp.customerId.trim() ? sp.customerId.trim() : undefined;
  const [{ bookings, stats, exportRows, pagination, paymentFilter }, profitConfig] = await Promise.all([
    getBookings(sp),
    getProfitabilityConfig(),
  ]);

  const statsMap = stats.reduce((acc, s) => {
    acc[s.status] = { count: s._count, revenue: s._sum.total || 0 };
    return acc;
  }, {} as Record<string, { count: number; revenue: number }>);

  const totalRevenue = stats.reduce((sum, s) => sum + (s._sum.total || 0), 0);
  const paymentFilterLabel = getPaymentFilterLabel(paymentFilter);
  const now = new Date();
  const nextWeek = addDays(now, 7);
  const pendingPaymentCount = bookings.filter((booking) => !booking.depositPaid || !booking.remainingPaid).length;
  const overduePaymentCount = bookings.filter((booking) => {
    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') return false;
    const eventDate = new Date(booking.eventDate);
    return (!booking.depositPaid && eventDate < addDays(now, 30)) || (!booking.remainingPaid && eventDate < addDays(now, 7));
  }).length;
  const upcomingExecutionCount = bookings.filter((booking) => {
    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') return false;
    const eventDate = new Date(booking.eventDate);
    return eventDate >= now && eventDate <= nextWeek;
  }).length;
  const preparingCount = statsMap.PREPARING?.count || 0;
  const automaticSignals = [
    customerId ? 'Llista contextual del client activa' : null,
    paymentFilterLabel ? `Focus automàtic: ${paymentFilterLabel}` : null,
    upcomingExecutionCount > 0 ? `${upcomingExecutionCount} reserva${upcomingExecutionCount > 1 ? 'es' : ''} dins dels pròxims 7 dies` : null,
    preparingCount > 0 ? `${preparingCount} reserva${preparingCount > 1 ? 'es' : ''} en preparació` : null,
  ].filter(Boolean) as string[];
  const manualSignals = [
    overduePaymentCount > 0 ? `${overduePaymentCount} cobrament${overduePaymentCount > 1 ? 's' : ''} en risc o vençut${overduePaymentCount > 1 ? 's' : ''}` : null,
    pendingPaymentCount > 0 ? `${pendingPaymentCount} reserva${pendingPaymentCount > 1 ? 'es' : ''} amb cobrament pendent` : null,
    statsMap.PENDING?.count ? `${statsMap.PENDING.count} reserva${statsMap.PENDING.count > 1 ? 'es' : ''} pendents de confirmar` : null,
  ].filter(Boolean) as string[];
  const nextStepHref = overduePaymentCount > 0
    ? customerId
      ? buildCustomerBookingListHref(customerId, { payment: 'overdue' })
      : '/admin/bookings?payment=overdue'
    : upcomingExecutionCount > 0
      ? customerId
        ? buildCustomerBookingListHref(customerId, { status: 'PREPARING' })
        : '/admin/bookings?status=PREPARING'
      : customerId
        ? buildCustomerWorkspaceTabHref(customerId, 'bookings')
        : '/admin/bookings/new';
  const nextStepLabel = overduePaymentCount > 0
    ? 'Revisar cobraments en risc'
    : upcomingExecutionCount > 0
      ? 'Preparar reserves imminents'
      : customerId
        ? 'Obrir workspace del client'
        : 'Crear reserva nova';
  const nextStepDetail = overduePaymentCount > 0
    ? 'La prioritat és tancar imports que poden afectar execució o caixa.'
    : upcomingExecutionCount > 0
      ? 'Hi ha execució pròxima i convé revisar checklist, timings i estat.'
      : customerId
        ? 'No hi ha tensió clara ara mateix, però el context del client continua actiu.'
        : 'No hi ha senyal calent a la llista actual.';

  return (
    <div className="bd__root">

      {/* ── Header sticky — mateix patró que la fitxa de reserva ── */}
      <div className="ap-sticky-header">
        <div className="ap-detail-bar" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 20px' }}>
          {customerId ? (
            <Link href={buildCustomerWorkspaceTabHref(customerId, 'bookings')} className="ap-detail-bar-btn">← Client</Link>
          ) : (
            <span className="ap-detail-kicker">Agenda</span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ExportCsvButton
              filename="reserves"
              headers={['Referència', 'Client', 'Data', 'Tipus', 'Estat', 'Total (€)']}
              rows={exportRows.map((b) => [
                b.reference,
                b.clientName,
                formatDate(b.eventDate),
                getEventLabel(b.eventType),
                b.status,
                String(b.total),
              ])}
            />
            <Link href="/admin/bookings/new" className="ap-detail-bar-btn ap-detail-bar-btn--accent">+ Nova</Link>
          </div>
        </div>
        <div className="ap-detail-hero">
          <p className="ap-detail-kicker">Reserva · {pagination.total} esdeveniments</p>
          <h1 className="ap-detail-title">Reserves</h1>
        </div>
      </div>

      {paymentFilterLabel && (
        <div className="bk-payment-filter-banner ap-detail-stats-cell ap-detail-stats-cell--warn">
          <span className="ap-detail-stats-label">Focus</span>
          <span className="ap-detail-stats-val text-sm">{paymentFilterLabel}</span>
          <Link href="/admin/bookings" className="text-xs opacity-60 hover:opacity-100 ml-auto">Veure totes →</Link>
        </div>
      )}

      <div style={{ maxWidth: 1220, margin: '0 auto', padding: '8px 20px', width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>

        <div className="bk-stats-bar ap-detail-stats">
          <div className="ap-detail-stats-cell ap-detail-stats-cell--gold">
            <span className="ap-detail-stats-label">Total</span>
            <span className="ap-detail-stats-val">{pagination.total} · {formatCurrency(totalRevenue)}</span>
          </div>
          {BOOKING_OVERVIEW_STATUS_CARDS.map((card) => (
            <div key={card.status} className="ap-detail-stats-cell">
              <span className="ap-detail-stats-label">{card.label}</span>
              <span className="ap-detail-stats-val">{statsMap[card.status]?.count || 0}</span>
            </div>
          ))}
        </div>

        <BookingFilters />

      </div>

      {isKanban && (
        <BookingPipelineViewWrapper />
      )}

      {!isKanban && <div style={{ maxWidth: 1220, margin: '0 auto', padding: '0 20px', width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}><>
      <section className="lg:hidden space-y-3">
        {bookings.length === 0 ? (
          <div className="rounded-2xl border admin-card-glass p-8 text-center">
            <span className="text-4xl">📅</span>
            <p className="mt-2">Encara no hi ha reserves</p>
            <p className="text-xs mt-1 admin-tone-text-slate">Quan un lead es confirma, es genera una reserva automàticament. També pots crear-ne una manualment.</p>
            <Link href="/admin/bookings/new" className="text-sm mt-3 inline-block font-medium">
              Crear primera reserva →
            </Link>
          </div>
        ) : (
          bookings.map((booking) => {
            const statusConf = getBookingStatusDisplay(booking.status);
            const eventType = getEventLabel(booking.eventType);
            const isPast = new Date(booking.eventDate) < new Date();

            return (
              <article
                key={booking.id}
                className={`block rounded-2xl border admin-card-glass p-4 transition-colors ${
                  isPast && booking.status !== 'COMPLETED'
                    ? 'admin-tone-border-warning'
                    : 'admin-tone-border-neutral admin-tone-bg-neutral hover:brightness-105'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link href={buildBookingHref(booking.id)}>
                        <code className="text-xs font-mono px-1.5 py-0.5 rounded">{booking.reference}</code>
                      </Link>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConf.bg} ${statusConf.text}`}>
                        {statusConf.label}
                      </span>
                    </div>
                    {booking.customerId ? (
                      <Link
                        href={buildCustomerHubHref(booking.customerId)}
                        className="font-medium mt-2 truncate block"
                      >
                        {booking.clientName} 👤
                      </Link>
                    ) : (
                      <p className="font-medium mt-2 truncate">{booking.clientName}</p>
                    )}
                    <p className="text-xs truncate">{booking.eventLocation}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold">{formatCurrency(booking.total)}</p>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium mt-0.5 ${booking.depositPaid && booking.remainingPaid ? 'admin-tone-text-success' : booking.depositPaid ? 'admin-tone-text-warning' : 'admin-tone-text-danger'}`}>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${booking.depositPaid && booking.remainingPaid ? 'admin-tone-bg-success' : booking.depositPaid ? 'admin-tone-bg-warning' : 'admin-tone-bg-danger'}`} />
                      {booking.depositPaid && booking.remainingPaid ? 'Pagat' : booking.depositPaid ? 'Parcial' : 'Pendent'}
                    </span>
                    {(() => {
                      const extrasTotal = booking.extras.reduce((sum, e) => sum + e.price * e.quantity, 0);
                      const marginPct = computeSimpleMarginPct(
                        {
                          total: booking.total,
                          packPrice: booking.pack.price,
                          extrasTotal,
                          extraHours: 0,
                          extraHourPrice: 0,
                          distanceKm: 0,
                          travelCost: booking.travelCost ?? 0,
                        },
                        profitConfig,
                      );
                      const tone = getMarginTone(marginPct);
                      return (
                        <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs font-semibold mt-1 ${tone.bg} ${tone.color}`}>
                          {marginPct.toFixed(0)}% marge
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="">{eventType}</span>
                    <span className="px-1.5 py-0.5 rounded text-xs font-medium">
                      {getTranslatedPackName(booking.pack.translations, booking.pack.slug, booking.lead?.preferredLocale)}
                    </span>
                  </div>
                  <span className="font-medium flex items-center gap-1.5">
                    {formatDateShort(booking.eventDate)}
                    {!isPast && booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (() => {
                      const d = Math.ceil((new Date(booking.eventDate).getTime() - Date.now()) / 864e5);
                      return (
                        <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                          d === 0 ? 'admin-tone-soft-info' : d <= 7 ? 'admin-tone-bg-warning admin-tone-text-warning' : 'admin-tone-bg-neutral admin-tone-text-neutral'
                        }`}>
                          {d === 0 ? 'AVUI' : `${d}d`}
                        </span>
                      );
                    })()}
                  </span>
                </div>
                <div className="mt-3">
                  <BookingActions
                    id={booking.id}
                    status={booking.status}
                    eventDate={booking.eventDate.toISOString()}
                    customerId={booking.customerId}
                  />
                </div>
              </article>
            );
          })
        )}
      </section>

      <section className="bk-table-section hidden lg:block overflow-hidden">
          <table className="w-full" aria-label="Llistat de reserves">
            <thead className="bk-table-head">
              <tr>
                <th scope="col" className="px-3 py-2 text-left bk-th-label w-[9%]">Ref.</th>
                <th scope="col" className="px-3 py-2 text-left bk-th-label">Client</th>
                <th scope="col" className="px-3 py-2 text-left bk-th-label w-[11%]">Tipus</th>
                <th scope="col" className="px-3 py-2 text-left bk-th-label w-[11%]">Data</th>
                <th scope="col" className="px-3 py-2 text-left bk-th-label w-[9%]">Pack</th>
                <th scope="col" className="px-3 py-2 text-left bk-th-label w-[10%]">Total</th>
                <th scope="col" className="px-3 py-2 text-left bk-th-label w-[7%]">Marge</th>
                <th scope="col" className="px-3 py-2 text-left bk-th-label w-[9%]">Estat</th>
                <th scope="col" className="px-3 py-2 text-right bk-th-label w-[18%]">Accions</th>
              </tr>
            </thead>
            <tbody className="divide-y admin-tone-border-subtle">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <span className="text-4xl">📅</span>
                    <p className="mt-2">Encara no hi ha reserves</p>
                    <p className="text-xs mt-1 admin-tone-text-slate">Quan un lead es confirma, es genera una reserva automàticament.</p>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const statusConf = getBookingStatusDisplay(booking.status);
                  const eventType = getEventLabel(booking.eventType);
                  const isPast = new Date(booking.eventDate) < new Date();

                  return (
                    <tr
                      key={booking.id}
                      className={`bk-table-row hover:bg-white/[0.025] transition-colors${isPast && booking.status !== 'COMPLETED' ? ' bk-table-row--past' : ''}`}
                    >
                      <td className="px-3 py-2.5">
                        <Link href={buildBookingHref(booking.id)} className="block max-w-[7rem] truncate font-mono text-xs text-[var(--gold)] hover:opacity-80 whitespace-nowrap">
                          {booking.reference}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5">
                        {booking.customerId ? (
                          <Link href={buildCustomerHubHref(booking.customerId!)} className="font-semibold text-sm hover:text-white truncate block max-w-[160px]">
                            {booking.clientName}
                          </Link>
                        ) : (
                          <span className="font-semibold text-sm truncate block max-w-[160px]">{booking.clientName}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-sm">{eventType}</td>
                      <td className="px-3 py-2.5 max-w-[8rem] whitespace-nowrap">
                        <span className="text-sm font-medium">{formatDateShort(booking.eventDate)}</span>
                        {!isPast && booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (() => {
                          const d = Math.ceil((new Date(booking.eventDate).getTime() - Date.now()) / 864e5);
                          return (
                            <span className={`ml-1 inline-flex rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                              d === 0 ? 'admin-tone-soft-info' : d <= 7 ? 'admin-tone-bg-warning admin-tone-text-warning' : 'opacity-40'
                            }`}>
                              {d === 0 ? 'AVUI' : `${d}d`}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-2.5 text-sm">
                        <span className="truncate block max-w-[100px]">
                          {getTranslatedPackName(booking.pack.translations, booking.pack.slug, booking.lead?.preferredLocale)}
                        </span>
                        {booking._count.extras > 0 && <span className="opacity-50 text-xs">+{booking._count.extras}</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="max-w-[7rem] truncate text-sm font-bold tabular-nums whitespace-nowrap">{formatCurrency(booking.total)}</div>
                        <span className={`inline-flex items-center gap-1 text-xs mt-0.5 ${booking.depositPaid && booking.remainingPaid ? 'admin-tone-text-success' : booking.depositPaid ? 'admin-tone-text-warning' : 'admin-tone-text-danger'}`}>
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${booking.depositPaid && booking.remainingPaid ? 'admin-tone-bg-success' : booking.depositPaid ? 'admin-tone-bg-warning' : 'admin-tone-bg-danger'}`} />
                          {booking.depositPaid && booking.remainingPaid ? 'Pagat' : booking.depositPaid ? 'Parcial' : 'Pendent'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {(() => {
                          const extrasTotal = booking.extras.reduce((sum, e) => sum + e.price * e.quantity, 0);
                          const marginPct = computeSimpleMarginPct(
                            {
                              total: booking.total,
                              packPrice: booking.pack.price,
                              extrasTotal,
                              extraHours: 0,
                              extraHourPrice: 0,
                              distanceKm: 0,
                              travelCost: booking.travelCost ?? 0,
                            },
                            profitConfig,
                          );
                          const tone = getMarginTone(marginPct);
                          return (
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${tone.bg} ${tone.color}`}>
                              {marginPct.toFixed(0)}%
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusConf.bg} ${statusConf.text}`}>
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <BookingActions
                          id={booking.id}
                          status={booking.status}
                          eventDate={booking.eventDate.toISOString()}
                          customerId={booking.customerId}
                          compact
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
      </section>
      </></div>}

      {!isKanban && pagination.totalPages > 1 && (
        <section className="flex flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-xs sm:flex-row sm:justify-between">
          <span>
            Pàgina {pagination.page} de {pagination.totalPages}
          </span>
          <div className="flex items-center gap-2">
            {(() => {
              const filterParams = new URLSearchParams();
              if (sp.status) filterParams.set('status', sp.status);
              if (sp.eventType) filterParams.set('eventType', sp.eventType);
              if (sp.payment) filterParams.set('payment', sp.payment);
              if (sp.fromDate) filterParams.set('fromDate', sp.fromDate);
              if (sp.toDate) filterParams.set('toDate', sp.toDate);
              if (sp.search) filterParams.set('search', sp.search);
              if (sp.view) filterParams.set('view', sp.view);
              if (customerId) filterParams.set('customerId', customerId);
              const prevHref = customerId
                ? buildCustomerBookingListHref(customerId, {
                    status: sp.status,
                    eventType: sp.eventType,
                    payment: sp.payment,
                    fromDate: sp.fromDate,
                    toDate: sp.toDate,
                    search: sp.search,
                    view: sp.view,
                    page: pagination.page - 1,
                  })
                : `/admin/bookings?page=${pagination.page - 1}${filterParams.toString() ? `&${filterParams.toString()}` : ''}`;
              const nextHref = customerId
                ? buildCustomerBookingListHref(customerId, {
                    status: sp.status,
                    eventType: sp.eventType,
                    payment: sp.payment,
                    fromDate: sp.fromDate,
                    toDate: sp.toDate,
                    search: sp.search,
                    view: sp.view,
                    page: pagination.page + 1,
                  })
                : `/admin/bookings?page=${pagination.page + 1}${filterParams.toString() ? `&${filterParams.toString()}` : ''}`;
              return (
                <>
                  {pagination.page > 1 ? (
                    <Link href={prevHref} className="rounded-xl border px-3 py-1">← Anterior</Link>
                  ) : (
                    <span className="rounded-xl border px-3 py-1">← Anterior</span>
                  )}
                  {pagination.page < pagination.totalPages ? (
                    <Link href={nextHref} className="rounded-xl border px-3 py-1">Següent →</Link>
                  ) : (
                    <span className="rounded-xl border px-3 py-1">Següent →</span>
                  )}
                </>
              );
            })()}
          </div>
        </section>
      )}
    </div>
  );
}
