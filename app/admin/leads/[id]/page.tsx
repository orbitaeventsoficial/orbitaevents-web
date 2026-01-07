import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import LeadActionsEnhanced from './LeadActionsEnhanced';
import LeadProfileEditor from './LeadProfileEditor';
import LeadWorkspace from './LeadWorkspace';

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
  LOST: { bg: 'bg-gray-100', text: 'text-gray-300', label: 'Perdut' },
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

export default async function LeadDetailPage({ params }: Props) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: {
      notes: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      tasks: { orderBy: { createdAt: 'desc' } },
      documents: { orderBy: { createdAt: 'desc' } },
      activities: { orderBy: { createdAt: 'desc' } },
      booking: true,
    },
  });

  if (!lead) {
    notFound();
  }

  const statusConf = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NEW;
  const eventType = EVENT_TYPE_LABELS[lead.eventType] || lead.eventType;
  const priorityConf = PRIORITY_LABELS[lead.priority] || PRIORITY_LABELS.MEDIUM;

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
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
            }}
          />

          {/* Notes */}
          <section className="rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
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
            <section className="rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-700 mb-4">
                Reserva associada
              </h2>
              <div className="flex items-center justify-between p-4 rounded-lg border border-stone-200 hover:border-stone-200 transition-colors">
                <div>
                  <p className="font-medium text-slate-700">
                    📅 {new Date(lead.booking.eventDate).toLocaleDateString('ca-ES', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-slate-600">
                    Ref: {lead.booking.reference}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-700">
                    {lead.booking.total.toLocaleString('ca-ES')}€
                  </p>
                  <p className="text-xs text-slate-500">{lead.booking.status}</p>
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
          <section className="rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
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
                  <dt className="text-xs text-slate-500">Landing Page</dt>
                  <dd className="text-slate-700 truncate">{lead.landingPage}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
