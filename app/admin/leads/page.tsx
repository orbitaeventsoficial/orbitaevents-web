import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { cachedQuery, CacheTTL } from '@/lib/query-cache';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import LeadActions from './LeadActions';
import LeadQuickPriority from './LeadQuickPriority';
import LeadQuickStatus from './LeadQuickStatus';
import LeadViewToggle from './LeadViewToggle';
import type { EventType, LeadSource, LeadStatus, Priority, Prisma } from '@prisma/client';
import { LEAD_COLOR_DEFAULT_VARS, PRIORITY_COLOR_OPTIONS, STATUS_COLOR_OPTIONS } from './colorTheme';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Entrades | Òrbita Admin',
};

const STATUS_CONFIG = Object.fromEntries(
  STATUS_COLOR_OPTIONS.map((option) => [
    option.key,
    { label: option.label, badgeClass: option.badgeClass, chipClass: option.chipClass },
  ])
) as Record<string, { label: string; badgeClass: string; chipClass: string }>;

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

const PRIORITY_CONFIG = Object.fromEntries(
  PRIORITY_COLOR_OPTIONS.map((option) => [
    option.key,
    { label: option.label, badgeClass: option.badgeClass, chipClass: option.chipClass },
  ])
) as Record<string, { label: string; badgeClass: string; chipClass: string }>;

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: 'Web',
  CONFIGURATOR: 'Configurador',
  PHONE: 'Telèfon',
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
  WALLAPOP: 'Wallapop',
  REFERRAL: 'Boca-orella',
  GOOGLE: 'Google',
  OTHER: 'Altre',
};

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

const VALID_STATUS = ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING', 'WON', 'LOST'] as const satisfies readonly LeadStatus[];
const VALID_PRIORITY = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const satisfies readonly Priority[];
const VALID_EVENT_TYPE = Object.keys(EVENT_TYPE_LABELS) as EventType[];
const VALID_SOURCE = Object.keys(SOURCE_LABELS) as LeadSource[];

function isLeadStatus(value: string): value is LeadStatus {
  return (VALID_STATUS as readonly string[]).includes(value);
}

function isPriority(value: string): value is Priority {
  return (VALID_PRIORITY as readonly string[]).includes(value);
}

function isEventType(value: string): value is EventType {
  return (VALID_EVENT_TYPE as readonly string[]).includes(value);
}

