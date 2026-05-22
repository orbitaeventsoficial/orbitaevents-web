'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import type { CustomerFollowUpSummaryDTO, CustomerInsightsDTO, TimelineEventDTO, TimelineEventType } from '@/lib/customer-hub/dto';
import { formatDateFull, formatDateShort, formatTimeShort, formatWeekdayLong } from '@/lib/constants';
import { ADMIN_ACTIVITY_ACTION_META, CUSTOMER_TIMELINE_EVENT_META, CUSTOMER_TIMELINE_FILTER_OPTIONS } from '@/lib/constants/admin';
import { buildCustomerCommercialPriority } from '@/lib/customer-hub/commercialPriority';
import { buildCustomerCommercialRiskLink } from '@/lib/customer-hub/nextActionLink';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES I CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

type TimelineFilter = 'all' | 'proposals' | 'bookings' | 'tasks' | 'comms';


// ═══════════════════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════════════════

function formatDayHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Avui';
  if (diffDays === 1) return 'Ahir';
  if (diffDays < 7) return formatWeekdayLong(date);

  return date.getFullYear() !== now.getFullYear()
    ? formatDateFull(date)
    : formatDateShort(date);
}

function formatTime(dateStr: string): string {
  return formatTimeShort(dateStr);
}

function sanitizeEventTitle(title: string): string {
  const raw = title.trim();
  const direct = ADMIN_ACTIVITY_ACTION_META[raw as keyof typeof ADMIN_ACTIVITY_ACTION_META];
  if (direct?.label) return direct.label;

  const match = raw.match(/^([A-Z_]+)\s+·\s+([a-z_]+)$/);
  if (match) {
    const [, action, entity] = match;
    const actionMeta = ADMIN_ACTIVITY_ACTION_META[action as keyof typeof ADMIN_ACTIVITY_ACTION_META];
    if (actionMeta?.label) return actionMeta.label;
    if (action === 'LEAD_CONVERTED') return 'Lead convertit a client';
    if (entity === 'automation') return 'Automatització';
    if (entity === 'pricing') return 'Preus';
  }

  if (raw === 'LEAD_CONVERTED') return 'Lead convertit a client';
  return raw;
}

