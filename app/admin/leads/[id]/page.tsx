import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildLeadComposeHref, buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { AdminPage } from '../../components/AdminPage';
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
    <AdminPage
      className="admin-lead-detail-page"
      title={lead.name}
      back={{ href: '/admin/leads', label: 'Entrades' }}
      subtitle={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusConf.bg} ${statusConf.text}`}>
            {statusConf.label}
          </span>
          <span className="text-sm">{eventType}</span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityConf.color}`}>
            {priorityConf.label}
          </span>
        </div>
      }
      actions={
        <div className="flex flex-wrap gap-2">
          {lead.customerId && (
            <Link
              href={buildCustomerHubHref(lead.customerId)}
              className="ap-btn ap-btn--secondary w-full sm:w-auto"
            >
              👤 Fitxa Client
            </Link>
          )}
          {lead.phone && (
            <>
              <a
                href={`https://wa.me/${lead.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
                  `Hola ${lead.name}! Sóc de Òrbita Events, hem rebut la teva sol·licitud i volem ajudar-te a organitzar el teu event.`
                )}`}
                target="_blank" rel="noopener noreferrer"
                className="ap-btn ap-btn--primary w-full sm:w-auto"
              >
                💬 WhatsApp
              </a>
              <a
                href={`tel:${lead.phone}`}
                className="ap-btn ap-btn--secondary w-full sm:w-auto"
              >
                📞 Trucar
              </a>
            </>
          )}
          <Link
            href={buildLeadComposeHref(lead.id)}
            className="ap-btn ap-btn--secondary w-full sm:w-auto"
          >
            ✉️ Email
          </Link>
        </div>
      }
    >
      <section className="admin-lead-executive rounded-2xl border border-white/10 p-6 admin-card-glass" {...helpAttrs(ADMIN_LEAD_HELP.detail.executive)}>
        <div className="admin-lead-executive-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="admin-stagger-item rounded-xl border border-white/10 px-4 py-3 hover:bg-white/[0.03] transition-colors">
            <p className="text-xs uppercase tracking-wide opacity-60">Valor estimat</p>
            <p className="text-xl font-semibold">
              {estimatedRevenue !== null ? `${formatNumber(estimatedRevenue)}€` : '—'}
            </p>
          </div>
          <div className="admin-stagger-item rounded-xl border border-white/10 px-4 py-3 hover:bg-white/[0.03] transition-colors">
            <p className="text-xs uppercase tracking-wide opacity-60">Antiguitat de l&apos;entrada</p>
            <p className="text-xl font-semibold">{leadAgeDays} dies</p>
          </div>
          <div className="admin-stagger-item rounded-xl border border-white/10 px-4 py-3 hover:bg-white/[0.03] transition-colors">
            <p className="text-xs uppercase tracking-wide opacity-60">Flux client</p>
            <p className="text-xl font-semibold">
              {reviewFlowStatus === 'RESPONDIDO'
                ? 'Respost'
                : reviewFlowStatus === 'ENVIADO'
                  ? 'Enviat'
                  : reviewFlowStatus === 'FALTA_ENVIAR'
                    ? 'Falta enviar'
                    : 'Sense reserva'}
            </p>
          </div>
          <div className="admin-stagger-item rounded-xl border border-white/10 px-4 py-3 hover:bg-white/[0.03] transition-colors">
            <p className="text-xs uppercase tracking-wide opacity-60">Post-event intern</p>
            <p className="text-xl font-semibold">
              {internalPostEventStatus === 'COMPLETO'
                ? 'Completat'
                : internalPostEventStatus === 'EN_PROGRESO'
                  ? 'En progrés'
                  : internalPostEventStatus === 'PENDIENTE'
                    ? 'Pendent'
                    : 'Sense reserva'}
            </p>
          </div>
          <div className="admin-stagger-item rounded-xl border border-white/10 px-4 py-3 hover:bg-white/[0.03] transition-colors">
            <p className="inline-flex items-center gap-1 text-xs uppercase tracking-wide opacity-60">
              Puntuació entrada
              <InfoTooltip text={ADMIN_HELP.leadScore} />
            </p>
            <p className="text-xl font-semibold">
              {leadScore.score} · {LEAD_SCORE_BAND_LABELS[leadScore.band] || leadScore.band}
            </p>
            <ScoreSnapshotButton leadId={lead.id} />
          </div>
        </div>
      </section>

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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
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

          {/* Booking */}
          {!lead.booking && (
            <section className="rounded-xl border border-dashed border-white/10 p-6 text-center admin-card-glass" {...helpAttrs(ADMIN_LEAD_HELP.detail.createBooking)}>
              <p className="text-sm mb-3 opacity-70">Encara no hi ha cap reserva associada a aquesta entrada.</p>
              <Link
                href={`/admin/bookings/new?leadId=${lead.id}`}
                className="ap-btn ap-btn--primary"
              >
                📅 Crear reserva des d&apos;aquesta entrada
              </Link>
            </section>
          )}
          {lead.booking && (
            <section className="rounded-xl border border-white/10 p-6 admin-card-glass" {...helpAttrs(ADMIN_LEAD_HELP.detail.booking)}>
              <h2 className="text-lg font-semibold mb-4">
                Reserva associada
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 p-4 hover:bg-white/[0.03] transition-colors">
                  <p className="font-medium">
                    📅 {formatDateFull(lead.booking.eventDate)}
                  </p>
                  <p className="text-sm opacity-70">Ref: {lead.booking.reference}</p>
                  <p className="text-sm opacity-70">Tipus: {lead.booking.eventType}</p>
                  <p className="text-sm opacity-70">Ubicació: {lead.booking.eventLocation}</p>
                  <p className="text-sm opacity-70">Convidats: {lead.booking.guestCount}</p>
                </div>
                <div className="rounded-xl border border-white/10 p-4 hover:bg-white/[0.03] transition-colors">
                  <p className="text-lg font-bold">
                    {formatNumber(lead.booking.total)}€
                  </p>
                  <p className="text-sm opacity-70">Estat: {lead.booking.status}</p>
                  <p className="text-sm opacity-70">Subtotal: {formatNumber(lead.booking.subtotal)}€</p>
                  <p className="text-sm opacity-70">IVA: {formatNumber(lead.booking.vatAmount)}€</p>
                  <p className="text-sm opacity-70">
                    Dipòsit: {lead.booking.depositPaid ? 'Pagat' : 'Pendent'} ({formatNumber(lead.booking.depositAmount)}€)
                  </p>
                  <p className="text-sm opacity-70">
                    Resta: {lead.booking.remainingPaid ? 'Pagada' : 'Pendent'} ({formatNumber(lead.booking.remainingAmount)}€)
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 p-4 md:col-span-2">
                  <h4 className="text-sm font-semibold mb-2">Post-event i automatitzacions</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="text-sm">
                      <p className="">
                        Estat client: <strong className={
                          reviewFlowStatus === 'RESPONDIDO'
                            ? 'admin-tone-text-success'
                            : reviewFlowStatus === 'ENVIADO'
                              ? 'admin-tone-text-info'
                              : 'admin-tone-text-warning'
                        }>
                          {reviewFlowStatus === 'RESPONDIDO'
                            ? 'Respost'
                            : reviewFlowStatus === 'ENVIADO'
                              ? 'Enviat'
                              : reviewFlowStatus === 'FALTA_ENVIAR'
                                ? 'Falta enviar'
                                : 'Sense reserva'}
                        </strong>
                      </p>
                      <p className="">
                        Enllaç de valoració enviat: <strong className={lead.booking.postEventEmailSent ? 'admin-tone-text-success' : 'admin-tone-text-warning'}>
                          {lead.booking.postEventEmailSent ? 'Sí' : 'No'}
                        </strong>
                      </p>
                      <p className="">
                        Data d&apos;enviament: {lead.booking.postEventEmailSentAt
                          ? formatDateTimeFull(lead.booking.postEventEmailSentAt)
                          : '-'}
                      </p>
                      <p className="break-all">
                        Token de valoració: {lead.booking.reviewToken || '-'}
                      </p>
                      <p className="">
                        El client ha respost: <strong className={(lead.booking.reviewSubmittedAt || lead.booking.clientSurvey) ? 'admin-tone-text-success' : 'admin-tone-text-warning'}>
                          {(lead.booking.reviewSubmittedAt || lead.booking.clientSurvey) ? 'Sí' : 'No'}
                        </strong>
                      </p>
                      <p className="">
                        Data de resposta: {lead.booking.reviewSubmittedAt
                          ? formatDateTimeFull(lead.booking.reviewSubmittedAt)
                          : lead.booking.clientSurvey?.submittedAt
                            ? formatDateTimeFull(lead.booking.clientSurvey.submittedAt)
                            : '-'}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="">
                        Estat intern de post-esdeveniment: <strong className={
                          internalPostEventStatus === 'COMPLETO'
                            ? 'admin-tone-text-success'
                            : internalPostEventStatus === 'EN_PROGRESO'
                              ? 'admin-tone-text-info'
                              : 'admin-tone-text-warning'
                        }>
                          {internalPostEventStatus === 'COMPLETO'
                            ? 'Completat'
                            : internalPostEventStatus === 'EN_PROGRESO'
                              ? 'En progrés'
                              : internalPostEventStatus === 'PENDIENTE'
                                ? 'Pendent'
                                : 'Sense reserva'}
                        </strong>
                      </p>
                      <p className="">
                        Informe tècnic: <strong>{lead.booking.postEventReport ? 'Completat' : 'Pendent'}</strong>
                      </p>
                      <p className="">
                        Enquesta client: <strong>{lead.booking.clientSurvey ? 'Rebuda' : 'Sense resposta'}</strong>
                      </p>
                      <p className="">
                        Feedback enviat: <strong>{lead.booking.clientFeedback?.sentAt ? 'Sí' : 'No'}</strong>
                      </p>
                      {lead.booking.clientSurvey && (
                        <p className="">
                          Rating/NPS: <strong>{lead.booking.clientSurvey.overallRating}/5 · {lead.booking.clientSurvey.npsScore}/10</strong>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <form action="/api/admin/emails/send-post-event" method="POST">
                      <input type="hidden" name="bookingId" value={lead.booking.id} />
                      <button
                        type="submit"
                        className="ap-btn ap-btn--primary inline-flex w-full items-center justify-center px-3 py-1.5 text-xs sm:w-auto"
                      >
                        Enviar enllaç valoració
                      </button>
                    </form>
                    {reviewUrl && lead.phone && (
                      <a
                        href={`https://wa.me/${lead.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
                          `Hola ${lead.name}, gràcies per confiar en Òrbita Events! Ens ajudaria molt la teva valoració: ${reviewUrl}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ap-btn ap-btn--primary inline-flex w-full items-center justify-center px-3 py-1.5 text-xs sm:w-auto"
                      >
                        Enviar per WhatsApp
                      </a>
                    )}
                    {reviewUrl && (
                      <a
                        href={reviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ap-btn ap-btn--secondary inline-flex w-full items-center justify-center px-3 py-1.5 text-xs sm:w-auto"
                      >
                        Obrir formulari client
                      </a>
                    )}
                    <Link href={buildBookingHref(lead.booking.id)} className="ap-btn ap-btn--secondary inline-flex w-full items-center justify-center px-3 py-1.5 text-xs sm:w-auto">
                      Veure reserva completa
                    </Link>
                    <Link href="/admin/post-event/reports" className="ap-btn ap-btn--secondary inline-flex w-full items-center justify-center px-3 py-1.5 text-xs sm:w-auto">
                      Informes post-event
                    </Link>
                    <Link href="/admin/post-event/surveys" className="ap-btn ap-btn--secondary inline-flex w-full items-center justify-center px-3 py-1.5 text-xs sm:w-auto">
                      Enquestes client
                    </Link>
                    <Link href="/admin/emails" className="ap-btn ap-btn--secondary inline-flex w-full items-center justify-center px-3 py-1.5 text-xs sm:w-auto">
                      Automatitzacions de correu
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}

          <LeadWorkspace
            leadId={lead.id}
            initialTasks={serializedTasks}
            initialDocuments={serializedDocuments}
            initialActivities={serializedActivities}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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
          <section className="rounded-xl border border-white/10 p-6 admin-card-glass" {...helpAttrs(ADMIN_LEAD_HELP.detail.record)}>
            <h3 className="text-sm font-semibold mb-4">Detalls del registre</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs">ID</dt>
                <dd className="font-mono text-xs break-all">{lead.id}</dd>
              </div>
              <div>
                <dt className="text-xs">Idioma preferit</dt>
                <dd className="">{lead.preferredLocale.toUpperCase()}</dd>
              </div>
              <div>
                <dt className="text-xs">Antiguitat de l&apos;entrada</dt>
                <dd className="">{leadAgeDays} dies</dd>
              </div>
              {lead.customerId && (
                <div>
                  <dt className="text-xs">ID client</dt>
                  <dd className="font-mono text-xs break-all">
                    <Link href={buildCustomerHubHref(lead.customerId!)} className="hover:underline">
                      {lead.customerId}
                    </Link>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs">Creat</dt>
                <dd className="">
                  {formatDateTime(lead.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs">Actualitzat</dt>
                <dd className="">
                  {formatDateTime(lead.updatedAt)}
                </dd>
              </div>
              {lead.contactedAt && (
                <div>
                  <dt className="text-xs">Contactat</dt>
                  <dd className="">
                    {formatDate(lead.contactedAt)}
                  </dd>
                </div>
              )}
              {lead.landingPage && (
                <div>
                  <dt className="text-xs">Pàgina d&apos;entrada</dt>
                  <dd className="truncate">{lead.landingPage}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="rounded-xl border border-white/10 p-6 admin-card-glass" {...helpAttrs(ADMIN_LEAD_HELP.detail.attribution)}>
            <h3 className="inline-flex items-center gap-1 text-sm font-semibold mb-4">
              Atribució / UTM
              <InfoTooltip text={ADMIN_HELP.leadAttribution} />
            </h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="inline-flex items-center gap-1 text-xs">
                  Origen
                  <InfoTooltip text={ADMIN_HELP.leadSource} />
                </dt>
                <dd className="">{lead.source || '-'}</dd>
              </div>
              <div>
                <dt className="inline-flex items-center gap-1 text-xs">
                  UTM source
                  <InfoTooltip text={ADMIN_HELP.leadUtmSource} />
                </dt>
                <dd className="break-all">{lead.utmSource || '-'}</dd>
              </div>
              <div>
                <dt className="inline-flex items-center gap-1 text-xs">
                  UTM medium
                  <InfoTooltip text={ADMIN_HELP.leadUtmMedium} />
                </dt>
                <dd className="break-all">{lead.utmMedium || '-'}</dd>
              </div>
              <div>
                <dt className="inline-flex items-center gap-1 text-xs">
                  UTM campaign
                  <InfoTooltip text={ADMIN_HELP.leadUtmCampaign} />
                </dt>
                <dd className="break-all">{lead.utmCampaign || '-'}</dd>
              </div>
              <div>
                <dt className="inline-flex items-center gap-1 text-xs">
                  Landing
                  <InfoTooltip text={ADMIN_HELP.leadLandingPage} />
                </dt>
                <dd className="break-all">{lead.landingPage || '-'}</dd>
              </div>
            </dl>
          </section>

          {customerLinkPreview && (
            <LeadCustomerLinkPanel leadId={lead.id} preview={customerLinkPreview} />
          )}

          {lead.customer && (
            <section className="rounded-xl border border-white/10 p-6 admin-card-glass" {...helpAttrs(ADMIN_LEAD_HELP.detail.customer)}>
              <h3 className="text-sm font-semibold mb-4">Relació Client</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs">Nom</dt>
                  <dd className="">{lead.customer.name || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs">Email</dt>
                  <dd className="break-all">{lead.customer.email || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs">Telèfon</dt>
                  <dd className="">{lead.customer.phone || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs">Idioma</dt>
                  <dd className="">{lead.customer.preferredLocale}</dd>
                </div>
                <div>
                  <dt className="text-xs">Origen</dt>
                  <dd className="">{lead.customer.source}</dd>
                </div>
                <div>
                  <dt className="text-xs">Total d&apos;esdeveniments</dt>
                  <dd className="">{lead.customer.totalEvents}</dd>
                </div>
                <div>
                  <dt className="text-xs">Despesa total</dt>
                  <dd className="">{formatNumber(lead.customer.totalSpent)}€</dd>
                </div>
                <div>
                  <dt className="text-xs">Últim event</dt>
                  <dd className="">
                    {lead.customer.lastEventDate
                      ? formatDateSimple(lead.customer.lastEventDate)
                      : '-'}
                  </dd>
                </div>
              </dl>
              <Link
                href={buildCustomerHubHref(lead.customer.id)}
                className="mt-4 inline-flex rounded-xl px-3 py-1.5 text-xs font-semibold text-white"
              >
                Obrir fitxa client
              </Link>
            </section>
          )}

          <section className="rounded-xl border border-white/10 p-6 admin-card-glass" {...helpAttrs(ADMIN_LEAD_HELP.detail.history)}>
            <h3 className="text-sm font-semibold mb-4">
              Historial del client ({relatedLeads.length})
            </h3>
            {relatedLeads.length === 0 ? (
              <p className="text-sm">No hi ha altres esdeveniments/entrades d&apos;aquest client.</p>
            ) : (
              <div className="space-y-2">
                {relatedLeads.map((item) => (
                  <Link
                    key={item.id}
                    href={buildLeadWorkspaceHref(item.id)}
                    className="admin-card-glass block rounded-xl border border-white/10 p-3 hover:bg-white/[0.03] transition-colors"
                  >
                    <p className="text-sm font-medium">
                      {getEventLabel(item.eventType)} · {item.status}
                    </p>
                    <p className="text-xs">
                      {item.eventDate ? formatDateSimple(item.eventDate) : 'Sense data'} ·
                      {' '}Entrada creada {formatDateSimple(item.createdAt)}
                    </p>
                    {item.booking ? (
                      <p className="text-xs">
                        <Link
                          href={buildBookingHref(item.booking.id)}
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Reserva {item.booking.reference}
                        </Link>
                        {' '}· {item.booking.status} · {formatNumber(item.booking.total)}€
                      </p>
                    ) : (
                      <p className="text-xs">Sense reserva associada</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>

          <LeadTechnicalSnapshotPanel
            leadId={lead.id}
            snapshotJson={technicalSnapshotJson}
            defaultEmail={internalSnapshotEmail}
          />
        </div>
      </div>
    </AdminPage>
  );
}





