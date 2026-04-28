'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import { useToast } from '@/app/admin/components/ToastProvider';
import { EVENT_TYPE_VALUES, getEventLabel } from '@/lib/constants';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';

type Pack = { id: string; code: string; price: number };

type Outcome = 'lead' | 'lead+proposal' | 'lead+proposal+booking';

type FormState = {
  name: string;
  email: string;
  phone: string;
  dni: string;
  eventType: string;
  eventDate: string;
  eventLocation: string;
  eventVenue: string;
  guestCount: string;
  packId: string;
  budget: string;
  message: string;
};

const INITIAL: FormState = {
  name: '',
  email: '',
  phone: '',
  dni: '',
  eventType: 'WEDDING',
  eventDate: '',
  eventLocation: '',
  eventVenue: '',
  guestCount: '',
  packId: '',
  budget: '',
  message: '',
};

export default function QuickCreateForm({ packs }: { packs: Pack[] }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState<Outcome | null>(null);

  const update = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async (outcome: Outcome) => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Nom i email són obligatoris');
      return;
    }

    if (outcome === 'lead+proposal+booking') {
      if (!form.eventDate) return toast.error('Data necessària per crear reserva');
      if (!form.eventLocation.trim()) return toast.error('Lloc necessari per crear reserva');
      if (!form.guestCount || Number(form.guestCount) < 1)
        return toast.error('Invitats necessaris per crear reserva');
      if (!form.packId) return toast.error('Pack necessari per crear reserva');
      if (!form.phone.trim()) return toast.error('Telèfon necessari per crear reserva');
    }

    const selectedPack = packs.find((p) => p.id === form.packId) || null;

    setSubmitting(outcome);
    try {
      const res = await fetchWithCsrf('/api/admin/quick-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcome,
          client: {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || undefined,
            dni: form.dni.trim() || undefined,
          },
          event: {
            eventType: form.eventType,
            eventDate: form.eventDate || undefined,
            eventLocation: form.eventLocation.trim() || undefined,
            eventVenue: form.eventVenue.trim() || undefined,
            guestCount: form.guestCount ? Number(form.guestCount) : undefined,
            interestedPackId: form.packId || undefined,
            budget: form.budget.trim() || undefined,
            message: form.message.trim() || undefined,
          },
          proposalSubtotal: selectedPack ? selectedPack.price : undefined,
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        leadId?: string;
        proposalId?: string | null;
        bookingId?: string | null;
        stage?: string;
      };
      if (!res.ok || !payload.ok || !payload.leadId) {
        toast.error(payload.error || 'No s’ha pogut crear');
        return;
      }
      if (payload.bookingId) {
        toast.success('Lead, pressupost i reserva creats');
        router.push(`/admin/bookings/${payload.bookingId}`);
      } else if (payload.proposalId) {
        toast.success('Lead i pressupost creats');
        router.push(`/admin/presupuestos/${payload.proposalId}`);
      } else {
        toast.success('Lead creat');
        router.push(buildLeadWorkspaceHref(payload.leadId));
      }
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        void submit('lead');
      }}
    >
      <fieldset className="rounded-xl border border-white/10 bg-black/20 p-5 space-y-3">
        <legend className="px-2 text-sm font-semibold">Client</legend>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-xs text-white/60">Nom *</span>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm focus:border-amber-400/60 focus:outline-none"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs text-white/60">Email *</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm focus:border-amber-400/60 focus:outline-none"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs text-white/60">Telèfon</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm focus:border-amber-400/60 focus:outline-none"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs text-white/60">DNI/NIE</span>
            <input
              type="text"
              value={form.dni}
              onChange={(e) => update('dni', e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm focus:border-amber-400/60 focus:outline-none"
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-white/10 bg-black/20 p-5 space-y-3">
        <legend className="px-2 text-sm font-semibold">Esdeveniment</legend>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-xs text-white/60">Tipus</span>
            <select
              value={form.eventType}
              onChange={(e) => update('eventType', e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm focus:border-amber-400/60 focus:outline-none"
            >
              {EVENT_TYPE_VALUES.map((value) => (
                <option key={value} value={value}>
                  {getEventLabel(value)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-xs text-white/60">Data</span>
            <input
              type="date"
              value={form.eventDate}
              onChange={(e) => update('eventDate', e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm focus:border-amber-400/60 focus:outline-none"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs text-white/60">Lloc</span>
            <input
              type="text"
              value={form.eventLocation}
              onChange={(e) => update('eventLocation', e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm focus:border-amber-400/60 focus:outline-none"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs text-white/60">Establiment / venue</span>
            <input
              type="text"
              value={form.eventVenue}
              onChange={(e) => update('eventVenue', e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm focus:border-amber-400/60 focus:outline-none"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs text-white/60">Invitats</span>
            <input
              type="number"
              min={0}
              value={form.guestCount}
              onChange={(e) => update('guestCount', e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm focus:border-amber-400/60 focus:outline-none"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs text-white/60">Pressupost (text lliure)</span>
            <input
              type="text"
              placeholder="ex. 800-1200€"
              value={form.budget}
              onChange={(e) => update('budget', e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm focus:border-amber-400/60 focus:outline-none"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-xs text-white/60">Pack</span>
            <select
              value={form.packId}
              onChange={(e) => update('packId', e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm focus:border-amber-400/60 focus:outline-none"
            >
              <option value="">— Sense pack —</option>
              {packs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} · {p.price}€
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-xs text-white/60">Notes / missatge</span>
            <textarea
              rows={3}
              value={form.message}
              onChange={(e) => update('message', e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm focus:border-amber-400/60 focus:outline-none"
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-amber-400/30 bg-amber-500/[0.04] p-5 space-y-3">
        <legend className="px-2 text-sm font-semibold text-amber-200">Què vols crear?</legend>
        <div className="grid sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => void submit('lead')}
            disabled={submitting !== null}
            className="rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm font-medium hover:bg-white/5 disabled:opacity-60"
          >
            <div className="font-semibold">Només lead</div>
            <div className="text-xs text-white/60 mt-1">Captura inicial</div>
          </button>
          <button
            type="button"
            onClick={() => void submit('lead+proposal')}
            disabled={submitting !== null}
            className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm font-medium hover:bg-amber-500/20 disabled:opacity-60"
          >
            <div className="font-semibold">Lead + pressupost</div>
            <div className="text-xs text-white/70 mt-1">DRAFT</div>
          </button>
          <button
            type="button"
            onClick={() => void submit('lead+proposal+booking')}
            disabled={submitting !== null}
            className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm font-medium hover:bg-emerald-500/20 disabled:opacity-60"
          >
            <div className="font-semibold">Tot d&apos;un cop</div>
            <div className="text-xs text-white/70 mt-1">+ Reserva PENDING</div>
          </button>
        </div>
        {submitting && (
          <p className="text-xs text-amber-200/80">Creant {submitting}…</p>
        )}
      </fieldset>
    </form>
  );
}
