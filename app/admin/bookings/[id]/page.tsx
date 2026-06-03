// app/admin/bookings/[id]/page.tsx
import './booking-detail.css';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { buildLeadComposeHref, buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { buildCustomerComposeHref, buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
import { buildPackHref } from '@/lib/admin/packWorkspaceHref';
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
import StripePaymentPanel from './StripePaymentPanel';
import BookingSectionNav from './BookingSectionNav';
import BookingGallery from './BookingGallery';
import BookingFieldNotesComposer from './BookingFieldNotesComposer';
import BookingCustomerLinkPanel from './BookingCustomerLinkPanel';
import BookingQuestionnaireSection from './BookingQuestionnaireSection';
import { getBookingOperationalSnapshot } from '@/lib/services/bookingOperationalService';
import { getWeatherForEvent } from '@/lib/services/weatherService';
import WxBadge from '@/app/admin/components/WxBadge';
import type { WxData } from '@/app/admin/components/WxBadge';
import BookingTotalEditor from './BookingTotalEditor';
import { previewBookingCustomerLink } from '@/lib/services/bookings/bookingCustomerLinkService';
import { getBookingStatusDisplay, getEventLabel, formatDate, formatCurrency, formatDateSimple, formatDateTimeFull } from '@/lib/constants';
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
  if (kind === 'message')  return 'Comunicació';
  if (kind === 'task')     return 'Tasca';
  if (kind === 'proposal') return 'Pressupost';
  if (kind === 'booking')  return 'Reserva';
  if (kind === 'system')   return 'Sistema';
  if (kind === 'crud')     return 'Operació';
  return 'Activitat';
}

function getBookingTimelineSourceLabel(source: CanonicalTimelineEvent['source']): string {
  if (source === 'adminLog')        return 'Sistema';
  if (source === 'leadActivity')    return 'Lead';
  if (source === 'customerActivity') return 'Client';
  return 'Activitat';
}

function describeBookingTimelineEntry(entry: CanonicalTimelineEvent): string {
  if (entry.body) return entry.body;
  const metadata = entry.metadata || {};
  const flow      = typeof metadata.flow      === 'string' ? metadata.flow      : '';
  const channel   = typeof metadata.channel   === 'string' ? metadata.channel   : '';
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
            contractSignedBy: true, contractSignatureIp: true, contractSignatureUa: true, contractSignatureBlob: true,
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
  if (!booking) notFound();

  const statusConf     = getBookingStatusDisplay(booking.status);
  const eventType      = getEventLabel(booking.eventType);
  const packTranslation = getPackTranslation(
    booking.pack.translations,
    booking.lead?.preferredLocale || booking.preferredLocale || 'ca'
  );

  const ops = await getBookingOperationalSnapshot(booking);

  // Meteo: rang 5 dies
  let bookingWx: WxData | null = null;
  if (booking.eventDate && booking.eventLocation) {
    const diffMs = booking.eventDate.getTime() - Date.now();
    if (diffMs >= -86400000 && diffMs <= 5 * 86400000) {
      const weather = await getWeatherForEvent(booking.eventLocation, booking.eventDate).catch(() => null);
      if (weather) bookingWx = { kind: weather.kind, tmax: weather.tempMax, tmin: weather.tempMin, forecast: true };
    }
  }
  const { commStatuses, recentCommRows, reviewFlowStatus, internalPostEventStatus, timeline: bookingTimeline, customer, profitabilityConfig, targetMarginPct, inventoryCost } = ops;
  const activePortalAccess = ops.portalAccess as Parameters<typeof ClientPortalAccessPanel>[0]['initialActive'];

  const customerLinkPreview = booking.customerId ? null : await previewBookingCustomerLink(booking.id);
  const bookingComposeHref  = customer
    ? buildCustomerComposeHref(customer.id)
    : booking.lead
      ? buildLeadComposeHref(booking.lead.id)
      : '/admin/inbox/compose';

  const googleCalendarUrl = buildGoogleCalendarUrl({
    reference: booking.reference, clientName: booking.clientName,
    eventDate: booking.eventDate, eventStartTime: booking.eventStartTime,
    eventEndTime: booking.eventEndTime, eventLocation: booking.eventLocation,
    eventVenue: booking.eventVenue, notes: booking.notes,
  });

  const bookingCompat       = booking as BookingNumericCompat;
  const packPrice           = booking.pack?.price ? Number(booking.pack.price) : 0;
  const extrasTotal         = booking.extras?.reduce((s: number, e: { price?: number | null; quantity?: number | null }) => s + Number(e.price || 0) * (e.quantity || 1), 0) ?? 0;
  const extraHours          = typeof bookingCompat.extraHours === 'number' ? bookingCompat.extraHours : 0;
  const extraHourPrice      = booking.pack?.extraHourPrice ? Number(booking.pack.extraHourPrice) : 0;
  const inventoryCostReal   = inventoryCost.totalCost;
  const inventoryRemainingHoursAvg = inventoryCost.remainingHoursAvg;
  const inventoryRemainingHoursMin = inventoryCost.remainingHoursMin;

  const daysUntil = Math.ceil((booking.eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isPast    = daysUntil < 0;
  const isToday   = daysUntil === 0;
  const isSoon    = daysUntil > 0 && daysUntil <= 7;

  const directCostPreview =
    (inventoryCostReal > 0 ? inventoryCostReal : packPrice * profitabilityConfig.packCostRatio) +
    (extrasTotal * profitabilityConfig.extraCostRatio) +
    (extraHours * extraHourPrice * profitabilityConfig.extraHourCostRatio) +
    profitabilityConfig.fixedOperationalCost;
  const previewMarginPct = booking.total > 0 ? ((Number(booking.total) - directCostPreview) / Number(booking.total)) * 100 : 0;

  const ownerAutomaticSignals = [
    !isPast && !isToday ? `Esdeveniment en ${daysUntil} ${daysUntil === 1 ? 'dia' : 'dies'}` : null,
    booking.status === 'PREPARING'            ? 'Reserva en preparació activa' : null,
    reviewFlowStatus === 'ENVIADO'            ? 'Flux client enviat i pendent de resposta' : null,
    internalPostEventStatus === 'EN_PROGRESO' ? 'Post-event intern en progrés' : null,
  ].filter(Boolean) as string[];

  const ownerManualSignals = [
    !booking.depositPaid ? 'Falta cobrar la paga i senyal' : null,
    booking.depositPaid && !booking.remainingPaid ? 'Falta cobrar la resta' : null,
    isToday && booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' ? "L'esdeveniment és avui" : null,
    isSoon  && booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' ? 'Convé revisar checklist i timings' : null,
    previewMarginPct < targetMarginPct ? `Marge per sota de l'objectiu (${previewMarginPct.toFixed(0)}% vs ${targetMarginPct.toFixed(0)}%)` : null,
  ].filter(Boolean) as string[];

  const ownerNextStep = !booking.depositPaid
    ? { title: 'Revisar cobrament inicial', detail: `Paga i senyal pendent de ${formatCurrency(booking.depositAmount)}`, href: '#sec-finances' }
    : booking.depositPaid && !booking.remainingPaid
      ? { title: 'Tancar cobrament final', detail: `Resta pendent de ${formatCurrency(booking.remainingAmount)}`, href: '#sec-finances' }
      : isSoon && booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED'
        ? { title: 'Revisar preparació operativa', detail: 'Checklist, equipament i horaris haurien de quedar tancats ara', href: '#sec-equipament' }
        : booking.status === 'COMPLETED' && !booking.postEventReport
          ? { title: 'Completar post-event', detail: "Falta tancar l'informe intern de l'esdeveniment", href: '#sec-historial' }
          : { title: 'Obrir marge i costos', detail: 'No hi ha tensió crítica ara mateix; revisa salut econòmica i transport', href: '#sec-marge' };

  // KPI payment state helpers
  const paymentKpiClass = booking.depositPaid && booking.remainingPaid ? 'bd__kpi--ok' : booking.depositPaid ? 'bd__kpi--warn' : 'bd__kpi--err';
  const paymentDotClass = booking.depositPaid && booking.remainingPaid ? 'bd__kpi-dot--ok' : booking.depositPaid ? 'bd__kpi-dot--warn' : 'bd__kpi-dot--err';
  const paymentLabel    = booking.depositPaid && booking.remainingPaid ? 'Completat' : booking.depositPaid ? 'Parcial' : 'Pendent';

  const flowKpiClass = reviewFlowStatus === 'RESPONDIDO' ? 'bd__kpi--ok' : reviewFlowStatus === 'ENVIADO' ? 'bd__kpi--warn' : 'bd__kpi--err';
  const flowDotClass = reviewFlowStatus === 'RESPONDIDO' ? 'bd__kpi-dot--ok' : reviewFlowStatus === 'ENVIADO' ? 'bd__kpi-dot--warn' : 'bd__kpi-dot--err';
  const flowLabel    = reviewFlowStatus === 'RESPONDIDO' ? 'Respost' : reviewFlowStatus === 'ENVIADO' ? 'Enviat' : 'Falta enviar';

  const peKpiClass = internalPostEventStatus === 'COMPLETO' ? 'bd__kpi--ok' : internalPostEventStatus === 'EN_PROGRESO' ? 'bd__kpi--warn' : '';
  const peDotClass = internalPostEventStatus === 'COMPLETO' ? 'bd__kpi-dot--ok' : internalPostEventStatus === 'EN_PROGRESO' ? 'bd__kpi-dot--warn' : 'bd__kpi-dot--neutral';
  const peLabel    = internalPostEventStatus === 'COMPLETO' ? 'Completat' : internalPostEventStatus === 'EN_PROGRESO' ? 'En progrés' : 'Pendent';

  return (
    <div className="bd__root">

      {/* ── Header sticky ── */}
      <div className="bd__header">
        <div className="bd__hero">

          {/* Breadcrumb */}
          <div className="bd__breadcrumb">
            <Link href="/admin/leads" className="bd__back">Agenda</Link>
            <span className="bd__bread-sep">›</span>
            <Link href="/admin/bookings" className="bd__back">Reserves</Link>
            <span className="bd__bread-sep">›</span>
            <span>{booking.reference}</span>
          </div>

          {/* Title + actions */}
          <div className="bd__toprow">
            <div className="bd__titlecol">
              <p className="bd__eyebrow">Reserva</p>
              <h1 className="bd__h1">
                <span className="bd__h1-ref">{booking.reference}</span>
                {booking.clientName}
              </h1>
              <div className="bd__meta">
                {/* Status chip */}
                <span className={`bd__chip ${
                  booking.status === 'CONFIRMED' || booking.status === 'COMPLETED' ? 'bd__chip--ok'
                  : booking.status === 'CANCELLED' ? 'bd__chip--err'
                  : 'bd__chip--warn'
                }`}>
                  {statusConf.label}
                </span>
                <span className="bd__chip">{eventType} · {formatDate(booking.eventDate)}</span>
                {bookingWx && <WxBadge wx={bookingWx} size="md" />}
                {!isPast && !isToday && booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                  <span className={`bd__chip ${isSoon ? 'bd__chip--warn' : ''}`}>
                    {daysUntil} {daysUntil === 1 ? 'dia' : 'dies'}
                  </span>
                )}
                {isToday && booking.status !== 'COMPLETED' && (
                  <span className="bd__chip bd__chip--info">AVUI</span>
                )}
              </div>
            </div>

            <div className="bd__acts">
              <BookingStatusChanger
                bookingId={booking.id}
                currentStatus={booking.status}
                guestCount={booking.guestCount}
              />
              {customer && (
                <Link href={buildCustomerHubHref(customer.id)} className="bd__btn bd__btn--sec">
                  Fitxa Client
                </Link>
              )}
              {booking.lead && (
                <Link href={buildLeadWorkspaceHref(booking.lead.id)} className="bd__btn">
                  Entrada original
                </Link>
              )}
            </div>
          </div>

          {/* KPI bar */}
          <div className="bd__kpis" {...helpAttrs(ADMIN_BOOKING_HELP.detail.executive)}>
            {/* Total */}
            <div className="bd__kpi bd__kpi--gold">
              <p className="bd__kpi-label">Total reserva</p>
              <p className="bd__kpi-val">{formatCurrency(booking.total)}</p>
            </div>

            {/* Pagament */}
            <div className={`bd__kpi ${paymentKpiClass}`}>
              <div className="bd__kpi-head">
                <span className={`bd__kpi-dot ${paymentDotClass}`} />
                <p className="bd__kpi-label">Pagament</p>
              </div>
              <p className="bd__kpi-val">{paymentLabel}</p>
            </div>

            {/* Flux client */}
            <div className={`bd__kpi ${flowKpiClass}`}>
              <div className="bd__kpi-head">
                <span className={`bd__kpi-dot ${flowDotClass}`} />
                <p className="bd__kpi-label">Flux client</p>
              </div>
              <p className="bd__kpi-val">{flowLabel}</p>
            </div>

            {/* Post-event intern */}
            <div className={`bd__kpi ${peKpiClass}`}>
              <div className="bd__kpi-head">
                <span className={`bd__kpi-dot ${peDotClass}`} />
                <p className="bd__kpi-label">Post-event</p>
              </div>
              <p className="bd__kpi-val">{peLabel}</p>
            </div>

            {/* Entrada comercial */}
            <div className="bd__kpi">
              <p className="bd__kpi-label">Entrada comercial</p>
              {booking.lead ? (
                <Link href={buildLeadWorkspaceHref(booking.lead.id)} className="bd__kpi-link">
                  {booking.lead.status}
                </Link>
              ) : (
                <p className="bd__kpi-val">Sense lead</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Section nav */}
      <BookingSectionNav />

      {/* ── Body ── */}
      <div className="bd__body">

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

        {/* ── Client ── */}
        <section id="sec-client" className="bd__pnl" {...helpAttrs(ADMIN_BOOKING_HELP.detail.client)}>
          <div className="bd__pnl-head">
            <h2 className="bd__pnl-title">Informació del Client</h2>
          </div>
          <MobileQuickActions
            phone={booking.clientPhone}
            email={booking.clientEmail}
            emailHref={bookingComposeHref}
            whatsappMessage={`Hola ${booking.clientName}! Et contactem des d'Òrbita Events per la reserva ${booking.reference}.`}
          />
          <div className="bd__grid">
            <div>
              <p className="bd__field-label">Nom</p>
              {customer ? (
                <Link href={buildCustomerHubHref(customer.id)} className="bd__field-link bd__field-val--em">
                  {booking.clientName}
                </Link>
              ) : (
                <p className="bd__field-val bd__field-val--em">{booking.clientName}</p>
              )}
            </div>
            <div>
              <p className="bd__field-label">Email</p>
              <Link href={bookingComposeHref} className="bd__field-link">{booking.clientEmail}</Link>
            </div>
            <div>
              <p className="bd__field-label">Telèfon</p>
              <a href={`tel:${booking.clientPhone}`} className="bd__field-link">{booking.clientPhone}</a>
            </div>
          </div>

          {booking.lead && (
            <hr className="bd__sep" />
          )}
          {booking.lead && (
            <div style={{ marginTop: '10px' }}>
              <Link href={buildLeadWorkspaceHref(booking.lead.id)} className="bd__field-link">
                Veure entrada original →
              </Link>
            </div>
          )}

          <div className="bd__quickacts">
            <PostEventEmailButton bookingId={booking.id} />
            {customer && (
              <Link href={buildCustomerHubHref(customer.id)} className="bd__btn bd__btn--sec">
                Fitxa client 360
              </Link>
            )}
            <CalendarSyncButton bookingId={booking.id} />
            <details className="relative group" {...helpAttrs(ADMIN_BOOKING_HELP.detail.moreActions)}>
              <summary className="bd__btn list-none cursor-pointer select-none">Més accions ▾</summary>
              <div className="bd__dropdown">
                <Link href={`/admin/post-event/reports/new?bookingId=${booking.id}`} className="bd__dropdown-item">
                  Crear informe intern
                </Link>
                <a href={googleCalendarUrl} target="_blank" rel="noopener noreferrer" className="bd__dropdown-item">
                  Afegir a Google Calendar
                </a>
                <Link href="/admin/settings/integrations" className="bd__dropdown-item">
                  Sincronitzar mòbil/ICS
                </Link>
              </div>
            </details>
          </div>

          {customer && (
            <div className="bd__custstrip">
              Historial client: {customer.totalEvents} esdeveniments · {formatCurrency(customer.totalSpent)} · últim {formatDateSimple(customer.lastEventDate)}
            </div>
          )}
        </section>

        {/* ── Detalls event ── */}
        <section id="sec-event" className="bd__pnl" {...helpAttrs(ADMIN_BOOKING_HELP.detail.event)}>
          <div className="bd__pnl-head">
            <h2 className="bd__pnl-title">Detalls de l&apos;Esdeveniment</h2>
          </div>
          <div className="bd__grid bd__grid--4">
            <div>
              <p className="bd__field-label">Tipus</p>
              <p className="bd__field-val">{eventType}</p>
            </div>
            <div>
              <p className="bd__field-label">Data</p>
              <p className="bd__field-val bd__field-val--em">{formatDate(booking.eventDate)}</p>
            </div>
            <div>
              <p className="bd__field-label">Horari</p>
              <p className="bd__field-val">{booking.eventStartTime || '--:--'} – {booking.eventEndTime || '--:--'}</p>
            </div>
            <div>
              <p className="bd__field-label">Convidats</p>
              <p className="bd__field-val bd__field-val--em">{booking.guestCount} persones</p>
            </div>
            <div className="bd__grid--span2">
              <p className="bd__field-label">Ubicació</p>
              <p className="bd__field-val">{booking.eventLocation}</p>
            </div>
            {booking.eventVenue && (
              <div className="bd__grid--span2">
                <p className="bd__field-label">Espai</p>
                <p className="bd__field-val">{booking.eventVenue}</p>
              </div>
            )}
          </div>
        </section>

        {/* ── Serveis ── */}
        <section id="sec-serveis" className="bd__pnl" {...helpAttrs(ADMIN_BOOKING_HELP.detail.services)}>
          <div className="bd__pnl-head">
            <h2 className="bd__pnl-title">Serveis Contractats</h2>
          </div>

          <div className="bd__packcard">
            <div className="bd__packcard-info">
              <p className="bd__packcard-type">Pack</p>
              <Link href={buildPackHref(booking.pack.id)} className="bd__packcard-name">
                {packTranslation?.name || booking.pack.slug}
              </Link>
              {packTranslation?.tagline && (
                <p className="bd__packcard-tag">{packTranslation.tagline}</p>
              )}
              <p className="bd__packcard-meta">
                {booking.pack.djHours}h DJ · {booking.pack.soundWatts}W So
                {booking.pack.includesFog && ' · Fum'}
                {booking.pack.includesMic && ' · Micro'}
              </p>
            </div>
            <span className="bd__packcard-price">{formatCurrency(booking.pack.price)}</span>
          </div>

          {booking.extras.length > 0 && (
            <div className="bd__extras">
              <p className="bd__extras-title">Extras</p>
              {booking.extras.map((extra: BookingExtraRow) => {
                const extraTranslation = getPackTranslation(
                  extra.extra.translations as Array<{ locale: string; name: string; tagline?: string | null }>,
                  booking.lead?.preferredLocale || booking.preferredLocale || 'ca'
                );
                return (
                  <div key={extra.id} className="bd__extrarow">
                    <div>
                      <p className="bd__extrarow-name">{extraTranslation?.name || extra.extra.slug}</p>
                      {(extra.quantity ?? 0) > 1 && <p className="bd__extrarow-qty">×{extra.quantity}</p>}
                    </div>
                    <span className="bd__extrarow-price">{formatCurrency(extra.price)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {extraHours > 0 && (
            <div className="bd__extrahours">
              <span className="bd__extrahours-label">Hores extra</span>
              <span className="bd__extrahours-val">
                {extraHours}h × {formatCurrency(booking.pack.extraHourPrice)} = {formatCurrency(extraHours * booking.pack.extraHourPrice)}
              </span>
            </div>
          )}
        </section>

        {/* ── Equipament ── */}
        <div id="sec-equipament" style={{ scrollMarginTop: '140px' }}>
          <BookingInventorySection bookingId={booking.id} />
        </div>

        {/* ── Portal ── */}
        <div id="sec-portal" style={{ scrollMarginTop: '140px' }}>
          <ClientPortalAccessPanel bookingId={booking.id} initialActive={activePortalAccess} />
        </div>

        {/* ── Qüestionari ── */}
        <div id="sec-questionnaire" style={{ scrollMarginTop: '140px' }}>
          <BookingQuestionnaireSection bookingId={booking.id} />
        </div>

        {/* ── Finances ── */}
        <section id="sec-finances" className="bd__pnl" {...helpAttrs(ADMIN_BOOKING_HELP.detail.finances)}>
          <div className="bd__pnl-head">
            <h2 className="bd__pnl-title">Resum Econòmic</h2>
          </div>
          <div className="bd__finrows">
            <div className="bd__finrow">
              <span>Subtotal</span>
              <span>{formatCurrency(booking.subtotal)}</span>
            </div>
            {booking.discount > 0 && (
              <div className="bd__finrow">
                <span>Descompte{booking.discountCode ? ` (${booking.discountCode})` : ''}</span>
                <span>-{formatCurrency(booking.discount)}</span>
              </div>
            )}
            <div className="bd__finrow">
              <span>IVA ({booking.vatRate}%)</span>
              <span>{formatCurrency(booking.vatAmount)}</span>
            </div>
            <div className="bd__finrow bd__finrow--total">
              <span>Total</span>
              <BookingTotalEditor bookingId={booking.id} total={Number(booking.total)} />
            </div>
          </div>

          <div className="bd__paygrid">
            <div className={`bd__paycell ${booking.depositPaid ? 'bd__paycell--ok' : 'bd__paycell--err'}`}>
              <p className="bd__paycell-label">Paga i Senyal (30%)</p>
              <p className="bd__paycell-val">{formatCurrency(booking.depositAmount)}</p>
              <p className="bd__paycell-state">{booking.depositPaid ? 'Pagat' : 'Pendent'}</p>
            </div>
            <div className={`bd__paycell ${booking.remainingPaid ? 'bd__paycell--ok' : 'bd__paycell--warn'}`}>
              <p className="bd__paycell-label">Resta</p>
              <p className="bd__paycell-val">{formatCurrency(booking.remainingAmount)}</p>
              <p className="bd__paycell-state">{booking.remainingPaid ? 'Pagat' : 'Pendent'}</p>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <StripePaymentPanel
              bookingId={booking.id}
              depositPaid={booking.depositPaid}
              depositPaymentUrl={booking.depositPaymentUrl}
              remainingPaid={booking.remainingPaid}
              remainingPaymentUrl={booking.remainingPaymentUrl}
              depositAmount={booking.depositAmount}
              remainingAmount={booking.remainingAmount}
            />
          </div>
        </section>

        {/* ── Checklist ── */}
        {(booking.status === 'CONFIRMED' || booking.status === 'PREPARING') && (
          <BookingChecklist bookingId={booking.id} />
        )}

        {/* ── Marge ── */}
        <div id="sec-marge" style={{ scrollMarginTop: '140px' }}>
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

        {/* ── Documents ── */}
        <div id="sec-documents" style={{ scrollMarginTop: '140px' }}>
          <DocumentFlowSection
            proposals={(booking.proposals as BookingProposalRow[]).map((p) => ({
              id: p.id, reference: p.reference, status: p.status, pdfUrl: p.pdfUrl,
              contractStatus: p.contractStatus, contractReference: p.contractReference,
              contractPdfUrl: p.contractPdfUrl,
              contractSignedAt: p.contractSignedAt?.toISOString() || null,
              contractSignedBy: p.contractSignedBy, contractSignatureIp: p.contractSignatureIp,
              contractSignatureUa: p.contractSignatureUa, contractSignatureBlob: p.contractSignatureBlob,
            }))}
            invoices={(booking.invoices as BookingInvoiceRow[]).map((inv) => ({
              id: inv.id, reference: inv.reference, status: inv.status, holdedInvoiceUrl: inv.holdedInvoiceUrl,
            }))}
          />
          <InvoiceSection
            bookingId={booking.id}
            invoices={(booking.invoices as BookingInvoiceRow[]).map((inv) => ({
              id: inv.id, reference: inv.reference, status: inv.status,
              total: Number(inv.total), holdedInvoiceUrl: inv.holdedInvoiceUrl,
              holdedSyncError: inv.holdedSyncError, createdAt: inv.createdAt.toISOString(),
            }))}
          />
        </div>

        {/* ── Notes ── */}
        {booking.notes && (
          <section className="bd__pnl">
            <div className="bd__pnl-head">
              <h2 className="bd__pnl-title">Notes</h2>
            </div>
            <p className="bd__notes">{booking.notes}</p>
          </section>
        )}

        {/* ── Comunicacions ── */}
        <section id="sec-comunicacions" className="bd__pnl" {...helpAttrs(ADMIN_BOOKING_HELP.detail.commHistory)}>
          <div className="bd__pnl-head">
            <h2 className="bd__pnl-title">Historial de comunicacions</h2>
            {recentCommRows.length > 0 && (
              <span className="bd__pnl-count">{recentCommRows.length}</span>
            )}
          </div>
          {recentCommRows.length === 0 ? (
            <p className="bd__empty">Encara no hi ha comunicacions registrades per aquest esdeveniment.</p>
          ) : (
            <table className="bd__comtbl" aria-label="Historial de comunicacions">
              <thead>
                <tr>
                  <th scope="col">Data</th>
                  <th scope="col">Acció</th>
                  <th scope="col">Flux</th>
                  <th scope="col">Canal</th>
                </tr>
              </thead>
              <tbody>
                {recentCommRows.map((row: { id: string; createdAt: Date; action: string; flow: string; channel: string }) => (
                  <tr key={row.id}>
                    <td>{formatDateTimeFull(row.createdAt)}</td>
                    <td>{row.action === 'COMM_RESPONDED' ? 'Respost' : 'Enviat'}</td>
                    <td>{row.flow}</td>
                    <td>{row.channel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* ── Historial (timeline) ── */}
        {bookingTimeline.length > 0 && (
          <section id="sec-historial" className="bd__pnl" {...helpAttrs(ADMIN_BOOKING_HELP.detail.activity)}>
            <div className="bd__pnl-head">
              <div>
                <h2 className="bd__pnl-title">Historial de canvis</h2>
              </div>
              <span className="bd__pnl-count">{bookingTimeline.length} entrades</span>
            </div>
            <div className="bd__entries">
              {bookingTimeline.map((entry) => {
                const description = describeBookingTimelineEntry(entry);
                return (
                  <article key={entry.id} className="bd__entry">
                    <div className="bd__entry-inner">
                      <div className="bd__entry-main">
                        <p className="bd__entry-eyebrow">
                          <span>{getBookingTimelineSourceLabel(entry.source)}</span>
                          <span>·</span>
                          <span>{getBookingTimelineKindLabel(entry.kind)}</span>
                        </p>
                        <p className="bd__entry-title">{entry.title}</p>
                        {description && <p className="bd__entry-body">{description}</p>}
                        {entry.link && (
                          <Link href={entry.link.href} className="bd__entry-link">
                            {entry.link.label}
                          </Link>
                        )}
                      </div>
                      <div className="bd__entry-ts">
                        <p>{formatDateTimeFull(new Date(entry.occurredAt))}</p>
                        {entry.actor && <p className="bd__entry-actor">{entry.actor}</p>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Galeria ── */}
        <section id="sec-galeria" className="bd__pnl" {...helpAttrs(ADMIN_BOOKING_HELP.detail.gallery)}>
          <div style={{ marginBottom: '16px' }}>
            <BookingFieldNotesComposer bookingId={booking.id} />
          </div>
          <BookingGallery bookingId={booking.id} />
        </section>

        {/* ── Post-event ── */}
        {booking.status === 'COMPLETED' && (
          <section className="bd__pnl">
            <div className="bd__pnl-head">
              <h2 className="bd__pnl-title">Post-event</h2>
            </div>
            <div className="bd__postevent">
              <div className={`bd__pecard ${booking.postEventReport ? 'bd__pecard--ok' : ''}`}>
                <p className="bd__pecard-name">Informe Intern</p>
                <p className="bd__pecard-val">{booking.postEventReport ? 'Completat' : 'Pendent de completar'}</p>
              </div>
              <div className={`bd__pecard ${booking.clientSurvey ? 'bd__pecard--ok' : ''}`}>
                <p className="bd__pecard-name">Enquesta Client</p>
                <p className="bd__pecard-val">{booking.clientSurvey ? `NPS: ${booking.clientSurvey.npsScore}` : 'Pendent de rebre'}</p>
              </div>
              <div className={`bd__pecard ${booking.clientFeedback ? 'bd__pecard--ok' : ''}`}>
                <p className="bd__pecard-name">Feedback Enviat</p>
                <p className="bd__pecard-val">{booking.clientFeedback ? `Codi: ${booking.clientFeedback.discountCode}` : "Pendent d'enviar"}</p>
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
              sentAt:      commStatuses.PAYMENT.sentAt?.toISOString()      || null,
              respondedAt: commStatuses.PAYMENT.respondedAt?.toISOString() || null,
            },
            POST_EVENT: {
              ...commStatuses.POST_EVENT,
              sentAt:      commStatuses.POST_EVENT.sentAt?.toISOString()      || null,
              respondedAt: commStatuses.POST_EVENT.respondedAt?.toISOString() || null,
            },
            GENERAL: {
              ...commStatuses.GENERAL,
              sentAt:      commStatuses.GENERAL.sentAt?.toISOString()      || null,
              respondedAt: commStatuses.GENERAL.respondedAt?.toISOString() || null,
            },
          }}
        />

      </div>
    </div>
  );
}
