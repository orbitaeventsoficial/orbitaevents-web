'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import { useToast } from '@/app/admin/components/ToastProvider';
import { buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';

type OwnerRefs = {
  customerId: string | null;
  customer: { id: string; name: string; email: string } | null;
  leadId: string | null;
  lead: { id: string; name: string; email: string } | null;
  bookingId: string | null;
  booking: { id: string; reference: string; status: string } | null;
};

type SearchEntity = 'customer' | 'lead' | 'booking';

type SearchResult = {
  id: string;
  primary: string;
  secondary?: string;
};

async function searchEntities(entity: SearchEntity, query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const url =
    entity === 'customer'
      ? `/api/admin/customers?q=${encodeURIComponent(trimmed)}&limit=8`
      : entity === 'lead'
      ? `/api/admin/leads?search=${encodeURIComponent(trimmed)}&limit=8`
      : `/api/admin/bookings?search=${encodeURIComponent(trimmed)}&limit=8`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  const payload = (await res.json().catch(() => null)) as
    | { customers?: Array<{ id: string; name: string; email: string }>; leads?: Array<{ id: string; name: string; email: string }>; bookings?: Array<{ id: string; reference: string; status: string }> }
    | null;
  if (!payload) return [];
  if (entity === 'customer' && payload.customers) {
    return payload.customers.map((c) => ({ id: c.id, primary: c.name, secondary: c.email }));
  }
  if (entity === 'lead' && payload.leads) {
    return payload.leads.map((l) => ({ id: l.id, primary: l.name, secondary: l.email }));
  }
  if (entity === 'booking' && payload.bookings) {
    return payload.bookings.map((b) => ({ id: b.id, primary: b.reference, secondary: b.status }));
  }
  return [];
}

const ENTITY_LABELS: Record<SearchEntity, { title: string; placeholder: string; emptyHint: string }> = {
  customer: {
    title: 'Re-assignar a un client',
    placeholder: 'Cerca per nom o email…',
    emptyHint: 'Escriu almenys 2 caràcters per cercar clients',
  },
  lead: {
    title: 'Re-assignar a un lead',
    placeholder: 'Cerca per nom o email…',
    emptyHint: 'Escriu almenys 2 caràcters per cercar leads',
  },
  booking: {
    title: 'Re-assignar a una reserva',
    placeholder: 'Cerca per referència…',
    emptyHint: 'Escriu almenys 2 caràcters per cercar reserves',
  },
};

export default function ProposalOwnerPanel({
  proposalId,
  initial,
}: {
  proposalId: string;
  initial: OwnerRefs;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState<SearchEntity | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const config = open ? ENTITY_LABELS[open] : null;

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      const items = await searchEntities(open, query);
      if (!cancelled) {
        setResults(items);
        setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, query]);

  const submitChange = async (changes: Partial<Record<'customerId' | 'leadId' | 'bookingId', string | null>>) => {
    setSubmitting(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/proposals/${proposalId}/owner`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
      const payload = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !payload.ok) {
        toast.error(payload.error || 'No s’ha pogut actualitzar');
        return;
      }
      toast.success('Pressupost reassignat');
      setOpen(null);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const ownerRows = useMemo(
    () => [
      {
        kind: 'customer' as const,
        label: 'Client',
        currentId: initial.customerId,
        currentLabel: initial.customer?.name || null,
        currentSecondary: initial.customer?.email || null,
        href: initial.customer ? buildCustomerHubHref(initial.customer.id) : null,
      },
      {
        kind: 'lead' as const,
        label: 'Lead',
        currentId: initial.leadId,
        currentLabel: initial.lead?.name || null,
        currentSecondary: initial.lead?.email || null,
        href: initial.lead ? buildLeadWorkspaceHref(initial.lead.id) : null,
      },
      {
        kind: 'booking' as const,
        label: 'Reserva',
        currentId: initial.bookingId,
        currentLabel: initial.booking?.reference || null,
        currentSecondary: initial.booking?.status || null,
        href: initial.booking ? buildBookingHref(initial.booking.id) : null,
      },
    ],
    [initial],
  );

  return (
    <section
      className="rounded-xl border border-white/10 bg-black/20 p-6"
      aria-label="Re-assignar pressupost"
    >
      <h3 className="text-sm font-semibold mb-1">Vincles del pressupost</h3>
      <p className="text-xs text-white/60 mb-4">
        Un pressupost pot estar lligat a un client, un lead i/o una reserva. Pots canviar qualsevol vincle aquí sense haver d’esborrar i recrear.
      </p>
      <ul className="space-y-3">
        {ownerRows.map((row) => (
          <li
            key={row.kind}
            className="rounded-lg border border-white/10 bg-black/20 p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="text-sm">
              <div className="text-[11px] uppercase tracking-wide text-white/50">{row.label}</div>
              {row.currentId ? (
                <>
                  <div className="font-semibold">{row.currentLabel || row.currentId}</div>
                  {row.currentSecondary && (
                    <div className="text-xs text-white/60 break-all">{row.currentSecondary}</div>
                  )}
                </>
              ) : (
                <div className="text-sm text-white/50 italic">Sense {row.label.toLowerCase()} assignat</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {row.href && (
                <Link
                  href={row.href}
                  className="text-xs px-3 py-1.5 rounded-lg border border-white/15 hover:bg-white/10"
                >
                  Veure
                </Link>
              )}
              <button
                type="button"
                onClick={() => setOpen(row.kind)}
                disabled={submitting}
                className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/90 text-zinc-900 font-semibold hover:bg-amber-400 disabled:opacity-60"
              >
                {row.currentId ? 'Canviar' : 'Vincular'}
              </button>
              {row.currentId && (
                <button
                  type="button"
                  onClick={() => void submitChange({ [`${row.kind}Id`]: null })}
                  disabled={submitting}
                  className="text-xs px-3 py-1.5 rounded-lg border border-rose-400/40 text-rose-200 hover:bg-rose-500/10 disabled:opacity-60"
                >
                  Desvincular
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {open && config && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-sm font-semibold">{config.title}</h4>
            <input
              type="search"
              autoFocus
              placeholder={config.placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-3 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm focus:border-amber-400/60 focus:outline-none"
            />
            <div className="mt-3 max-h-64 overflow-y-auto">
              {loading ? (
                <p className="text-xs text-white/50 px-1 py-2">Cercant…</p>
              ) : results.length === 0 ? (
                <p className="text-xs text-white/50 px-1 py-2">{config.emptyHint}</p>
              ) : (
                <ul className="space-y-1">
                  {results.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => void submitChange({ [`${open}Id`]: r.id })}
                        disabled={submitting}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10 disabled:opacity-60"
                      >
                        <div className="font-medium">{r.primary}</div>
                        {r.secondary && <div className="text-xs text-white/60">{r.secondary}</div>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="text-xs px-3 py-1.5 rounded-lg border border-white/15 hover:bg-white/10"
              >
                Cancel·lar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
