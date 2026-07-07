'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { buildSocialWorkspaceHref } from '@/lib/admin/socialWorkspaceHref';
import type { PreparedPostEventAction } from '../../lib/post-event-actions';

type Props = {
  bookingId: string;
  customerId: string | null;
  preparedAction: PreparedPostEventAction;
  alreadyRecorded?: boolean;
  recordedHref?: string | null;
};

export function RecordRecurrenceDecisionButton({ bookingId, customerId, preparedAction, alreadyRecorded = false, recordedHref = null }: Props) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'saving' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [createdHref, setCreatedHref] = useState<string | null>(recordedHref);

  if (!customerId || preparedAction.key === 'thank_you') return null;
  const isRecorded = alreadyRecorded || state === 'done';
  const isSocialDraft = preparedAction.key === 'social_post';
  const socialDraftHref = isSocialDraft ? createdHref : null;
  const idleLabel = isSocialDraft ? 'Crear esborrany social' : 'Registrar decisio';
  const savingLabel = isSocialDraft ? 'Creant...' : 'Registrant...';
  const doneLabel = isSocialDraft ? 'Esborrany creat' : 'Registrat';

  const handleClick = async () => {
    if (alreadyRecorded || state !== 'idle') return;
    setState('saving');
    setError(null);

    try {
      const res = await fetchWithCsrf('/api/admin/post-event/recurrence-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          customerId,
          actionKey: preparedAction.key,
          draft: preparedAction.draft,
          href: preparedAction.href,
        }),
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || 'No s ha pogut registrar');
      }

      const socialPostId = payload?.decision?.socialPostId;
      if (isSocialDraft && typeof socialPostId === 'string' && socialPostId.trim()) {
        const socialPostHref = typeof payload?.decision?.socialPostHref === 'string'
          ? payload.decision.socialPostHref
          : buildSocialWorkspaceHref(socialPostId);
        setCreatedHref(socialPostHref);
      }
      setState('done');
      router.refresh();
    } catch (err) {
      log.error('Error recording post-event recurrence decision', err);
      setError(err instanceof Error ? err.message : 'Error registrant decisio');
      setState('idle');
    }
  };

  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={handleClick}
        disabled={alreadyRecorded || state !== 'idle'}
        aria-disabled={isRecorded}
        className={`ap-btn px-2.5 py-1 text-xs disabled:opacity-60 ${
          isRecorded
            ? 'ap-btn--secondary admin-tone-border-success admin-tone-bg-success admin-tone-text-success'
            : 'ap-btn--secondary'
        }`}
      >
        {isRecorded ? doneLabel : state === 'saving' ? savingLabel : idleLabel}
      </button>
      {isRecorded && socialDraftHref && (
        <Link href={socialDraftHref} className="mt-1 text-[length:var(--o-text-2xs)] font-semibold admin-tone-text-cyan hover:opacity-80">
          Obrir esborrany
        </Link>
      )}
      {error && <span className="mt-1 text-[length:var(--o-text-2xs)] admin-tone-text-danger">{error}</span>}
    </span>
  );
}
