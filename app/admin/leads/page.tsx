import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { cachedQuery, CacheTTL } from '@/lib/query-cache';
import Link from 'next/link';
import LeadActions from './LeadActions';
import LeadSavedViews from './LeadSavedViews';
import type { EventType, LeadStatus, Priority, Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Entrades | Òrbita Admin',
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  NEW: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Entrada nova' },
  CONTACTED: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Contactat' },
  QUOTE_SENT: { bg: 'bg-purple-500/20', text: 'text-purple-300', label: 'Pressupost enviat' },
  NEGOTIATING: { bg: 'bg-orange-500/20', text: 'text-orange-300', label: 'Negociació' },
  WON: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', label: 'Guanyat!' },
  LOST: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Perdut' },
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

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-500/20 text-slate-300',
  MEDIUM: 'bg-blue-500/20 text-blue-300',
  HIGH: 'bg-orange-500/20 text-orange-300',
  URGENT: 'bg-rose-500/20 text-rose-300',
};

function buildQuery(filters: {
  status: string[];
  priority: string[];
  eventType: string[];
  q: string;
  from: Date | null;
  to: Date | null;
}) {
  const params = new URLSearchParams();
  filters.status.forEach((value) => params.append('status', value));
  filters.priority.forEach((value) => params.append('priority', value));
  filters.eventType.forEach((value) => params.append('eventType', value));
  if (filters.q) params.set('q', filters.q);
  if (filters.from) params.set('from', filters.from.toISOString().slice(0, 10));
  if (filters.to) params.set('to', filters.to.toISOString().slice(0, 10));
  return params.toString();
}

const VALID_STATUS = ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING', 'WON', 'LOST'] as const satisfies readonly LeadStatus[];
const VALID_PRIORITY = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const satisfies readonly Priority[];
const VALID_EVENT_TYPE = Object.keys(EVENT_TYPE_LABELS) as EventType[];

function isLeadStatus(value: string): value is LeadStatus {
  return (VALID_STATUS as readonly string[]).includes(value);
}

function isPriority(value: string): value is Priority {
  return (VALID_PRIORITY as readonly string[]).includes(value);
}

function isEventType(value: string): value is EventType {
  return (VALID_EVENT_TYPE as readonly string[]).includes(value);
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
  q: string;
  from: Date | null;
  to: Date | null;
};

type Pagination = {
  page: number;
  pageSize: number;
  totalPages: number;
};

