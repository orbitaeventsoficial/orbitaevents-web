// app/admin/bookings/[id]/page.tsx
import type { ReactNode } from 'react';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { buildLeadComposeHref, buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { buildCustomerComposeHref, buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
import { buildPackHref } from '@/lib/admin/packWorkspaceHref';
import { buildEventLogistics } from '@/lib/admin/eventLogistics';
import { buildProposalHref } from '@/lib/admin/proposalWorkspaceHref';
import { notFound } from 'next/navigation';
import { BookingStatusChanger } from './BookingStatusChanger';
import CommunicationPanel from './CommunicationPanel';
import CalendarSyncButton from './CalendarSyncButton';
import PostEventEmailButton from './PostEventEmailButton';
import BookingMarginCard from './BookingMarginCard';
import BookingServiceLinesEditor from './BookingServiceLinesEditor';
import type { BookingServiceLineFormInput } from '../booking-form.types';
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
import { aggregateServiceLines } from '@/lib/services/costEngine';
import { getWeatherForEvent } from '@/lib/services/weatherService';
import WxBadge from '@/app/admin/components/WxBadge';
import type { WxData } from '@/app/admin/components/WxBadge';
import BookingTotalEditor from './BookingTotalEditor';
import PaymentToggle from './PaymentToggle';
import CashPaymentButton from './CashPaymentButton';
import { getPaymentBand, getPaymentLabel } from '@/lib/payment-status';
import { getBookingFiscalMode, getBookingPaymentMethodHelp, getBookingPaymentMethodLabel } from '@/lib/constants/booking-payment';
import { previewBookingCustomerLink } from '@/lib/services/bookings/bookingCustomerLinkService';
import { getLeadStatusDisplay, getEventLabel, formatDate, formatCurrency, formatDateSimple, formatDateTimeFull, getContractStatusLabel, getInvoiceStatusLabel, getProposalStatusDisplay } from '@/lib/constants';
import { ADMIN_BOOKING_HELP, helpAttrs } from '@/app/admin/components/adminHelpContent';
import type { BookingExtraRow, BookingProposalRow, BookingInvoiceRow, BookingNumericCompat } from './booking-utils';
import { buildGoogleCalendarUrl, getPackTranslation } from './booking-utils';
import type { CanonicalTimelineEvent } from '@/lib/services/timelineQueryService';
import MobileQuickActions from '@/app/admin/components/MobileQuickActions';
import CommercialDocumentsHistory, { type CommercialDocumentHistoryItem } from '@/app/admin/components/CommercialDocumentsHistory';
import { AdminEmptyState } from '@/app/admin/components/AdminPage';

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

// ── Helpers de presentació (token-utility, hipersemblança amb la fitxa de client) ──
function FieldLabel({ children }: { children: ReactNode }) {
  return <p className="m-0 mb-1 font-mono text-xs font-bold uppercase tracking-[0.1em] text-[var(--t3)]">{children}</p>;
}

function SecDivider({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div id={id} className="my-1 flex scroll-mt-24 items-center gap-2.5">
      <span className="h-px flex-1 bg-[var(--o-admin-line)]" />
      <span className="whitespace-nowrap font-mono text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--ax-fill-bright)]">{children}</span>
      <span className="h-px flex-1 bg-[var(--o-admin-line)]" />
    </div>
  );
}

function Panel({
  id,
  title,
  count,
  help,
  className = '',
  children,
}: {
  id?: string;
  title: string;
  count?: ReactNode;
  help?: Record<string, unknown>;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-36 rounded-[var(--o-r-xl)] border border-[var(--o-admin-line)] bg-[var(--ax-elevated)] p-4 shadow-[0_2px_16px_var(--ax-overlay-lg)] ${className}`}
      {...help}
    >
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-[var(--o-admin-line-2)] pb-2.5">
        <h2 className="m-0 font-display text-lg font-bold tracking-[-0.01em] text-[var(--t)]">{title}</h2>
        {count != null && (
          <span className="rounded-full border border-[var(--o-admin-line-2)] bg-[var(--ax-fill-2)] px-2 py-0.5 text-xs text-[var(--t3)]">{count}</span>
        )}
      </div>
      {children}
    </section>
  );
}

async function getBooking(id: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        pack: { include: { translations: true, inventory: { include: { item: true } } } },
        extras: { include: { extra: { include: { translations: true } } } },
        serviceLines: { orderBy: { sortOrder: 'asc' } },
        inventory: { include: { item: true } },
        lead: {
          include: {
            dossiers: {
              where: { deletedAt: null },
              orderBy: { createdAt: 'desc' },
              select: { id: true, nom: true, mode: true, sentAt: true, createdAt: true },
            },
            documents: {
              orderBy: { createdAt: 'desc' },
              select: { id: true, type: true, title: true, fileUrl: true, createdAt: true },
            },
          },
        },
        proposals: {
          select: {
            id: true, reference: true, status: true, total: true, createdAt: true, sentAt: true, acceptedAt: true, pdfUrl: true,
            contractStatus: true, contractReference: true, contractPdfUrl: true, contractSignedAt: true,
            contractSignedBy: true, contractSignatureIp: true, contractSignatureUa: true, contractSignatureBlob: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          select: { id: true, reference: true, status: true, total: true, holdedInvoiceUrl: true, holdedSyncError: true, pdfUrl: true, createdAt: true },
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
  // Logística de camp (mòbil): navegar a l'adreça i hora de sortida (viatge + 1h muntatge).
  const eventLogistics = buildEventLogistics({
    phone: booking.clientPhone,
    address: [booking.eventVenue, booking.eventLocation].filter(Boolean).join(', '),
    distanceKm: typeof bookingCompat.distanceKm === 'number' ? bookingCompat.distanceKm : null,
    eventStartTime: booking.eventStartTime,
  });
  const packPrice           = booking.pack?.price ? Number(booking.pack.price) : 0;
  const extrasTotal         = booking.extras?.reduce((s: number, e: { price?: number | null; quantity?: number | null }) => s + Number(e.price || 0) * (e.quantity || 1), 0) ?? 0;
  const serviceLinesAgg     = aggregateServiceLines(booking.serviceLines ?? []);
  const serviceLinesCost    = serviceLinesAgg.cost;
  const extraHours          = typeof bookingCompat.extraHours === 'number' ? bookingCompat.extraHours : 0;
  const extraHourPrice      = booking.pack?.extraHourPrice ? Number(booking.pack.extraHourPrice) : 0;
  const inventoryCostReal   = inventoryCost.totalCost;
  const inventoryRemainingHoursAvg = inventoryCost.remainingHoursAvg;
  const inventoryRemainingHoursMin = inventoryCost.remainingHoursMin;

  const daysUntil = Math.ceil((booking.eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isPast    = daysUntil < 0;
  const isToday   = daysUntil === 0;
  const isSoon    = daysUntil > 0 && daysUntil <= 7;


  // KPI payment state helpers (label canònic via lib/payment-status)
  const paymentCoverage = {
    cashAmount: booking.cashAmount ? Number(booking.cashAmount) : null,
    total: Number(booking.total),
  };
  const paymentBand     = getPaymentBand(booking.depositPaid, booking.remainingPaid, paymentCoverage);
  const paymentLabel    = getPaymentLabel(booking.depositPaid, booking.remainingPaid, paymentCoverage);
  const fiscalMode      = getBookingFiscalMode(booking.invoiceRequired);
  const paymentMethodLabel = getBookingPaymentMethodLabel(booking.paymentMethod);
  const paymentMethodHelp  = getBookingPaymentMethodHelp(booking.paymentMethod);

  const flowLabel    = reviewFlowStatus === 'RESPONDIDO' ? 'Respost' : reviewFlowStatus === 'ENVIADO' ? 'Enviat' : 'Falta enviar';

  const documentHistoryItems: CommercialDocumentHistoryItem[] = [
    ...booking.proposals.flatMap((p) => {
      const items: CommercialDocumentHistoryItem[] = [{
        id: `proposal-${p.id}`,
        kindLabel: 'Pressupost',
        title: p.reference,
        reference: p.reference,
        statusLabel: getProposalStatusDisplay(p.status).label,
        amount: Number(p.total),
        createdAt: p.createdAt,
        sentAt: p.sentAt,
        href: buildProposalHref(p.id),
      }];
      if (p.contractReference || p.contractStatus || p.contractPdfUrl) {
        items.push({
          id: `contract-${p.id}`,
          kindLabel: 'Contracte',
          title: p.contractReference || p.reference,
          reference: p.contractReference || null,
          statusLabel: getContractStatusLabel(p.contractStatus ?? null),
          amount: Number(p.total),
          createdAt: p.contractSignedAt || p.sentAt || p.createdAt,
          href: p.contractPdfUrl || buildProposalHref(p.id),
          targetBlank: Boolean(p.contractPdfUrl),
        });
      }
      return items;
    }),
    ...booking.invoices.map((inv) => ({
      id: `invoice-${inv.id}`,
      kindLabel: 'Factura',
      title: inv.reference,
      reference: inv.reference,
      statusLabel: getInvoiceStatusLabel(inv.status),
      amount: Number(inv.total),
      createdAt: inv.createdAt,
      href: inv.holdedInvoiceUrl || inv.pdfUrl || null,
      targetBlank: Boolean(inv.holdedInvoiceUrl || inv.pdfUrl),
    })),
    ...(booking.lead?.dossiers || []).map((d) => ({
      id: `dossier-${d.id}`,
      kindLabel: d.mode === 'quote' ? 'Pressupost dossier' : 'Dossier',
      title: d.nom,
      statusLabel: d.sentAt ? 'enviat' : 'esborrany',
      createdAt: d.createdAt,
      sentAt: d.sentAt,
      href: `/api/admin/dossiers/${d.id}/composite`,
      targetBlank: true,
    })),
    ...(booking.lead?.documents || []).map((doc) => ({
      id: `lead-document-${doc.id}`,
      kindLabel: doc.type === 'QUOTE' ? 'Pressupost antic' : doc.type === 'CONTRACT' ? 'Contracte antic' : 'Document',
      title: doc.title,
      statusLabel: doc.type,
      createdAt: doc.createdAt,
      href: doc.fileUrl,
      targetBlank: true,
    })),
  ];

  const chipBase = 'inline-flex h-8 items-center whitespace-nowrap rounded-full border px-3 text-sm font-semibold';

  return (
    <div className="min-h-screen bg-[var(--ax-canvas)] text-[var(--t2)]">

      {/* ── HEADER ── */}
      <div className="ap-sticky-header">

        {/* Barra superior */}
        <div className="ap-detail-bar">
          <Link href="/admin/bookings" className="ap-detail-bar-btn">← Reserves</Link>
          <div className="ap-detail-bar-actions">
            {customer && (
              <Link href={buildCustomerHubHref(customer.id)} className="ap-detail-bar-btn ap-detail-bar-btn--accent">👤 Client</Link>
            )}
            {booking.lead && (
              <Link href={buildLeadWorkspaceHref(booking.lead.id)} className="ap-detail-bar-btn">↗ Lead</Link>
            )}
          </div>
        </div>

        {/* Hero: kicker + títol + meta */}
        <div className="ap-detail-hero">
          <p className="ap-detail-kicker">{eventType} · {booking.reference}</p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="ap-detail-title">{booking.clientName}</h1>
            <div className="ap-detail-meta">
              <BookingStatusChanger bookingId={booking.id} currentStatus={booking.status} guestCount={booking.guestCount} />
              {bookingWx && <WxBadge wx={bookingWx} size="md" />}
              {!isPast && !isToday && booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                <span className={`${chipBase} ${isSoon ? 'border-[var(--ax-warning-border)] bg-[var(--ax-warning-bg)] text-[var(--o-warning)]' : 'border-[var(--o-admin-line-2)] bg-[var(--ax-fill-2)] text-[var(--t2)]'}`}>
                  {daysUntil} {daysUntil === 1 ? 'dia' : 'dies'}
                </span>
              )}
              {isToday && booking.status !== 'COMPLETED' && (
                <span className={`${chipBase} border-[var(--ax-info-border)] bg-[var(--ax-info-bg)] text-[var(--o-info)]`}>AVUI</span>
              )}
            </div>
          </div>
        </div>

          {/* KPI stats */}
          <div className="ap-detail-stats" {...helpAttrs(ADMIN_BOOKING_HELP.detail.executive)}>
            <div className="ap-detail-stats-cell ap-detail-stats-cell--gold">
              <p className="ap-detail-stats-label">Total reserva</p>
              <p className="ap-detail-stats-val">{formatCurrency(booking.total)}</p>
            </div>
            <div className={`ap-detail-stats-cell ${paymentBand === 'paid' ? 'ap-detail-stats-cell--ok' : paymentBand === 'partial' ? 'ap-detail-stats-cell--warn' : 'ap-detail-stats-cell--err'}`}>
              <p className="ap-detail-stats-label">
                <span className={`ap-detail-stats-dot ap-detail-stats-dot--${paymentBand === 'paid' ? 'ok' : paymentBand === 'partial' ? 'warn' : 'err'}`} />
                Pagament
              </p>
              <p className="ap-detail-stats-val">{paymentLabel}</p>
            </div>
            <div className="ap-detail-stats-cell">
              <p className="ap-detail-stats-label">Data</p>
              <p className="ap-detail-stats-val">{formatDate(booking.eventDate)}</p>
            </div>
            <div className={`ap-detail-stats-cell ${reviewFlowStatus === 'RESPONDIDO' ? 'ap-detail-stats-cell--ok' : reviewFlowStatus === 'ENVIADO' ? 'ap-detail-stats-cell--warn' : 'ap-detail-stats-cell--err'}`}>
              <p className="ap-detail-stats-label">
                <span className={`ap-detail-stats-dot ap-detail-stats-dot--${reviewFlowStatus === 'RESPONDIDO' ? 'ok' : reviewFlowStatus === 'ENVIADO' ? 'warn' : 'err'}`} />
                Flux client
              </p>
              <p className="ap-detail-stats-val">{flowLabel}</p>
            </div>
            <div className="ap-detail-stats-cell">
              <p className="ap-detail-stats-label">Lead</p>
              {booking.lead ? (
                <Link href={buildLeadWorkspaceHref(booking.lead.id)} className="ap-detail-stats-val" style={{ textDecoration: 'none' }}>
                  {getLeadStatusDisplay(booking.lead.status).label}
                </Link>
              ) : (
                <p className="ap-detail-stats-val" style={{ opacity: 0.4 }}>Sense lead</p>
              )}
            </div>
          </div>

        {/* ── Navegació seccions ── */}
        <BookingSectionNav />

      </div>

      {/* ── BODY ── */}
      <div className="mx-auto flex max-w-[76.25rem] flex-col gap-1 px-5 pb-8 pt-2">

        {customerLinkPreview && (
          <BookingCustomerLinkPanel bookingId={booking.id} preview={customerLinkPreview} />
        )}

        <div className="grid grid-cols-1 gap-1 lg:grid-cols-2">

          {/* ── Client ── */}
          <Panel id="sec-client" title="Informació del Client" help={helpAttrs(ADMIN_BOOKING_HELP.detail.client)}>
            {/* Dades canoniques: customer si vinculat, booking com a fallback */}
            {(() => {
              const displayName  = customer?.name  ?? booking.clientName;
              const displayEmail = customer?.email ?? booking.clientEmail;
              const displayPhone = customer?.phone ?? booking.clientPhone;
              return (
                <>
                  <MobileQuickActions
                    phone={displayPhone}
                    email={displayEmail}
                    emailHref={bookingComposeHref}
                    whatsappMessage={`Hola ${displayName}! Et contactem des d'Òrbita Events per la reserva ${booking.reference}.`}
                  />
                  <div className="grid grid-cols-1 gap-x-2.5 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <FieldLabel>Nom</FieldLabel>
                      {customer ? (
                        <Link href={buildCustomerHubHref(customer.id)} className="block text-sm font-bold text-[var(--gold)] no-underline hover:underline">{displayName}</Link>
                      ) : (
                        <p className="m-0 text-sm font-bold text-[var(--gold)]">{displayName}</p>
                      )}
                    </div>
                    <div>
                      <FieldLabel>Email</FieldLabel>
                      <Link href={bookingComposeHref} className="block text-sm font-semibold text-[var(--t)] no-underline hover:underline">{displayEmail}</Link>
                    </div>
                    <div>
                      <FieldLabel>Telèfon</FieldLabel>
                      <a href={`tel:${displayPhone}`} className="block text-sm font-semibold text-[var(--t)] no-underline hover:underline">{displayPhone}</a>
                    </div>
                  </div>
                </>
              );
            })()}
            {booking.lead && <hr className="mt-3 border-0 border-t border-[var(--o-admin-line)]" />}
            {booking.lead && (
              <div className="mt-2.5">
                <Link href={buildLeadWorkspaceHref(booking.lead.id)} className="text-sm font-semibold text-[var(--t)] no-underline hover:underline">Veure entrada original →</Link>
              </div>
            )}
            <div className="mt-2.5 flex flex-wrap gap-2">
              <PostEventEmailButton bookingId={booking.id} />
              {customer && (
                <Link href={buildCustomerHubHref(customer.id)} className="ap-btn ap-btn--secondary ap-btn--xs">Fitxa client 360</Link>
              )}
              <CalendarSyncButton bookingId={booking.id} />
              <details className="group relative" {...helpAttrs(ADMIN_BOOKING_HELP.detail.moreActions)}>
                <summary className="ap-btn ap-btn--xs cursor-pointer list-none select-none">Més accions ▾</summary>
                <div className="absolute right-0 top-[calc(100%+0.25rem)] z-20 min-w-[12.5rem] rounded-[var(--o-r-lg)] border border-[var(--o-admin-line-2)] bg-[var(--raised)] py-1 shadow-[var(--o-shadow-lg)]">
                  <Link href={`/admin/post-event/reports/new?bookingId=${booking.id}`} className="block px-3.5 py-2 text-xs text-[var(--t2)] no-underline transition-colors hover:bg-[var(--ax-fill-2)] hover:text-[var(--t)]">Crear informe intern</Link>
                  <a href={googleCalendarUrl} target="_blank" rel="noopener noreferrer" className="block px-3.5 py-2 text-xs text-[var(--t2)] no-underline transition-colors hover:bg-[var(--ax-fill-2)] hover:text-[var(--t)]">Afegir a Google Calendar</a>
                  <Link href="/admin/settings/integrations" className="block px-3.5 py-2 text-xs text-[var(--t2)] no-underline transition-colors hover:bg-[var(--ax-fill-2)] hover:text-[var(--t)]">Sincronitzar mòbil/ICS</Link>
                </div>
              </details>
            </div>
            {customer && (
              <div className="mt-2.5 rounded-[var(--o-r-md)] border border-[var(--o-admin-line)] bg-[var(--ax-fill-1)] px-3 py-2 text-xs text-[var(--t3)]">
                Historial: {customer.totalEvents} esdeveniments · {formatCurrency(customer.totalSpent)} · últim {formatDateSimple(customer.lastEventDate)}
              </div>
            )}
          </Panel>

          {/* ── Esdeveniment ── */}
          <Panel id="sec-event" title="Detalls de l'Esdeveniment" help={helpAttrs(ADMIN_BOOKING_HELP.detail.event)}>
            <div className="grid grid-cols-1 gap-x-2.5 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-4">
              <div><FieldLabel>Tipus</FieldLabel><p className="m-0 text-sm font-semibold text-[var(--t)]">{eventType}</p></div>
              <div><FieldLabel>Data</FieldLabel><p className="m-0 text-sm font-bold text-[var(--gold)]">{formatDate(booking.eventDate)}</p></div>
              <div><FieldLabel>Horari</FieldLabel><p className="m-0 text-sm font-semibold text-[var(--t)]">{booking.eventStartTime || '--:--'} – {booking.eventEndTime || '--:--'}</p></div>
              <div><FieldLabel>Convidats</FieldLabel><p className="m-0 text-sm font-bold text-[var(--gold)]">{booking.guestCount} persones</p></div>
              <div className="sm:col-span-2"><FieldLabel>Ubicació</FieldLabel><p className="m-0 text-sm font-semibold text-[var(--t)]">{booking.eventLocation}</p></div>
              {booking.eventVenue && (
                <div className="sm:col-span-2"><FieldLabel>Espai</FieldLabel><p className="m-0 text-sm font-semibold text-[var(--t)]">{booking.eventVenue}</p></div>
              )}
              {eventLogistics.departureTime && (
                <div className="sm:col-span-2">
                  <FieldLabel>Sortir cap al bolo</FieldLabel>
                  <p className="m-0 text-sm font-bold text-[var(--gold)]">
                    {eventLogistics.departureTime}
                    <span className="text-xs font-normal text-[var(--t3)]"> · {eventLogistics.travelMinutes} min viatge + {eventLogistics.setupMinutes} min muntatge</span>
                  </p>
                </div>
              )}
              {(eventLogistics.wazeUrl || eventLogistics.mapsUrl) && (
                <div className="mt-1 flex flex-wrap gap-2 sm:col-span-2">
                  {eventLogistics.wazeUrl && (
                    <a href={eventLogistics.wazeUrl} target="_blank" rel="noopener noreferrer" className="ap-btn ap-btn--secondary ap-btn--xs">🧭 Waze</a>
                  )}
                  {eventLogistics.mapsUrl && (
                    <a href={eventLogistics.mapsUrl} target="_blank" rel="noopener noreferrer" className="ap-btn ap-btn--secondary ap-btn--xs">📍 Maps</a>
                  )}
                </div>
              )}
            </div>
          </Panel>

          {/* ── Serveis ── */}
          <Panel id="sec-serveis" title="Serveis Contractats" help={helpAttrs(ADMIN_BOOKING_HELP.detail.services)}>
            <div className="flex items-start justify-between gap-3 rounded-[var(--o-r-lg)] border border-[var(--o-admin-line)] bg-[var(--ax-fill-1)] p-3">
              <div className="min-w-0 flex-1">
                <p className="m-0 mb-1 font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--t3)]">Pack</p>
                <Link href={buildPackHref(booking.pack.id)} className="text-base font-extrabold text-[var(--t)] no-underline hover:text-[var(--gold)]">{packTranslation?.name || booking.pack.slug}</Link>
                <p className="m-0 mt-1 text-xs text-[var(--t3)]">Pack base de la reserva</p>
              </div>
              <span className="shrink-0 text-base font-bold text-[var(--gold)]">{formatCurrency(booking.pack.price)}</span>
            </div>
            {booking.extras.length > 0 && (
              <div className="mt-0.5 flex flex-col gap-1.5">
                <p className="m-0 mb-1 font-mono text-xs font-bold uppercase tracking-[0.1em] text-[var(--t3)]">Extras</p>
                {booking.extras.map((extra: BookingExtraRow) => {
                  const extraTranslation = getPackTranslation(
                    extra.extra.translations as Array<{ locale: string; name: string; tagline?: string | null }>,
                    booking.lead?.preferredLocale || booking.preferredLocale || 'ca'
                  );
                  return (
                    <div key={extra.id} className="flex items-center justify-between rounded-[var(--o-r-md)] border border-[var(--o-admin-line)] bg-[var(--ax-fill-1)] px-2.5 py-2">
                      <div>
                        <p className="m-0 text-sm text-[var(--t)]">{extraTranslation?.name || extra.extra.slug}</p>
                        {(extra.quantity ?? 0) > 1 && <p className="m-0 mt-px text-xs text-[var(--t3)]">×{extra.quantity}</p>}
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-[var(--t2)]">{formatCurrency(extra.price)}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {extraHours > 0 && (
              <div className="mt-1.5 flex items-center justify-between rounded-[var(--o-r-lg)] border border-[var(--o-admin-line)] bg-[var(--ax-fill-1)] px-2.5 py-2">
                <span className="text-sm text-[var(--t2)]">Hores extra</span>
                <span className="text-sm font-semibold text-[var(--gold)]">{extraHours}h × {formatCurrency(booking.pack.extraHourPrice)} = {formatCurrency(extraHours * booking.pack.extraHourPrice)}</span>
              </div>
            )}
          </Panel>

          {/* ── Finances ── */}
          <Panel id="sec-finances" title="Resum Econòmic" help={helpAttrs(ADMIN_BOOKING_HELP.detail.finances)}>
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between gap-3 border-b border-[var(--o-admin-line)] py-1.5 text-sm text-[var(--t2)]"><span>Subtotal</span><span>{formatCurrency(booking.subtotal)}</span></div>
              {booking.discount > 0 && (
                <div className="flex justify-between gap-3 border-b border-[var(--o-admin-line)] py-1.5 text-sm text-[var(--t2)]"><span>Descompte{booking.discountCode ? ` (${booking.discountCode})` : ''}</span><span>-{formatCurrency(booking.discount)}</span></div>
              )}
              <div className="flex justify-between gap-3 border-b border-[var(--o-admin-line)] py-1.5 text-sm text-[var(--t2)]"><span>IVA ({booking.vatRate}%)</span><span>{formatCurrency(booking.vatAmount)}</span></div>
              <div className="flex justify-between gap-3 border-b border-[var(--o-admin-line)] py-1.5 text-sm text-[var(--t2)]"><span>Fiscalitat</span><span>{fiscalMode.label}</span></div>
              <div className="flex justify-between gap-3 border-b border-[var(--o-admin-line)] py-1.5 text-sm text-[var(--t2)]"><span>Cobrament</span><span>{paymentMethodLabel}</span></div>
              {paymentCoverage.cashAmount && paymentCoverage.cashAmount > 0 && (
                <div className="flex justify-between gap-3 border-b border-[var(--o-admin-line)] py-1.5 text-sm text-[var(--t2)]"><span>Efectiu registrat</span><span>{formatCurrency(paymentCoverage.cashAmount)}</span></div>
              )}
              <div className="mt-1.5 flex items-center justify-between gap-3 border-t border-[var(--o-admin-line)] pt-2.5 text-base font-bold text-[var(--gold)]"><span>Total</span><BookingTotalEditor bookingId={booking.id} total={Number(booking.total)} /></div>
            </div>
            <p className="mt-1 text-xs text-[var(--t3)]">{paymentMethodHelp}</p>
            <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--o-r-lg)] border border-[var(--o-admin-line)] bg-[var(--o-admin-line)]">
              <div className={`px-3 py-2.5 ${booking.depositPaid ? 'bg-[var(--ax-success-bg)]' : 'bg-[var(--ax-danger-bg)]'}`}>
                <p className="m-0 mb-1 font-mono text-xs font-bold uppercase tracking-[0.1em] text-[var(--t3)]">Paga i senyal</p>
                <p className={`m-0 font-bold ${booking.depositPaid ? 'text-[var(--o-success)]' : 'text-[var(--o-danger)]'}`}>{formatCurrency(booking.depositAmount)}</p>
                <div className="text-xs text-[var(--t3)]">
                  <PaymentToggle bookingId={booking.id} field="depositPaid" paid={booking.depositPaid} />
                </div>
              </div>
              <div className={`px-3 py-2.5 ${booking.remainingPaid ? 'bg-[var(--ax-success-bg)]' : 'bg-[var(--ax-warning-bg)]'}`}>
                <p className="m-0 mb-1 font-mono text-xs font-bold uppercase tracking-[0.1em] text-[var(--t3)]">Resta</p>
                <p className={`m-0 font-bold ${booking.remainingPaid ? 'text-[var(--o-success)]' : 'text-[var(--o-warning)]'}`}>{formatCurrency(booking.remainingAmount)}</p>
                <div className="text-xs text-[var(--t3)]">
                  <PaymentToggle bookingId={booking.id} field="remainingPaid" paid={booking.remainingPaid} />
                </div>
              </div>
            </div>
            <div className="mt-2 flex justify-end">
              <CashPaymentButton bookingId={booking.id} total={Number(booking.total)} fullyPaid={booking.depositPaid && booking.remainingPaid} />
            </div>
            <div className="mt-3">
              <StripePaymentPanel
                bookingId={booking.id}
                depositPaid={booking.depositPaid}
                depositPaymentUrl={booking.depositPaymentUrl}
                depositBizumDeclaredAt={(booking as { depositBizumDeclaredAt?: Date | null }).depositBizumDeclaredAt ?? null}
                remainingPaid={booking.remainingPaid}
                remainingPaymentUrl={booking.remainingPaymentUrl}
                remainingBizumDeclaredAt={(booking as { remainingBizumDeclaredAt?: Date | null }).remainingBizumDeclaredAt ?? null}
                depositAmount={booking.depositAmount}
                remainingAmount={booking.remainingAmount}
                stripeConfigured={!!process.env.STRIPE_SECRET_KEY}
              />
            </div>
          </Panel>

        </div>

        <SecDivider id="sec-equipament">Equipament</SecDivider>
        <BookingInventorySection bookingId={booking.id} />

        <SecDivider id="sec-portal">Portal client</SecDivider>
        <ClientPortalAccessPanel bookingId={booking.id} initialActive={activePortalAccess} />

        <SecDivider id="sec-questionnaire">Qüestionari</SecDivider>
        <BookingQuestionnaireSection bookingId={booking.id} />

        {(booking.status === 'CONFIRMED' || booking.status === 'PREPARING') && (
          <BookingChecklist bookingId={booking.id} />
        )}

        <SecDivider id="sec-marge">Marge</SecDivider>
        <div>
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
            serviceLinesCost={serviceLinesCost}
          />
        </div>

        <Panel title="Serveis i productes (fora de pack)">
          <BookingServiceLinesEditor
            bookingId={booking.id}
            initialLines={(booking.serviceLines ?? []).map((line: { collaboratorId?: string | null; kind: string; label: string; revenueAmount?: number | null; costAmount?: number | null; quantity?: number | null; notes?: string | null }) => ({
              collaboratorId: line.collaboratorId ?? undefined,
              kind: line.kind as BookingServiceLineFormInput['kind'],
              label: line.label,
              revenueAmount: line.revenueAmount ?? undefined,
              costAmount: line.costAmount ?? undefined,
              quantity: line.quantity ?? 1,
              notes: line.notes ?? undefined,
            }))}
          />
        </Panel>

        {booking.notes && (
          <Panel title="Notes">
            <p className="m-0 whitespace-pre-wrap text-sm text-[var(--t2)]">{booking.notes}</p>
          </Panel>
        )}

        <SecDivider id="sec-documents">Documents</SecDivider>
        <div>
          <CommercialDocumentsHistory items={documentHistoryItems} />
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

        <SecDivider id="sec-comunicacions">Comunicacions</SecDivider>
        <Panel
          title="Historial de comunicacions"
          count={recentCommRows.length > 0 ? recentCommRows.length : undefined}
          help={helpAttrs(ADMIN_BOOKING_HELP.detail.commHistory)}
        >
          {recentCommRows.length === 0 ? (
            <AdminEmptyState title="Encara no hi ha comunicacions registrades per aquest esdeveniment." />
          ) : (
            <div className="ap-table-wrap">
              <table className="ap-table" aria-label="Historial de comunicacions">
                <thead className="ap-table-head"><tr><th scope="col" className="ap-table-th">Data</th><th scope="col" className="ap-table-th">Acció</th><th scope="col" className="ap-table-th">Flux</th><th scope="col" className="ap-table-th">Canal</th></tr></thead>
                <tbody className="ap-table-body">
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
            </div>
          )}
        </Panel>

        <SecDivider id="sec-historial">Historial</SecDivider>
        {bookingTimeline.length > 0 && (
          <Panel
            title="Historial de canvis"
            count={`${bookingTimeline.length} entrades`}
            help={helpAttrs(ADMIN_BOOKING_HELP.detail.activity)}
          >
            <div className="grid gap-1">
              {bookingTimeline.slice(0, 8).map((entry) => {
                const description = describeBookingTimelineEntry(entry);
                return (
                  <article key={entry.id} className="rounded-[var(--o-r-md)] border border-[var(--o-admin-line)] bg-[var(--ax-fill-1)] px-2.5 py-2">
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <div className="min-w-0">
                        <p className="m-0 mb-0.5 flex items-center gap-1 font-mono text-xs font-extrabold uppercase tracking-[0.08em] text-[var(--t3)]"><span>{getBookingTimelineSourceLabel(entry.source)}</span><span>·</span><span>{getBookingTimelineKindLabel(entry.kind)}</span></p>
                        <p className="m-0 text-xs font-extrabold leading-tight text-[var(--t)]">{entry.title}</p>
                        {description && <p className="hidden">{description}</p>}
                        {entry.link && <Link href={entry.link.href} className="hidden">{entry.link.label}</Link>}
                      </div>
                      <div className="text-left text-xs leading-tight text-[var(--t3)] sm:whitespace-nowrap sm:text-right">
                        <p className="m-0">{formatDateTimeFull(new Date(entry.occurredAt))}</p>
                        {entry.actor && <p className="m-0 mt-0.5">{entry.actor}</p>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {bookingTimeline.length > 8 && (
              <p className="mt-2 border-t border-[var(--o-admin-line)] pt-2 text-xs font-bold text-[var(--t3)]">Mostrant les 8 últimes entrades. {bookingTimeline.length - 8} moviments antics amagats.</p>
            )}
          </Panel>
        )}

        <SecDivider id="sec-galeria">Galeria</SecDivider>
        <Panel title="Galeria" help={helpAttrs(ADMIN_BOOKING_HELP.detail.gallery)}>
          <div className="mb-4">
            <BookingFieldNotesComposer bookingId={booking.id} />
          </div>
          <BookingGallery bookingId={booking.id} />
        </Panel>

        {/* ── Post-event ── */}
        {booking.status === 'COMPLETED' && (
          <Panel title="Post-event">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className={`rounded-[var(--o-r-lg)] border px-3.5 py-3 ${booking.postEventReport ? 'border-[var(--ax-success-border)] bg-[var(--ax-success-bg)]' : 'border-[var(--o-admin-line)] bg-[var(--ax-fill-1)]'}`}>
                <p className="m-0 mb-1 text-sm font-semibold text-[var(--t)]">Informe Intern</p>
                <p className="m-0 text-xs text-[var(--t3)]">{booking.postEventReport ? 'Completat' : 'Pendent de completar'}</p>
              </div>
              <div className={`rounded-[var(--o-r-lg)] border px-3.5 py-3 ${booking.clientSurvey ? 'border-[var(--ax-success-border)] bg-[var(--ax-success-bg)]' : 'border-[var(--o-admin-line)] bg-[var(--ax-fill-1)]'}`}>
                <p className="m-0 mb-1 text-sm font-semibold text-[var(--t)]">Enquesta Client</p>
                <p className="m-0 text-xs text-[var(--t3)]">{booking.clientSurvey ? `NPS: ${booking.clientSurvey.npsScore}` : 'Pendent de rebre'}</p>
              </div>
              <div className={`rounded-[var(--o-r-lg)] border px-3.5 py-3 ${booking.clientFeedback ? 'border-[var(--ax-success-border)] bg-[var(--ax-success-bg)]' : 'border-[var(--o-admin-line)] bg-[var(--ax-fill-1)]'}`}>
                <p className="m-0 mb-1 text-sm font-semibold text-[var(--t)]">Feedback Enviat</p>
                <p className="m-0 text-xs text-[var(--t3)]">{booking.clientFeedback ? `Codi: ${booking.clientFeedback.discountCode}` : "Pendent d'enviar"}</p>
              </div>
            </div>
          </Panel>
        )}

        <CommunicationPanel
          bookingId={booking.id}
          clientName={booking.clientName}
          clientPhone={booking.clientPhone}
          initialStatuses={{
            PAYMENT: { ...commStatuses.PAYMENT, sentAt: commStatuses.PAYMENT.sentAt?.toISOString() || null, respondedAt: commStatuses.PAYMENT.respondedAt?.toISOString() || null },
            POST_EVENT: { ...commStatuses.POST_EVENT, sentAt: commStatuses.POST_EVENT.sentAt?.toISOString() || null, respondedAt: commStatuses.POST_EVENT.respondedAt?.toISOString() || null },
            GENERAL: { ...commStatuses.GENERAL, sentAt: commStatuses.GENERAL.sentAt?.toISOString() || null, respondedAt: commStatuses.GENERAL.respondedAt?.toISOString() || null },
          }}
        />

      </div>
    </div>
  );
}
