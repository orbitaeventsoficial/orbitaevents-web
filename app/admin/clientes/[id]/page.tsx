import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import CustomerTabSelector from './CustomerTabSelector';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
  searchParams?: { tab?: string };
}

const TABS = ['resumen', 'presupuestos', 'reservas', 'comunicaciones', 'tareas', 'leads', 'notas'] as const;
type CustomerTab = (typeof TABS)[number];

function getTab(value?: string): CustomerTab {
  if (!value) return 'resumen';
  return (TABS as readonly string[]).includes(value) ? (value as CustomerTab) : 'resumen';
}

function parseBudgetValue(input?: string | null): number {
  if (!input) return 0;
  const normalized = input.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}

function formatDate(value?: Date | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('ca-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value?: Date | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('ca-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_LABEL: Record<string, string> = {
  NEW: 'Nou',
  CONTACTED: 'Contactat',
  QUOTE_SENT: 'Pressupost enviat',
  NEGOTIATING: 'Negociació',
  WON: 'Guanyat',
  LOST: 'Perdut',
};

export default async function CustomerDetailPage({ params, searchParams }: Props) {
  const currentTab = getTab(searchParams?.tab);
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      leads: {
        include: {
          booking: {
            select: {
              id: true,
              reference: true,
              status: true,
              total: true,
              eventDate: true,
              postEventEmailSent: true,
              postEventEmailSentAt: true,
              reviewSubmittedAt: true,
            },
          },
          tasks: {
            select: { id: true, status: true, dueDate: true },
          },
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      activityLog: {
        orderBy: { createdAt: 'desc' },
        take: 80,
      },
      testimonials: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      discountCodes: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      bookings: {
        orderBy: { eventDate: 'desc' },
        take: 50,
      },
      proposals: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      consentRecords: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!customer) notFound();

  const leadCountsByStatus = customer.leads.reduce<Record<string, number>>((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {});

  const totalBudgetPipeline = customer.leads
    .filter((lead) => ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'].includes(lead.status))
    .reduce((sum, lead) => sum + parseBudgetValue(lead.budget), 0);

  const wonRevenue = customer.leads.reduce((sum, lead) => sum + (lead.booking?.total || 0), 0);

  const openTasks = customer.leads.flatMap((lead) => lead.tasks).filter((task) => task.status !== 'DONE').length;
  const overdueTasks = customer.leads
    .flatMap((lead) => lead.tasks)
    .filter((task) => task.status !== 'DONE' && task.dueDate && new Date(task.dueDate) < new Date()).length;

  const pendingContactSLA = customer.leads.filter((lead) => {
    if (lead.status !== 'NEW') return false;
    const hours = (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60);
    return hours > 24;
  }).length;

  const automationStats = customer.leads.reduce(
    (acc, lead) => {
      if (!lead.booking) return acc;
      if (lead.booking.postEventEmailSent) acc.sent += 1;
      else acc.pending += 1;
      if (lead.booking.reviewSubmittedAt) acc.responded += 1;
      return acc;
    },
    { pending: 0, sent: 0, responded: 0 }
  );

  const omnichannelTimeline = [
    ...customer.activityLog.map((item) => ({
      id: `c-${item.id}`,
      source: 'customer',
      title: item.action,
      description: item.details ? JSON.stringify(item.details) : null,
      createdAt: item.createdAt,
      leadId: null as string | null,
    })),
    ...customer.leads.flatMap((lead) =>
      lead.activities.map((item) => ({
        id: `l-${item.id}`,
        source: 'lead',
        title: item.title || item.type,
        description: item.description || null,
        createdAt: item.createdAt,
        leadId: lead.id,
      }))
    ),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 120);

  const completion = {
    phone: !!customer.phone,
    instagram: !!customer.instagram,
    marketingConsent: customer.marketingConsent,
    gdprConsent: customer.gdprConsent,
  };

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-slate-950/60 p-6 shadow-sm">
        <Link href="/admin/clientes" className="text-sm text-slate-400 hover:text-slate-200">
          ← Tornar a clients
        </Link>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">{customer.name}</h1>
            <p className="text-sm text-slate-400">{customer.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                Idioma {customer.preferredLocale}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                Origen {customer.source}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/presupuestos?customerId=${customer.id}`}
              className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600"
            >
              Nou pressupost
            </Link>
            <Link
              href={`/admin/bookings?customerId=${customer.id}`}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600"
            >
              Nova reserva
            </Link>
            <Link
              href={`/admin/tasks?customerId=${customer.id}`}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
            >
              Nova tasca
            </Link>
            {customer.phone && (
              <a
                href={`https://wa.me/${customer.phone.replace(/[^\d]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
              >
                WhatsApp
              </a>
            )}
            <a
              href={`mailto:${customer.email}`}
              className="rounded-lg border border-white/10 bg-slate-950/60 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5"
            >
              Email
            </a>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-sm">
        <CustomerTabSelector customerId={customer.id} currentTab={currentTab} />
        <div className="hidden flex-wrap gap-2 sm:flex">
          {TABS.map((tab) => (
            <Link
              key={tab}
              href={`/admin/clientes/${customer.id}?tab=${tab}`}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                currentTab === tab
                  ? 'border border-cyan-400/40 bg-cyan-500/15 text-cyan-200'
                  : 'border border-white/10 bg-slate-900/60 text-slate-300 hover:bg-white/5'
              }`}
            >
              {tab === 'resumen' && 'Resumen'}
              {tab === 'presupuestos' && 'Presupuestos'}
              {tab === 'reservas' && 'Reservas'}
              {tab === 'comunicaciones' && 'Comunicaciones'}
              {tab === 'tareas' && 'Tareas'}
              {tab === 'leads' && 'Leads'}
              {tab === 'notas' && 'Notas/Docs'}
            </Link>
          ))}
        </div>
      </section>

      {currentTab === 'resumen' && (
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 shadow-sm">
          <p className="text-xs text-slate-400">Esdeveniments totals</p>
          <p className="text-2xl font-semibold text-slate-100">{customer.totalEvents}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 shadow-sm">
          <p className="text-xs text-slate-400">Ingressos tancats</p>
          <p className="text-2xl font-semibold text-slate-100">{wonRevenue.toLocaleString('ca-ES')}€</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 shadow-sm">
          <p className="text-xs text-slate-400">Pipeline estimat</p>
          <p className="text-2xl font-semibold text-slate-100">{totalBudgetPipeline.toLocaleString('ca-ES')}€</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 shadow-sm">
          <p className="text-xs text-slate-400">Tasques obertes</p>
          <p className="text-2xl font-semibold text-slate-100">{openTasks}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 shadow-sm">
          <p className="text-xs text-slate-400">SLA contacte trencat</p>
          <p className="text-2xl font-semibold text-amber-700">{pendingContactSLA}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 shadow-sm">
          <p className="text-xs text-slate-400">Tasques vençudes</p>
          <p className="text-2xl font-semibold text-rose-700">{overdueTasks}</p>
        </div>
      </section>
      )}

      {currentTab === 'resumen' && (
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-sm xl:col-span-2">
          <h2 className="text-lg font-semibold text-slate-100">Historial d&apos;events i pipeline</h2>
          <div className="mt-4 space-y-2">
            {customer.leads.length === 0 ? (
              <p className="text-sm text-slate-400">Sense leads associats.</p>
            ) : (
              customer.leads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/admin/leads/${lead.id}`}
                  className="block rounded-xl border border-white/10 p-3 hover:bg-white/5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-100">
                      {STATUS_LABEL[lead.status] || lead.status} · {lead.eventType}
                    </p>
                    <p className="text-xs text-slate-400">
                      Event {formatDate(lead.eventDate)} · Creat {formatDate(lead.createdAt)}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-slate-300">
                    Pressupost: {lead.budget || '-'} · Booking:{' '}
                    {lead.booking ? `${lead.booking.reference} (${lead.booking.status}) ${lead.booking.total.toLocaleString('ca-ES')}€` : 'No'}
                  </p>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-100">Automatitzacions</h2>
          <div className="mt-3 space-y-2 text-sm text-slate-200">
            <p>Post-event pendent: <strong>{automationStats.pending}</strong></p>
            <p>Post-event enviat: <strong>{automationStats.sent}</strong></p>
            <p>Client ha respost: <strong>{automationStats.responded}</strong></p>
          </div>
          <h3 className="mt-5 text-sm font-semibold text-slate-100">Qualitat de dades</h3>
          <div className="mt-2 space-y-1 text-sm text-slate-200">
            <p>Telèfon: <strong>{completion.phone ? 'OK' : 'Falta'}</strong></p>
            <p>Instagram: <strong>{completion.instagram ? 'OK' : 'Falta'}</strong></p>
            <p>GDPR: <strong>{completion.gdprConsent ? 'OK' : 'Falta'}</strong></p>
            <p>Màrqueting: <strong>{completion.marketingConsent ? 'OK' : 'No consentit'}</strong></p>
          </div>
          <h3 className="mt-5 text-sm font-semibold text-slate-100">Embut</h3>
          <div className="mt-2 space-y-1 text-sm text-slate-200">
            <p>NEW: <strong>{leadCountsByStatus.NEW || 0}</strong></p>
            <p>CONTACTED: <strong>{leadCountsByStatus.CONTACTED || 0}</strong></p>
            <p>QUOTE_SENT: <strong>{leadCountsByStatus.QUOTE_SENT || 0}</strong></p>
            <p>NEGOTIATING: <strong>{leadCountsByStatus.NEGOTIATING || 0}</strong></p>
            <p>WON: <strong>{leadCountsByStatus.WON || 0}</strong></p>
            <p>LOST: <strong>{leadCountsByStatus.LOST || 0}</strong></p>
          </div>
        </section>
      </div>
      )}

      {currentTab === 'comunicaciones' && (
      <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-100">Timeline omnicanal</h2>
        <div className="mt-4 space-y-2">
          {omnichannelTimeline.length === 0 ? (
            <p className="text-sm text-slate-400">Sense activitat.</p>
          ) : (
            omnichannelTimeline.map((item) => (
              <div key={item.id} className="rounded-xl border border-white/10 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-100">
                    [{item.source === 'customer' ? 'CLIENT' : 'LEAD'}] {item.title}
                  </p>
                  <p className="text-xs text-slate-400">{formatDateTime(item.createdAt)}</p>
                </div>
                {item.description && (
                  <p className="mt-1 text-xs text-slate-300 whitespace-pre-wrap">{item.description}</p>
                )}
                {item.leadId && (
                  <Link href={`/admin/leads/${item.leadId}`} className="mt-2 inline-block text-xs text-cyan-300 hover:underline">
                    Obrir lead
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      </section>
      )}

      {currentTab === 'notas' && (
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-100">Testimonis i descomptes</h2>
          <p className="mt-2 text-sm text-slate-200">
            Testimonis: <strong>{customer.testimonials.length}</strong> · Codis descompte: <strong>{customer.discountCodes.length}</strong>
          </p>
          <div className="mt-3 space-y-2">
            {customer.discountCodes.slice(0, 8).map((code) => (
              <div key={code.id} className="rounded-lg border border-white/10 px-3 py-2 text-sm">
                <span className="font-semibold">{code.code}</span> · {code.discountPercent}% · {code.currentUses}/{code.maxUses} usos
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-100">Compliment (consentiments)</h2>
          <p className="mt-2 text-sm text-slate-200">
            Registres: <strong>{customer.consentRecords.length}</strong>
          </p>
          <div className="mt-3 space-y-2">
            {customer.consentRecords.slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 px-3 py-2 text-sm">
                <p>
                  {item.consentType} · <strong>{item.granted ? 'Acceptat' : 'Denegat'}</strong>
                </p>
                <p className="text-xs text-slate-400">{formatDateTime(item.createdAt)} · {item.source}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      )}

      {currentTab === 'presupuestos' && (
        <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-100">Presupuestos</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/admin/presupuestos?customerId=${customer.id}`} className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-600">
              Abrir editor PDF
            </Link>
            <Link href="/admin/settings/quotes" className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-white/5">
              Plantillas de presupuesto
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {customer.proposals.length === 0 ? (
              <p className="text-sm text-slate-400">No hay presupuestos guardados todavía.</p>
            ) : (
              customer.proposals.map((proposal) => (
                <div key={proposal.id} className="rounded-xl border border-white/10 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-100">
                      {proposal.reference} · {proposal.status}
                    </p>
                    <p className="text-xs text-slate-300">
                      {proposal.total.toLocaleString('ca-ES')}€ · {formatDate(proposal.createdAt)}
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link
                      href={`/admin/presupuestos?customerId=${customer.id}&proposalId=${proposal.id}`}
                      className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-slate-100 hover:bg-white/5"
                    >
                      Veure / editar
                    </Link>
                    <form action={`/api/admin/proposals/${proposal.id}/send`} method="POST">
                      <button
                        type="submit"
                        className="rounded-md border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200 hover:bg-emerald-500/20"
                      >
                        Marcar enviat
                      </button>
                    </form>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {currentTab === 'reservas' && (
        <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-100">Reservas del cliente</h2>
          <div className="mt-4 space-y-2">
            {customer.bookings.length === 0 ? (
              <p className="text-sm text-slate-400">No hay reservas asociadas todavía.</p>
            ) : (
              customer.bookings.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/admin/bookings/${booking.id}`}
                    className="block rounded-xl border border-white/10 p-3 hover:bg-white/5"
                  >
                    <p className="text-sm font-semibold text-slate-100">
                      {booking.reference} · {booking.status}
                    </p>
                    <p className="text-xs text-slate-300">
                      {formatDate(booking.eventDate)} · {booking.total.toLocaleString('ca-ES')}€
                    </p>
                  </Link>
                ))
            )}
          </div>
        </section>
      )}

      {currentTab === 'tareas' && (
        <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-100">Tareas</h2>
          <p className="mt-2 text-sm text-slate-300">
            Tareas abiertas de todos los leads de este cliente.
          </p>
          <div className="mt-4 space-y-2">
            {customer.leads.flatMap((lead) => lead.tasks.map((task) => ({ leadId: lead.id, task }))).length === 0 ? (
              <p className="text-sm text-slate-400">No hay tareas registradas.</p>
            ) : (
              customer.leads
                .flatMap((lead) => lead.tasks.map((task) => ({ leadId: lead.id, task })))
                .map((item) => (
                  <Link
                    key={item.task.id}
                    href={`/admin/leads/${item.leadId}`}
                    className="block rounded-xl border border-white/10 p-3 hover:bg-white/5"
                  >
                    <p className="text-sm font-semibold text-slate-100">
                      {item.task.status} · {item.task.id}
                    </p>
                    <p className="text-xs text-slate-300">
                      Vencimiento: {formatDate(item.task.dueDate)}
                    </p>
                  </Link>
                ))
            )}
          </div>
        </section>
      )}

      {currentTab === 'leads' && (
        <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-100">Leads vinculados</h2>
          <div className="mt-4 space-y-2">
            {customer.leads.length === 0 ? (
              <p className="text-sm text-slate-400">No hay leads vinculados.</p>
            ) : (
              customer.leads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/admin/leads/${lead.id}`}
                  className="block rounded-xl border border-white/10 p-3 hover:bg-white/5"
                >
                  <p className="text-sm font-semibold text-slate-100">
                    {STATUS_LABEL[lead.status] || lead.status} · {lead.eventType}
                  </p>
                  <p className="text-xs text-slate-300">
                    {formatDate(lead.createdAt)} · {lead.email}
                  </p>
                </Link>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}



