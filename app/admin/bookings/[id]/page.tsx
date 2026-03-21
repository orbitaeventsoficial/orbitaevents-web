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
import BookingChecklist from './BookingChecklist';
import InvoiceSection from './InvoiceSection';
import DocumentFlowSection from './DocumentFlowSection';
import BookingInventorySection from './BookingInventorySection';
import ClientPortalAccessPanel from './ClientPortalAccessPanel';
import BookingSectionNav from './BookingSectionNav';
import BookingGallery from './BookingGallery';
import { getActivePortalAccessForBooking } from '@/lib/services/clientPortalAccess';
import { calculateCostPerHour, calculateEventDuration } from '@/lib/inventory-utils';
import { getProfitabilityConfig } from '@/lib/services/profitabilityService';

import { getBookingStatusDisplay, getEventLabel, formatDate, formatCurrency, formatDateSimple, formatDateTimeFull, DEFAULT_EXPECTED_LIFE_HOURS } from '@/lib/constants';
import { AdminPage } from '../../components/AdminPage';
import Tooltip from '@/app/admin/components/Tooltip';
import type { BookingExtraRow, BookingProposalRow, BookingInvoiceRow, BookingNumericCompat } from './booking-utils';
import { buildGoogleCalendarUrl, parseLogDetails, getPackTranslation } from './booking-utils';

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



