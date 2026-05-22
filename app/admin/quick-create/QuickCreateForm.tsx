'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import { useToast } from '@/app/admin/components/ToastProvider';
import { EVENT_TYPE_VALUES, getEventLabel } from '@/lib/constants';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { buildProposalHref } from '@/lib/admin/proposalWorkspaceHref';
import { suggestPackForLead } from '@/lib/services/packSuggestionService';

type Pack = { id: string; slug: string; code: string; price: number };

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

function getConfidenceLabel(confidence: 'high' | 'medium' | 'low'): string {
  if (confidence === 'high') return 'Alta';
  if (confidence === 'medium') return 'Mitjana';
  return 'Baixa';
}

export default function QuickCreateForm({ packs }: { packs: Pack[] }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState<Outcome | null>(null);

  const update = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const canSuggest = Boolean(form.guestCount || form.budget.trim());
  const suggestion = canSuggest
    ? suggestPackForLead({
        eventType: form.eventType,
        guestCount: form.guestCount ? Number(form.guestCount) : null,
        budget: form.budget.trim() || null,
      })
    : null;
  const bestSuggestion = suggestion?.best ?? null;
  const suggestedPack =
    bestSuggestion ? packs.find((pack) => pack.slug === bestSuggestion.pack.slug) ?? null : null;
  const suggestedAlternatives =
    suggestion?.alternatives
      .map((alternative) => packs.find((pack) => pack.slug === alternative.pack.slug) ?? null)
      .filter((pack): pack is Pack => Boolean(pack))
      .slice(0, 2) ?? [];
  const selectedPack = packs.find((p) => p.id === form.packId) || null;

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
        router.push(buildBookingHref(payload.bookingId));
      } else if (payload.proposalId) {
        toast.success('Lead i pressupost creats');
        router.push(buildProposalHref(payload.proposalId));
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
          {canSuggest && suggestion && (
            <div className="sm:col-span-2 rounded-xl border border-cyan-400/20 bg-cyan-500/[0.06] p-4 text-sm">
              {suggestedPack && !suggestion.unmatched ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-cyan-100 font-semibold">Suggeriment automàtic</span>
                    <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-cyan-100">
                      Confiança {bestSuggestion ? getConfidenceLabel(bestSuggestion.confidence) : ''}
                    </span>
                    {form.packId === suggestedPack.id ? (
                      <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-emerald-100">
                        Aplicat
                      </span>
                    ) : null}
                  </div>
                  <p className="text-white/85">
                    <span className="font-semibold">{suggestedPack.code}</span> · {suggestedPack.price}€
                  </p>
                  {bestSuggestion && bestSuggestion.reasons.length > 0 ? (
                    <p className="text-xs text-cyan-50/80">
                      {bestSuggestion.reasons.slice(0, 2).join(' · ')}
                    </p>
                  ) : null}
                  {bestSuggestion && bestSuggestion.warnings.length > 0 ? (
                    <p className="text-xs text-amber-100/80">
                      {bestSuggestion.warnings.slice(0, 1).join(' · ')}
                    </p>
                  ) : null}
                  {suggestedAlternatives.length > 0 ? (
                    <p className="text-xs text-white/55">
                      Alternatives: {suggestedAlternatives.map((pack) => pack.code).join(' · ')}
                    </p>
                  ) : null}
                  {form.packId !== suggestedPack.id ? (
                    <button
                      type="button"
                      onClick={() => update('packId', suggestedPack.id)}
                      className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-50 hover:bg-cyan-400/20"
                    >
                      Aplicar suggeriment
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-semibold text-cyan-100">Sense suggeriment clar</p>
                  <p className="text-xs text-white/65">
                    Amb les dades actuals no hi ha cap pack amb encaix prou net. Ajusta invitats,
                    pressupost o tria el pack manualment.
                  </p>
                </div>
              )}
            </div>
          )}
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
        {!form.packId && suggestedPack ? (
          <p className="text-xs text-white/55">
            Tens un pack suggerit disponible. Si no l&apos;apliques, el lead es crearà sense pack
            assignat.
          </p>
        ) : null}
      </fieldset>
    </form>
  );
}
