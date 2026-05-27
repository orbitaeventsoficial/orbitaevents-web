import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildLeadComposeHref, buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import '../leads-design.css';
import LeadActionsEnhanced from './LeadActionsEnhanced';
import LeadProfileEditor from './LeadProfileEditor';
import LeadWorkspace from './LeadWorkspace';
import LeadNotesPanel from './LeadNotesPanel';
import LeadGuidedFlow from './LeadGuidedFlow';
import { scoreLead } from '@/lib/services/commercialScoring';
import { computeLeadInsights } from '@/lib/services/leadInsightsService';
import ScoreSnapshotButton from './ScoreSnapshotButton';
import LeadInsightsBanner from './LeadInsightsBanner';
import LeadScoreBreakdown from './LeadScoreBreakdown';
import LeadTechnicalSnapshotPanel from './LeadTechnicalSnapshotPanel';
import LeadCustomerLinkPanel from './LeadCustomerLinkPanel';
import LeadMobileQuickActions from './LeadMobileQuickActions';
import { LeadDossiersPanel } from './LeadDossiersPanel';
import { buildLeadTechnicalSnapshot } from '@/lib/services/leadSnapshotService';
import { previewLeadCustomerLink } from '@/lib/services/leads/leadCustomerLinkService';
import { SITE_CONFIG } from '@/app/config/site-config';
import InfoTooltip from '@/app/admin/components/InfoTooltip';
import { ADMIN_HELP } from '@/app/admin/components/adminHelpGlossary';
import { ADMIN_LEAD_HELP, helpAttrs } from '@/app/admin/components/adminHelpContent';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    select: { name: true },
  });

  return {
    title: lead ? `${lead.name} | Entrades` : 'Entrada no trobada',
  };
}

import { LEAD_SCORE_BAND_LABELS, formatDate, formatDateFull, formatDateSimple, formatDateTimeFull, formatDateTime, formatNumber, getEventLabel, getLeadPriorityDisplay, getLeadStatusDisplay } from '@/lib/constants';
import { getAppBaseUrl } from '@/lib/site';


const STAGE_KEY_MAP: Record<string, string> = {
  NEW: 'nou', CONTACTED: 'contactat', QUOTE_SENT: 'contactat',
  NEGOTIATING: 'contactat', WON: 'guanyat', LOST: 'perdut',
};

function getPriorityBadge(priority: string) {
  const tone = getLeadPriorityDisplay(priority);
  return { label: tone.label, color: tone.bg + ' ' + tone.text };
}

