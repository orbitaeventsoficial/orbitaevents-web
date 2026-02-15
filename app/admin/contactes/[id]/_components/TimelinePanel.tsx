'use client';

import type { TimelineEventDTO } from '@/lib/customer-hub/dto';
import Link from 'next/link';

export default function TimelinePanel({ timeline }: { timeline: TimelineEventDTO[] }) {
  return (
    <aside className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 lg:sticky lg:top-[220px]">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Timeline</h2>
      <p className="mt-1 text-xs text-slate-400">Activitat unificada del client</p>

      <div className="mt-3 max-h-[68vh] space-y-2 overflow-y-auto pr-1">
        {timeline.length === 0 ? (
          <p className="rounded-lg border border-slate-700/60 bg-slate-800/50 p-3 text-xs text-slate-400">
            Encara no hi ha activitat.
          </p>
        ) : (
          timeline.map((event) => (
            <article key={event.id} className="rounded-lg border border-slate-700/60 bg-slate-800/50 p-3">
              <p className="text-xs font-semibold text-slate-200">{event.title}</p>
              <p className="mt-1 text-[11px] text-slate-400">
                {new Date(event.at).toLocaleDateString('ca-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {event.link && (
                <Link href={event.link.href} className="mt-1 inline-block text-xs text-cyan-300 hover:text-cyan-200">
                  {event.link.label}
                </Link>
              )}
            </article>
          ))
        )}
      </div>
    </aside>
  );
}

