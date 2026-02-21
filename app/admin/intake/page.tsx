'use client';

/**
 * QUICK INTAKE - Creació ràpida d'entrades des de qualsevol canal
 * Telèfon, WhatsApp, Instagram, Wallapop, boca-orella, email, web...
 * Amb detecció de duplicats en temps real
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const SOURCE_OPTIONS = [
  { value: 'PHONE', label: 'Telèfon', icon: '📞' },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: '💬' },
  { value: 'INSTAGRAM', label: 'Instagram', icon: '📸' },
  { value: 'WALLAPOP', label: 'Wallapop', icon: '🟢' },
  { value: 'REFERRAL', label: 'Boca-orella', icon: '🗣️' },
  { value: 'GOOGLE', label: 'Google', icon: '🔍' },
  { value: 'WEBSITE', label: 'Web', icon: '🌐' },
  { value: 'OTHER', label: 'Altre', icon: '📋' },
];

const EVENT_TYPES = [
  { value: 'WEDDING', label: 'Casament', icon: '💍' },
  { value: 'BIRTHDAY', label: 'Aniversari', icon: '🎂' },
  { value: 'CORPORATE', label: 'Corporatiu', icon: '🎯' },
  { value: 'COMMUNION', label: 'Comunió', icon: '⛪' },
  { value: 'BAPTISM', label: 'Bateig', icon: '👶' },
  { value: 'GRADUATION', label: 'Graduació', icon: '🎓' },
  { value: 'ANNIVERSARY', label: 'Celebració', icon: '🎉' },
  { value: 'PRIVATE_PARTY', label: 'Festa privada', icon: '🎵' },
  { value: 'OTHER', label: 'Altre', icon: '📋' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Baixa', selected: 'border-slate-400/60 bg-slate-500/20 text-slate-200' },
  { value: 'MEDIUM', label: 'Mitjana', selected: 'border-sky-400/60 bg-sky-500/20 text-sky-100' },
  { value: 'HIGH', label: 'Alta', selected: 'border-orange-400/60 bg-orange-500/20 text-orange-100' },
  { value: 'URGENT', label: 'Urgent', selected: 'border-rose-400/70 bg-rose-500/25 text-rose-100' },
];

type DuplicateWarning = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  matchScore: number;
  matchReasons: Array<{ field: string; type: string }>;
};

type FormData = {
  name: string;
  email: string;
  phone: string;
  source: string;
  eventType: string;
  eventDate: string;
  eventLocation: string;
  guestCount: string;
  budget: string;
  message: string;
  priority: string;
};

const INITIAL_FORM: FormData = {
  name: '',
  email: '',
  phone: '',
  source: 'PHONE',
  eventType: 'OTHER',
  eventDate: '',
  eventLocation: '',
  guestCount: '',
  budget: '',
  message: '',
  priority: 'MEDIUM',
};

const INTAKE_SOURCE_STORAGE_KEY = 'admin.intake.source';

export default function IntakePage() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [duplicates, setDuplicates] = useState<DuplicateWarning[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedSource = window.localStorage.getItem(INTAKE_SOURCE_STORAGE_KEY);
    if (storedSource && SOURCE_OPTIONS.some((opt) => opt.value === storedSource)) {
      setForm((prev) => ({ ...prev, source: storedSource }));
    }
  }, []);

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'source' && typeof window !== 'undefined') {
      window.localStorage.setItem(INTAKE_SOURCE_STORAGE_KEY, value);
    }
    setSuccess(null);
  };

  // Real-time duplicate check
  const debounceName = form.name;
  const debounceEmail = form.email;
  const debouncePhone = form.phone;
  useEffect(() => {
    if (!debounceName && !debounceEmail && !debouncePhone) {
      setDuplicates([]);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingDuplicates(true);
      try {
        const res = await fetch('/api/admin/customers/check-duplicates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: debounceName, email: debounceEmail, phone: debouncePhone }),
        });
        if (res.ok) {
          const data = await res.json();
          setDuplicates(data?.data?.matches || []);
        }
      } catch {
        // Silent
      } finally {
        setCheckingDuplicates(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [debounceName, debounceEmail, debouncePhone]);

  const handleSubmit = useCallback(async () => {
    if (!form.name || !form.email) {
      setError('Nom i email són obligatoris');
      return;
    }

    // Warn about high-score duplicates
    const highDup = duplicates.find((d) => d.matchScore >= 80);
    if (highDup) {
      const proceed = window.confirm(
        `Atenció: S'ha trobat un client molt similar: "${highDup.name}" (${highDup.matchScore}% coincidència).\n\nVols crear l'entrada igualment?`
      );
      if (!proceed) return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        source: form.source || 'OTHER',
        eventType: form.eventType,
        eventDate: form.eventDate || undefined,
        eventLocation: form.eventLocation.trim() || undefined,
        guestCount: form.guestCount ? parseInt(form.guestCount, 10) : undefined,
        budget: form.budget.trim() || undefined,
        message: form.message.trim() || undefined,
        priority: form.priority,
      };

      const res = await fetch('/api/admin/leads-new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Error creant l'entrada");
      }

      const data = await res.json();
      setSuccess({ id: data.lead.id, name: data.lead.name });
      setForm((prev) => ({ ...INITIAL_FORM, source: prev.source }));
      setDuplicates([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconegut');
    } finally {
      setSubmitting(false);
    }
  }, [form, duplicates]);

  return (
    <div className="max-w-4xl space-y-6 pb-24 sm:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
            Entrada ràpida
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Crea una entrada des de qualsevol canal amb detecció de duplicats
          </p>
        </div>
        <Link
          href="/admin/leads"
          className="rounded-xl border border-slate-600/50 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 hover:bg-slate-600/50 transition-colors"
        >
          ← Entrades
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-2">
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/admin/leads"
            className="admin-keep-colors rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2 text-center text-xs sm:text-sm font-medium text-slate-300 hover:bg-slate-700/60 transition-colors"
          >
            Tauler Leads
          </Link>
          <Link
            href="/admin/intake"
            className="admin-keep-colors rounded-xl border border-cyan-500/50 bg-cyan-500/15 px-3 py-2 text-center text-xs sm:text-sm font-semibold text-cyan-200"
            aria-current="page"
          >
            Entrada ràpida
          </Link>
        </div>
      </section>

      {/* Success */}
      {success && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <p className="text-emerald-200 font-medium">
            Entrada creada correctament per a {success.name}
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              href={`/admin/leads/${success.id}`}
              className="rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/30 transition-colors"
            >
              Obrir entrada →
            </Link>
            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600/50 transition-colors"
            >
              Crear una altra
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
          <p className="text-rose-300 text-sm">{error}</p>
        </div>
      )}

      {/* Duplicate warnings */}
      {duplicates.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-sm font-semibold text-amber-200 flex items-center gap-2">
            {checkingDuplicates && <span className="animate-spin">⟳</span>}
            Possibles duplicats detectats ({duplicates.length})
          </p>
          <div className="mt-3 space-y-2">
            {duplicates.map((dup) => (
              <Link
                key={dup.id}
                href={`/admin/contactes/${dup.id}`}
                className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 hover:bg-amber-500/15 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-amber-100">{dup.name}</p>
                  <p className="text-xs text-amber-300/70">
                    {dup.email}{dup.phone ? ` · ${dup.phone}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    dup.matchScore >= 80 ? 'bg-rose-500/20 text-rose-300' :
                    dup.matchScore >= 50 ? 'bg-amber-500/20 text-amber-300' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {dup.matchScore}%
                  </span>
                  <div className="flex gap-1">
                    {dup.matchReasons.map((r, i) => (
                      <span key={i} className="text-[10px] bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded">
                        {r.field}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Source selector */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5">
        <label className="text-sm font-semibold text-slate-200">Canal d&apos;entrada</label>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SOURCE_OPTIONS.map((src) => (
            <button
              key={src.value}
              type="button"
              onClick={() => updateField('source', src.value)}
              aria-pressed={form.source === src.value}
              className={`admin-keep-colors rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                form.source === src.value
                  ? 'border-amber-400/70 bg-amber-500/25 text-amber-100 shadow-sm'
                  : 'border-slate-700/50 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <span className="text-lg leading-none">{src.icon}</span>
                <span className="leading-none">{src.label}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main form */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">Dades del client</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs text-slate-400">Nom *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Nom i cognom"
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="client@exemple.com"
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Telèfon</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="+34 600 000 000"
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Prioritat</label>
            <div className="mt-1 grid grid-cols-4 gap-2">
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => updateField('priority', p.value)}
                  className={`admin-keep-colors rounded-lg border px-2 py-2 text-sm font-medium transition-all ${
                    form.priority === p.value
                      ? `${p.selected} shadow-sm`
                      : 'border-slate-700/50 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Event details */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">Detalls de l&apos;esdeveniment</h2>

        <div>
          <label className="text-xs text-slate-400">Tipus d&apos;esdeveniment</label>
          <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
            {EVENT_TYPES.map((et) => (
              <button
                key={et.value}
                type="button"
                onClick={() => updateField('eventType', et.value)}
                aria-pressed={form.eventType === et.value}
                className={`admin-keep-colors rounded-xl border px-2 py-2 text-xs font-medium transition-all ${
                  form.eventType === et.value
                    ? 'border-amber-400/70 bg-amber-500/25 text-amber-100 shadow-sm'
                    : 'border-slate-700/50 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span className="text-base leading-none">{et.icon}</span>
                <span className="block mt-1 leading-tight">{et.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs text-slate-400">Data</label>
            <input
              type="date"
              value={form.eventDate}
              onChange={(e) => updateField('eventDate', e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Ubicació</label>
            <input
              type="text"
              value={form.eventLocation}
              onChange={(e) => updateField('eventLocation', e.target.value)}
              placeholder="Lloc de celebració"
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400">Convidats</label>
              <input
                type="number"
                value={form.guestCount}
                onChange={(e) => updateField('guestCount', e.target.value)}
                placeholder="100"
                className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Pressupost</label>
              <input
                type="text"
                value={form.budget}
                onChange={(e) => updateField('budget', e.target.value)}
                placeholder="2.000€"
                className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400">Missatge / Notes</label>
          <textarea
            value={form.message}
            onChange={(e) => updateField('message', e.target.value)}
            rows={3}
            placeholder="Detalls addicionals, què necessita el client, context de la conversa..."
            className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !form.name || !form.email}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Creant entrada...' : 'Crear entrada'}
        </button>
        <button
          type="button"
          onClick={() => {
            setForm((prev) => ({ ...INITIAL_FORM, source: prev.source }));
            setDuplicates([]);
            setError(null);
            setSuccess(null);
          }}
          className="rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-3 text-sm text-slate-300 hover:bg-slate-600/50 transition-colors"
        >
          Netejar
        </button>
      </div>
    </div>
  );
}
