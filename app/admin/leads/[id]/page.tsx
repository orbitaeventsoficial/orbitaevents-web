import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import LeadActionsEnhanced from './LeadActionsEnhanced';

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
  LOST: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Perdut' },
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

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: '🌐 Web',
  CONFIGURATOR: '⚙️ Configurador',
  PHONE: '📞 Telèfon',
  WHATSAPP: '💬 WhatsApp',
  INSTAGRAM: '📸 Instagram',
  REFERRAL: '🤝 Referència',
  GOOGLE: '🔍 Google',
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
      booking: true,
    },
  });

  if (!lead) {
    notFound();
  }

  const statusConf = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NEW;
  const eventType = EVENT_TYPE_LABELS[lead.eventType] || lead.eventType;
  const priorityConf = PRIORITY_LABELS[lead.priority] || PRIORITY_LABELS.MEDIUM;

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
          {/* Info del client */}
          <section className="rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">Informació del client</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase">Email</dt>
                <dd className="mt-1 text-sm text-slate-700">{lead.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase">Telèfon</dt>
                <dd className="mt-1 text-sm text-slate-700">{lead.phone || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase">Data event</dt>
                <dd className="mt-1 text-sm text-slate-700">
                  {lead.eventDate
                    ? new Date(lead.eventDate).toLocaleDateString('ca-ES', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase">Nº invitats</dt>
                <dd className="mt-1 text-sm text-slate-700">
                  {lead.guestCount ? `${lead.guestCount} persones` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase">Pressupost</dt>
                <dd className="mt-1 text-sm text-slate-700">
                  {lead.budget || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase">Ubicació</dt>
                <dd className="mt-1 text-sm text-slate-700">{lead.eventLocation || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase">Origen</dt>
                <dd className="mt-1 text-sm text-slate-700">{SOURCE_LABELS[lead.source] || lead.source}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase">UTM</dt>
                <dd className="mt-1 text-sm text-slate-700">
                  {lead.utmSource || lead.utmCampaign
                    ? `${lead.utmSource || ''} / ${lead.utmCampaign || ''}`
                    : '—'}
                </dd>
              </div>
              {lead.interestedPackId && (
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase">Pack interessat</dt>
                  <dd className="mt-1 text-sm text-slate-700">{lead.interestedPackId}</dd>
                </div>
              )}
              {lead.interestedExtras.length > 0 && (
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase">Extras interessat</dt>
                  <dd className="mt-1 text-sm text-slate-700">{lead.interestedExtras.join(', ')}</dd>
                </div>
              )}
            </dl>

            {lead.message && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <dt className="text-xs font-medium text-slate-500 uppercase mb-2">Missatge</dt>
                <dd className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">
                  {lead.message}
                </dd>
              </div>
            )}
          </section>

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
