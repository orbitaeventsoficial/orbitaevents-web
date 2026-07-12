'use client';

import Link from 'next/link';
import { useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';

type PortfolioEventSummary = {
  id: string;
  title: string;
  adminHref: string;
};

type Props = {
  bookingId: string;
  existingEvent?: PortfolioEventSummary | null;
};

export function EnsurePortfolioEventButton({ bookingId, existingEvent = null }: Props) {
  const [state, setState] = useState<'idle' | 'saving' | 'done'>('idle');
  const [eventHref, setEventHref] = useState(existingEvent?.adminHref ?? null);
  const [eventTitle, setEventTitle] = useState(existingEvent?.title ?? null);
  const [error, setError] = useState<string | null>(null);

  const isReady = Boolean(eventHref) || state === 'done';

  const handleClick = async () => {
    if (isReady || state === 'saving') return;
    setState('saving');
    setError(null);

    try {
      const response = await fetchWithCsrf('/api/admin/post-event/portfolio-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || payload?.error || 'No s ha pogut crear portfolio');
      }

      const adminHref = typeof payload?.event?.adminHref === 'string'
        ? payload.event.adminHref
        : '/admin/portfolio#events';
      const title = typeof payload?.event?.title === 'string' ? payload.event.title : null;
      setEventHref(adminHref);
      setEventTitle(title);
      setState('done');
    } catch (err) {
      log.error('Error ensuring post-event portfolio event', err);
      setError(err instanceof Error ? err.message : 'Error creant portfolio');
      setState('idle');
    }
  };

  if (eventHref) {
    return (
      <span className="inline-flex flex-col items-end gap-1">
        <Link href={eventHref} className="ap-btn ap-btn--secondary px-3 py-1.5 text-xs">
          Obrir portfolio
        </Link>
        {eventTitle && <span className="max-w-44 truncate text-right text-[length:var(--o-text-2xs)] text-[var(--t3)]">{eventTitle}</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === 'saving'}
        className="ap-btn ap-btn--secondary px-3 py-1.5 text-xs disabled:opacity-60"
      >
        {state === 'saving' ? 'Creant...' : 'Crear portfolio'}
      </button>
      {error && <span className="max-w-56 text-right text-[length:var(--o-text-2xs)] admin-tone-text-danger">{error}</span>}
    </span>
  );
}