async function getLeads(filters: {
  status?: string | string[];
  priority?: string | string[];
  eventType?: string | string[];
  q?: string;
  from?: string;
  to?: string;
  page?: string;
}) {
  try {
    const status = toArray(filters.status).filter(isLeadStatus);
    const priority = toArray(filters.priority).filter(isPriority);
    const eventType = toArray(filters.eventType).filter(isEventType);
    const from = parseDate(filters.from);
    const to = parseDate(filters.to);
    const pageRaw = Number.parseInt(filters.page || '1', 10);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const pageSize = 25;

    const where: Prisma.LeadWhereInput = {
      ...(status.length ? { status: { in: status } } : {}),
      ...(priority.length ? { priority: { in: priority } } : {}),
      ...(eventType.length ? { eventType: { in: eventType } } : {}),
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
      `q=${filters.q || ''}`,
      `from=${from ? from.toISOString().slice(0, 10) : ''}`,
      `to=${to ? to.toISOString().slice(0, 10) : ''}`,
      `page=${page}`,
      `size=${pageSize}`,
    ].join('|');

    const [
      leads,
      filteredCount,
      totalCount,
      newCount,
      negotiationCount,
      wonCount,
    ] = await cachedQuery(
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
            status: true,
            priority: true,
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
        prisma.lead.count(),
        prisma.lead.count({ where: { status: 'NEW' } }),
        prisma.lead.count({ where: { status: { in: ['CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] } } }),
        prisma.lead.count({ where: { status: 'WON' } }),
      ]),
      CacheTTL.VERY_SHORT
    );

    const normalizedFilters: LeadFilters = { status, priority, eventType, q: filters.q || '', from, to };
    return {
      leads,
      counts: {
        filtered: filteredCount,
        total: totalCount,
        new: newCount,
        negotiation: negotiationCount,
        won: wonCount,
      },
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
      counts: { filtered: 0, total: 0, new: 0, negotiation: 0, won: 0 },
      filters: { status: [], priority: [], eventType: [], q: '', from: null, to: null } as LeadFilters,
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
    q?: string;
    from?: string;
    to?: string;
    page?: string;
  };
}) {
  const { status, priority, eventType, q, from, to, page } = searchParams || {};
  const data = await getLeads({ status, priority, eventType, q, from, to, page });
  const leads = data.leads;

  // Estadístiques ràpides
  const stats = {
    total: data.counts.total,
    nous: data.counts.new,
    enNegociacio: data.counts.negotiation,
    convertits: data.counts.won,
  };
  const currentQuery = buildQuery(data.filters);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Mobile optimized */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-100">Entrades</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {data.counts.filtered} de {stats.total} contactes
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center rounded-xl border border-slate-600/50 bg-slate-700/50 px-3 py-2 text-xs sm:text-sm font-medium text-slate-200 hover:bg-slate-600/50 transition-colors"
        >
          ← Tornar
        </Link>
      </header>

      {/* Stats Cards - 2x2 mobile */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-3 sm:p-5">
          <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase">Total</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-slate-100">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-sky-600/5 backdrop-blur-sm p-3 sm:p-5">
          <p className="text-[10px] sm:text-xs font-medium text-sky-400 uppercase">Nous</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-slate-100">{stats.nous}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/5 backdrop-blur-sm p-3 sm:p-5">
          <p className="text-[10px] sm:text-xs font-medium text-amber-400 uppercase">Negociació</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-slate-100">{stats.enNegociacio}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 backdrop-blur-sm p-3 sm:p-5">
          <p className="text-[10px] sm:text-xs font-medium text-emerald-400 uppercase">Convertits</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-slate-100">{stats.convertits}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-4">
        <form method="get" className="grid gap-3 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <label className="text-xs text-slate-400">Cerca</label>
            <input
              name="q"
              defaultValue={data.filters.q}
              placeholder="Nom, email o telèfon"
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Tipus event</label>
            <select
              name="eventType"
              defaultValue={data.filters.eventType[0] || ''}
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
              <option value="">Tots</option>
              {VALID_EVENT_TYPE.map((value) => (
                <option key={value} value={value}>{EVENT_TYPE_LABELS[value]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400">Data inici</label>
            <input
              type="date"
              name="from"
              defaultValue={data.filters.from ? data.filters.from.toISOString().slice(0, 10) : ''}
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Data fi</label>
            <input
              type="date"
              name="to"
              defaultValue={data.filters.to ? data.filters.to.toISOString().slice(0, 10) : ''}
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="w-full rounded-xl bg-cyan-500/20 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/30"
            >
              Aplicar
            </button>
            <Link
              href="/admin/leads"
              className="w-full rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
            >
              Netejar
            </Link>
          </div>
          <div className="lg:col-span-3">
            <p className="text-[10px] uppercase text-slate-500">Estat</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {VALID_STATUS.map((value) => (
                <label key={value} className="flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    name="status"
                    value={value}
                    defaultChecked={data.filters.status.includes(value)}
                    className="accent-cyan-500"
                  />
                  {value}
                </label>
              ))}
            </div>
          </div>
          <div className="lg:col-span-3">
            <p className="text-[10px] uppercase text-slate-500">Prioritat</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {VALID_PRIORITY.map((value) => (
                <label key={value} className="flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    name="priority"
                    value={value}
                    defaultChecked={data.filters.priority.includes(value)}
                    className="accent-amber-500"
                  />
                  {value}
                </label>
              ))}
            </div>
          </div>
        </form>
      </section>

      <LeadSavedViews currentQuery={currentQuery} />

      <section className="flex flex-wrap items-center gap-2 text-xs">
        <Link
          href="/admin/leads"
          className={`rounded-full border px-3 py-1 ${
            data.filters.status.length === 0 && data.filters.priority.length === 0 ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200' : 'border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          Tots
        </Link>
        {VALID_STATUS.map((value) => (
          <Link
            key={value}
            href={`/admin/leads?status=${value}`}
            className={`rounded-full border px-3 py-1 ${
              data.filters.status.includes(value as LeadStatus) ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200' : 'border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {value}
          </Link>
        ))}
        {VALID_PRIORITY.map((value) => (
          <Link
            key={value}
            href={`/admin/leads?priority=${value}`}
            className={`rounded-full border px-3 py-1 ${
              data.filters.priority.includes(value as Priority) ? 'border-amber-500/40 bg-amber-500/10 text-amber-200' : 'border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {value}
          </Link>
        ))}
      </section>

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
              <Link
                key={lead.id}
                href={`/admin/leads/${lead.id}`}
                className="block rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-4 hover:bg-slate-700/40 active:bg-slate-700/60 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-semibold shrink-0">
                      {lead.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-100 truncate">{lead.name}</p>
                      <p className="text-xs text-slate-400 truncate">{lead.email}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusConf.bg} ${statusConf.text}`}>
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
                {lead.booking && (
                  <div className="mt-2 text-xs text-emerald-400 font-medium">✓ Reserva: {lead.booking.reference}</div>
                )}
              </Link>
            );
          })
        )}
      </section>

      {/* Desktop Table View */}
      <section className="hidden lg:block rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-700/30 border-b border-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-300">Client</th>
                <th className="px-4 py-3 text-left font-medium text-slate-300">Contacte</th>
                <th className="px-4 py-3 text-left font-medium text-slate-300">Tipus</th>
                <th className="px-4 py-3 text-left font-medium text-slate-300">Data</th>
                <th className="px-4 py-3 text-left font-medium text-slate-300">Estat</th>
                <th className="px-4 py-3 text-left font-medium text-slate-300">Prioritat</th>
                <th className="px-4 py-3 text-right font-medium text-slate-300">Accions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
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
                  const priorityColor = PRIORITY_COLORS[lead.priority] || PRIORITY_COLORS.MEDIUM;

                  return (
                    <tr key={lead.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/leads/${lead.id}`} className="font-medium text-slate-100 hover:text-cyan-400">
                          {lead.name}
                        </Link>
                        {lead.booking && (
                          <div className="text-xs text-emerald-400">✓ {lead.booking.reference}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <a href={`mailto:${lead.email}`} className="text-cyan-400 hover:underline text-xs truncate block max-w-[180px]">
                          {lead.email}
                        </a>
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`} className="text-slate-400 text-xs">📱 {lead.phone}</a>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs">{eventType}</td>
                      <td className="px-4 py-3 text-slate-300 text-xs">
                        {lead.eventDate
                          ? new Date(lead.eventDate).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusConf.bg} ${statusConf.text}`}>
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityColor}`}>
                          {lead.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <LeadActions leadId={lead.id} leadName={lead.name} phone={lead.phone} hasBooking={!!lead.booking} />
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
    </div>
  );
}
