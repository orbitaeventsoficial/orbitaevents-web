import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { cachedQuery, CacheTTL } from '@/lib/query-cache';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { AdminPage } from '../components/AdminPage';
import { AdminHelpPanel } from '../components/AdminHelpPanel';
import LeadActions from './LeadActions';
import LeadLostReasonBadge from './LeadLostReasonBadge';
import LeadQuickPriority from './LeadQuickPriority';
import LeadQuickStatus from './LeadQuickStatus';
import LeadViewToggle from './LeadViewToggle';
import type { EventType, LeadSource, LeadStatus, Priority, Prisma } from '@prisma/client';
import { getLeadPriorityColorDisplay, getLeadStatusColorDisplay, LEAD_COLOR_DEFAULT_VARS } from './colorTheme';
import ExportCsvButton from '../components/ExportCsvButton';
import PipelineSuggestionsPanel from './PipelineSuggestionsPanel';
import { OwnerControlStrip } from '../components/OwnerControlStrip';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Entrades | Òrbita Admin',
};

import { EVENT_TYPE_VALUES, LEAD_SOURCE_VALUES, LEAD_STATUS_VALUES, PRIORITY_VALUES, formatDateShort, formatDate, getEventLabel, getSourceDisplay } from '@/lib/constants';


function buildQuery(filters: {
  status: string[];
  priority: string[];
  eventType: string[];
  source: string[];
  q: string;
  from: Date | null;
  to: Date | null;
}) {
  const params = new URLSearchParams();
  filters.status.forEach((value) => params.append('status', value));
  filters.priority.forEach((value) => params.append('priority', value));
  filters.eventType.forEach((value) => params.append('eventType', value));
  filters.source.forEach((value) => params.append('source', value));
  if (filters.q) params.set('q', filters.q);
  if (filters.from) params.set('from', filters.from.toISOString().slice(0, 10));
  if (filters.to) params.set('to', filters.to.toISOString().slice(0, 10));
  return params.toString();
}


function isLeadStatus(value: string): value is LeadStatus {
  return (LEAD_STATUS_VALUES as readonly string[]).includes(value);
}

function isPriority(value: string): value is Priority {
  return (PRIORITY_VALUES as readonly string[]).includes(value);
}

function isEventType(value: string): value is EventType {
  return (EVENT_TYPE_VALUES as readonly string[]).includes(value);
}

function isLeadSource(value: string): value is LeadSource {
  return (LEAD_SOURCE_VALUES as readonly string[]).includes(value);
}

function toArray(value?: string | string[]): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

type LeadFilters = {
  status: LeadStatus[];
  priority: Priority[];
  eventType: EventType[];
  source: LeadSource[];
  q: string;
  from: Date | null;
  to: Date | null;
};

type Pagination = {
  page: number;
  pageSize: number;
  totalPages: number;
};

function getPendingTimeBadge(createdAt: Date, status: LeadStatus) {
  if (status === 'WON' || status === 'LOST') {
    return { label: 'Tancat', className: '' };
  }

  const hours = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60));
  if (hours >= 24) {
    return { label: `${hours}h (urgent)`, className: '' };
  }
  if (hours >= 8) {
    return { label: `${hours}h (aviat)`, className: '' };
  }
  return { label: `${Math.max(0, hours)}h (controlat)`, className: '' };
}

