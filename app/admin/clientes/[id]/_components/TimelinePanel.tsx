'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import type { TimelineEventDTO, TimelineEventType } from '@/lib/customer-hub/dto';
import { DEFAULT_LOCALE } from '@/lib/constants';
import { CUSTOMER_TIMELINE_EVENT_META, CUSTOMER_TIMELINE_FILTER_OPTIONS } from '@/lib/constants/admin';

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
  if (diffDays < 7) return date.toLocaleDateString(DEFAULT_LOCALE, { weekday: 'long' });

  return date.toLocaleDateString(DEFAULT_LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(DEFAULT_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
  });
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

export default function TimelinePanel({ timeline }: { timeline: TimelineEventDTO[] }) {
  const [filter, setFilter] = useState<TimelineFilter>('all');
  const [expanded, setExpanded] = useState(false);

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
    <aside className="rounded-2xl border p-4 lg:sticky lg:top-[220px]" data-help-title="Cronologia del client" data-help-desc="Agrupa l'activitat del client per dies i et deixa filtrar per pressupostos, reserves, tasques o comunicacions.">
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
      <div className={`mt-4 space-y-4 overflow-y-auto pr-1 ${expanded ? 'max-h-[80vh]' : 'max-h-[50vh]'}`}>
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

  return (
    <article
      className={`rounded-xl border-l-2 bg-white/[0.03] p-2.5 pl-3 ${borderColor}`}
    >
      <div className="flex items-start gap-2">
        <span className="text-sm">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">
            {event.title}
          </p>
          <p className="mt-0.5 text-[10px]">
            {formatTime(event.at)}
          </p>
        </div>
      </div>

      {event.link && (
        <Link
          href={event.link.href}
          className="mt-1.5 inline-block text-[10px] transition-colors"
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

