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

  const submit = async (
    action: 'link' | 'create',
    options: { customerId?: string; pendingId: string },
  ) => {
    setSubmitting(options.pendingId);
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
        toast.error(payload.error || 'No s’ha pogut vincular el client');
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
    } finally {
      setSubmitting(null);
    }
  };

  if (preview.kind === 'booking-not-found') return null;
  if (preview.kind === 'already-linked') return null;

  if (preview.kind === 'matches-found') {
    return (
      <section
        className="rounded-xl border border-amber-400/40 bg-amber-500/[0.06] p-6"
        aria-label="Coincidencies de client"
      >
        <h3 className="text-sm font-semibold mb-1 text-amber-200">
          Aquesta reserva ja sembla un client
        </h3>
        <p className="text-xs text-amber-100/70 mb-4">
          Hem trobat {preview.matches.length === 1 ? 'una coincidència' : `${preview.matches.length} coincidències`} a la base de clients. Vincula-la per evitar duplicats i recuperar historial.
        </p>
        <ul className="space-y-3">
          {preview.matches.map((match) => {
            const pendingId = `link:${match.customerId}`;
            const isSubmitting = submitting === pendingId;
            return (
              <li
                key={match.customerId}
                className="rounded-lg border border-white/10 bg-black/20 p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-sm">
                  <div className="font-semibold">{match.customerName}</div>
                  <div className="text-xs text-white/60 break-all">{match.customerEmail}</div>
                  {match.customerPhone && (
                    <div className="text-xs text-white/50">Tel: {match.customerPhone}</div>
                  )}
                  <div className="mt-1 text-[11px] uppercase tracking-wide text-amber-200/80">
                    {match.confidence === 'strong' ? 'Coincidència forta' : 'Coincidència parcial'}
                    {match.matchedBy.length > 0 && ` · ${formatMatchedBy(match.matchedBy)}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={buildCustomerHubHref(match.customerId)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-white/15 hover:bg-white/10"
                  >
                    Veure fitxa
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      void submit('link', { customerId: match.customerId, pendingId })
                    }
                    disabled={isSubmitting || submitting !== null}
                    className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/90 text-zinc-900 font-semibold hover:bg-amber-400 disabled:opacity-60"
                  >
                    {isSubmitting ? 'Vinculant…' : 'Vincular'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  // no-match
  const pendingId = 'create:new';
  const isSubmitting = submitting === pendingId;
  return (
    <section
      className="rounded-xl border border-white/10 bg-black/20 p-6"
      aria-label="Crear client des de la reserva"
    >
      <h3 className="text-sm font-semibold mb-1">Reserva amb client de pas</h3>
      <p className="text-xs text-white/60 mb-4">
        Aquesta reserva no està vinculada a cap client del CRM. Cap client coincideix amb les seves dades. Vols crear un client nou amb el snapshot d&apos;aquesta reserva?
      </p>
      <button
        type="button"
        onClick={() => void submit('create', { pendingId })}
        disabled={isSubmitting || submitting !== null}
        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/90 text-zinc-900 font-semibold hover:bg-emerald-400 disabled:opacity-60"
      >
        {isSubmitting ? 'Creant client…' : 'Crear client nou'}
      </button>
    </section>
  );
}
