// app/admin/bookings/[id]/page.tsx
import { log } from '@/lib/logger';
// Detall de reserva amb canvi d'estat
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookingStatusChanger } from './BookingStatusChanger';
import CommunicationPanel from './CommunicationPanel';
import { deriveFlowStatus } from '@/lib/services/communicationStatusService';
import CalendarSyncButton from './CalendarSyncButton';
import PostEventEmailButton from './PostEventEmailButton';
import BookingMarginCard from './BookingMarginCard';
import InvoiceSection from './InvoiceSection';
import DocumentFlowSection from './DocumentFlowSection';
import BookingInventorySection from './BookingInventorySection';
import ClientPortalAccessPanel from './ClientPortalAccessPanel';
import { getActivePortalAccessForBooking } from '@/lib/services/clientPortalAccess';
import { calculateCostPerHour, calculateEventDuration } from '@/lib/inventory-utils';
import { getProfitabilityConfig } from '@/lib/services/profitabilityService';

import { BOOKING_STATUS_CONFIG as STATUS_CONFIG, EVENT_TYPE_LABELS, formatDate, formatCurrency, formatDateSimple, formatDateTimeFull } from '@/lib/constants';
import { AdminPage } from '../../components/AdminPage';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

async function getBooking(id: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        pack: { include: { translations: true, inventory: { include: { item: true } } } },
        extras: { include: { extra: { include: { translations: true } } } },
        inventory: { include: { item: true } },
        lead: true,
        proposals: {
          select: {
            id: true, reference: true, status: true, pdfUrl: true,
            contractStatus: true, contractReference: true, contractPdfUrl: true, contractSignedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          select: { id: true, reference: true, status: true, total: true, holdedInvoiceUrl: true, holdedSyncError: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        postEventReport: true,
        clientSurvey: true,
        clientFeedback: true,
      },
    });

    return booking;
  } catch (error) {
    log.error('Error obtenint reserva:', error);
    return null;
  }
}


