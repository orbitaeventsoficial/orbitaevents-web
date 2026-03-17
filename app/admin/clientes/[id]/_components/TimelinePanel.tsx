'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import type { TimelineEventDTO, TimelineEventType } from '@/lib/customer-hub/dto';
import { DEFAULT_LOCALE } from '@/lib/constants';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES I CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

type TimelineFilter = 'all' | 'proposals' | 'bookings' | 'tasks' | 'comms';

const FILTER_OPTIONS: Array<{ key: TimelineFilter; label: string; icon: string }> = [
  { key: 'all', label: 'Tot', icon: '📋' },
  { key: 'proposals', label: 'Pressupostos', icon: '📄' },
  { key: 'bookings', label: 'Reserves', icon: '📅' },
  { key: 'tasks', label: 'Tasques', icon: '✅' },
  { key: 'comms', label: 'Comunicacions', icon: '💬' },
];

const EVENT_TYPE_FILTER: Record<TimelineEventType, TimelineFilter> = {
  PROPOSAL_CREATED: 'proposals',
  PROPOSAL_SENT: 'proposals',
  PROPOSAL_ACCEPTED: 'proposals',
  BOOKING_CREATED: 'bookings',
  BOOKING_CONFIRMED: 'bookings',
  TASK_CREATED: 'tasks',
  TASK_DONE: 'tasks',
  MESSAGE_SENT: 'comms',
  EMAIL_RECEIVED: 'comms',
  WHATSAPP_SENT: 'comms',
  PHONE_CALL: 'comms',
  NOTE_ADDED: 'comms',
  ACTIVITY: 'comms',
};

const EVENT_ICONS: Partial<Record<TimelineEventType, string>> = {
  PROPOSAL_CREATED: '📄',
  PROPOSAL_SENT: '📤',
  PROPOSAL_ACCEPTED: '✅',
  BOOKING_CREATED: '📅',
  BOOKING_CONFIRMED: '🎉',
  TASK_CREATED: '📝',
  TASK_DONE: '✓',
  MESSAGE_SENT: '✉️',
  EMAIL_RECEIVED: '📩',
  WHATSAPP_SENT: '💬',
  PHONE_CALL: '📞',
  NOTE_ADDED: '📌',
  ACTIVITY: '•',
};

const EVENT_COLORS: Partial<Record<TimelineEventType, string>> = {
  PROPOSAL_CREATED: 'border-l-cyan-500',
  PROPOSAL_SENT: 'border-l-cyan-400',
  PROPOSAL_ACCEPTED: 'border-l-emerald-500',
  BOOKING_CREATED: 'border-l-indigo-500',
  BOOKING_CONFIRMED: 'border-l-emerald-400',
  TASK_CREATED: 'border-l-amber-500',
  TASK_DONE: 'border-l-emerald-500',
  MESSAGE_SENT: 'border-l-violet-500',
  EMAIL_RECEIVED: 'border-l-violet-400',
  WHATSAPP_SENT: 'border-l-green-500',
  PHONE_CALL: 'border-l-sky-500',
  NOTE_ADDED: 'border-l-white/20',
  ACTIVITY: 'border-l-white/10',
};

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
    return timeline.filter((event) => EVENT_TYPE_FILTER[event.type] === filter);
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
    <aside className="rounded-2xl border p-4 lg:sticky lg:top-[220px]">
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
      <div className="mt-3 flex flex-wrap gap-1">
        {FILTER_OPTIONS.map((opt) => (
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
  const icon = EVENT_ICONS[event.type] || '•';
  const borderColor = EVENT_COLORS[event.type] || 'border-l-white/10';

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
