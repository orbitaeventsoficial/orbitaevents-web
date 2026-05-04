// app/admin/bookings/[id]/page.tsx
import { log } from '@/lib/logger';
// Detall de reserva amb canvi d'estat
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { notFound } from 'next/navigation';
import { BookingStatusChanger } from './BookingStatusChanger';
import CommunicationPanel from './CommunicationPanel';
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
import BookingFieldNotesComposer from './BookingFieldNotesComposer';
import BookingCustomerLinkPanel from './BookingCustomerLinkPanel';
import { getBookingOperationalSnapshot } from '@/lib/services/bookingOperationalService';
import { previewBookingCustomerLink } from '@/lib/services/bookings/bookingCustomerLinkService';

import { getBookingStatusDisplay, getEventLabel, formatDate, formatCurrency, formatDateSimple, formatDateTimeFull } from '@/lib/constants';
import { AdminPage } from '../../components/AdminPage';
import Tooltip from '@/app/admin/components/Tooltip';
import { ADMIN_BOOKING_HELP, helpAttrs } from '@/app/admin/components/adminHelpContent';
import type { BookingExtraRow, BookingProposalRow, BookingInvoiceRow, BookingNumericCompat } from './booking-utils';
import { buildGoogleCalendarUrl, getPackTranslation } from './booking-utils';
import type { CanonicalTimelineEvent } from '@/lib/services/timelineQueryService';
import { OwnerControlStrip } from '@/app/admin/components/OwnerControlStrip';
import MobileQuickActions from '@/app/admin/components/MobileQuickActions';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

function getBookingTimelineKindLabel(kind: CanonicalTimelineEvent['kind']): string {
  if (kind === 'message') return 'Comunicacio';
  if (kind === 'task') return 'Tasca';
  if (kind === 'proposal') return 'Pressupost';
  if (kind === 'booking') return 'Reserva';
  if (kind === 'system') return 'Sistema';
  if (kind === 'crud') return 'Operacio';
  return 'Activitat';
}

function getBookingTimelineSourceLabel(source: CanonicalTimelineEvent['source']): string {
  if (source === 'adminLog') return 'Sistema';
  if (source === 'leadActivity') return 'Lead';
  if (source === 'customerActivity') return 'Client';
  return 'Activitat';
}