function toGoogleCalendarUtc(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}T${hh}${min}${ss}Z`;
}

function combineDateAndTime(baseDate: Date, time: string | null): Date | null {
  if (!time) return null;
  const [hRaw, mRaw] = time.split(':');
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const dt = new Date(baseDate);
  dt.setHours(h, m, 0, 0);
  return dt;
}

function buildGoogleCalendarUrl(booking: {
  reference: string;
  clientName: string;
  eventDate: Date;
  eventStartTime: string | null;
  eventEndTime: string | null;
  eventLocation: string;
  eventVenue: string | null;
  notes: string | null;
}) {
  const title = `Òrbita · ${booking.reference} · ${booking.clientName}`;
  const start = combineDateAndTime(booking.eventDate, booking.eventStartTime);
  const end = combineDateAndTime(booking.eventDate, booking.eventEndTime);
  const location = [booking.eventVenue, booking.eventLocation].filter(Boolean).join(' · ');
  const details = [
    `Client: ${booking.clientName}`,
    `Referència: ${booking.reference}`,
    booking.notes ? `Notes: ${booking.notes}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const params = new URLSearchParams();
  params.set('action', 'TEMPLATE');
  params.set('text', title);
  if (start && end && end.getTime() > start.getTime()) {
    params.set('dates', `${toGoogleCalendarUtc(start)}/${toGoogleCalendarUtc(end)}`);
    params.set('ctz', 'Europe/Madrid');
  } else {
    const dayStart = new Date(booking.eventDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    const yyyymmdd = `${dayStart.getFullYear()}${String(dayStart.getMonth() + 1).padStart(2, '0')}${String(dayStart.getDate()).padStart(2, '0')}`;
    const yyyymmddEnd = `${dayEnd.getFullYear()}${String(dayEnd.getMonth() + 1).padStart(2, '0')}${String(dayEnd.getDate()).padStart(2, '0')}`;
    params.set('dates', `${yyyymmdd}/${yyyymmddEnd}`);
  }
  if (location) params.set('location', location);
  if (details) params.set('details', details);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function parseLogDetails(details: unknown): Record<string, unknown> {
  if (!details || typeof details !== 'object') return {};
  return details as Record<string, unknown>;
}

function getPackTranslation(
  translations: Array<{ locale: string; name: string; tagline?: string | null }>,
  locale?: string | null
) {
  const preferred = String(locale || 'ca').toLowerCase();
  return (
    translations.find((t) => t.locale === preferred) ||
    translations.find((t) => t.locale === 'ca') ||
    translations[0]
  );
}

export default async function BookingDetailPage({ params }: PageProps) {
  const booking = await getBooking(params.id);

  if (!booking) {
    notFound();
  }

  const statusConf = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
  const eventType = EVENT_TYPE_LABELS[booking.eventType] || booking.eventType;
  const packTranslation = getPackTranslation(
    booking.pack.translations,
    booking.lead?.preferredLocale || booking.preferredLocale || 'ca'
  );
  // Paral·lelitzar totes les queries secundàries
  const [commLogs, customer, activePortalAccess, profitabilityConfig, marginTargetSetting] = await Promise.all([
    prisma.adminLog.findMany({
      where: {
        entity: 'booking',
        entityId: booking.id,
        action: { in: ['COMM_SENT', 'COMM_RESPONDED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    booking.customerId
      ? prisma.customer.findUnique({
          where: { id: booking.customerId },
          select: { id: true, totalEvents: true, totalSpent: true, lastEventDate: true },
        })
      : prisma.customer.findFirst({
          where: { emailNormalized: booking.clientEmail.trim().toLowerCase() },
          select: { id: true, totalEvents: true, totalSpent: true, lastEventDate: true },
        }),
    getActivePortalAccessForBooking(booking.id) as Promise<Parameters<typeof ClientPortalAccessPanel>[0]['initialActive']>,
    getProfitabilityConfig(),
    prisma.setting.findUnique({ where: { key: 'pricing.pack.marginTargetPct' } }),
  ]);
  const commStatuses = {
    PAYMENT: deriveFlowStatus(commLogs, 'PAYMENT'),
    POST_EVENT: deriveFlowStatus(commLogs, 'POST_EVENT'),
    GENERAL: deriveFlowStatus(commLogs, 'GENERAL'),
  } as const;
  const reviewFlowStatus = booking.reviewSubmittedAt || booking.clientSurvey
    ? 'RESPONDIDO'
    : booking.postEventEmailSent
      ? 'ENVIADO'
      : 'FALTA_ENVIAR';
  const internalPostEventStatus =
    booking.postEventReport && booking.clientFeedback?.sentAt
      ? 'COMPLETO'
      : booking.postEventReport || booking.clientFeedback?.sentAt
        ? 'EN_PROGRESO'
        : 'PENDIENTE';
  const googleCalendarUrl = buildGoogleCalendarUrl({
    reference: booking.reference,
    clientName: booking.clientName,
    eventDate: booking.eventDate,
    eventStartTime: booking.eventStartTime,
    eventEndTime: booking.eventEndTime,
    eventLocation: booking.eventLocation,
    eventVenue: booking.eventVenue,
    notes: booking.notes,
  });
  const recentCommRows = commLogs.slice(0, 12).map((logEntry) => {
    const details = parseLogDetails(logEntry.details);
    return {
      id: logEntry.id,
      createdAt: logEntry.createdAt,
      action: logEntry.action,
      flow: typeof details.flow === 'string' ? details.flow : '-',
      channel: typeof details.channel === 'string' ? details.channel : '-',
    };
  });
  const bAny = booking as Record<string, unknown>;
  const packPrice = booking.pack?.price ? Number(booking.pack.price) : 0;
  const extrasTotal = booking.extras?.reduce((sum, e) => sum + Number(e.price || 0) * (e.quantity || 1), 0) ?? 0;
  const extraHours = typeof bAny.extraHours === 'number' ? bAny.extraHours : 0;
  const extraHourPrice = booking.pack?.extraHourPrice ? Number(booking.pack.extraHourPrice) : 0;
  const marginTargetRaw = Number(marginTargetSetting?.value);
  const targetMarginPct = Number.isFinite(marginTargetRaw)
    ? (marginTargetRaw > 1 ? marginTargetRaw : marginTargetRaw * 100)
    : 35;
  const inventoryHours = calculateEventDuration(booking.eventStartTime, booking.eventEndTime);
  const assignedItemIds = (booking.inventory || []).map((assigned) => assigned.itemId);
  const usageByItem = assignedItemIds.length > 0
    ? new Map(
        (await prisma.inventoryUsage.groupBy({
          by: ['itemId'],
          where: { itemId: { in: assignedItemIds } },
          _sum: { hoursUsed: true },
        })).map((row) => [row.itemId, row._sum.hoursUsed || 0])
      )
    : new Map<string, number>();
  const inventoryCostReal = (booking.inventory || []).reduce((sum, assigned) => {
    const perHour = calculateCostPerHour(assigned.item.purchasePrice, assigned.item.expectedLifeHours);
    return sum + (perHour * (assigned.quantity || 1) * inventoryHours);
  }, 0);
  const remainingHoursList = (booking.inventory || []).map((assigned) => {
    const expectedLifeHours = assigned.item.expectedLifeHours || 2000;
    const used = usageByItem.get(assigned.itemId) || 0;
    return Math.max(0, expectedLifeHours - used);
  });
  const inventoryRemainingHoursAvg = remainingHoursList.length > 0
    ? remainingHoursList.reduce((acc, n) => acc + n, 0) / remainingHoursList.length
    : null;
  const inventoryRemainingHoursMin = remainingHoursList.length > 0
    ? Math.min(...remainingHoursList)
    : null;

  return (
    <AdminPage
      title={`Reserva ${booking.reference}`}
      back={{ href: '/admin/bookings', label: 'Reserves' }}
      subtitle={
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusConf.bg} ${statusConf.text}`}>
            {statusConf.label}
          </span>
          <span className="text-sm">{eventType} · {formatDate(booking.eventDate)}</span>
          {customer && (
            <Link
              href={`/admin/clientes/${customer.id}`}
              className="ap-btn ap-btn--secondary"
            >
              👤 Fitxa Client
            </Link>
          )}
          {booking.lead && (
            <Link
              href={`/admin/leads/${booking.lead.id}`}
              className="ap-btn ap-btn--secondary"
            >
              📥 Entrada original
            </Link>
          )}
        </div>
      }
      actions={
        <BookingStatusChanger
          bookingId={booking.id}
          currentStatus={booking.status}
          guestCount={booking.guestCount}
        />
      }
    >

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-white/10 px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-wide">Total reserva</p>
          <p className="text-xl font-semibold">{formatCurrency(booking.total)}</p>
        </div>
        <div className="rounded-xl border border-white/10 px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-wide">Pagament</p>
          <p className="text-xl font-semibold">
            {booking.depositPaid && booking.remainingPaid ? 'Completat' : booking.depositPaid ? 'Parcial' : 'Pendent'}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-wide">Flux client</p>
          <p className="text-xl font-semibold">
            {reviewFlowStatus === 'RESPONDIDO'
              ? 'Respost'
              : reviewFlowStatus === 'ENVIADO'
                ? 'Enviat'
                : 'Falta enviar'}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-wide">Post-event intern</p>
          <p className="text-xl font-semibold">
            {internalPostEventStatus === 'COMPLETO'
              ? 'Completat'
              : internalPostEventStatus === 'EN_PROGRESO'
                ? 'En progrés'
                : 'Pendent'}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-wide">Entrada comercial</p>
          <p className="text-xl font-semibold">
            {booking.lead ? (
              <Link href={`/admin/leads/${booking.lead.id}`} className="transition-colors">
                {booking.lead.status}
              </Link>
            ) : 'Sense lead'}
          </p>
        </div>
      </section>

      {/* Client Info */}
      <section className="rounded-xl border border-white/10 shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Informació del Client</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase">Nom</p>
            {customer ? (
              <Link href={`/admin/clientes/${customer.id}`} className="mt-1 font-medium transition-colors block">
                {booking.clientName}
              </Link>
            ) : (
              <p className="mt-1 font-medium">{booking.clientName}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium uppercase">Email</p>
            <a href={`mailto:${booking.clientEmail}`} className="mt-1 hover:underline block">
              {booking.clientEmail}
            </a>
          </div>
          <div>
            <p className="text-xs font-medium uppercase">Telèfon</p>
            <a href={`tel:${booking.clientPhone}`} className="mt-1 hover:underline block">
              {booking.clientPhone}
            </a>
          </div>
        </div>
        {booking.lead && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <Link
              href={`/admin/leads/${booking.lead.id}`}
              className="text-sm hover:underline"
            >
              Veure lead original →
            </Link>
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <PostEventEmailButton bookingId={booking.id} />
          {customer && (
            <Link
              href={`/admin/clientes/${customer.id}`}
              className="rounded-xl border border-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/5 transition-colors"
            >
              Fitxa client 360
            </Link>
          )}
          <CalendarSyncButton bookingId={booking.id} />
          <details className="relative group">
            <summary className="list-none rounded-xl border border-white/10 px-3 py-1.5 text-xs font-semibold cursor-pointer hover:bg-white/5 transition-colors select-none">
              Mes accions ▾
            </summary>
            <div className="absolute right-0 top-full mt-1 z-20 w-52 rounded-xl border border-white/10 bg-black shadow-xl py-1">
              <Link
                href={`/admin/post-event/reports/new?bookingId=${booking.id}`}
                className="block px-4 py-2 text-xs hover:bg-white/5 transition-colors"
              >
                Crear informe intern
              </Link>
              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 text-xs hover:bg-white/5 transition-colors"
              >
                Afegir a Google Calendar
              </a>
              <Link
                href="/admin/settings/integrations"
                className="block px-4 py-2 text-xs hover:bg-white/5 transition-colors"
              >
                Sincronitzar mobil/ICS
              </Link>
            </div>
          </details>
        </div>
        {customer && (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
            Historial client: {customer.totalEvents} esdeveniments · {formatCurrency(customer.totalSpent)} ·
            {' '}últim esdeveniment {formatDateSimple(customer.lastEventDate)}
          </div>
        )}
      </section>

      {/* Event Info */}
      <section className="rounded-xl border border-white/10 shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Detalls de l&apos;Event</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase">Tipus</p>
            <p className="mt-1">{eventType}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase">Data</p>
            <p className="mt-1 font-medium">{formatDate(booking.eventDate)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase">Horari</p>
            <p className="mt-1">
              {booking.eventStartTime || '--:--'} - {booking.eventEndTime || '--:--'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase">Convidats</p>
            <p className="mt-1 font-medium">{booking.guestCount} persones</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium uppercase">Ubicació</p>
            <p className="mt-1">{booking.eventLocation}</p>
          </div>
          {booking.eventVenue && (
            <div className="sm:col-span-2">
              <p className="text-xs font-medium uppercase">Espai</p>
              <p className="mt-1">{booking.eventVenue}</p>
            </div>
          )}
        </div>
      </section>

      {/* Services */}
      <section className="rounded-xl border border-white/10 shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Serveis Contractats</h2>

        {/* Pack */}
        <div className="p-4 rounded-xl border mb-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium uppercase">Pack</span>
              <Link href={`/admin/packs/${booking.pack.id}`} className="text-lg font-semibold underline decoration-white/20 hover:decoration-white/60 transition-colors">
                {packTranslation?.name || booking.pack.slug}
              </Link>
              {packTranslation?.tagline && (
                <p className="text-sm">{packTranslation.tagline}</p>
              )}
              <p className="text-xs mt-1">
                {booking.pack.djHours}h DJ · {booking.pack.soundWatts}W So
                {booking.pack.includesFog && ' · Fum'}
                {booking.pack.includesMic && ' · Micro'}
              </p>
            </div>
            <p className="text-xl font-bold">{formatCurrency(booking.pack.price)}</p>
          </div>
        </div>

        {/* Extras */}
        {booking.extras.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Extras</p>
            {booking.extras.map((extra) => {
              const extraTranslation = getPackTranslation(
                extra.extra.translations as Array<{ locale: string; name: string; tagline?: string | null }>,
                booking.lead?.preferredLocale || booking.preferredLocale || 'ca'
              );
              return (
                <div key={extra.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div>
                    <p className="font-medium">
                      {extraTranslation?.name || extra.extra.slug}
                    </p>
                    {extra.quantity > 1 && (
                      <p className="text-xs">x{extra.quantity}</p>
                    )}
                  </div>
                  <p className="font-medium">{formatCurrency(extra.price)}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Extra Hours */}
        {booking.extraHours > 0 && (
          <div className="mt-4 flex items-center justify-between p-3 rounded-xl">
            <p className="font-medium">Hores extra</p>
            <p className="font-medium">
              {booking.extraHours}h × {formatCurrency(booking.pack.extraHourPrice)} = {formatCurrency(booking.extraHours * booking.pack.extraHourPrice)}
            </p>
          </div>
        )}
      </section>

      {/* Equipament assignat */}
      <BookingInventorySection bookingId={booking.id} />

      <ClientPortalAccessPanel
        bookingId={booking.id}
        initialActive={activePortalAccess}
      />

      {/* Pricing */}
      <section className="rounded-xl border border-white/10 shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Resum Econòmic</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(booking.subtotal)}</span>
          </div>
          {booking.discount > 0 && (
            <div className="flex justify-between">
              <span>Descompte {booking.discountCode && `(${booking.discountCode})`}</span>
              <span>-{formatCurrency(booking.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>IVA ({booking.vatRate}%)</span>
            <span>{formatCurrency(booking.vatAmount)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold pt-3 border-t">
            <span>Total</span>
            <span>{formatCurrency(booking.total)}</span>
          </div>
        </div>

        {/* Payment Status */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className={`p-4 rounded-xl ${booking.depositPaid ? 'bg-emerald-950/30 border border-emerald-400/30' : 'bg-rose-950/30 border border-rose-400/30'}`}>
            <p className="text-xs font-medium uppercase">Paga i Senyal (30%)</p>
            <p className="text-lg font-bold">{formatCurrency(booking.depositAmount)}</p>
            <span className={`text-xs ${booking.depositPaid ? 'text-emerald-300' : 'text-rose-300'}`}>
              {booking.depositPaid ? '✓ Pagat' : '✗ Pendent'}
            </span>
          </div>
          <div className={`p-4 rounded-xl ${booking.remainingPaid ? 'bg-emerald-950/30 border border-emerald-400/30' : 'bg-amber-950/30 border border-amber-400/30'}`}>
            <p className="text-xs font-medium uppercase">Resta</p>
            <p className="text-lg font-bold">{formatCurrency(booking.remainingAmount)}</p>
            <span className={`text-xs ${booking.remainingPaid ? 'text-emerald-300' : 'text-amber-300'}`}>
              {booking.remainingPaid ? '✓ Pagat' : '○ Pendent'}
            </span>
          </div>
        </div>
      </section>

      {/* Margin + Travel Cost (editable) */}
      <BookingMarginCard
        bookingId={booking.id}
        total={Number(booking.total)}
        packPrice={packPrice}
        extrasTotal={extrasTotal}
        extraHours={extraHours}
        extraHourPrice={extraHourPrice}
        distanceKm={typeof bAny.distanceKm === 'number' ? bAny.distanceKm : null}
        fuelCostPerKm={typeof bAny.fuelCostPerKm === 'number' ? bAny.fuelCostPerKm : null}
        travelCost={typeof bAny.travelCost === 'number' ? bAny.travelCost : null}
        source={booking.lead?.source || 'UNKNOWN'}
        eventLocation={booking.eventLocation}
        eventVenue={booking.eventVenue}
        inventoryCostReal={inventoryCostReal > 0 ? Number(inventoryCostReal.toFixed(2)) : null}
        inventoryHours={inventoryHours > 0 ? inventoryHours : null}
        inventoryRemainingHoursAvg={inventoryRemainingHoursAvg != null ? Number(inventoryRemainingHoursAvg.toFixed(1)) : null}
        inventoryRemainingHoursMin={inventoryRemainingHoursMin != null ? Number(inventoryRemainingHoursMin.toFixed(1)) : null}
        packCostRatio={profitabilityConfig.packCostRatio}
        extraCostRatio={profitabilityConfig.extraCostRatio}
        extraHourCostRatio={profitabilityConfig.extraHourCostRatio}
        fixedOperationalCost={profitabilityConfig.fixedOperationalCost}
        targetMarginPct={targetMarginPct}
      />

      {/* Document Flow: Pressupost → Contracte → Factura */}
      <DocumentFlowSection
        proposals={booking.proposals.map((p) => ({
          id: p.id,
          reference: p.reference,
          status: p.status,
          pdfUrl: p.pdfUrl,
          contractStatus: p.contractStatus,
          contractReference: p.contractReference,
          contractPdfUrl: p.contractPdfUrl,
          contractSignedAt: p.contractSignedAt?.toISOString() || null,
        }))}
        invoices={booking.invoices.map((inv) => ({
          id: inv.id,
          reference: inv.reference,
          status: inv.status,
          holdedInvoiceUrl: inv.holdedInvoiceUrl,
        }))}
      />

      {/* Invoice */}
      <InvoiceSection
        bookingId={booking.id}
        invoices={booking.invoices.map((inv) => ({
          id: inv.id,
          reference: inv.reference,
          status: inv.status,
          total: Number(inv.total),
          holdedInvoiceUrl: inv.holdedInvoiceUrl,
          holdedSyncError: inv.holdedSyncError,
          createdAt: inv.createdAt.toISOString(),
        }))}
      />

      {/* Notes */}
      {booking.notes && (
        <section className="rounded-xl border border-white/10 shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Notes</h2>
          <p className="whitespace-pre-wrap">{booking.notes}</p>
        </section>
      )}

      <section className="rounded-xl border border-white/10 shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Historial de comunicacions</h2>
        {recentCommRows.length === 0 ? (
          <p className="text-sm">Encara no hi ha comunicacions registrades per aquest esdeveniment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm" aria-label="Historial de comunicacions">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide">
                  <th scope="col" className="px-2 py-2">Data</th>
                  <th scope="col" className="px-2 py-2">Acció</th>
                  <th scope="col" className="px-2 py-2">Flux</th>
                  <th scope="col" className="px-2 py-2">Canal</th>
                </tr>
              </thead>
              <tbody>
                {recentCommRows.map((row) => (
                  <tr key={row.id} className="border-b border-white/10 hover:bg-white/[0.03] transition-colors">
                    <td className="px-2 py-2 whitespace-nowrap">{formatDateTimeFull(row.createdAt)}</td>
                    <td className="px-2 py-2">{row.action === 'COMM_RESPONDED' ? 'Respost' : 'Enviat'}</td>
                    <td className="px-2 py-2">{row.flow}</td>
                    <td className="px-2 py-2">{row.channel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Post-Event Section */}
      {booking.status === 'COMPLETED' && (
        <section className="rounded-xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">Post-event</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className={`p-4 rounded-xl border ${booking.postEventReport ? 'bg-emerald-500/15 border-emerald-400/30' : 'bg-black/60 border-white/10'}`}>
              <p className="font-medium">Informe Intern</p>
              <p className="text-sm">
                {booking.postEventReport ? '✓ Completat' : 'Pendent de completar'}
              </p>
            </div>
            <div className={`p-4 rounded-xl border ${booking.clientSurvey ? 'bg-emerald-500/15 border-emerald-400/30' : 'bg-black/60 border-white/10'}`}>
              <p className="font-medium">Enquesta Client</p>
              <p className="text-sm">
                {booking.clientSurvey ? `✓ NPS: ${booking.clientSurvey.npsScore}` : 'Pendent de rebre'}
              </p>
            </div>
            <div className={`p-4 rounded-xl border ${booking.clientFeedback ? 'bg-emerald-500/15 border-emerald-400/30' : 'bg-black/60 border-white/10'}`}>
              <p className="font-medium">Feedback Enviat</p>
              <p className="text-sm">
                {booking.clientFeedback ? `✓ Codi: ${booking.clientFeedback.discountCode}` : 'Pendent d\'enviar'}
              </p>
            </div>
          </div>
        </section>
      )}

      <CommunicationPanel
        bookingId={booking.id}
        clientName={booking.clientName}
        clientPhone={booking.clientPhone}
        initialStatuses={{
          PAYMENT: {
            ...commStatuses.PAYMENT,
            sentAt: commStatuses.PAYMENT.sentAt?.toISOString() || null,
            respondedAt: commStatuses.PAYMENT.respondedAt?.toISOString() || null,
          },
          POST_EVENT: {
            ...commStatuses.POST_EVENT,
            sentAt: commStatuses.POST_EVENT.sentAt?.toISOString() || null,
            respondedAt: commStatuses.POST_EVENT.respondedAt?.toISOString() || null,
          },
          GENERAL: {
            ...commStatuses.GENERAL,
            sentAt: commStatuses.GENERAL.sentAt?.toISOString() || null,
            respondedAt: commStatuses.GENERAL.respondedAt?.toISOString() || null,
          },
        }}
      />
    </AdminPage>
  );
}