function parseBudgetValue(input?: string | null): number | null {
  if (!input) return null;
  const normalized = input.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export default async function LeadDetailPage({ params }: Props) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      customerId: true,
      name: true,
      email: true,
      phone: true,
      eventType: true,
      eventDate: true,
      eventLocation: true,
      guestCount: true,
      budget: true,
      message: true,
      interestedPackId: true,
      interestedExtras: true,
      source: true,
      landingPage: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      status: true,
      priority: true,
      nurturingStep: true,
      lastNurturingAt: true,
      assignedTo: true,
      preferredLocale: true,
      createdAt: true,
      updatedAt: true,
      contactedAt: true,
      convertedAt: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          preferredLocale: true,
          source: true,
          totalEvents: true,
          totalSpent: true,
          lastEventDate: true,
        },
      },
      notes: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      universalTasks: { orderBy: { createdAt: 'desc' } },
      documents: { orderBy: { createdAt: 'desc' } },
      activities: { orderBy: { createdAt: 'desc' } },
      booking: {
        include: {
          postEventReport: true,
          clientSurvey: true,
          clientFeedback: true,
        },
      },
    },
  });

  if (!lead) {
    notFound();
  }

  const statusConf = getLeadStatusDisplay(lead.status);
  const eventType = getEventLabel(lead.eventType);
  const priorityConf = getPriorityBadge(lead.priority);
  const baseUrl = getAppBaseUrl();
  const reviewUrl = lead.booking?.reviewToken
    ? `${baseUrl}/${lead.preferredLocale || 'es'}/valoracio?token=${lead.booking.reviewToken}&ref=${lead.booking.reference}`
    : null;
  const reviewFlowStatus = !lead.booking
    ? 'SENSE_RESERVA'
    : (lead.booking.reviewSubmittedAt || lead.booking.clientSurvey)
      ? 'RESPONDIDO'
      : lead.booking.postEventEmailSent
        ? 'ENVIADO'
        : 'FALTA_ENVIAR';
  const internalPostEventStatus = !lead.booking
    ? 'SENSE_RESERVA'
    : lead.booking.postEventReport && lead.booking.clientFeedback?.sentAt
      ? 'COMPLETO'
      : lead.booking.postEventReport || lead.booking.clientFeedback?.sentAt
        ? 'EN_PROGRESO'
        : 'PENDIENTE';
  const leadAgeDays = Math.max(
    0,
    Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24))
  );
  const budgetValue = parseBudgetValue(lead.budget);
  const estimatedRevenue = lead.booking?.total ?? budgetValue ?? null;
  const leadScore = scoreLead({
    status: lead.status,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
    eventDate: lead.eventDate,
    budget: lead.budget,
    phone: lead.phone,
    eventLocation: lead.eventLocation,
    guestCount: lead.guestCount,
    interestedPackId: lead.interestedPackId,
    source: lead.source,
  });
  const customerLinkPreview = await previewLeadCustomerLink(lead.id);
  const relatedLeads = await prisma.lead.findMany({
    where: {
      id: { not: lead.id },
      OR: [
        ...(lead.customerId ? [{ customerId: lead.customerId }] : []),
        { email: lead.email },
      ],
    },
    select: {
      id: true,
      eventType: true,
      status: true,
      eventDate: true,
      createdAt: true,
      booking: {
        select: {
          id: true,
          reference: true,
          eventDate: true,
          status: true,
          total: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  const technicalSnapshot = buildLeadTechnicalSnapshot({
    lead: {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      eventType: lead.eventType,
      eventDate: lead.eventDate,
      eventLocation: lead.eventLocation,
      guestCount: lead.guestCount,
      budget: lead.budget,
      status: lead.status,
      priority: lead.priority,
      source: lead.source,
      assignedTo: lead.assignedTo,
      preferredLocale: lead.preferredLocale,
      customerId: lead.customerId,
      interestedPackId: lead.interestedPackId,
      interestedExtras: lead.interestedExtras,
      utmSource: lead.utmSource,
      utmMedium: lead.utmMedium,
      utmCampaign: lead.utmCampaign,
      landingPage: lead.landingPage,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      contactedAt: lead.contactedAt,
      convertedAt: lead.convertedAt,
    },
    stats: {
      notes: lead.notes.length,
      tasks: lead.universalTasks.length,
      documents: lead.documents.length,
      activities: lead.activities.length,
    },
    booking: lead.booking,
  });
  const technicalSnapshotJson = JSON.stringify(technicalSnapshot, null, 2);
  const internalSnapshotEmail = process.env.CONTACT_TO || SITE_CONFIG.business.email;
  const stageKey = STAGE_KEY_MAP[lead.status] || 'nou';

  const serializedTasks = lead.universalTasks.map((task) => ({
    ...task,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
  }));

  const serializedDocuments = lead.documents.map((doc) => ({
    ...doc,
    createdAt: doc.createdAt.toISOString(),
  }));

  const serializedActivities = lead.activities.map((activity) => ({
    ...activity,
    createdAt: activity.createdAt.toISOString(),
  }));
  const openTasksCount = lead.universalTasks.filter((task) => task.status !== 'DONE' && task.status !== 'CANCELLED').length;

  const leadInsights = computeLeadInsights({
    lead: {
      id: lead.id,
      status: lead.status,
      priority: lead.priority,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      contactedAt: lead.contactedAt,
      convertedAt: lead.convertedAt,
      eventDate: lead.eventDate,
      eventType: lead.eventType,
      budget: lead.budget,
      phone: lead.phone,
      eventLocation: lead.eventLocation,
      guestCount: lead.guestCount,
      interestedPackId: lead.interestedPackId,
      source: lead.source,
    },
    tasks: lead.universalTasks.map((t) => ({ status: t.status, dueDate: t.dueDate, title: t.title })),
    activities: lead.activities.map((a) => ({ createdAt: a.createdAt, type: a.type })),
    booking: lead.booking ? {
      status: lead.booking.status,
      total: lead.booking.total,
      depositPaid: lead.booking.depositPaid,
      remainingPaid: lead.booking.remainingPaid,
      depositAmount: lead.booking.depositAmount,
    } : null,
    relatedLeads: relatedLeads.map((r) => ({
      status: r.status,
      booking: r.booking ? { total: r.booking.total } : null,
    })),
  });

  return (
    <div className="fx-root">
      <div className="fx__page">

        {/* Barra de navegació */}
        <div className="lp2__bar">
          <Link href="/admin/leads" className="lp2__back">
            <span className="lp2__backic">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 12L6 8l4-4"/></svg>
            </span>
            Entrades
          </Link>
          <span className="lp2__crumb">{lead.name}</span>
          <div className="lp2__baracts">
            {lead.customerId && (
              <Link href={buildCustomerHubHref(lead.customerId)} className="lp2__btn--sec">
                Fitxa Client
              </Link>
            )}
            {lead.phone && (
              <>
                <a
                  href={`https://wa.me/${lead.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Hola ${lead.name}! Sóc de Òrbita Events, hem rebut la teva sol·licitud i volem ajudar-te a organitzar el teu event.`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="lp2__btn--prim"
                >
                  WhatsApp
                </a>
                <a href={`tel:${lead.phone}`} className="lp2__btn--sec">Trucar</a>
              </>
            )}
            <Link href={buildLeadComposeHref(lead.id)} className="lp2__btn--sec">Email</Link>
          </div>
        </div>

        {/* Hero */}
        <div className="lp2__hero" data-stage={stageKey}>
          <div className="lp2__id">
            <span className="lp2__kicker">Entrada · {eventType}</span>
            <h1 className="lp2__name">{lead.name}</h1>
            <span className="lp2__meta">
              {statusConf.label} · {priorityConf.label}
              {lead.email ? ` · ${lead.email}` : ''}
              {lead.phone ? ` · ${lead.phone}` : ''}
            </span>
          </div>
        </div>

        {/* KPIs executives */}
        <div className="lp2__exec" {...helpAttrs(ADMIN_LEAD_HELP.detail.executive)}>
          <div className="lp2__kpi lp2__kpi--money">
            <div className="lp2__kpi-label">Valor estimat</div>
            <div className="lp2__kpi-val">{estimatedRevenue !== null ? `${formatNumber(estimatedRevenue)}€` : '—'}</div>
          </div>
          <div className="lp2__kpi lp2__kpi--neutral">
            <div className="lp2__kpi-label">Antiguitat</div>
            <div className="lp2__kpi-val">{leadAgeDays}d</div>
          </div>
          <div className="lp2__kpi lp2__kpi--neutral">
            <div className="lp2__kpi-label">Flux client</div>
            <div className="lp2__kpi-val">
              {reviewFlowStatus === 'RESPONDIDO' ? 'Respost'
                : reviewFlowStatus === 'ENVIADO' ? 'Enviat'
                : reviewFlowStatus === 'FALTA_ENVIAR' ? 'Falta enviar'
                : '—'}
            </div>
          </div>
          <div className="lp2__kpi lp2__kpi--neutral">
            <div className="lp2__kpi-label">Post-event</div>
            <div className="lp2__kpi-val">
              {internalPostEventStatus === 'COMPLETO' ? 'Completat'
                : internalPostEventStatus === 'EN_PROGRESO' ? 'En progrés'
                : internalPostEventStatus === 'PENDIENTE' ? 'Pendent'
                : '—'}
            </div>
          </div>
          <div className="lp2__kpi lp2__kpi--money">
            <div className="lp2__kpi-label">
              Puntuació <InfoTooltip text={ADMIN_HELP.leadScore} />
            </div>
            <div className="lp2__kpi-val">{leadScore.score}</div>
            <ScoreSnapshotButton leadId={lead.id} />
          </div>
        </div>

        <LeadMobileQuickActions
          leadId={lead.id}
          leadName={lead.name}
          leadEmail={lead.email}
          leadPhone={lead.phone}
          currentStatus={lead.status}
        />

        <LeadInsightsBanner
          insights={leadInsights}
          leadId={lead.id}
          customerId={lead.customerId}
          bookingId={lead.booking?.id}
        />

        <LeadScoreBreakdown
          lead={{
            status: lead.status,
            createdAt: lead.createdAt.toISOString(),
            updatedAt: lead.updatedAt.toISOString(),
            eventDate: lead.eventDate?.toISOString() ?? null,
            budget: lead.budget,
            phone: lead.phone,
            eventLocation: lead.eventLocation,
            guestCount: lead.guestCount,
            interestedPackId: lead.interestedPackId,
            source: lead.source,
          }}
        />

        <LeadGuidedFlow
          leadId={lead.id}
          currentStatus={lead.status}
          hasCustomer={Boolean(lead.customerId)}
          hasBooking={Boolean(lead.booking)}
          bookingId={lead.booking?.id}
          documentsCount={lead.documents.length}
          openTasksCount={openTasksCount}
        />

        {/* Layout 2 columnes */}
        <div className="lp2__layout">
          {/* Columna principal */}
          <div className="lp2__main">
            <LeadProfileEditor
              lead={{
                id: lead.id,
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                eventDate: lead.eventDate ? lead.eventDate.toISOString() : null,
                eventType: lead.eventType,
                eventLocation: lead.eventLocation,
                guestCount: lead.guestCount,
                budget: lead.budget,
                message: lead.message,
                status: lead.status,
                priority: lead.priority,
                source: lead.source,
                assignedTo: lead.assignedTo,
                interestedPackId: lead.interestedPackId,
                interestedExtras: lead.interestedExtras,
                landingPage: lead.landingPage,
                utmSource: lead.utmSource,
                utmMedium: lead.utmMedium,
                utmCampaign: lead.utmCampaign,
                preferredLocale: lead.preferredLocale,
              }}
            />

            <LeadNotesPanel
              leadId={lead.id}
              initialNotes={lead.notes.map((note) => ({
                id: note.id,
                content: note.content,
                createdBy: note.createdBy,
                createdAt: note.createdAt.toISOString(),
              }))}
            />

            <LeadDossiersPanel
              leadId={lead.id}
              leadNom={lead.name}
              leadEmail={lead.email}
              leadTelefon={lead.phone ?? undefined}
            />

            {/* Reserva */}
            {!lead.booking && (
              <div className="lp2__panel" {...helpAttrs(ADMIN_LEAD_HELP.detail.createBooking)}>
                <div className="lp2__nobook">
                  <p>Encara no hi ha cap reserva associada a aquesta entrada.</p>
                  <Link href={`/admin/bookings/new?leadId=${lead.id}`} className="lp2__btn--prim">
                    Crear reserva
                  </Link>
                </div>
              </div>
            )}
            {lead.booking && (
              <div className="lp2__panel" {...helpAttrs(ADMIN_LEAD_HELP.detail.booking)}>
                <h2 className="lp2__h">Reserva associada</h2>
                <div className="lp2__bookcards">
                  <div className="lp2__bookcard">
                    <div className="lp2__bookcard-title">Event</div>
                    <dl>
                      <div className="lp2__bookfield"><dt>Data</dt><dd>{formatDateFull(lead.booking.eventDate)}</dd></div>
                      <div className="lp2__bookfield"><dt>Ref</dt><dd>{lead.booking.reference}</dd></div>
                      <div className="lp2__bookfield"><dt>Tipus</dt><dd>{lead.booking.eventType}</dd></div>
                      <div className="lp2__bookfield"><dt>Ubicació</dt><dd>{lead.booking.eventLocation}</dd></div>
                      <div className="lp2__bookfield"><dt>Convidats</dt><dd>{lead.booking.guestCount}</dd></div>
                      <div className="lp2__bookfield"><dt>Estat</dt><dd>{lead.booking.status}</dd></div>
                    </dl>
                  </div>
                  <div className="lp2__bookcard">
                    <div className="lp2__bookcard-title">Financer</div>
                    <dl>
                      <div className="lp2__bookfield"><dt>Total</dt><dd><strong>{formatNumber(lead.booking.total)}€</strong></dd></div>
                      <div className="lp2__bookfield"><dt>Subtotal</dt><dd>{formatNumber(lead.booking.subtotal)}€</dd></div>
                      <div className="lp2__bookfield"><dt>IVA</dt><dd>{formatNumber(lead.booking.vatAmount)}€</dd></div>
                      <div className="lp2__bookfield"><dt>Dipòsit</dt><dd className={lead.booking.depositPaid ? 'lp2__tone--ok' : 'lp2__tone--warn'}>{lead.booking.depositPaid ? 'Pagat' : 'Pendent'} ({formatNumber(lead.booking.depositAmount)}€)</dd></div>
                      <div className="lp2__bookfield"><dt>Resta</dt><dd className={lead.booking.remainingPaid ? 'lp2__tone--ok' : 'lp2__tone--warn'}>{lead.booking.remainingPaid ? 'Pagada' : 'Pendent'} ({formatNumber(lead.booking.remainingAmount)}€)</dd></div>
                    </dl>
                  </div>
                </div>
                <div className="lp2__postevent">
                  <h4 className="lp2__h">Post-event i automatitzacions</h4>
                  <dl className="lp2__postevent-grid">
                    <div className="lp2__prow"><dt>Estat client</dt><dd className={reviewFlowStatus === 'RESPONDIDO' ? 'lp2__tone--ok' : reviewFlowStatus === 'ENVIADO' ? 'lp2__tone--warn' : 'lp2__tone--bad'}>{reviewFlowStatus === 'RESPONDIDO' ? 'Respost' : reviewFlowStatus === 'ENVIADO' ? 'Enviat' : reviewFlowStatus === 'FALTA_ENVIAR' ? 'Falta enviar' : 'Sense reserva'}</dd></div>
                    <div className="lp2__prow"><dt>Valoració enviada</dt><dd className={lead.booking.postEventEmailSent ? 'lp2__tone--ok' : 'lp2__tone--bad'}>{lead.booking.postEventEmailSent ? 'Sí' : 'No'}</dd></div>
                    <div className="lp2__prow"><dt>Client ha respost</dt><dd className={(lead.booking.reviewSubmittedAt || lead.booking.clientSurvey) ? 'lp2__tone--ok' : 'lp2__tone--bad'}>{(lead.booking.reviewSubmittedAt || lead.booking.clientSurvey) ? 'Sí' : 'No'}</dd></div>
                    <div className="lp2__prow"><dt>Post-event intern</dt><dd className={internalPostEventStatus === 'COMPLETO' ? 'lp2__tone--ok' : internalPostEventStatus === 'EN_PROGRESO' ? 'lp2__tone--warn' : 'lp2__tone--bad'}>{internalPostEventStatus === 'COMPLETO' ? 'Completat' : internalPostEventStatus === 'EN_PROGRESO' ? 'En progrés' : internalPostEventStatus === 'PENDIENTE' ? 'Pendent' : 'Sense reserva'}</dd></div>
                    <div className="lp2__prow"><dt>Informe tècnic</dt><dd>{lead.booking.postEventReport ? 'Completat' : 'Pendent'}</dd></div>
                    <div className="lp2__prow"><dt>Enquesta client</dt><dd>{lead.booking.clientSurvey ? 'Rebuda' : 'Sense resposta'}</dd></div>
                    {lead.booking.clientSurvey && (
                      <div className="lp2__prow"><dt>Rating/NPS</dt><dd>{lead.booking.clientSurvey.overallRating}/5 · {lead.booking.clientSurvey.npsScore}/10</dd></div>
                    )}
                    <div className="lp2__prow"><dt>Enviament</dt><dd>{lead.booking.postEventEmailSentAt ? formatDateTimeFull(lead.booking.postEventEmailSentAt) : '-'}</dd></div>
                  </dl>
                </div>
                <div className="lp2__bookacts">
                  <form action="/api/admin/emails/send-post-event" method="POST">
                    <input type="hidden" name="bookingId" value={lead.booking.id} />
                      <button type="submit" className="lp2__btn--prim">
                        Enviar valoració
                      </button>
                    </form>
                    {reviewUrl && lead.phone && (
                      <a
                        href={`https://wa.me/${lead.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Hola ${lead.name}, gràcies per confiar en Òrbita Events! Ens ajudaria molt la teva valoració: ${reviewUrl}`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="lp2__btn--prim"
                      >
                        Enviar per WhatsApp
                      </a>
                    )}
                    {reviewUrl && (
                      <a href={reviewUrl} target="_blank" rel="noopener noreferrer" className="lp2__btn--sec">
                        Obrir formulari client
                      </a>
                    )}
                    <Link href={buildBookingHref(lead.booking.id)} className="lp2__btn--sec">Veure reserva</Link>
                    <Link href="/admin/post-event/reports" className="lp2__btn--sec">Informes post-event</Link>
                    <Link href="/admin/post-event/surveys" className="lp2__btn--sec">Enquestes client</Link>
                    <Link href="/admin/emails" className="lp2__btn--sec">Automatitzacions email</Link>
                  </div>
              </div>
            )}

            <LeadWorkspace
              leadId={lead.id}
              initialTasks={serializedTasks}
              initialDocuments={serializedDocuments}
              initialActivities={serializedActivities}
            />
          </div>

          {/* Sidebar */}
          <aside className="lp2__decision">
            <LeadActionsEnhanced
              leadId={lead.id}
              currentStatus={lead.status}
              clientName={lead.name}
              clientEmail={lead.email}
              clientPhone={lead.phone}
              eventType={eventType}
              nurturingStep={lead.nurturingStep}
              lastNurturingAt={lead.lastNurturingAt ? lead.lastNurturingAt.toISOString() : null}
            />

            {/* Metadades */}
            <div className="lp2__panel" {...helpAttrs(ADMIN_LEAD_HELP.detail.record)}>
              <h3 className="lp2__h">Detalls del registre</h3>
              <dl className="lp2__rows">
                <div>
                  <dt>ID</dt>
                  <dd className="lp2__mono-xs">{lead.id}</dd>
                </div>
                <div>
                  <dt>Idioma</dt>
                  <dd>{lead.preferredLocale.toUpperCase()}</dd>
                </div>
                <div>
                  <dt>Antiguitat</dt>
                  <dd>{leadAgeDays} dies</dd>
                </div>
                {lead.customerId && (
                  <div>
                    <dt>Client</dt>
                    <dd><Link href={buildCustomerHubHref(lead.customerId!)} className="lp2__link-gold">{lead.customerId.slice(0, 8)}…</Link></dd>
                  </div>
                )}
                <div><dt>Creat</dt><dd>{formatDateTime(lead.createdAt)}</dd></div>
                <div><dt>Actualitzat</dt><dd>{formatDateTime(lead.updatedAt)}</dd></div>
                {lead.contactedAt && <div><dt>Contactat</dt><dd>{formatDate(lead.contactedAt)}</dd></div>}
                {lead.landingPage && <div><dt>Landing</dt><dd style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.landingPage}</dd></div>}
              </dl>
            </div>

            {/* Atribució */}
            <div className="lp2__panel" {...helpAttrs(ADMIN_LEAD_HELP.detail.attribution)}>
              <h3 className="lp2__h">Atribució / UTM <InfoTooltip text={ADMIN_HELP.leadAttribution} /></h3>
              <dl className="lp2__rows">
                <div><dt>Origen <InfoTooltip text={ADMIN_HELP.leadSource} /></dt><dd>{lead.source || '-'}</dd></div>
                <div><dt>UTM source <InfoTooltip text={ADMIN_HELP.leadUtmSource} /></dt><dd>{lead.utmSource || '-'}</dd></div>
                <div><dt>UTM medium <InfoTooltip text={ADMIN_HELP.leadUtmMedium} /></dt><dd>{lead.utmMedium || '-'}</dd></div>
                <div><dt>UTM campaign <InfoTooltip text={ADMIN_HELP.leadUtmCampaign} /></dt><dd>{lead.utmCampaign || '-'}</dd></div>
                <div><dt>Landing <InfoTooltip text={ADMIN_HELP.leadLandingPage} /></dt><dd style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.landingPage || '-'}</dd></div>
              </dl>
            </div>

            {customerLinkPreview && (
              <LeadCustomerLinkPanel leadId={lead.id} preview={customerLinkPreview} />
            )}

            {lead.customer && (
              <div className="lp2__panel" {...helpAttrs(ADMIN_LEAD_HELP.detail.customer)}>
                <h3 className="lp2__h">Relació Client</h3>
                <dl className="lp2__rows">
                  <div><dt>Nom</dt><dd>{lead.customer.name || '-'}</dd></div>
                  <div><dt>Email</dt><dd>{lead.customer.email || '-'}</dd></div>
                  <div><dt>Telèfon</dt><dd>{lead.customer.phone || '-'}</dd></div>
                  <div><dt>Idioma</dt><dd>{lead.customer.preferredLocale}</dd></div>
                  <div><dt>Origen</dt><dd>{lead.customer.source}</dd></div>
                  <div><dt>Total events</dt><dd>{lead.customer.totalEvents}</dd></div>
                  <div><dt>Despesa total</dt><dd className="lp2__tone--ok">{formatNumber(lead.customer.totalSpent)}€</dd></div>
                  <div><dt>Últim event</dt><dd>{lead.customer.lastEventDate ? formatDateSimple(lead.customer.lastEventDate) : '-'}</dd></div>
                </dl>
                <Link href={buildCustomerHubHref(lead.customer.id)} className="lp2__btn--sec" style={{ marginTop: '12px' }}>
                  Obrir fitxa client
                </Link>
              </div>
            )}

            {/* Historial */}
            <div className="lp2__panel" {...helpAttrs(ADMIN_LEAD_HELP.detail.history)}>
              <h3 className="lp2__h">Historial ({relatedLeads.length})</h3>
              {relatedLeads.length === 0 ? (
                <p className="lp2__empty">No hi ha altres entrades d&apos;aquest client.</p>
              ) : (
                relatedLeads.map((item) => (
                  <Link key={item.id} href={buildLeadWorkspaceHref(item.id)} className="lp2__histitem">
                    <b>{getEventLabel(item.eventType)} · {item.status}</b>
                    <span>
                      {item.eventDate ? formatDateSimple(item.eventDate) : 'Sense data'} · creada {formatDateSimple(item.createdAt)}
                    </span>
                    {item.booking && (
                      <span>{item.booking.reference} · {item.booking.status} · {formatNumber(item.booking.total)}€</span>
                    )}
                  </Link>
                ))
              )}
            </div>

            <LeadTechnicalSnapshotPanel
              leadId={lead.id}
              snapshotJson={technicalSnapshotJson}
              defaultEmail={internalSnapshotEmail}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}





