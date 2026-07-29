'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchWithCsrf } from '@/lib/csrf';
import { useToast } from '@/app/admin/components/ToastProvider';
import { buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
import type {
  BookingCustomerMatchSummary,
  BookingCustomerPreview,
} from '@/lib/services/bookings/bookingCustomerLinkService';

const MATCH_LABELS: Record<'email' | 'phone' | 'name', string> = {
  email: 'mateix email',
  phone: 'mateix telèfon',
  name: 'mateix nom',
};

const CUSTOMER_LINK_ERROR = 'No s’ha pogut vincular el client';

function formatMatchedBy(matchedBy: BookingCustomerMatchSummary['matchedBy']): string {
  if (matchedBy.length === 0) return '';
  return matchedBy.map((kind) => MATCH_LABELS[kind]).join(' · ');
}

export default function BookingCustomerLinkPanel({
  bookingId,
  preview,
}: {
  bookingId: string;
  preview: BookingCustomerPreview;
}) {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; pendingId: string } | null>(null);

  const submit = async (
    action: 'link' | 'create',
    options: { customerId?: string; pendingId: string },
  ) => {
    setSubmitting(options.pendingId);
    setError(null);
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/customer-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          action === 'link'
            ? { action, customerId: options.customerId }
            : { action },
        ),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        customerId?: string;
        created?: boolean;
        alreadyLinked?: boolean;
      };
      if (!res.ok || !payload.ok) {
        const message = payload.error || CUSTOMER_LINK_ERROR;
        setError({ message, pendingId: options.pendingId });
        toast.error(message);
        return;
      }
      if (payload.alreadyLinked) {
        toast.info('Aquesta reserva ja estava vinculada');
      } else if (payload.created) {
        toast.success('Client nou creat i vinculat a la reserva');
      } else {
        toast.success('Reserva vinculada al client existent');
      }
      router.refresh();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : CUSTOMER_LINK_ERROR;
      setError({ message, pendingId: options.pendingId });
      console.error(CUSTOMER_LINK_ERROR, submitError);
      toast.error(message);
    } finally {
      setSubmitting(null);
    }
  };

  if (preview.kind === 'booking-not-found') return null;
  if (preview.kind === 'already-linked') return null;

  if (preview.kind === 'matches-found') {
    return (
      <section
        className="flex flex-wrap items-center justify-between gap-3.5 rounded-[var(--o-r-xl)] border border-[var(--ax-warning-border)] bg-[var(--ax-warning-bg)] p-3"
        aria-label="Coincidencies de client"
      >
        <div className="min-w-0">
          <h3 className="m-0 text-sm font-extrabold text-[var(--t)]">Aquesta reserva ja sembla un client</h3>
          <p className="mt-0.5 text-xs text-[var(--t3)]">{preview.matches.length === 1 ? '1 coincidència' : `${preview.matches.length} coincidències`} al CRM. Vincula-la per evitar duplicats.</p>
        </div>
        <ul className="m-0 flex w-full list-none flex-col gap-1.5 p-0 sm:w-auto sm:min-w-[40%]">
          {preview.matches.map((match) => {
            const pendingId = `link:${match.customerId}`;
            const isSubmitting = submitting === pendingId;
            return (
              <li
                key={match.customerId}
                className="flex items-center justify-between gap-2.5 rounded-[var(--o-r-lg)] border border-[var(--o-admin-line)] bg-[var(--ax-overlay-lg)] px-2 py-1.5"
              >
                <div>
                  <strong className="block text-xs text-[var(--t)]">{match.customerName}</strong>
                  <span className="block text-xs uppercase tracking-[0.06em] text-[var(--t3)]">{match.confidence === 'strong' ? 'Fort' : 'Parcial'}{match.matchedBy.length > 0 && ` · ${formatMatchedBy(match.matchedBy)}`}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Link href={buildCustomerHubHref(match.customerId)} className="ap-btn ap-btn--xs">
                    Veure fitxa
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      void submit('link', { customerId: match.customerId, pendingId })
                    }
                    disabled={isSubmitting || submitting !== null}
                    aria-invalid={error?.pendingId === pendingId ? true : undefined}
                    className="ap-btn ap-btn--primary ap-btn--xs"
                  >
                    {isSubmitting ? 'Vinculant…' : 'Vincular'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        {error && (
          <p role="alert" className="basis-full rounded-[var(--o-r-lg)] border border-[var(--ax-danger-border)] bg-[var(--ax-danger-bg)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ax-danger-text)]">
            {error.message}
          </p>
        )}
      </section>
    );
  }

  // no-match
  const pendingId = 'create:new';
  const isSubmitting = submitting === pendingId;
  return (
    <section
      className="flex flex-wrap items-center justify-between gap-3.5 rounded-[var(--o-r-xl)] border border-[var(--o-admin-line)] bg-[var(--ax-fill-1)] p-3"
      aria-label="Crear client des de la reserva"
    >
      <div className="min-w-0">
        <h3 className="m-0 text-sm font-extrabold text-[var(--t)]">Client de pas</h3>
        <p className="mt-0.5 text-xs text-[var(--t3)]">No està vinculat al CRM. Crea client només si vols historial i seguiment post-event.</p>
      </div>
      <button
        type="button"
      onClick={() => void submit('create', { pendingId })}
      disabled={isSubmitting || submitting !== null}
      aria-invalid={error?.pendingId === pendingId ? true : undefined}
      className="ap-btn ap-btn--primary ap-btn--xs"
    >
        {isSubmitting ? 'Creant…' : 'Crear client'}
      </button>
      {error && (
        <p role="alert" className="basis-full rounded-[var(--o-r-lg)] border border-[var(--ax-danger-border)] bg-[var(--ax-danger-bg)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ax-danger-text)]">
          {error.message}
        </p>
      )}
    </section>
  );
}