function describeBookingTimelineEntry(entry: CanonicalTimelineEvent): string {
  if (entry.body) return entry.body;
  const metadata = entry.metadata || {};
  const flow = typeof metadata.flow === 'string' ? metadata.flow : '';
  const channel = typeof metadata.channel === 'string' ? metadata.channel : '';
  const reference = typeof metadata.reference === 'string' ? metadata.reference : '';
  return [flow, channel, reference ? `Ref. ${reference}` : ''].filter(Boolean).join(' · ');
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
  // Snapshot operacional unificat (§6.7 — Canvi #14):
  // getBookingOperationalSnapshot consolida 8 queries paral·leles en una sola crida.
  const ops = await getBookingOperationalSnapshot(booking);
  const { commStatuses, recentCommRows, reviewFlowStatus, internalPostEventStatus, timeline: bookingTimeline, customer, profitabilityConfig, targetMarginPct, inventoryCost } = ops;
  const activePortalAccess = ops.portalAccess as Parameters<typeof ClientPortalAccessPanel>[0]['initialActive'];

  const customerLinkPreview = booking.customerId ? null : await previewBookingCustomerLink(booking.id);

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

  const bookingCompat = booking as BookingNumericCompat;
  const packPrice = booking.pack?.price ? Number(booking.pack.price) : 0;
  const extrasTotal = booking.extras?.reduce((sum: number, e: { price?: number | null; quantity?: number | null }) => sum + Number(e.price || 0) * (e.quantity || 1), 0) ?? 0;
  const extraHours = typeof bookingCompat.extraHours === 'number' ? bookingCompat.extraHours : 0;
  const extraHourPrice = booking.pack?.extraHourPrice ? Number(booking.pack.extraHourPrice) : 0;
  const inventoryCostReal = inventoryCost.totalCost;
  const inventoryRemainingHoursAvg = inventoryCost.remainingHoursAvg;
  const inventoryRemainingHoursMin = inventoryCost.remainingHoursMin;
  const daysUntil = Math.ceil((booking.eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isPast = daysUntil < 0;
  const isToday = daysUntil === 0;
  const isSoon = daysUntil > 0 && daysUntil <= 7;
  const directCostPreview =
    (inventoryCostReal > 0 ? inventoryCostReal : packPrice * profitabilityConfig.packCostRatio) +
    (extrasTotal * profitabilityConfig.extraCostRatio) +
    (extraHours * extraHourPrice * profitabilityConfig.extraHourCostRatio) +
    profitabilityConfig.fixedOperationalCost;
  const previewMarginPct = booking.total > 0 ? ((Number(booking.total) - directCostPreview) / Number(booking.total)) * 100 : 0;
  const ownerAutomaticSignals = [
    !isPast && !isToday ? `Esdeveniment en ${daysUntil} ${daysUntil === 1 ? 'dia' : 'dies'}` : null,
    booking.status === 'PREPARING' ? 'Reserva en preparació activa' : null,
    reviewFlowStatus === 'ENVIADO' ? 'Flux client enviat i pendent de resposta' : null,
    internalPostEventStatus === 'EN_PROGRESO' ? 'Post-event intern en progrés' : null,
  ].filter(Boolean) as string[];
  const ownerManualSignals = [
    !booking.depositPaid ? 'Falta cobrar la paga i senyal' : null,
    booking.depositPaid && !booking.remainingPaid ? 'Falta cobrar la resta' : null,
    isToday && booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' ? 'L’esdeveniment és avui' : null,
    isSoon && booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' ? 'Convé revisar checklist i timings' : null,
    previewMarginPct < targetMarginPct ? `Marge per sota de l’objectiu (${previewMarginPct.toFixed(0)}% vs ${targetMarginPct.toFixed(0)}%)` : null,
  ].filter(Boolean) as string[];
  const ownerNextStep = !booking.depositPaid
    ? {
        title: 'Revisar cobrament inicial',
        detail: `Paga i senyal pendent de ${formatCurrency(booking.depositAmount)}`,
        href: '#sec-finances',
      }
    : booking.depositPaid && !booking.remainingPaid
      ? {
          title: 'Tancar cobrament final',
          detail: `Resta pendent de ${formatCurrency(booking.remainingAmount)}`,
          href: '#sec-finances',
        }
      : isSoon && booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED'
        ? {
            title: 'Revisar preparació operativa',
            detail: 'Checklist, equipament i horaris haurien de quedar tancats ara',
            href: '#sec-equipament',
          }
        : booking.status === 'COMPLETED' && !booking.postEventReport
          ? {
              title: 'Completar post-event',
              detail: 'Falta tancar l’informe intern de l’esdeveniment',
              href: '#sec-historial',
            }
          : {
              title: 'Obrir marge i costos',
              detail: 'No hi ha tensió crítica ara mateix; revisa salut econòmica i transport',
              href: '#sec-marge',
            };

  return (
    <AdminPage
      className="admin-booking-page"
      title={`Reserva ${booking.reference}`}
      back={{ href: '/admin/bookings', label: 'Reserves' }}
      subtitle={
        (() => {
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
                  href={buildLeadWorkspaceHref(booking.lead.id)}
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

      {customerLinkPreview && (
        <BookingCustomerLinkPanel bookingId={booking.id} preview={customerLinkPreview} />
      )}

      <OwnerControlStrip
        system={{
          eyebrow: 'Automàtic',
          title: 'Què vigila el sistema',
          tone: 'info',
          items: ownerAutomaticSignals,
          emptyText: 'Sense senyals automàtiques destacades ara mateix.',
        }}
        manual={{
          eyebrow: 'Manual',
          title: 'Què et reclama decisió',
          tone: ownerManualSignals.length > 0 ? 'warning' : 'success',
          items: ownerManualSignals,
          emptyText: 'No hi ha cap front manual calent ara mateix.',
        }}
        nextStep={{
          title: ownerNextStep.title,
          detail: ownerNextStep.detail,
          href: ownerNextStep.href,
        }}
      />

      <section className="admin-booking-executive grid gap-3 sm:grid-cols-2 xl:grid-cols-5" {...helpAttrs(ADMIN_BOOKING_HELP.detail.executive)}>
        <div className="admin-booking-summary-card ap-card rounded-xl px-4 py-3">
          <p className="text-xs uppercase tracking-wide">Total reserva</p>
          <p className="text-xl font-semibold">{formatCurrency(booking.total)}</p>
        </div>
        <div className={`admin-booking-summary-card rounded-xl border px-4 py-3 shadow-sm ${booking.depositPaid && booking.remainingPaid ? 'ap-card--success' : booking.depositPaid ? 'ap-card--warning' : 'ap-card--danger'}`}>
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
        <div className={`admin-booking-summary-card rounded-xl border px-4 py-3 shadow-sm ${reviewFlowStatus === 'RESPONDIDO' ? 'ap-card--success' : reviewFlowStatus === 'ENVIADO' ? 'ap-card--warning' : 'ap-card--danger'}`}>
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
        <div className={`admin-booking-summary-card rounded-xl border px-4 py-3 shadow-sm ${internalPostEventStatus === 'COMPLETO' ? 'ap-card--success' : internalPostEventStatus === 'EN_PROGRESO' ? 'ap-card--warning' : ''}`}>
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
        <div className="admin-booking-summary-card ap-card rounded-xl px-4 py-3">
          <p className="text-xs uppercase tracking-wide">Entrada comercial</p>
          <p className="text-xl font-semibold">
            {booking.lead ? (
              <Link href={buildLeadWorkspaceHref(booking.lead.id)} className="transition-colors">
                {booking.lead.status}
              </Link>
            ) : 'Sense lead'}
          </p>
        </div>
      </section>

      <BookingSectionNav />

      {/* Client Info */}
      <section id="sec-client" className="admin-booking-panel scroll-mt-28 ap-card rounded-xl p-6" {...helpAttrs(ADMIN_BOOKING_HELP.detail.client)}>
        <h2 className="text-lg font-semibold mb-4">Informació del Client</h2>
        <MobileQuickActions
          phone={booking.clientPhone}
          email={booking.clientEmail}
          whatsappMessage={`Hola ${booking.clientName}! Et contactem des d'Òrbita Events per la reserva ${booking.reference}.`}
        />
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
              href={buildLeadWorkspaceHref(booking.lead.id)}
              className="text-sm hover:underline"
            >
              Veure lead original
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
          <details className="relative group" {...helpAttrs(ADMIN_BOOKING_HELP.detail.moreActions)}>
            <summary className="list-none ap-btn ap-btn--secondary text-xs cursor-pointer select-none">
              Mes accions v
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
      <section id="sec-event" className="admin-booking-panel scroll-mt-28 ap-card rounded-xl p-6" {...helpAttrs(ADMIN_BOOKING_HELP.detail.event)}>
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
      <section id="sec-serveis" className="admin-booking-panel scroll-mt-28 ap-card rounded-xl p-6" {...helpAttrs(ADMIN_BOOKING_HELP.detail.services)}>
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
              {booking.extraHours}h x {formatCurrency(booking.pack.extraHourPrice)} = {formatCurrency(booking.extraHours * booking.pack.extraHourPrice)}
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
      <section id="sec-finances" className="admin-booking-panel scroll-mt-28 ap-card rounded-xl p-6" {...helpAttrs(ADMIN_BOOKING_HELP.detail.finances)}>
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
              {booking.depositPaid ? 'Pagat' : 'Pendent'}
            </span>
          </div>
          <div className={`p-4 rounded-xl ${booking.remainingPaid ? 'ap-card--success' : 'ap-card--warning'}`}>
            <p className="text-xs font-medium uppercase">Resta</p>
            <p className="text-lg font-bold">{formatCurrency(booking.remainingAmount)}</p>
            <span className={`text-xs ${booking.remainingPaid ? 'admin-tone-text-success' : 'admin-tone-text-warning'}`}>
              {booking.remainingPaid ? 'Pagat' : 'Pendent'}
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
        inventoryHours={inventoryCost.hours > 0 ? inventoryCost.hours : null}
        inventoryRemainingHoursAvg={inventoryRemainingHoursAvg != null ? Number(inventoryRemainingHoursAvg.toFixed(1)) : null}
        inventoryRemainingHoursMin={inventoryRemainingHoursMin != null ? Number(inventoryRemainingHoursMin.toFixed(1)) : null}
        packCostRatio={profitabilityConfig.packCostRatio}
        extraCostRatio={profitabilityConfig.extraCostRatio}
        extraHourCostRatio={profitabilityConfig.extraHourCostRatio}
        fixedOperationalCost={profitabilityConfig.fixedOperationalCost}
        targetMarginPct={targetMarginPct}
      />
      </div>

      {/* Document Flow: Pressupost -> Contracte -> Factura */}
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

      <section id="sec-comunicacions" className="admin-booking-panel scroll-mt-28 ap-card rounded-xl p-6" {...helpAttrs(ADMIN_BOOKING_HELP.detail.commHistory)}>
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
      {bookingTimeline.length > 0 && (
        <section id="sec-historial" className="admin-booking-panel scroll-mt-28 ap-card rounded-xl p-6" {...helpAttrs(ADMIN_BOOKING_HELP.detail.activity)}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Historial de canvis</h2>
              <p className="mt-1 text-sm">Lectura canonica de l'activitat operativa d'aquesta reserva.</p>
            </div>
            <span className="ap-badge px-2.5 py-1 text-[11px]">{bookingTimeline.length} entrades</span>
          </div>
          <div className="space-y-3">
            {bookingTimeline.map((entry) => {
              const description = describeBookingTimelineEntry(entry);
              return (
                <article key={entry.id} className="ap-card rounded-2xl p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide admin-tone-text-neutral">
                        <span>{getBookingTimelineSourceLabel(entry.source)}</span>
                        <span>·</span>
                        <span>{getBookingTimelineKindLabel(entry.kind)}</span>
                      </div>
                      <p className="text-sm font-semibold">{entry.title}</p>
                      {description && (
                        <p className="mt-1 text-xs admin-tone-text-slate">{description}</p>
                      )}
                      {entry.link && (
                        <div className="mt-2">
                          <Link href={entry.link.href} className="text-xs admin-tone-text-info underline decoration-current/30 transition-colors hover:opacity-80">
                            {entry.link.label}
                          </Link>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs admin-tone-text-slate">{formatDateTimeFull(new Date(entry.occurredAt))}</p>
                      {entry.actor && <p className="mt-1 text-[11px] admin-tone-text-neutral">{entry.actor}</p>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Gallery Section */}
      <section id="sec-galeria" className="admin-booking-panel scroll-mt-28 ap-card rounded-xl p-6" {...helpAttrs(ADMIN_BOOKING_HELP.detail.gallery)}>
        <div className="mb-6">
          <BookingFieldNotesComposer bookingId={booking.id} />
        </div>
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
                {booking.postEventReport ? 'Completat' : 'Pendent de completar'}
              </p>
            </div>
            <div className={`p-4 rounded-xl border ${booking.clientSurvey ? 'ap-card--success' : ''}`}>
              <p className="font-medium">Enquesta Client</p>
              <p className="text-sm">
                {booking.clientSurvey ? `NPS: ${booking.clientSurvey.npsScore}` : 'Pendent de rebre'}
              </p>
            </div>
            <div className={`p-4 rounded-xl border ${booking.clientFeedback ? 'ap-card--success' : ''}`}>
              <p className="font-medium">Feedback Enviat</p>
              <p className="text-sm">
                {booking.clientFeedback ? `Codi: ${booking.clientFeedback.discountCode}` : 'Pendent d\'enviar'}
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















