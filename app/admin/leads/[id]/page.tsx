import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import LeadActionsEnhanced from './LeadActionsEnhanced';
import LeadProfileEditor from './LeadProfileEditor';
import LeadWorkspace from './LeadWorkspace';
import LeadNotesPanel from './LeadNotesPanel';
import LeadGuidedFlow from './LeadGuidedFlow';
import { scoreLead } from '@/lib/services/commercialScoring';
import ScoreSnapshotButton from './ScoreSnapshotButton';
import LeadTechnicalSnapshotPanel from './LeadTechnicalSnapshotPanel';
import { buildLeadTechnicalSnapshot } from '@/lib/services/leadSnapshotService';
import { SITE_CONFIG } from '@/app/config/site-config';
import InfoTooltip from '@/app/admin/components/InfoTooltip';
import { ADMIN_HELP } from '@/app/admin/help-content';

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

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  NEW: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Nova entrada' },
  CONTACTED: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Contactat' },
  QUOTE_SENT: { bg: 'bg-purple-500/20', text: 'text-purple-300', label: 'Pressupost enviat' },
  NEGOTIATING: { bg: 'bg-orange-500/20', text: 'text-orange-300', label: 'Negociació' },
  WON: { bg: 'bg-green-500/20', text: 'text-green-300', label: 'Guanyat!' },
  LOST: { bg: 'bg-slate-500/20', text: 'text-slate-300', label: 'Perdut' },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: '💍 Casament',
  BIRTHDAY: '🎂 Aniversari',
  CORPORATE: '🎯 Corporatiu',
  COMMUNION: '⛪ Comunió',
  BAPTISM: '👶 Bateig',
  GRADUATION: '🎓 Graduació',
  ANNIVERSARY: '🎉 Celebració',
  PRIVATE_PARTY: '🎵 Festa privada',
  OTHER: '📋 Altre',
};

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Baixa', color: 'bg-slate-500/20 text-slate-300' },
  MEDIUM: { label: 'Mitjana', color: 'bg-blue-500/20 text-blue-300' },
  HIGH: { label: 'Alta', color: 'bg-orange-500/20 text-orange-300' },
  URGENT: { label: 'Urgent', color: 'bg-red-500/20 text-red-300' },
};
const SCORE_BAND_LABELS: Record<string, string> = {
  LOW: 'BAIX',
  MEDIUM: 'MITJÀ',
  HIGH: 'ALT',
};

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
      tasks: { orderBy: { createdAt: 'desc' } },
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

  const statusConf = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NEW;
  const eventType = EVENT_TYPE_LABELS[lead.eventType] || lead.eventType;
  const priorityConf = PRIORITY_LABELS[lead.priority] || PRIORITY_LABELS.MEDIUM;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://orbitaevents.com';
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
      tasks: lead.tasks.length,
      documents: lead.documents.length,
      activities: lead.activities.length,
    },
    booking: lead.booking,
  });
  const technicalSnapshotJson = JSON.stringify(technicalSnapshot, null, 2);
  const internalSnapshotEmail = process.env.CONTACT_TO || SITE_CONFIG.business.email;

  const serializedTasks = lead.tasks.map((task) => ({
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
  const openTasksCount = lead.tasks.filter((task) => task.status !== 'DONE' && task.status !== 'CANCELLED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/admin/leads"
              className="text-sm text-slate-400 hover:text-slate-100"
            >
              ← Tornar a entrades
            </Link>
            {lead.customerId && (
              <Link
                href={`/admin/contactes/${lead.customerId}`}
                className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700 transition-colors"
              >
                👤 Fitxa Client
              </Link>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
            {lead.name}
          </h1>
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusConf.bg} ${statusConf.text}`}
            >
              {statusConf.label}
            </span>
            <span className="text-sm text-slate-400">{eventType}</span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityConf.color}`}>
              {priorityConf.label}
            </span>
          </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {lead.phone && (
              <>
                <a
                  href={`https://wa.me/${lead.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
                    `Hola ${lead.name}! Sóc de Òrbita Events, hem rebut la teva sol·licitud i volem ajudar-te a organitzar el teu event.`
                  )}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
                >
                  💬 WhatsApp
                </a>
                <a
                  href={`tel:${lead.phone}`}
                  className="inline-flex items-center rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                >
                  📞 Trucar
                </a>
              </>
            )}
            <a
              href={`mailto:${lead.email}`}
              className="inline-flex items-center rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700"
            >
              ✉️ Email
            </a>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-300">Valor estimat</p>
            <p className="text-xl font-semibold text-slate-100">
              {estimatedRevenue !== null ? `${estimatedRevenue.toLocaleString('ca-ES')}€` : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-300">Antiguitat de l&apos;entrada</p>
            <p className="text-xl font-semibold text-slate-100">{leadAgeDays} dies</p>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-300">Flux client</p>
            <p className="text-xl font-semibold text-slate-100">
              {reviewFlowStatus === 'RESPONDIDO'
                ? 'Respost'
                : reviewFlowStatus === 'ENVIADO'
                  ? 'Enviat'
                  : reviewFlowStatus === 'FALTA_ENVIAR'
                    ? 'Falta enviar'
                    : 'Sense reserva'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-300">Post-event intern</p>
            <p className="text-xl font-semibold text-slate-100">
              {internalPostEventStatus === 'COMPLETO'
                ? 'Completat'
                : internalPostEventStatus === 'EN_PROGRESO'
                  ? 'En progrés'
                  : internalPostEventStatus === 'PENDIENTE'
                    ? 'Pendent'
                    : 'Sense reserva'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 px-4 py-3">
            <p className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-300">
              Puntuació entrada
              <InfoTooltip text={ADMIN_HELP.leadScore} />
            </p>
            <p className="text-xl font-semibold text-slate-100">
              {leadScore.score} · {SCORE_BAND_LABELS[leadScore.band] || leadScore.band}
            </p>
            <ScoreSnapshotButton leadId={lead.id} />
          </div>
        </div>
      </header>

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
          {lead.booking && (
            <section className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-100 mb-4">
                Reserva associada
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-white/10 p-4">
                  <p className="font-medium text-slate-100">
                    📅 {new Date(lead.booking.eventDate).toLocaleDateString('ca-ES', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-slate-300">Ref: {lead.booking.reference}</p>
                  <p className="text-sm text-slate-300">Tipus: {lead.booking.eventType}</p>
                  <p className="text-sm text-slate-300">Ubicació: {lead.booking.eventLocation}</p>
                  <p className="text-sm text-slate-300">Convidats: {lead.booking.guestCount}</p>
                </div>
                <div className="rounded-lg border border-white/10 p-4">
                  <p className="text-lg font-bold text-slate-100">
                    {lead.booking.total.toLocaleString('ca-ES')}€
                  </p>
                  <p className="text-sm text-slate-300">Estat: {lead.booking.status}</p>
                  <p className="text-sm text-slate-300">Subtotal: {lead.booking.subtotal.toLocaleString('ca-ES')}€</p>
                  <p className="text-sm text-slate-300">IVA: {lead.booking.vatAmount.toLocaleString('ca-ES')}€</p>
                  <p className="text-sm text-slate-300">
                    Dipòsit: {lead.booking.depositPaid ? 'Pagat' : 'Pendent'} ({lead.booking.depositAmount.toLocaleString('ca-ES')}€)
                  </p>
                  <p className="text-sm text-slate-300">
                    Resta: {lead.booking.remainingPaid ? 'Pagada' : 'Pendent'} ({lead.booking.remainingAmount.toLocaleString('ca-ES')}€)
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 p-4 md:col-span-2">
                  <h4 className="text-sm font-semibold text-slate-100 mb-2">Post-event i automatitzacions</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="text-sm">
                      <p className="text-slate-300">
                        Estat client: <strong className={
                          reviewFlowStatus === 'RESPONDIDO'
                            ? 'text-emerald-600'
                            : reviewFlowStatus === 'ENVIADO'
                              ? 'text-blue-600'
                              : 'text-amber-600'
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
                      <p className="text-slate-300">
                        Enllaç de valoració enviat: <strong className={lead.booking.postEventEmailSent ? 'text-emerald-600' : 'text-amber-600'}>
                          {lead.booking.postEventEmailSent ? 'Sí' : 'No'}
                        </strong>
                      </p>
                      <p className="text-slate-300">
                        Data d&apos;enviament: {lead.booking.postEventEmailSentAt
                          ? new Date(lead.booking.postEventEmailSentAt).toLocaleString('ca-ES')
                          : '-'}
                      </p>
                      <p className="text-slate-300 break-all">
                        Token de valoració: {lead.booking.reviewToken || '-'}
                      </p>
                      <p className="text-slate-300">
                        El client ha respost: <strong className={(lead.booking.reviewSubmittedAt || lead.booking.clientSurvey) ? 'text-emerald-600' : 'text-amber-600'}>
                          {(lead.booking.reviewSubmittedAt || lead.booking.clientSurvey) ? 'Sí' : 'No'}
                        </strong>
                      </p>
                      <p className="text-slate-300">
                        Data de resposta: {lead.booking.reviewSubmittedAt
                          ? new Date(lead.booking.reviewSubmittedAt).toLocaleString('ca-ES')
                          : lead.booking.clientSurvey?.submittedAt
                            ? new Date(lead.booking.clientSurvey.submittedAt).toLocaleString('ca-ES')
                            : '-'}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-300">
                        Estat intern de post-esdeveniment: <strong className={
                          internalPostEventStatus === 'COMPLETO'
                            ? 'text-emerald-600'
                            : internalPostEventStatus === 'EN_PROGRESO'
                              ? 'text-blue-600'
                              : 'text-amber-600'
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
                      <p className="text-slate-300">
                        Informe tècnic: <strong>{lead.booking.postEventReport ? 'Completat' : 'Pendent'}</strong>
                      </p>
                      <p className="text-slate-300">
                        Enquesta client: <strong>{lead.booking.clientSurvey ? 'Rebuda' : 'Sense resposta'}</strong>
                      </p>
                      <p className="text-slate-300">
                        Feedback enviat: <strong>{lead.booking.clientFeedback?.sentAt ? 'Sí' : 'No'}</strong>
                      </p>
                      {lead.booking.clientSurvey && (
                        <p className="text-slate-300">
                          Rating/NPS: <strong>{lead.booking.clientSurvey.overallRating}/5 · {lead.booking.clientSurvey.npsScore}/10</strong>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action="/api/admin/emails/send-post-event" method="POST">
                      <input type="hidden" name="bookingId" value={lead.booking.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
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
                        rel="noreferrer"
                        className="inline-flex items-center rounded-md bg-green-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-600"
                      >
                        Enviar per WhatsApp
                      </a>
                    )}
                    {reviewUrl && (
                      <a
                        href={reviewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700"
                      >
                        Obrir formulari client
                      </a>
                    )}
                    <Link href={`/admin/bookings/${lead.booking.id}`} className="inline-flex items-center rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700">
                      Veure reserva completa
                    </Link>
                    <Link href="/admin/post-event/reports" className="inline-flex items-center rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700">
                      Informes post-event
                    </Link>
                    <Link href="/admin/post-event/surveys" className="inline-flex items-center rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700">
                      Enquestes client
                    </Link>
                    <Link href="/admin/emails" className="inline-flex items-center rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700">
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
          />

          {/* Metadades */}
          <section className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-100 mb-4">Detalls del registre</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-slate-400">ID</dt>
                <dd className="font-mono text-xs text-slate-100 break-all">{lead.id}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Idioma preferit</dt>
                <dd className="text-slate-100">{lead.preferredLocale.toUpperCase()}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Antiguitat de l&apos;entrada</dt>
                <dd className="text-slate-100">{leadAgeDays} dies</dd>
              </div>
              {lead.customerId && (
                <div>
                  <dt className="text-xs text-slate-300">ID client</dt>
                  <dd className="font-mono text-xs break-all">
                    <Link href={`/admin/contactes/${lead.customerId}`} className="text-cyan-300 hover:text-cyan-200 hover:underline">
                      {lead.customerId}
                    </Link>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-slate-400">Creat</dt>
                <dd className="text-slate-100">
                  {new Date(lead.createdAt).toLocaleDateString('ca-ES', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Actualitzat</dt>
                <dd className="text-slate-100">
                  {new Date(lead.updatedAt).toLocaleDateString('ca-ES', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </dd>
              </div>
              {lead.contactedAt && (
                <div>
                  <dt className="text-xs text-slate-400">Contactat</dt>
                  <dd className="text-slate-100">
                    {new Date(lead.contactedAt).toLocaleDateString('ca-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </dd>
                </div>
              )}
              {lead.landingPage && (
                <div>
                  <dt className="text-xs text-slate-300">Pàgina d&apos;entrada</dt>
                  <dd className="text-slate-100 truncate">{lead.landingPage}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-sm">
            <h3 className="inline-flex items-center gap-1 text-sm font-semibold text-slate-100 mb-4">
              Atribució / UTM
              <InfoTooltip text={ADMIN_HELP.leadAttribution} />
            </h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="inline-flex items-center gap-1 text-xs text-slate-300">
                  Origen
                  <InfoTooltip text={ADMIN_HELP.leadSource} />
                </dt>
                <dd className="text-slate-100">{lead.source || '-'}</dd>
              </div>
              <div>
                <dt className="inline-flex items-center gap-1 text-xs text-slate-300">
                  UTM source
                  <InfoTooltip text={ADMIN_HELP.leadUtmSource} />
                </dt>
                <dd className="text-slate-100 break-all">{lead.utmSource || '-'}</dd>
              </div>
              <div>
                <dt className="inline-flex items-center gap-1 text-xs text-slate-300">
                  UTM medium
                  <InfoTooltip text={ADMIN_HELP.leadUtmMedium} />
                </dt>
                <dd className="text-slate-100 break-all">{lead.utmMedium || '-'}</dd>
              </div>
              <div>
                <dt className="inline-flex items-center gap-1 text-xs text-slate-300">
                  UTM campaign
                  <InfoTooltip text={ADMIN_HELP.leadUtmCampaign} />
                </dt>
                <dd className="text-slate-100 break-all">{lead.utmCampaign || '-'}</dd>
              </div>
              <div>
                <dt className="inline-flex items-center gap-1 text-xs text-slate-300">
                  Landing
                  <InfoTooltip text={ADMIN_HELP.leadLandingPage} />
                </dt>
                <dd className="text-slate-100 break-all">{lead.landingPage || '-'}</dd>
              </div>
            </dl>
          </section>

          {lead.customer && (
            <section className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-100 mb-4">Relació Client</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-400">Nom</dt>
                  <dd className="text-slate-100">{lead.customer.name || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Email</dt>
                  <dd className="text-slate-100 break-all">{lead.customer.email || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Telèfon</dt>
                  <dd className="text-slate-100">{lead.customer.phone || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-300">Idioma</dt>
                  <dd className="text-slate-100">{lead.customer.preferredLocale}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-300">Origen</dt>
                  <dd className="text-slate-100">{lead.customer.source}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-300">Total d&apos;esdeveniments</dt>
                  <dd className="text-slate-100">{lead.customer.totalEvents}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-300">Despesa total</dt>
                  <dd className="text-slate-100">{lead.customer.totalSpent.toLocaleString('ca-ES')}€</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-300">Últim event</dt>
                  <dd className="text-slate-100">
                    {lead.customer.lastEventDate
                      ? new Date(lead.customer.lastEventDate).toLocaleDateString('ca-ES')
                      : '-'}
                  </dd>
                </div>
              </dl>
              <Link
                href={`/admin/contactes/${lead.customer.id}`}
                className="mt-4 inline-flex rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Obrir fitxa client
              </Link>
            </section>
          )}

          <section className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-100 mb-4">
              Historial del client ({relatedLeads.length})
            </h3>
            {relatedLeads.length === 0 ? (
              <p className="text-sm text-slate-400">No hi ha altres esdeveniments/entrades d&apos;aquest client.</p>
            ) : (
              <div className="space-y-2">
                {relatedLeads.map((item) => (
                  <Link
                    key={item.id}
                    href={`/admin/leads/${item.id}`}
                    className="block rounded-lg border border-white/10 p-3 hover:bg-slate-800"
                  >
                    <p className="text-sm font-medium text-slate-100">
                      {EVENT_TYPE_LABELS[item.eventType] || item.eventType} · {item.status}
                    </p>
                    <p className="text-xs text-slate-400">
                      {item.eventDate ? new Date(item.eventDate).toLocaleDateString('ca-ES') : 'Sense data'} ·
                      {' '}Entrada creada {new Date(item.createdAt).toLocaleDateString('ca-ES')}
                    </p>
                    {item.booking ? (
                      <p className="text-xs text-emerald-400">
                        <Link
                          href={`/admin/bookings/${item.booking.id}`}
                          className="hover:underline hover:text-emerald-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Reserva {item.booking.reference}
                        </Link>
                        {' '}· {item.booking.status} · {item.booking.total.toLocaleString('ca-ES')}€
                      </p>
                    ) : (
                      <p className="text-xs text-amber-400">Sense reserva associada</p>
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
    </div>
  );
}



