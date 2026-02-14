import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import LeadActionsEnhanced from './LeadActionsEnhanced';
import LeadProfileEditor from './LeadProfileEditor';
import LeadWorkspace from './LeadWorkspace';
import { scoreLead } from '@/lib/services/commercialScoring';
import ScoreSnapshotButton from './ScoreSnapshotButton';
import LeadTechnicalSnapshotPanel from './LeadTechnicalSnapshotPanel';
import { buildLeadTechnicalSnapshot } from '@/lib/services/leadSnapshotService';
import { SITE_CONFIG } from '@/app/config/site-config';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
  });

  return {
    title: lead ? `${lead.name} | Leads` : 'Lead no trobat',
  };
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  NEW: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Nou Lead' },
  CONTACTED: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Contactat' },
  QUOTE_SENT: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Pressupost enviat' },
  NEGOTIATING: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Negociació' },
  WON: { bg: 'bg-green-100', text: 'text-green-700', label: 'Guanyat!' },
  LOST: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Perdut' },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: '💍 Boda',
  BIRTHDAY: '🎂 Aniversari',
  CORPORATE: '🎯 Corporatiu',
  COMMUNION: '⛪ Comunió',
  BAPTISM: '👶 Bateig',
  GRADUATION: '🎓 Graduació',
  ANNIVERSARY: '🎉 Aniversari',
  PRIVATE_PARTY: '🎵 Festa privada',
  OTHER: '📋 Altre',
};

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Baixa', color: 'bg-stone-100 text-slate-700' },
  MEDIUM: { label: 'Mitjana', color: 'bg-blue-100 text-blue-700' },
  HIGH: { label: 'Alta', color: 'bg-orange-100 text-orange-700' },
  URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-700' },
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
    include: {
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
    include: {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
          <Link
            href="/admin/leads"
            className="text-sm text-slate-500 hover:text-slate-700 mb-2 inline-block"
          >
            ← Tornar a leads
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-700">
            {lead.name}
          </h1>
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusConf.bg} ${statusConf.text}`}
            >
              {statusConf.label}
            </span>
            <span className="text-sm text-slate-500">{eventType}</span>
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
              className="inline-flex items-center rounded-md bg-stone-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-stone-200"
            >
              ✉️ Email
            </a>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border border-stone-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Valor estimat</p>
            <p className="text-xl font-semibold text-slate-800">
              {estimatedRevenue !== null ? `${estimatedRevenue.toLocaleString('ca-ES')}€` : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Antiguitat lead</p>
            <p className="text-xl font-semibold text-slate-800">{leadAgeDays} dies</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Flux client</p>
            <p className="text-xl font-semibold text-slate-800">
              {reviewFlowStatus === 'RESPONDIDO'
                ? 'Respondido'
                : reviewFlowStatus === 'ENVIADO'
                  ? 'Enviado'
                  : reviewFlowStatus === 'FALTA_ENVIAR'
                    ? 'Falta enviar'
                    : 'Sin reserva'}
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Post-event interno</p>
            <p className="text-xl font-semibold text-slate-800">
              {internalPostEventStatus === 'COMPLETO'
                ? 'Completado'
                : internalPostEventStatus === 'EN_PROGRESO'
                  ? 'En progreso'
                  : internalPostEventStatus === 'PENDIENTE'
                    ? 'Pendiente'
                    : 'Sin reserva'}
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Lead score</p>
            <p className="text-xl font-semibold text-slate-800">
              {leadScore.score} · {SCORE_BAND_LABELS[leadScore.band] || leadScore.band}
            </p>
            <ScoreSnapshotButton leadId={lead.id} />
          </div>
        </div>
      </header>

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

          {/* Notes */}
          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">
              Notes ({lead.notes.length})
            </h2>

            {lead.notes.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                Encara no hi ha notes
              </p>
            ) : (
              <div className="space-y-4">
                {lead.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-lg bg-slate-50 hover:bg-stone-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-slate-500">
                        {new Date(note.createdAt).toLocaleDateString('ca-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {note.createdBy && (
                        <span className="text-xs text-slate-400">
                          per {note.createdBy}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Booking */}
          {lead.booking && (
            <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-700 mb-4">
                Reserva associada
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-stone-200 p-4">
                  <p className="font-medium text-slate-700">
                    📅 {new Date(lead.booking.eventDate).toLocaleDateString('ca-ES', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-slate-600">Ref: {lead.booking.reference}</p>
                  <p className="text-sm text-slate-600">Tipus: {lead.booking.eventType}</p>
                  <p className="text-sm text-slate-600">Ubicació: {lead.booking.eventLocation}</p>
                  <p className="text-sm text-slate-600">Convidats: {lead.booking.guestCount}</p>
                </div>
                <div className="rounded-lg border border-stone-200 p-4">
                  <p className="text-lg font-bold text-slate-700">
                    {lead.booking.total.toLocaleString('ca-ES')}€
                  </p>
                  <p className="text-sm text-slate-600">Estat: {lead.booking.status}</p>
                  <p className="text-sm text-slate-600">Subtotal: {lead.booking.subtotal.toLocaleString('ca-ES')}€</p>
                  <p className="text-sm text-slate-600">IVA: {lead.booking.vatAmount.toLocaleString('ca-ES')}€</p>
                  <p className="text-sm text-slate-600">
                    Dipòsit: {lead.booking.depositPaid ? 'Pagat' : 'Pendent'} ({lead.booking.depositAmount.toLocaleString('ca-ES')}€)
                  </p>
                  <p className="text-sm text-slate-600">
                    Resta: {lead.booking.remainingPaid ? 'Pagada' : 'Pendent'} ({lead.booking.remainingAmount.toLocaleString('ca-ES')}€)
                  </p>
                </div>
                <div className="rounded-lg border border-stone-200 p-4 md:col-span-2">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Post-event i automatitzacions</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="text-sm">
                      <p className="text-slate-600">
                        Estado cliente: <strong className={
                          reviewFlowStatus === 'RESPONDIDO'
                            ? 'text-emerald-600'
                            : reviewFlowStatus === 'ENVIADO'
                              ? 'text-blue-600'
                              : 'text-amber-600'
                        }>
                          {reviewFlowStatus === 'RESPONDIDO'
                            ? 'Respondido'
                            : reviewFlowStatus === 'ENVIADO'
                              ? 'Enviado'
                              : reviewFlowStatus === 'FALTA_ENVIAR'
                                ? 'Falta enviar'
                                : 'Sin reserva'}
                        </strong>
                      </p>
                      <p className="text-slate-600">
                        Enlace valoración enviado: <strong className={lead.booking.postEventEmailSent ? 'text-emerald-600' : 'text-amber-600'}>
                          {lead.booking.postEventEmailSent ? 'Sí' : 'No'}
                        </strong>
                      </p>
                      <p className="text-slate-600">
                        Fecha envío: {lead.booking.postEventEmailSentAt
                          ? new Date(lead.booking.postEventEmailSentAt).toLocaleString('ca-ES')
                          : '-'}
                      </p>
                      <p className="text-slate-600 break-all">
                        Token review: {lead.booking.reviewToken || '-'}
                      </p>
                      <p className="text-slate-600">
                        Cliente ha respondido: <strong className={(lead.booking.reviewSubmittedAt || lead.booking.clientSurvey) ? 'text-emerald-600' : 'text-amber-600'}>
                          {(lead.booking.reviewSubmittedAt || lead.booking.clientSurvey) ? 'Sí' : 'No'}
                        </strong>
                      </p>
                      <p className="text-slate-600">
                        Fecha respuesta: {lead.booking.reviewSubmittedAt
                          ? new Date(lead.booking.reviewSubmittedAt).toLocaleString('ca-ES')
                          : lead.booking.clientSurvey?.submittedAt
                            ? new Date(lead.booking.clientSurvey.submittedAt).toLocaleString('ca-ES')
                            : '-'}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-600">
                        Estado post-event interno: <strong className={
                          internalPostEventStatus === 'COMPLETO'
                            ? 'text-emerald-600'
                            : internalPostEventStatus === 'EN_PROGRESO'
                              ? 'text-blue-600'
                              : 'text-amber-600'
                        }>
                          {internalPostEventStatus === 'COMPLETO'
                            ? 'Completado'
                            : internalPostEventStatus === 'EN_PROGRESO'
                              ? 'En progreso'
                              : internalPostEventStatus === 'PENDIENTE'
                                ? 'Pendiente'
                                : 'Sin reserva'}
                        </strong>
                      </p>
                      <p className="text-slate-600">
                        Informe tècnic: <strong>{lead.booking.postEventReport ? 'Completat' : 'Pendent'}</strong>
                      </p>
                      <p className="text-slate-600">
                        Enquesta client: <strong>{lead.booking.clientSurvey ? 'Rebuda' : 'Sense resposta'}</strong>
                      </p>
                      <p className="text-slate-600">
                        Feedback enviat: <strong>{lead.booking.clientFeedback?.sentAt ? 'Sí' : 'No'}</strong>
                      </p>
                      {lead.booking.clientSurvey && (
                        <p className="text-slate-600">
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
                        className="inline-flex items-center rounded-md bg-stone-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-stone-200"
                      >
                        Obrir formulari client
                      </a>
                    )}
                    <Link href={`/admin/bookings/${lead.booking.id}`} className="inline-flex items-center rounded-md bg-stone-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-stone-200">
                      Veure reserva completa
                    </Link>
                    <Link href="/admin/post-event/reports" className="inline-flex items-center rounded-md bg-stone-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-stone-200">
                      Informes post-event
                    </Link>
                    <Link href="/admin/post-event/surveys" className="inline-flex items-center rounded-md bg-stone-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-stone-200">
                      Enquestes client
                    </Link>
                    <Link href="/admin/emails" className="inline-flex items-center rounded-md bg-stone-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-stone-200">
                      Automatitzacions email
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
          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Detalls del registre</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">ID</dt>
                <dd className="font-mono text-xs text-slate-700 break-all">{lead.id}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Idioma preferit</dt>
                <dd className="text-slate-700">{lead.preferredLocale.toUpperCase()}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Antiguitat lead</dt>
                <dd className="text-slate-700">{leadAgeDays} dies</dd>
              </div>
              {lead.customerId && (
                <div>
                  <dt className="text-xs text-slate-600">ID client</dt>
                  <dd className="font-mono text-xs text-slate-700 break-all">{lead.customerId}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-slate-500">Creat</dt>
                <dd className="text-slate-700">
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
                <dt className="text-xs text-slate-500">Actualitzat</dt>
                <dd className="text-slate-700">
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
                  <dt className="text-xs text-slate-500">Contactat</dt>
                  <dd className="text-slate-700">
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
                  <dt className="text-xs text-slate-600">Pàgina d&apos;entrada</dt>
                  <dd className="text-slate-700 truncate">{lead.landingPage}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Atribució / UTM</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-slate-600">Origen</dt>
                <dd className="text-slate-700">{lead.source || '-'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-600">UTM source</dt>
                <dd className="text-slate-700 break-all">{lead.utmSource || '-'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-600">UTM medium</dt>
                <dd className="text-slate-700 break-all">{lead.utmMedium || '-'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-600">UTM campaign</dt>
                <dd className="text-slate-700 break-all">{lead.utmCampaign || '-'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-600">Landing</dt>
                <dd className="text-slate-700 break-all">{lead.landingPage || '-'}</dd>
              </div>
            </dl>
          </section>

          {lead.customer && (
            <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Relació Client</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Nom</dt>
                  <dd className="text-slate-700">{lead.customer.name || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Email</dt>
                  <dd className="text-slate-700 break-all">{lead.customer.email || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Telèfon</dt>
                  <dd className="text-slate-700">{lead.customer.phone || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-600">Idioma</dt>
                  <dd className="text-slate-700">{lead.customer.preferredLocale}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-600">Origen</dt>
                  <dd className="text-slate-700">{lead.customer.source}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-600">Total d&apos;events</dt>
                  <dd className="text-slate-700">{lead.customer.totalEvents}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-600">Despesa total</dt>
                  <dd className="text-slate-700">{lead.customer.totalSpent.toLocaleString('ca-ES')}€</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-600">Últim event</dt>
                  <dd className="text-slate-700">
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
                Obrir Customer 360
              </Link>
            </section>
          )}

          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">
              Historial del client ({relatedLeads.length})
            </h3>
            {relatedLeads.length === 0 ? (
              <p className="text-sm text-slate-500">No hi ha altres events/leads d&apos;aquest client.</p>
            ) : (
              <div className="space-y-2">
                {relatedLeads.map((item) => (
                  <Link
                    key={item.id}
                    href={`/admin/leads/${item.id}`}
                    className="block rounded-lg border border-stone-200 p-3 hover:bg-slate-50"
                  >
                    <p className="text-sm font-medium text-slate-700">
                      {EVENT_TYPE_LABELS[item.eventType] || item.eventType} · {item.status}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.eventDate ? new Date(item.eventDate).toLocaleDateString('ca-ES') : 'Sense data'} ·
                      {' '}Lead creat {new Date(item.createdAt).toLocaleDateString('ca-ES')}
                    </p>
                    {item.booking ? (
                      <p className="text-xs text-emerald-700">
                        Reserva {item.booking.reference} · {item.booking.status} · {item.booking.total.toLocaleString('ca-ES')}€
                      </p>
                    ) : (
                      <p className="text-xs text-amber-700">Sense reserva associada</p>
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