function groupByDay(events: TimelineEventDTO[]): Array<{ date: string; label: string; events: TimelineEventDTO[] }> {
  const groups = new Map<string, TimelineEventDTO[]>();

  for (const event of events) {
    const dateKey = new Date(event.at).toISOString().split('T')[0];
    const existing = groups.get(dateKey) || [];
    existing.push(event);
    groups.set(dateKey, existing);
  }

  return Array.from(groups.entries())
    .map(([date, events]) => ({
      date,
      label: formatDayHeader(events[0].at),
      events,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function TimelinePanel({
  timeline,
  customerId,
  customerName,
  customerPhone,
  insights,
  followUpSummary,
}: {
  timeline: TimelineEventDTO[];
  customerId: string;
  customerName: string;
  customerPhone?: string;
  insights: CustomerInsightsDTO;
  followUpSummary?: CustomerFollowUpSummaryDTO;
}) {
  const [filter, setFilter] = useState<TimelineFilter>('all');
  const [expanded, setExpanded] = useState(false);
  const commercialPriority = useMemo(() => buildCustomerCommercialPriority({
    insights,
    followUpSummary,
  }), [followUpSummary, insights]);
  const commercialRiskLink = useMemo(() => buildCustomerCommercialRiskLink({
    customerId,
    customerName,
    customerPhone,
    commercialRisk: insights.commercialRisk,
    followUpSummary,
  }), [customerId, customerName, customerPhone, followUpSummary, insights.commercialRisk]);

  const filteredTimeline = useMemo(() => {
    if (filter === 'all') return timeline;
    return timeline.filter((event) => CUSTOMER_TIMELINE_EVENT_META[event.type]?.filter === filter);
  }, [timeline, filter]);

  const groupedTimeline = useMemo(() => {
    return groupByDay(filteredTimeline);
  }, [filteredTimeline]);

  const displayedGroups = useMemo(() => {
    if (expanded) return groupedTimeline;
    // Mostrar només els primers 5 dies
    return groupedTimeline.slice(0, 5);
  }, [groupedTimeline, expanded]);

  const hasMore = groupedTimeline.length > 5;

  const toggleExpand = useCallback(() => {
    setExpanded((v) => !v);
  }, []);

  return (
    <aside className="min-w-0 overflow-hidden rounded-2xl border p-4 lg:sticky lg:top-[220px]" data-help-title="Cronologia del client" data-help-desc="Agrupa l'activitat del client per dies i et deixa filtrar per pressupostos, reserves, tasques o comunicacions.">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Cronologia
          </h2>
          <p className="text-[11px]">
            {filteredTimeline.length} esdeveniments
          </p>
        </div>
      </div>

      {/* Filters */}
      {filter === 'all' && commercialPriority && (
        <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/80">
                Estat comercial actual
              </p>
              <p className="mt-1 text-sm font-medium text-amber-100">
                {commercialPriority.title}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-50/80">
                {commercialPriority.detail}
              </p>
              {commercialPriority.footnote && (
                <p className="mt-2 text-[10px] uppercase tracking-wide text-amber-200/60">
                  {commercialPriority.footnote}
                </p>
              )}
            </div>
            {commercialRiskLink && (
              commercialRiskLink.external ? (
                <a
                  href={commercialRiskLink.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-full border border-amber-400/30 px-2.5 py-1 text-[10px] font-medium text-amber-200 transition-colors hover:bg-amber-500/10"
                >
                  {commercialRiskLink.label}
                </a>
              ) : (
                <Link
                  href={commercialRiskLink.href}
                  className="shrink-0 rounded-full border border-amber-400/30 px-2.5 py-1 text-[10px] font-medium text-amber-200 transition-colors hover:bg-amber-500/10"
                >
                  {commercialRiskLink.label}
                </Link>
              )
            )}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1" data-help-title="Filtres de cronologia" data-help-desc="Serveixen per reduir la cronologia al tipus d'activitat que t'interessa revisar ara mateix.">
        {CUSTOMER_TIMELINE_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setFilter(opt.key)}
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
              filter === opt.key
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/80'
            }`}
          >
            {opt.icon} {opt.label}
          </button>
        ))}
      </div>

      {/* Timeline content */}
      <div className={`mt-4 min-w-0 space-y-4 overflow-x-hidden overflow-y-auto pr-1 ${expanded ? 'max-h-[80vh]' : 'max-h-[50vh]'}`}>
        {filteredTimeline.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          displayedGroups.map((group) => (
            <div key={group.date}>
              {/* Day header */}
              <div className="sticky top-0 z-10 py-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider">
                  {group.label}
                </p>
              </div>

              {/* Events */}
              <div className="mt-1 space-y-1.5">
                {group.events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Show more / less */}
      {hasMore && (
        <button
          type="button"
          onClick={toggleExpand}
          className="mt-3 w-full rounded-xl border py-2 text-xs transition-colors"
        >
          {expanded ? 'Mostra menys ↑' : `Mostra més (${groupedTimeline.length - 5} dies més) ↓`}
        </button>
      )}
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBCOMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function EventCard({ event }: { event: TimelineEventDTO }) {
  const meta = CUSTOMER_TIMELINE_EVENT_META[event.type];
  const icon = meta?.icon || '•';
  const borderColor = meta?.borderClass || 'border-l-white/10';
  const preview = typeof event.meta?.preview === 'string' ? event.meta.preview.trim() : '';
  const direction = typeof event.meta?.direction === 'string' ? event.meta.direction : null;
  const channel = typeof event.meta?.channel === 'string' ? event.meta.channel : null;
  const commMeta = direction || channel
    ? [channel, direction].filter(Boolean).join(' · ')
    : null;

  return (
    <article
      className={`min-w-0 overflow-hidden rounded-xl border-l-2 bg-white/[0.03] p-2.5 pl-3 ${borderColor}`}
    >
      <div className="flex items-start gap-2">
        <span className="text-sm">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium break-words">
            {sanitizeEventTitle(event.title)}
          </p>
          <p className="mt-0.5 text-[10px]">
            {formatTime(event.at)}
          </p>
          {commMeta && (
            <p className="mt-0.5 text-[10px] uppercase tracking-wide opacity-50 break-words">
              {commMeta}
            </p>
          )}
          {preview && preview !== event.title && (
            <p className="mt-1 text-[11px] leading-relaxed opacity-75 break-words">
              {preview}
            </p>
          )}
        </div>
      </div>

      {event.link && (
        <Link
          href={event.link.href}
          className="mt-1.5 inline-block max-w-full truncate text-[10px] transition-colors"
        >
          {event.link.label} →
        </Link>
      )}
    </article>
  );
}

function EmptyState({ filter }: { filter: TimelineFilter }) {
  const messages: Record<TimelineFilter, string> = {
    all: 'Encara no hi ha activitat registrada.',
    proposals: 'Sense pressupostos.',
    bookings: 'Sense reserves.',
    tasks: 'Sense tasques.',
    comms: 'Sense comunicacions.',
  };

  return (
    <div className="rounded-xl border p-4 text-center">
      <p className="text-sm">{messages[filter]}</p>
    </div>
  );
}