export default async function BookingDetailPage({ params }: PageProps) {
  const booking = await getBooking(params.id);

  if (!booking) {
    notFound();
  }

  const statusConf = getBookingStatusDisplay(booking.status);
  const eventType = getEventLabel(booking.eventType);
  const packTranslation = getPackTranslation(
    booking.pack.translations,
    booking.lead?.preferredLocale || booking.preferredLocale || 'ca'
  );
  // Paral·lelitzar totes les queries secundàries
  const [commLogs, activityLogs, customer, activePortalAccess, profitabilityConfig, marginTargetSetting] = await Promise.all([
    prisma.adminLog.findMany({
      where: {
        entity: 'booking',
        entityId: booking.id,
        action: { in: ['COMM_SENT', 'COMM_RESPONDED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.adminLog.findMany({
      where: { entity: 'booking', entityId: booking.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
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
  const ACTION_LABELS: Record<string, { icon: string; label: string }> = {
    CREATE: { icon: '🆕', label: 'Reserva creada' },
    UPDATE: { icon: '✏️', label: 'Reserva actualitzada' },
    DELETE: { icon: '🗑️', label: 'Reserva eliminada' },
    STATUS_CHANGE: { icon: '🔄', label: 'Canvi d\'estat' },
    COMM_SENT: { icon: '📤', label: 'Comunicació enviada' },
    COMM_RESPONDED: { icon: '📥', label: 'Resposta rebuda' },
    PAYMENT_RECORDED: { icon: '💰', label: 'Pagament registrat' },
    INVENTORY_ASSIGNED: { icon: '📦', label: 'Inventari assignat' },
    CALENDAR_SYNC: { icon: '📅', label: 'Sincronitzat calendari' },
    PORTAL_ACCESS: { icon: '🔗', label: 'Accés portal' },
    CONTRACT_SIGNED: { icon: '✍️', label: 'Contracte signat' },
    INVOICE_CREATED: { icon: '🧾', label: 'Factura creada' },
  };
  const activityTimeline = activityLogs.map((entry) => {
    const details = parseLogDetails(entry.details);
    const config = ACTION_LABELS[entry.action] || { icon: '📋', label: entry.action };
    let description = '';
    if (entry.action === 'STATUS_CHANGE' && details.from && details.to) {
      description = `${details.from} → ${details.to}`;
    } else if (entry.action === 'UPDATE' && details.fields) {
      description = `Camps: ${Array.isArray(details.fields) ? details.fields.join(', ') : String(details.fields)}`;
    } else if (details.channel) {
      description = `${details.flow || ''} · ${details.channel}`;
    }
    return {
      id: entry.id,
      icon: config.icon,
      label: config.label,
      description,
      createdAt: entry.createdAt,
    };
  });

  const bookingCompat = booking as BookingNumericCompat;
  const packPrice = booking.pack?.price ? Number(booking.pack.price) : 0;
  const extrasTotal = booking.extras?.reduce((sum: number, e: { price?: number | null; quantity?: number | null }) => sum + Number(e.price || 0) * (e.quantity || 1), 0) ?? 0;
  const extraHours = typeof bookingCompat.extraHours === 'number' ? bookingCompat.extraHours : 0;
  const extraHourPrice = booking.pack?.extraHourPrice ? Number(booking.pack.extraHourPrice) : 0;
  const marginTargetRaw = Number(marginTargetSetting?.value);
  const targetMarginPct = Number.isFinite(marginTargetRaw)
    ? (marginTargetRaw > 1 ? marginTargetRaw : marginTargetRaw * 100)
    : 35;
  const inventoryHours = calculateEventDuration(booking.eventStartTime, booking.eventEndTime);
  const assignedItemIds = (booking.inventory || []).map((assigned: { itemId: string }) => assigned.itemId);
  const usageByItem = assignedItemIds.length > 0
    ? new Map(
        (await prisma.inventoryUsage.groupBy({
          by: ['itemId'],
          where: { itemId: { in: assignedItemIds } },
          _sum: { hoursUsed: true },
        })).map((row: { itemId: string; _sum: { hoursUsed: number | null } }) => [row.itemId, row._sum.hoursUsed || 0] as [string, number])
      )
    : new Map<string, number>();
  const inventoryCostReal = (booking.inventory || []).reduce((sum: number, assigned: { item: { purchasePrice: number | null; expectedLifeHours: number | null }; quantity: number | null }) => {
    const perHour = calculateCostPerHour(assigned.item.purchasePrice, assigned.item.expectedLifeHours);
    return sum + (perHour * (assigned.quantity || 1) * inventoryHours);
  }, 0);
  const remainingHoursList = (booking.inventory || []).map((assigned: { item: { expectedLifeHours: number | null; name: string }; itemId: string }) => {
    const expectedLifeHours = assigned.item.expectedLifeHours || DEFAULT_EXPECTED_LIFE_HOURS;
    const used = Number(usageByItem.get(assigned.itemId) || 0);
    return Math.max(0, expectedLifeHours - used);
  });
  const inventoryRemainingHoursAvg = remainingHoursList.length > 0
    ? remainingHoursList.reduce((acc: number, n: number) => acc + n, 0) / remainingHoursList.length
    : null;
  const inventoryRemainingHoursMin = remainingHoursList.length > 0
    ? Math.min(...remainingHoursList)
    : null;

  return (
    <AdminPage
      title={`Reserva ${booking.reference}`}
      back={{ href: '/admin/bookings', label: 'Reserves' }}
      subtitle={
        (() => {
          const daysUntil = Math.ceil((booking.eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          const isPast = daysUntil < 0;
          const isToday = daysUntil === 0;
          const isSoon = daysUntil > 0 && daysUntil <= 7;
          return (
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusConf.bg} ${statusConf.text}`}>
                {statusConf.label}
              </span>
              <span className="text-sm">{eventType} · {formatDate(booking.eventDate)}</span>
              {!isPast && !isToday && booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  isSoon ? 'ap-badge ap-badge--warning' : 'ap-badge'
                }`}>
                  {daysUntil} {daysUntil === 1 ? 'dia' : 'dies'}
                </span>
              )}
              {isToday && booking.status !== 'COMPLETED' && (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold admin-tone-soft-info border animate-pulse">
                  AVUI
                </span>
              )}
              {customer && (
                <Link
                  href={`/admin/clientes/${customer.id}`}
                  className="ap-btn ap-btn--secondary"
                >
                  Fitxa Client
                </Link>
              )}
              {booking.lead && (
                <Link
                  href={`/admin/leads/${booking.lead.id}`}
                  className="ap-btn ap-btn--secondary"
                >
                  Entrada original
                </Link>
              )}
            </div>
          );
        })()
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
        <div className="ap-card rounded-xl px-4 py-3">
          <p className="text-xs uppercase tracking-wide">Total reserva</p>
          <p className="text-xl font-semibold">{formatCurrency(booking.total)}</p>
        </div>
        <div className={`rounded-xl border px-4 py-3 shadow-sm ${booking.depositPaid && booking.remainingPaid ? 'ap-card--success' : booking.depositPaid ? 'ap-card--warning' : 'ap-card--danger'}`}>
          <div className="flex items-center gap-2">
            <Tooltip text={booking.depositPaid && booking.remainingPaid ? 'Paga i senyal + resta pagats' : booking.depositPaid ? 'Paga i senyal pagada, falta la resta' : 'Cap pagament rebut'}>
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${booking.depositPaid && booking.remainingPaid ? 'admin-tone-bg-success' : booking.depositPaid ? 'admin-tone-bg-warning' : 'admin-tone-bg-danger'}`} />
            </Tooltip>
            <p className="text-xs uppercase tracking-wide">Pagament</p>
          </div>
          <p className="text-xl font-semibold">
            {booking.depositPaid && booking.remainingPaid ? 'Completat' : booking.depositPaid ? 'Parcial' : 'Pendent'}
          </p>
        </div>
        <div className={`rounded-xl border px-4 py-3 shadow-sm ${reviewFlowStatus === 'RESPONDIDO' ? 'ap-card--success' : reviewFlowStatus === 'ENVIADO' ? 'ap-card--warning' : 'ap-card--danger'}`}>
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${reviewFlowStatus === 'RESPONDIDO' ? 'admin-tone-bg-success' : reviewFlowStatus === 'ENVIADO' ? 'admin-tone-bg-warning' : 'admin-tone-bg-danger'}`} />
            <p className="text-xs uppercase tracking-wide">Flux client</p>
          </div>
          <p className="text-xl font-semibold">
            {reviewFlowStatus === 'RESPONDIDO'
              ? 'Respost'
              : reviewFlowStatus === 'ENVIADO'
                ? 'Enviat'
                : 'Falta enviar'}
          </p>
        </div>
        <div className={`rounded-xl border px-4 py-3 shadow-sm ${internalPostEventStatus === 'COMPLETO' ? 'ap-card--success' : internalPostEventStatus === 'EN_PROGRESO' ? 'ap-card--warning' : ''}`}>
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${internalPostEventStatus === 'COMPLETO' ? 'admin-tone-bg-success' : internalPostEventStatus === 'EN_PROGRESO' ? 'admin-tone-bg-warning' : 'admin-tone-bg-neutral'}`} />
            <p className="text-xs uppercase tracking-wide">Post-event intern</p>
          </div>
          <p className="text-xl font-semibold">
            {internalPostEventStatus === 'COMPLETO'
              ? 'Completat'
              : internalPostEventStatus === 'EN_PROGRESO'
                ? 'En progrés'
                : 'Pendent'}
          </p>
        </div>
        <div className="ap-card rounded-xl px-4 py-3">
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

      <BookingSectionNav />

      {/* Client Info */}
      <section id="sec-client" className="scroll-mt-28 ap-card rounded-xl p-6">
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
          <div className="mt-4 pt-4 border-t admin-tone-border-neutral">
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
              className="ap-btn ap-btn--secondary text-xs"
            >
              Fitxa client 360
            </Link>
          )}
          <CalendarSyncButton bookingId={booking.id} />
          <details className="relative group">
            <summary className="list-none ap-btn ap-btn--secondary text-xs cursor-pointer select-none">
              Mes accions ▾
            </summary>
            <div className="absolute right-0 top-full mt-1 z-20 w-52 rounded-xl border admin-tone-border-neutral admin-tone-bg-neutral py-1">
              <Link
                href={`/admin/post-event/reports/new?bookingId=${booking.id}`}
                className="block px-4 py-2 text-xs transition-colors hover:admin-tone-bg-neutral"
              >
                Crear informe intern
              </Link>
              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 text-xs transition-colors hover:admin-tone-bg-neutral"
              >
                Afegir a Google Calendar
              </a>
              <Link
                href="/admin/settings/integrations"
                className="block px-4 py-2 text-xs transition-colors hover:admin-tone-bg-neutral"
              >
                Sincronitzar mobil/ICS
              </Link>
            </div>
          </details>
        </div>
        {customer && (
          <div className="mt-3 ap-card rounded-xl p-3 text-xs">
            Historial client: {customer.totalEvents} esdeveniments · {formatCurrency(customer.totalSpent)} ·
            {' '}últim esdeveniment {formatDateSimple(customer.lastEventDate)}
          </div>
        )}
      </section>

      {/* Event Info */}
      <section id="sec-event" className="scroll-mt-28 ap-card rounded-xl p-6">
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
      <section id="sec-serveis" className="scroll-mt-28 ap-card rounded-xl p-6">
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
            {booking.extras.map((extra: BookingExtraRow) => {
              const extraTranslation = getPackTranslation(
                extra.extra.translations as Array<{ locale: string; name: string; tagline?: string | null }>,
                booking.lead?.preferredLocale || booking.preferredLocale || 'ca'
              );
              return (
                <div key={extra.id} className="ap-card flex items-center justify-between p-3 rounded-xl">
                  <div>
                    <p className="font-medium">
                      {extraTranslation?.name || extra.extra.slug}
                    </p>
                    {(extra.quantity ?? 0) > 1 && (
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
      <div id="sec-equipament" className="scroll-mt-28">
        <BookingInventorySection bookingId={booking.id} />
      </div>

      <div id="sec-portal" className="scroll-mt-28">
        <ClientPortalAccessPanel
          bookingId={booking.id}
          initialActive={activePortalAccess}
        />
      </div>

      {/* Pricing */}
      <section id="sec-finances" className="scroll-mt-28 ap-card rounded-xl p-6">
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
          <div className={`p-4 rounded-xl ${booking.depositPaid ? 'ap-card--success' : 'ap-card--danger'}`}>
            <p className="text-xs font-medium uppercase">Paga i Senyal (30%)</p>
            <p className="text-lg font-bold">{formatCurrency(booking.depositAmount)}</p>
            <span className={`text-xs ${booking.depositPaid ? 'admin-tone-text-success' : 'admin-tone-text-danger'}`}>
              {booking.depositPaid ? '✓ Pagat' : '✗ Pendent'}
            </span>
          </div>
          <div className={`p-4 rounded-xl ${booking.remainingPaid ? 'ap-card--success' : 'ap-card--warning'}`}>
            <p className="text-xs font-medium uppercase">Resta</p>
            <p className="text-lg font-bold">{formatCurrency(booking.remainingAmount)}</p>
            <span className={`text-xs ${booking.remainingPaid ? 'admin-tone-text-success' : 'admin-tone-text-warning'}`}>
              {booking.remainingPaid ? '✓ Pagat' : '○ Pendent'}
            </span>
          </div>
        </div>
      </section>

      {/* Checklist de preparació */}
      {(booking.status === 'CONFIRMED' || booking.status === 'PREPARING') && (
        <BookingChecklist bookingId={booking.id} />
      )}

      {/* Margin + Travel Cost (editable) */}
      <div id="sec-marge" className="scroll-mt-28">
      <BookingMarginCard
        bookingId={booking.id}
        total={Number(booking.total)}
        packPrice={packPrice}
        extrasTotal={extrasTotal}
        extraHours={extraHours}
        extraHourPrice={extraHourPrice}
        distanceKm={typeof bookingCompat.distanceKm === 'number' ? bookingCompat.distanceKm : null}
        vehicleCostPerKm={typeof bookingCompat.vehicleCostPerKm === 'number' ? bookingCompat.vehicleCostPerKm : typeof bookingCompat.fuelCostPerKm === 'number' ? bookingCompat.fuelCostPerKm : null}
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
      </div>

      {/* Document Flow: Pressupost → Contracte → Factura */}
      <div id="sec-documents" className="scroll-mt-28">
      <DocumentFlowSection
        proposals={(booking.proposals as BookingProposalRow[]).map((p) => ({
          id: p.id,
          reference: p.reference,
          status: p.status,
          pdfUrl: p.pdfUrl,
          contractStatus: p.contractStatus,
          contractReference: p.contractReference,
          contractPdfUrl: p.contractPdfUrl,
          contractSignedAt: p.contractSignedAt?.toISOString() || null,
        }))}
        invoices={(booking.invoices as BookingInvoiceRow[]).map((inv) => ({
          id: inv.id,
          reference: inv.reference,
          status: inv.status,
          holdedInvoiceUrl: inv.holdedInvoiceUrl,
        }))}
      />

      {/* Invoice */}
      <InvoiceSection
        bookingId={booking.id}
        invoices={(booking.invoices as BookingInvoiceRow[]).map((inv) => ({
          id: inv.id,
          reference: inv.reference,
          status: inv.status,
          total: Number(inv.total),
          holdedInvoiceUrl: inv.holdedInvoiceUrl,
          holdedSyncError: inv.holdedSyncError,
          createdAt: inv.createdAt.toISOString(),
        }))}
      />
      </div>

      {/* Notes */}
      {booking.notes && (
        <section className="ap-card rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Notes</h2>
          <p className="whitespace-pre-wrap">{booking.notes}</p>
        </section>
      )}

      <section id="sec-comunicacions" className="scroll-mt-28 ap-card rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Historial de comunicacions</h2>
        {recentCommRows.length === 0 ? (
          <p className="text-sm">Encara no hi ha comunicacions registrades per aquest esdeveniment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm" aria-label="Historial de comunicacions">
              <thead>
                <tr className="border-b admin-tone-border-neutral text-left text-xs uppercase tracking-wide">
                  <th scope="col" className="px-2 py-2">Data</th>
                  <th scope="col" className="px-2 py-2">Acció</th>
                  <th scope="col" className="px-2 py-2">Flux</th>
                  <th scope="col" className="px-2 py-2">Canal</th>
                </tr>
              </thead>
              <tbody>
                {recentCommRows.map((row: { id: string; createdAt: Date; action: string; flow: string; channel: string }) => (
                  <tr key={row.id} className="border-b admin-tone-border-neutral transition-colors hover:admin-tone-bg-neutral">
                    <td className="px-2 py-2 whitespace-nowrap overflow-hidden text-ellipsis">{formatDateTimeFull(row.createdAt)}</td>
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

      {/* Activity timeline */}
      {activityTimeline.length > 0 && (
        <section id="sec-historial" className="scroll-mt-28 ap-card rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Historial de canvis</h2>
          <div className="relative pl-6 space-y-0">
            <div className="absolute left-2 top-1 bottom-1 w-px admin-tone-bg-neutral" />
            {activityTimeline.map((entry: { id: string; createdAt: Date; icon: string; label: string; description: string }) => (
              <div key={entry.id} className="relative flex items-start gap-3 py-2.5">
                <span className="absolute -left-4 top-3 w-2 h-2 rounded-full admin-tone-bg-neutral ring-2 ring-black" />
                <span className="text-base leading-none">{entry.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{entry.label}</p>
                  {entry.description && (
                    <p className="text-xs opacity-50 mt-0.5">{entry.description}</p>
                  )}
                </div>
                <span className="text-xs opacity-40 whitespace-nowrap overflow-hidden text-ellipsis shrink-0">
                  {formatDateTimeFull(entry.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Gallery Section */}
      <section id="sec-galeria" className="scroll-mt-28 ap-card rounded-xl p-6">
        <BookingGallery bookingId={booking.id} />
      </section>

      {/* Post-Event Section */}
      {booking.status === 'COMPLETED' && (
        <section className="rounded-xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">Post-event</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className={`p-4 rounded-xl border ${booking.postEventReport ? 'ap-card--success' : ''}`}>
              <p className="font-medium">Informe Intern</p>
              <p className="text-sm">
                {booking.postEventReport ? '✓ Completat' : 'Pendent de completar'}
              </p>
            </div>
            <div className={`p-4 rounded-xl border ${booking.clientSurvey ? 'ap-card--success' : ''}`}>
              <p className="font-medium">Enquesta Client</p>
              <p className="text-sm">
                {booking.clientSurvey ? `✓ NPS: ${booking.clientSurvey.npsScore}` : 'Pendent de rebre'}
              </p>
            </div>
            <div className={`p-4 rounded-xl border ${booking.clientFeedback ? 'ap-card--success' : ''}`}>
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