function isLeadSource(value: string): value is LeadSource {
  return (VALID_SOURCE as readonly string[]).includes(value);
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
    return { label: 'Tancat', className: 'bg-slate-500/20 text-slate-300' };
  }

  const hours = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60));
  if (hours >= 24) {
    return { label: `${hours}h (urgent)`, className: 'bg-rose-500/20 text-rose-300' };
  }
  if (hours >= 8) {
    return { label: `${hours}h (aviat)`, className: 'bg-amber-500/20 text-amber-300' };
  }
  return { label: `${Math.max(0, hours)}h (controlat)`, className: 'bg-emerald-500/20 text-emerald-300' };
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

  return (
    <div
      id="leads-theme-root"
      className="space-y-4 px-1 pb-24 sm:space-y-6 sm:px-0 sm:pb-8"
      style={LEAD_COLOR_DEFAULT_VARS as CSSProperties}
    >
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
      <section className="lg:hidden space-y-3">
        {leads.length === 0 ? (
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-8 text-center">
            <span className="text-4xl">📭</span>
            <p className="mt-2 text-slate-300">Encara no hi ha entrades</p>
            <p className="text-xs text-slate-500">Els contactes apareixeran aquí</p>
          </div>
        ) : (
          leads.map((lead) => {
            const statusConf = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NEW;
            const eventType = EVENT_TYPE_LABELS[lead.eventType] || lead.eventType;

            return (
              <article
                key={lead.id}
                className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-4 hover:bg-slate-700/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-semibold shrink-0">
                      {lead.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/leads/${lead.id}`} className="font-medium text-slate-100 truncate block hover:text-cyan-300">
                        {lead.name}
                      </Link>
                      <p className="text-xs text-slate-400 truncate">{lead.email}</p>
                      <p className="text-[11px] text-fuchsia-300/80">{SOURCE_LABELS[lead.source] || lead.source}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusConf.badgeClass}`}>
                    {statusConf.label}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>{eventType}</span>
                  <span>
                    {lead.eventDate
                      ? new Date(lead.eventDate).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' })
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
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="rounded-lg border border-cyan-500/40 px-2 py-1 text-[11px] font-medium text-cyan-300 hover:bg-cyan-500/10"
                    >
                      Obrir fitxa
                    </Link>
                    {lead.customerId && (
                      <Link
                        href={`/admin/contactes/${lead.customerId}`}
                        className="rounded-lg border border-violet-500/40 px-2 py-1 text-[11px] font-medium text-violet-300 hover:bg-violet-500/10"
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
                    className="mt-2 block text-xs text-emerald-400 font-medium hover:text-emerald-300 hover:underline"
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
      <section className="hidden lg:block rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-sm">
            <thead className="bg-slate-700/30 border-b border-slate-700/50">
              <tr>
                <th className="px-3 xl:px-4 py-3 text-center font-medium text-slate-300 whitespace-nowrap">Client</th>
                <th className="px-3 xl:px-4 py-3 text-center font-medium text-slate-300 whitespace-nowrap">Contacte</th>
                <th className="px-3 xl:px-4 py-3 text-center font-medium text-slate-300 whitespace-nowrap">Tipus</th>
                <th className="px-3 xl:px-4 py-3 text-center font-medium text-slate-300 whitespace-nowrap">Origen</th>
                <th className="px-3 xl:px-4 py-3 text-center font-medium text-slate-300 whitespace-nowrap">Data</th>
                <th className="px-3 xl:px-4 py-3 text-center font-medium text-slate-300 whitespace-nowrap">Temps pendent</th>
                <th className="px-3 xl:px-4 py-3 text-center font-medium text-slate-300 whitespace-nowrap">Estat</th>
                <th className="px-3 xl:px-4 py-3 text-center font-medium text-slate-300 whitespace-nowrap">Prioritat</th>
                <th className="px-3 xl:px-4 py-3 text-center font-medium text-slate-300 whitespace-nowrap">Accions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">📭</span>
                      <p>Encara no hi ha entrades</p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const statusConf = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NEW;
                  const eventType = EVENT_TYPE_LABELS[lead.eventType] || lead.eventType;
                  const priorityConf = PRIORITY_CONFIG[lead.priority] || PRIORITY_CONFIG.MEDIUM;

                  return (
                    <tr key={lead.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-3 xl:px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link href={`/admin/leads/${lead.id}`} className="font-medium text-slate-100 hover:text-cyan-400 whitespace-nowrap">
                            {lead.name}
                          </Link>
                          {lead.customerId && (
                            <Link href={`/admin/contactes/${lead.customerId}`} className="text-cyan-400 hover:text-cyan-300" title="Fitxa client">
                              👤
                            </Link>
                          )}
                        </div>
                        {lead.booking && (
                          <Link href={`/admin/bookings/${lead.booking.id}`} className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline block text-center">
                            ✓ {lead.booking.reference}
                          </Link>
                        )}
                      </td>
                      <td className="px-3 xl:px-4 py-3 text-center">
                        <a href={`mailto:${lead.email}`} className="text-cyan-400 hover:underline text-xs truncate block max-w-[220px] whitespace-nowrap mx-auto">
                          {lead.email}
                        </a>
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`} className="text-slate-400 text-xs whitespace-nowrap inline-block">📱 {lead.phone}</a>
                        )}
                      </td>
                      <td className="px-3 xl:px-4 py-3 text-slate-300 text-xs whitespace-nowrap text-center">{eventType}</td>
                      <td className="px-3 xl:px-4 py-3 text-xs text-fuchsia-200 whitespace-nowrap text-center">{SOURCE_LABELS[lead.source] || lead.source}</td>
                      <td className="px-3 xl:px-4 py-3 text-slate-300 text-xs whitespace-nowrap text-center">
                        {lead.eventDate
                          ? new Date(lead.eventDate).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="px-3 xl:px-4 py-3 text-center">
                        {(() => {
                          const pending = getPendingTimeBadge(new Date(lead.createdAt), lead.status);
                          return (
                            <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${pending.className}`}>
                              {pending.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-3 xl:px-4 py-3 text-center">
                        <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${statusConf.badgeClass}`}>
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="px-3 xl:px-4 py-3 text-center">
                        <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${priorityConf.badgeClass}`}>
                          {priorityConf.label}
                        </span>
                      </td>
                      <td className="px-3 xl:px-4 py-3 text-center whitespace-nowrap">
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
        <section className="flex items-center justify-between rounded-2xl border border-slate-700/50 bg-slate-800/60 p-3 text-xs text-slate-300">
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
                className="rounded-lg border border-slate-600/50 px-3 py-1 hover:bg-slate-700/50"
              >
                ← Anterior
              </Link>
            ) : (
              <span className="rounded-lg border border-slate-700/50 px-3 py-1 text-slate-500">← Anterior</span>
            )}
            {data.pagination.page < data.pagination.totalPages ? (
              <Link
                href={`/admin/leads?${(() => {
                  const params = new URLSearchParams(currentQuery);
                  params.set('page', String(data.pagination.page + 1));
                  return params.toString();
                })()}`}
                className="rounded-lg border border-slate-600/50 px-3 py-1 hover:bg-slate-700/50"
              >
                Següent →
              </Link>
            ) : (
              <span className="rounded-lg border border-slate-700/50 px-3 py-1 text-slate-500">Següent →</span>
            )}
          </div>
        </section>
      )}

      </LeadViewToggle>
    </div>
  );
}
