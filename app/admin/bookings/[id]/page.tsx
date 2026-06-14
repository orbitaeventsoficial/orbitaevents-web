// app/admin/bookings/[id]/page.tsx
import './booking-detail.css';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { buildLeadComposeHref, buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { buildCustomerComposeHref, buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
import { buildPackHref } from '@/lib/admin/packWorkspaceHref';
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
import { getWeatherForEvent } from '@/lib/services/weatherService';
import WxBadge from '@/app/admin/components/WxBadge';
import type { WxData } from '@/app/admin/components/WxBadge';
import BookingTotalEditor from './BookingTotalEditor';
import { previewBookingCustomerLink } from '@/lib/services/bookings/bookingCustomerLinkService';
import { getBookingStatusDisplay, getLeadStatusDisplay, getEventLabel, formatDate, formatCurrency, formatDateSimple, formatDateTimeFull, getContractStatusLabel, getInvoiceStatusLabel, getProposalStatusDisplay } from '@/lib/constants';
import { ADMIN_BOOKING_HELP, helpAttrs } from '@/app/admin/components/adminHelpContent';
import type { BookingExtraRow, BookingProposalRow, BookingInvoiceRow, BookingNumericCompat } from './booking-utils';
import { buildGoogleCalendarUrl, getPackTranslation } from './booking-utils';
import type { CanonicalTimelineEvent } from '@/lib/services/timelineQueryService';
import MobileQuickActions from '@/app/admin/components/MobileQuickActions';
import CommercialDocumentsHistory, { type CommercialDocumentHistoryItem } from '@/app/admin/components/CommercialDocumentsHistory';

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
  const serviceLinesCost    = booking.serviceLines?.reduce((s: number, l: { costAmount?: number | null; quantity?: number | null }) => s + Number(l.costAmount || 0) * (l.quantity || 1), 0) ?? 0;
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

  return (
    <div className="bd__root" style={{ minHeight: '100vh', background: '#000' }}>

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
          <div className="bd__titlerow">
            <h1 className="ap-detail-title">{booking.clientName}</h1>
            <div className="ap-detail-meta">
              <BookingStatusChanger bookingId={booking.id} currentStatus={booking.status} guestCount={booking.guestCount} />
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
        </div>

          {/* KPI stats */}
          <div className="ap-detail-stats" {...helpAttrs(ADMIN_BOOKING_HELP.detail.executive)}>
            <div className="ap-detail-stats-cell ap-detail-stats-cell--gold">
              <p className="ap-detail-stats-label">Total reserva</p>
              <p className="ap-detail-stats-val">{formatCurrency(booking.total)}</p>
            </div>
            <div className={`ap-detail-stats-cell ${booking.depositPaid && booking.remainingPaid ? 'ap-detail-stats-cell--ok' : booking.depositPaid ? 'ap-detail-stats-cell--warn' : 'ap-detail-stats-cell--err'}`}>
              <p className="ap-detail-stats-label">
                <span className={`ap-detail-stats-dot ap-detail-stats-dot--${booking.depositPaid && booking.remainingPaid ? 'ok' : booking.depositPaid ? 'warn' : 'err'}`} />
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
      <div className="bd__body">

        {customerLinkPreview && (
          <BookingCustomerLinkPanel bookingId={booking.id} preview={customerLinkPreview} />
        )}

        <div className="bd__overview">

          {/* ── Client ── */}
          <section id="sec-client" className="bd__pnl" {...helpAttrs(ADMIN_BOOKING_HELP.detail.client)}>
            <div className="bd__pnl-head">
              <h2 className="bd__pnl-title">Informació del Client</h2>
            </div>
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
                  <div className="bd__grid">
                    <div>
                      <p className="bd__field-label">Nom</p>
                      {customer ? (
                        <Link href={buildCustomerHubHref(customer.id)} className="bd__field-link bd__field-val--em">{displayName}</Link>
                      ) : (
                        <p className="bd__field-val bd__field-val--em">{displayName}</p>
                      )}
                    </div>
                    <div>
                      <p className="bd__field-label">Email</p>
                      <Link href={bookingComposeHref} className="bd__field-link">{displayEmail}</Link>
                    </div>
                    <div>
                      <p className="bd__field-label">Telèfon</p>
                      <a href={`tel:${displayPhone}`} className="bd__field-link">{displayPhone}</a>
                    </div>
                  </div>
                </>
              );
            })()}
            {booking.lead && <hr className="bd__sep" />}
            {booking.lead && (
              <div style={{ marginTop: '10px' }}>
                <Link href={buildLeadWorkspaceHref(booking.lead.id)} className="bd__field-link">Veure entrada original →</Link>
              </div>
            )}
            <div className="bd__quickacts">
              <PostEventEmailButton bookingId={booking.id} />
              {customer && (
                <Link href={buildCustomerHubHref(customer.id)} className="bd__btn bd__btn--sec">Fitxa client 360</Link>
              )}
              <CalendarSyncButton bookingId={booking.id} />
              <details className="relative group" {...helpAttrs(ADMIN_BOOKING_HELP.detail.moreActions)}>
                <summary className="bd__btn list-none cursor-pointer select-none">Més accions ▾</summary>
                <div className="bd__dropdown">
                  <Link href={`/admin/post-event/reports/new?bookingId=${booking.id}`} className="bd__dropdown-item">Crear informe intern</Link>
                  <a href={googleCalendarUrl} target="_blank" rel="noopener noreferrer" className="bd__dropdown-item">Afegir a Google Calendar</a>
                  <Link href="/admin/settings/integrations" className="bd__dropdown-item">Sincronitzar mòbil/ICS</Link>
                </div>
              </details>
            </div>
            {customer && (
              <div className="bd__custstrip">
                Historial: {customer.totalEvents} esdeveniments · {formatCurrency(customer.totalSpent)} · últim {formatDateSimple(customer.lastEventDate)}
              </div>
            )}
          </section>

          {/* ── Esdeveniment ── */}
          <section id="sec-event" className="bd__pnl" {...helpAttrs(ADMIN_BOOKING_HELP.detail.event)}>
            <div className="bd__pnl-head">
              <h2 className="bd__pnl-title">Detalls de l&apos;Esdeveniment</h2>
            </div>
            <div className="bd__grid bd__grid--4">
              <div><p className="bd__field-label">Tipus</p><p className="bd__field-val">{eventType}</p></div>
              <div><p className="bd__field-label">Data</p><p className="bd__field-val bd__field-val--em">{formatDate(booking.eventDate)}</p></div>
              <div><p className="bd__field-label">Horari</p><p className="bd__field-val">{booking.eventStartTime || '--:--'} – {booking.eventEndTime || '--:--'}</p></div>
              <div><p className="bd__field-label">Convidats</p><p className="bd__field-val bd__field-val--em">{booking.guestCount} persones</p></div>
              <div className="bd__grid--span2"><p className="bd__field-label">Ubicació</p><p className="bd__field-val">{booking.eventLocation}</p></div>
              {booking.eventVenue && (
                <div className="bd__grid--span2"><p className="bd__field-label">Espai</p><p className="bd__field-val">{booking.eventVenue}</p></div>
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
                <Link href={buildPackHref(booking.pack.id)} className="bd__packcard-name">{packTranslation?.name || booking.pack.slug}</Link>
                <p className="bd__packcard-meta">Pack base de la reserva</p>
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
                <span className="bd__extrahours-val">{extraHours}h × {formatCurrency(booking.pack.extraHourPrice)} = {formatCurrency(extraHours * booking.pack.extraHourPrice)}</span>
              </div>
            )}
          </section>

          {/* ── Finances ── */}
          <section id="sec-finances" className="bd__pnl" {...helpAttrs(ADMIN_BOOKING_HELP.detail.finances)}>
            <div className="bd__pnl-head">
              <h2 className="bd__pnl-title">Resum Econòmic</h2>
            </div>
            <div className="bd__finrows">
              <div className="bd__finrow"><span>Subtotal</span><span>{formatCurrency(booking.subtotal)}</span></div>
              {booking.discount > 0 && (
                <div className="bd__finrow"><span>Descompte{booking.discountCode ? ` (${booking.discountCode})` : ''}</span><span>-{formatCurrency(booking.discount)}</span></div>
              )}
              <div className="bd__finrow"><span>IVA ({booking.vatRate}%)</span><span>{formatCurrency(booking.vatAmount)}</span></div>
              <div className="bd__finrow bd__finrow--total"><span>Total</span><BookingTotalEditor bookingId={booking.id} total={Number(booking.total)} /></div>
            </div>
            <div className="bd__paygrid">
              <div className={`bd__paycell ${booking.depositPaid ? 'bd__paycell--ok' : 'bd__paycell--err'}`}>
                <p className="bd__paycell-label">Paga i senyal</p>
                <p className="bd__paycell-val">{formatCurrency(booking.depositAmount)}</p>
                <p className="bd__paycell-state">{booking.depositPaid ? 'Pagat' : 'Pendent'}</p>
              </div>
              <div className={`bd__paycell ${booking.remainingPaid ? 'bd__paycell--ok' : 'bd__paycell--warn'}`}>
                <p className="bd__paycell-label">Resta</p>
                <p className="bd__paycell-val">{formatCurrency(booking.remainingAmount)}</p>
                <p className="bd__paycell-state">{booking.remainingPaid ? 'Pagat' : 'Pendent'}</p>
              </div>
            </div>
            <div className="bd__stripe">
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
          </section>

        </div>{/* fi bd__overview */}

        <div className="bd__sec-divider" id="sec-equipament"><span>Equipament</span></div>
        <BookingInventorySection bookingId={booking.id} />

        <div className="bd__sec-divider" id="sec-portal"><span>Portal client</span></div>
        <ClientPortalAccessPanel bookingId={booking.id} initialActive={activePortalAccess} />

        <div className="bd__sec-divider" id="sec-questionnaire"><span>Qüestionari</span></div>
        <BookingQuestionnaireSection bookingId={booking.id} />

        {(booking.status === 'CONFIRMED' || booking.status === 'PREPARING') && (
          <BookingChecklist bookingId={booking.id} />
        )}

        <div className="bd__sec-divider" id="sec-marge"><span>Marge</span></div>
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

        <section className="bd__pnl">
          <div className="bd__pnl-head"><h2 className="bd__pnl-title">Serveis i productes (fora de pack)</h2></div>
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
        </section>

        {booking.notes && (
          <section className="bd__pnl">
            <div className="bd__pnl-head"><h2 className="bd__pnl-title">Notes</h2></div>
            <p className="bd__notes">{booking.notes}</p>
          </section>
        )}

        <div className="bd__sec-divider" id="sec-documents"><span>Documents</span></div>
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

        <div className="bd__sec-divider" id="sec-comunicacions"><span>Comunicacions</span></div>
        <section className="bd__pnl" {...helpAttrs(ADMIN_BOOKING_HELP.detail.commHistory)}>
          <div className="bd__pnl-head">
            <h2 className="bd__pnl-title">Historial de comunicacions</h2>
            {recentCommRows.length > 0 && <span className="bd__pnl-count">{recentCommRows.length}</span>}
          </div>
          {recentCommRows.length === 0 ? (
            <p className="bd__empty">Encara no hi ha comunicacions registrades per aquest esdeveniment.</p>
          ) : (
            <table className="bd__comtbl" aria-label="Historial de comunicacions">
              <thead><tr><th scope="col">Data</th><th scope="col">Acció</th><th scope="col">Flux</th><th scope="col">Canal</th></tr></thead>
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

        <div className="bd__sec-divider" id="sec-historial"><span>Historial</span></div>
        {bookingTimeline.length > 0 && (
          <section className="bd__pnl" {...helpAttrs(ADMIN_BOOKING_HELP.detail.activity)}>
            <div className="bd__pnl-head">
              <h2 className="bd__pnl-title">Historial de canvis</h2>
              <span className="bd__pnl-count">{bookingTimeline.length} entrades</span>
            </div>
            <div className="bd__entries">
              {bookingTimeline.slice(0, 8).map((entry) => {
                const description = describeBookingTimelineEntry(entry);
                return (
                  <article key={entry.id} className="bd__entry">
                    <div className="bd__entry-inner">
                      <div className="bd__entry-main">
                        <p className="bd__entry-eyebrow"><span>{getBookingTimelineSourceLabel(entry.source)}</span><span>·</span><span>{getBookingTimelineKindLabel(entry.kind)}</span></p>
                        <p className="bd__entry-title">{entry.title}</p>
                        {description && <p className="bd__entry-body">{description}</p>}
                        {entry.link && <Link href={entry.link.href} className="bd__entry-link">{entry.link.label}</Link>}
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
            {bookingTimeline.length > 8 && (
              <p className="bd__history-more">Mostrant les 8 últimes entrades. {bookingTimeline.length - 8} moviments antics amagats.</p>
            )}
          </section>
        )}

        <div className="bd__sec-divider" id="sec-galeria"><span>Galeria</span></div>
        <section className="bd__pnl" {...helpAttrs(ADMIN_BOOKING_HELP.detail.gallery)}>
          <div style={{ marginBottom: '16px' }}>
            <BookingFieldNotesComposer bookingId={booking.id} />
          </div>
          <BookingGallery bookingId={booking.id} />
        </section>

        {/* ── Post-event ── */}
        {booking.status === 'COMPLETED' && (
          <section className="bd__pnl">
            <div className="bd__pnl-head"><h2 className="bd__pnl-title">Post-event</h2></div>
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
            PAYMENT: { ...commStatuses.PAYMENT, sentAt: commStatuses.PAYMENT.sentAt?.toISOString() || null, respondedAt: commStatuses.PAYMENT.respondedAt?.toISOString() || null },
            POST_EVENT: { ...commStatuses.POST_EVENT, sentAt: commStatuses.POST_EVENT.sentAt?.toISOString() || null, respondedAt: commStatuses.POST_EVENT.respondedAt?.toISOString() || null },
            GENERAL: { ...commStatuses.GENERAL, sentAt: commStatuses.GENERAL.sentAt?.toISOString() || null, respondedAt: commStatuses.GENERAL.respondedAt?.toISOString() || null },
          }}
        />

      </div>
    </div>
  );
}