async function getLeads(filters: {
  status?: string | string[];
  priority?: string | string[];
  eventType?: string | string[];
  source?: string | string[];
  q?: string;
  from?: string;
  to?: string;
  page?: string;
}) {
  try {
    const status = toArray(filters.status).filter(isLeadStatus);
    const priority = toArray(filters.priority).filter(isPriority);
    const eventType = toArray(filters.eventType).filter(isEventType);
    const source = toArray(filters.source).filter(isLeadSource);
    const from = parseDate(filters.from);
    const to = parseDate(filters.to);
    const pageRaw = Number.parseInt(filters.page || '1', 10);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const pageSize = 25;

    const where: Prisma.LeadWhereInput = {
      ...(status.length ? { status: { in: status } } : {}),
      ...(priority.length ? { priority: { in: priority } } : {}),
      ...(eventType.length ? { eventType: { in: eventType } } : {}),
      ...(source.length ? { source: { in: source } } : {}),
      ...(filters.q
        ? {
            OR: [
              { name: { contains: filters.q, mode: 'insensitive' as const } },
              { email: { contains: filters.q, mode: 'insensitive' as const } },
              { phone: { contains: filters.q } },
            ],
          }
        : {}),
      ...(from || to
        ? {
            eventDate: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };

    const cacheKey = [
      'admin:leads',
      `status=${status.join(',') || 'all'}`,
      `priority=${priority.join(',') || 'all'}`,
      `eventType=${eventType.join(',') || 'all'}`,
      `source=${source.join(',') || 'all'}`,
      `q=${filters.q || ''}`,
      `from=${from ? from.toISOString().slice(0, 10) : ''}`,
      `to=${to ? to.toISOString().slice(0, 10) : ''}`,
      `page=${page}`,
      `size=${pageSize}`,
    ].join('|');

    const [leads, filteredCount] = await cachedQuery(
      cacheKey,
      () => Promise.all([
        prisma.lead.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            eventType: true,
            eventDate: true,
            createdAt: true,
            status: true,
            lostReason: true,
            priority: true,
            source: true,
            customerId: true,
            _count: {
              select: {
                notes: true,
              },
            },
            booking: {
              select: {
                id: true,
                reference: true,
              },
            },
          },
        }),
        prisma.lead.count({ where }),
      ]),
      CacheTTL.VERY_SHORT
    );

    const normalizedFilters: LeadFilters = { status, priority, eventType, source, q: filters.q || '', from, to };
    return {
      leads,
      filters: normalizedFilters,
      pagination: {
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(filteredCount / pageSize)),
      } as Pagination,
    };
  } catch (e) {
    log.error('Error obtenint leads:', e);
    return {
      leads: [],
      filters: { status: [], priority: [], eventType: [], source: [], q: '', from: null, to: null } as LeadFilters,
      pagination: { page: 1, pageSize: 25, totalPages: 1 } as Pagination,
    };
  }
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams?: {
    status?: string | string[];
    priority?: string | string[];
    eventType?: string | string[];
    source?: string | string[];
    q?: string;
    from?: string;
    to?: string;
    page?: string;
  };
}) {
  const { status, priority, eventType, source, q, from, to, page } = searchParams || {};
  const data = await getLeads({ status, priority, eventType, source, q, from, to, page });
  const leads = data.leads;
  const currentQuery = buildQuery(data.filters);
  const newLeads = leads.filter((lead) => lead.status === 'NEW').length;
  const hotLeads = leads.filter((lead) => lead.priority === 'HIGH' || lead.priority === 'URGENT').length;
  const wonLeads = leads.filter((lead) => lead.status === 'WON').length;
  const pipelineLinkedBookings = leads.filter((lead) => !!lead.booking).length;
  const staleLeads = leads.filter((lead) => {
    if (lead.status === 'WON' || lead.status === 'LOST') return false;
    const hours = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60));
    return hours >= 24;
  }).length;
  const automaticSignals = [
    newLeads > 0 ? `${newLeads} entrada${newLeads > 1 ? 'es' : ''} nova${newLeads > 1 ? 'es' : ''}` : null,
    hotLeads > 0 ? `${hotLeads} entrada${hotLeads > 1 ? 'es' : ''} d’alta prioritat` : null,
    pipelineLinkedBookings > 0 ? `${pipelineLinkedBookings} entrada${pipelineLinkedBookings > 1 ? 'es' : ''} ja vinculada${pipelineLinkedBookings > 1 ? 'es' : ''} a reserva` : null,
  ].filter(Boolean) as string[];
  const manualSignals = [
    staleLeads > 0 ? `${staleLeads} entrada${staleLeads > 1 ? 'es' : ''} fa més de 24h sense tancar` : null,
    newLeads > 0 ? `${newLeads} entrada${newLeads > 1 ? 'es' : ''} pendent${newLeads > 1 ? 's' : ''} de primera resposta` : null,
    wonLeads === 0 && leads.length > 0 ? 'Cap entrada guanyada a la vista actual' : null,
  ].filter(Boolean) as string[];
  const nextStepHref = staleLeads > 0
    ? '/admin/leads?status=NEW'
    : newLeads > 0
      ? '/admin/leads?status=NEW'
      : hotLeads > 0
        ? '/admin/leads?priority=HIGH&priority=URGENT'
        : '/admin/intake';
  const nextStepLabel = staleLeads > 0
    ? 'Respondre entrades fredes'
    : newLeads > 0
      ? 'Atacar entrades noves'
      : hotLeads > 0
        ? 'Revisar prioritats altes'
        : 'Crear entrada ràpida';
  const nextStepDetail = staleLeads > 0
    ? 'El risc principal és deixar refredar oportunitats que ja passen del llindar saludable.'
    : newLeads > 0
      ? 'La prioritat és fer la primera resposta comercial.'
      : hotLeads > 0
        ? 'Queden oportunitats calentes que mereixen atenció abans del detall.'
        : 'No hi ha tensió crítica a la vista actual.';

  return (
    <AdminPage
      className="admin-leads-page"
      title="Entrades"
      subtitle="Tauler comercial, seguiment i pipeline operatiu."
      actions={<div className="flex gap-2">
        <ExportCsvButton
          filename="entrades"
          headers={['Nom', 'Email', 'Telèfon', 'Tipus', 'Origen', 'Estat', 'Data event']}
          rows={leads.map((l) => [
            l.name,
            l.email,
            l.phone || '',
            getEventLabel(l.eventType),
            getSourceDisplay(l.source).label,
            l.status,
            l.eventDate ? formatDate(l.eventDate) : '',
          ])}
        />
        <Link href="/admin/intake" className="ap-btn ap-btn--primary">Entrada ràpida</Link>
      </div>}
    >
    <PipelineSuggestionsPanel />
    <div
      id="leads-theme-root"
      className="space-y-4 px-1 pb-24 sm:space-y-6 sm:px-0 sm:pb-8"
      style={LEAD_COLOR_DEFAULT_VARS as CSSProperties}
    >
      <OwnerControlStrip
        system={{
          eyebrow: 'Automàtic',
          title: 'Què vigila el sistema',
          tone: 'info',
          items: automaticSignals,
          emptyText: 'Sense senyals automàtiques destacades a la vista actual.',
        }}
        manual={{
          eyebrow: 'Manual',
          title: 'Què et reclama decisió',
          tone: manualSignals.length > 0 ? 'warning' : 'success',
          items: manualSignals,
          emptyText: 'No hi ha cap front manual calent a les entrades visibles.',
        }}
        nextStep={{
          title: nextStepLabel,
          detail: nextStepDetail,
          href: nextStepHref,
        }}
      />

      <AdminHelpPanel
        title="Com treballar entrades"
        description="Aquesta és la porta comercial. Aquí veus quines oportunitats s han de respondre abans i com avançar-les cap a client o reserva."
        items={[
          {
            title: 'Temps pendent',
            body: 'T ajuda a no deixar refredar una oportunitat important.',
          },
          {
            title: 'Pipeline',
            body: 'El pipeline va bé per moure oportunitats. La llista va millor per revisar detall.',
          },
          {
            title: 'Connexions',
            body: 'Si una entrada ja està lligada a un client o una reserva, ho tens a un clic.',
          },
        ]}
      />

      <section className="admin-leads-switcher rounded-2xl border p-2">
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/admin/leads"
            aria-current="page"
            className="admin-keep-colors admin-leads-tab admin-leads-tab--active rounded-xl border px-3 py-2 text-center text-xs sm:text-sm font-semibold"
          >
            Tauler Leads
          </Link>
          <Link
            href="/admin/intake"
            className="admin-keep-colors admin-leads-tab admin-leads-tab--idle rounded-xl border px-3 py-2 text-center text-xs sm:text-sm font-semibold transition-colors"
          >
            Entrada ràpida
          </Link>
        </div>
      </section>

      <LeadViewToggle
        pipelineFilters={{
          status: data.filters.status,
          priority: data.filters.priority,
          eventType: data.filters.eventType,
          source: data.filters.source,
          q: data.filters.q,
          from: data.filters.from ? data.filters.from.toISOString().slice(0, 10) : null,
          to: data.filters.to ? data.filters.to.toISOString().slice(0, 10) : null,
        }}
      >

      {/* Mobile Card View */}
      <section className="admin-leads-mobile lg:hidden space-y-3">
        {leads.length === 0 ? (
          <div className="rounded-2xl border admin-card-glass p-8 text-center">
            <span className="text-4xl">📭</span>
            <p className="mt-2">Encara no hi ha entrades</p>
            <p className="text-xs mt-1 admin-tone-text-slate">Les consultes del formulari web i altres canals apareixeran aquí automàticament.</p>
          </div>
        ) : (
          leads.map((lead) => {
            const statusConf = getLeadStatusColorDisplay(lead.status);
            const eventType = getEventLabel(lead.eventType);

            return (
              <article
                key={lead.id}
                className="admin-leads-mobile-card rounded-2xl border p-4 transition-colors admin-card-glass"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full border flex items-center justify-center font-semibold shrink-0">
                      {lead.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={buildLeadWorkspaceHref(lead.id)} className="font-medium truncate block">
                        {lead.name}
                      </Link>
                      <p className="text-xs truncate">{lead.email}</p>
                      <p className="text-[11px]">{getSourceDisplay(lead.source).label}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusConf.badgeClass}`}>
                    {statusConf.label}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span>{eventType}</span>
                  <span>
                    {lead.eventDate
                      ? formatDateShort(lead.eventDate)
                      : 'Sense data'}
                  </span>
                </div>
                <div className="mt-2">
                  {(() => {
                    const pending = getPendingTimeBadge(new Date(lead.createdAt), lead.status);
                    return (
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${pending.className}`}>
                        Temps pendent: {pending.label}
                      </span>
                    );
                  })()}
                </div>
                {lead.status === 'LOST' && (
                  <div className="mt-2">
                    <LeadLostReasonBadge lostReason={lead.lostReason} />
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={buildLeadWorkspaceHref(lead.id)}
                      className="rounded-xl border px-2 py-1 text-[11px] font-medium"
                    >
                      Obrir fitxa
                    </Link>
                    {lead.customerId && (
                      <Link
                        href={`/admin/clientes/${lead.customerId}`}
                        className="rounded-xl border px-2 py-1 text-[11px] font-medium"
                      >
                        Client
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <LeadQuickPriority leadId={lead.id} currentPriority={lead.priority} />
                    <LeadQuickStatus
                      leadId={lead.id}
                      currentStatus={lead.status}
                    />
                  </div>
                </div>
                {lead.booking && (
                  <Link
                    href={`/admin/bookings/${lead.booking.id}`}
                    className="mt-2 block text-xs font-medium hover:underline"
                  >
                    ✓ Reserva: {lead.booking.reference}
                  </Link>
                )}
              </article>
            );
          })
        )}
      </section>

      {/* Desktop Table View */}
      <section className="admin-leads-table hidden lg:block rounded-2xl border p-0 overflow-hidden admin-card-glass">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-sm" aria-label="Pipeline d'entrades">
            <thead className="border-b">
              <tr>
                <th scope="col" className="px-3 xl:px-4 py-3 text-center font-medium whitespace-nowrap overflow-hidden text-ellipsis">Client</th>
                <th scope="col" className="px-3 xl:px-4 py-3 text-center font-medium whitespace-nowrap overflow-hidden text-ellipsis">Contacte</th>
                <th scope="col" className="px-3 xl:px-4 py-3 text-center font-medium whitespace-nowrap overflow-hidden text-ellipsis">Tipus</th>
                <th scope="col" className="px-3 xl:px-4 py-3 text-center font-medium whitespace-nowrap overflow-hidden text-ellipsis">Origen</th>
                <th scope="col" className="px-3 xl:px-4 py-3 text-center font-medium whitespace-nowrap overflow-hidden text-ellipsis">Data</th>
                <th scope="col" className="px-3 xl:px-4 py-3 text-center font-medium whitespace-nowrap overflow-hidden text-ellipsis">Temps pendent</th>
                <th scope="col" className="px-3 xl:px-4 py-3 text-center font-medium whitespace-nowrap overflow-hidden text-ellipsis">Estat</th>
                <th scope="col" className="px-3 xl:px-4 py-3 text-center font-medium whitespace-nowrap overflow-hidden text-ellipsis">Prioritat</th>
                <th scope="col" className="px-3 xl:px-4 py-3 text-center font-medium whitespace-nowrap overflow-hidden text-ellipsis">Accions</th>
              </tr>
            </thead>
            <tbody className="divide-y admin-tone-border-subtle">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">📭</span>
                      <p>Encara no hi ha entrades</p>
                      <p className="text-xs admin-tone-text-slate">Les consultes del formulari web i altres canals apareixeran aquí automàticament.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const statusConf = getLeadStatusColorDisplay(lead.status);
                  const eventType = getEventLabel(lead.eventType);
                  const priorityConf = getLeadPriorityColorDisplay(lead.priority);

                  return (
                    <tr key={lead.id} className="transition-colors hover:bg-white/[0.03]">
                      <td className="px-3 xl:px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link href={buildLeadWorkspaceHref(lead.id)} className="font-medium whitespace-nowrap overflow-hidden text-ellipsis inline-block max-w-[180px]">
                            {lead.name}
                          </Link>
                          {lead.customerId && (
                            <Link href={`/admin/clientes/${lead.customerId}`} className="" title="Fitxa client">
                              👤
                            </Link>
                          )}
                        </div>
                        {lead.booking && (
                          <Link href={`/admin/bookings/${lead.booking.id}`} className="text-xs hover:underline block text-center">
                            ✓ {lead.booking.reference}
                          </Link>
                        )}
                      </td>
                      <td className="px-3 xl:px-4 py-3 text-center">
                        <a href={`mailto:${lead.email}`} className="hover:underline text-xs truncate block max-w-[220px] whitespace-nowrap mx-auto">
                          {lead.email}
                        </a>
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`} className="text-xs whitespace-nowrap overflow-hidden text-ellipsis inline-block max-w-[220px]">📱 {lead.phone}</a>
                        )}
                      </td>
                      <td className="px-3 xl:px-4 py-3 text-xs whitespace-nowrap overflow-hidden text-ellipsis text-center">{eventType}</td>
                      <td className="px-3 xl:px-4 py-3 text-xs whitespace-nowrap overflow-hidden text-ellipsis text-center">{getSourceDisplay(lead.source).label}</td>
                      <td className="px-3 xl:px-4 py-3 text-xs whitespace-nowrap overflow-hidden text-ellipsis text-center">
                        {lead.eventDate
                          ? formatDate(lead.eventDate)
                          : '—'}
                      </td>
                      <td className="px-3 xl:px-4 py-3 text-center">
                        {(() => {
                          const pending = getPendingTimeBadge(new Date(lead.createdAt), lead.status);
                          return (
                            <span className={`inline-flex whitespace-nowrap overflow-hidden text-ellipsis rounded-full px-2 py-0.5 text-xs font-medium max-w-[140px] ${pending.className}`}>
                              {pending.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-3 xl:px-4 py-3 text-center">
                        <span className={`inline-flex whitespace-nowrap overflow-hidden text-ellipsis rounded-full px-2 py-0.5 text-xs font-medium max-w-[140px] ${statusConf.badgeClass}`}>
                          {statusConf.label}
                        </span>
                        {lead.status === 'LOST' && (
                          <div className="mt-1">
                            <LeadLostReasonBadge lostReason={lead.lostReason} />
                          </div>
                        )}
                      </td>
                      <td className="px-3 xl:px-4 py-3 text-center">
                        <span className={`inline-flex whitespace-nowrap overflow-hidden text-ellipsis rounded-full px-2 py-0.5 text-xs font-medium max-w-[140px] ${priorityConf.badgeClass}`}>
                          {priorityConf.label}
                        </span>
                      </td>
                      <td className="px-3 xl:px-4 py-3 text-center whitespace-nowrap overflow-hidden text-ellipsis">
                        <LeadActions
                          leadId={lead.id}
                          leadName={lead.name}
                          phone={lead.phone}
                          hasBooking={!!lead.booking}
                          currentStatus={lead.status}
                          currentPriority={lead.priority}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {data.pagination.totalPages > 1 && (
        <section className="admin-leads-pagination ap-card flex items-center justify-between rounded-2xl p-3 text-xs">
          <span>
            Pàgina {data.pagination.page} de {data.pagination.totalPages}
          </span>
          <div className="flex items-center gap-2">
            {data.pagination.page > 1 ? (
              <Link
                href={`/admin/leads?${(() => {
                  const params = new URLSearchParams(currentQuery);
                  params.set('page', String(data.pagination.page - 1));
                  return params.toString();
                })()}`}
                className="ap-btn ap-btn--secondary px-3 py-1 text-xs"
              >
                ← Anterior
              </Link>
            ) : (
              <span className="ap-btn ap-btn--secondary px-3 py-1 text-xs opacity-50">← Anterior</span>
            )}
            {data.pagination.page < data.pagination.totalPages ? (
              <Link
                href={`/admin/leads?${(() => {
                  const params = new URLSearchParams(currentQuery);
                  params.set('page', String(data.pagination.page + 1));
                  return params.toString();
                })()}`}
                className="rounded-xl border px-3 py-1"
              >
                Següent →
              </Link>
            ) : (
              <span className="ap-btn ap-btn--secondary px-3 py-1 text-xs opacity-50">Següent →</span>
            )}
          </div>
        </section>
      )}

      </LeadViewToggle>
    </div>
    </AdminPage>
  );
}




