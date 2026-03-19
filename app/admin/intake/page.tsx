'use client';

/**
 * QUICK INTAKE - Creació ràpida d'entrades des de qualsevol canal
 * Telèfon, WhatsApp, Instagram, Wallapop, boca-orella, email, web...
 * Amb detecció de duplicats en temps real
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '@/app/admin/components/ToastProvider';
import { AdminPage } from '../components/AdminPage';
import { fetchWithCsrf } from '@/lib/csrf';

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

const SOURCE_SELECTED_STYLES: Record<string, string> = {
  PHONE: 'border-sky-400/70 bg-sky-500/25 text-sky-100',
  WHATSAPP: 'border-emerald-400/70 bg-emerald-500/25 text-emerald-100',
  INSTAGRAM: 'border-pink-400/70 bg-pink-500/25 text-pink-100',
  WALLAPOP: 'border-lime-400/70 bg-lime-500/25 text-lime-100',
  REFERRAL: 'border-orange-400/70 bg-orange-500/25 text-orange-100',
  GOOGLE: 'border-amber-400/70 bg-amber-500/25 text-amber-100',
  WEBSITE: 'border-cyan-400/70 bg-cyan-500/25 text-cyan-100',
  OTHER: 'border-white/20 bg-white/10 text-white/90',
};

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
  { value: 'LOW', label: 'Baixa', selected: 'border-white/15 bg-white/5 text-white/80' },
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
  dni: string;
  address: string;
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
  dni: '',
  address: '',
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
  const toast = useToast();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [duplicates, setDuplicates] = useState<DuplicateWarning[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicateOverride, setDuplicateOverride] = useState(false);
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
        const res = await fetchWithCsrf('/api/admin/customers/check-duplicates', {
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
    if (highDup && !duplicateOverride) {
      toast.warning(`Possible duplicat: "${highDup.name}" (${highDup.matchScore}%). Fes clic de nou per crear igualment.`);
      setDuplicateOverride(true);
      return;
    }
    setDuplicateOverride(false);

    setSubmitting(true);
    setError(null);

    try {
      // Prepend DNI/address to message so data is captured
      const extraParts: string[] = [];
      if (form.dni.trim()) extraParts.push(`DNI/NIF/CIF: ${form.dni.trim()}`);
      if (form.address.trim()) extraParts.push(`Adreça: ${form.address.trim()}`);
      const baseMessage = form.message.trim();
      const fullMessage = [...extraParts, baseMessage].filter(Boolean).join('\n') || undefined;

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
        message: fullMessage,
        priority: form.priority,
      };

      const res = await fetchWithCsrf('/api/admin/leads', {
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
      toast.success(`Entrada creada per a ${data.lead.name}`);
      setForm((prev) => ({ ...INITIAL_FORM, source: prev.source }));
      setDuplicates([]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconegut';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }, [form, duplicates, duplicateOverride, toast]);

  return (
    <AdminPage
      title="Entrada ràpida"
      subtitle="Crea una entrada des de qualsevol canal amb detecció de duplicats"
      back={{ href: '/admin/leads', label: 'Entrades' }}
    >

      <section className="rounded-2xl border p-2">
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/admin/leads"
            className="admin-keep-colors rounded-xl border px-3 py-2 text-center text-xs sm:text-sm font-medium transition-colors"
          >
            Tauler Leads
          </Link>
          <Link
            href="/admin/intake"
            className="admin-keep-colors rounded-xl border px-3 py-2 text-center text-xs sm:text-sm font-semibold"
            aria-current="page"
          >
            Entrada ràpida
          </Link>
        </div>
      </section>

      {/* Success */}
      {success && (
        <div className="rounded-2xl border p-5">
          <p className="font-medium">
            Entrada creada correctament per a {success.name}
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              href={`/admin/leads/${success.id}`}
              className="rounded-xl border px-4 py-2 text-sm font-semibold transition-colors"
            >
              Obrir entrada →
            </Link>
            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="rounded-xl border px-4 py-2 text-sm transition-colors"
            >
              Crear una altra
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border p-4">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Duplicate warnings */}
      {duplicates.length > 0 && (
        <div className="rounded-2xl border p-4">
          <p className="text-sm font-semibold flex items-center gap-2">
            {checkingDuplicates && <span className="animate-spin">⟳</span>}
            Possibles duplicats detectats ({duplicates.length})
          </p>
          <div className="mt-3 space-y-2">
            {duplicates.map((dup) => (
              <Link
                key={dup.id}
                href={`/admin/clientes/${dup.id}`}
                className="flex items-center justify-between rounded-xl border p-3 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{dup.name}</p>
                  <p className="text-xs">
                    {dup.email}{dup.phone ? ` · ${dup.phone}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    dup.matchScore >= 80 ? 'admin-tone-soft-danger' :
                    dup.matchScore >= 50 ? 'bg-amber-500/20 text-amber-300' :
                    'bg-white/5 text-white/40'
                  }`}>
                    {dup.matchScore}%
                  </span>
                  <div className="flex gap-1">
                    {dup.matchReasons.map((r, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded">
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
      <div className="rounded-2xl border p-5">
        <label className="text-sm font-semibold">Canal d&apos;entrada</label>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SOURCE_OPTIONS.map((src) => (
            <button
              key={src.value}
              type="button"
              onClick={() => updateField('source', src.value)}
              aria-pressed={form.source === src.value}
              className={`admin-keep-colors rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                form.source === src.value
                  ? `${SOURCE_SELECTED_STYLES[src.value] || 'border-cyan-400/70 bg-cyan-500/25 text-cyan-100'} shadow-sm`
                  : 'border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/5'
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
      <div className="rounded-2xl border p-5 space-y-4">
        <h2 className="text-sm font-semibold">Dades del client</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="intake-name" className="text-xs">Nom *</label>
            <input
              id="intake-name"
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Nom i cognom"
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
            />
          </div>
          <div>
            <label htmlFor="intake-email" className="text-xs">Email *</label>
            <input
              id="intake-email"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="client@exemple.com"
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
            />
          </div>
          <div>
            <label htmlFor="intake-phone" className="text-xs">Telèfon</label>
            <input
              id="intake-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="+34 600 000 000"
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
            />
          </div>
          <div>
            <label htmlFor="intake-dni" className="text-xs">DNI / NIF / CIF</label>
            <input
              id="intake-dni"
              type="text"
              value={form.dni}
              onChange={(e) => updateField('dni', e.target.value.toUpperCase())}
              placeholder="12345678A / B12345678"
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="intake-address" className="text-xs">Adreça</label>
            <input
              id="intake-address"
              type="text"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Carrer, número, CP, ciutat"
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
            />
          </div>
          <div>
            <label className="text-xs">Prioritat</label>
            <div className="mt-1 grid grid-cols-4 gap-2">
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => updateField('priority', p.value)}
                  className={`admin-keep-colors rounded-xl border px-2 py-2 text-sm font-medium transition-all ${
                    form.priority === p.value
                      ? `${p.selected} shadow-sm`
                      : 'border-white/10 text-white/40 hover:bg-white/5'
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
      <div className="rounded-2xl border p-5 space-y-4">
        <h2 className="text-sm font-semibold">Detalls de l&apos;esdeveniment</h2>

        <div>
          <label className="text-xs">Tipus d&apos;esdeveniment</label>
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
                    : 'border-white/10 bg-white/[0.02] text-white/40 hover:bg-white/5'
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
            <label htmlFor="intake-date" className="text-xs">Data</label>
            <input
              id="intake-date"
              type="date"
              value={form.eventDate}
              onChange={(e) => updateField('eventDate', e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
            />
          </div>
          <div>
            <label htmlFor="intake-location" className="text-xs">Ubicació</label>
            <input
              id="intake-location"
              type="text"
              value={form.eventLocation}
              onChange={(e) => updateField('eventLocation', e.target.value)}
              placeholder="Lloc de celebració"
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="intake-guests" className="text-xs">Convidats</label>
              <input
                id="intake-guests"
                type="number"
                min={1}
                value={form.guestCount}
                onChange={(e) => updateField('guestCount', e.target.value)}
                placeholder="100"
                className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
              />
            </div>
            <div>
              <label htmlFor="intake-budget" className="text-xs">Pressupost</label>
              <input
                id="intake-budget"
                type="text"
                value={form.budget}
                onChange={(e) => updateField('budget', e.target.value)}
                placeholder="2.000€"
                className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="intake-message" className="text-xs">Missatge / Notes</label>
          <textarea
            id="intake-message"
            value={form.message}
            onChange={(e) => updateField('message', e.target.value)}
            rows={3}
            placeholder="Detalls addicionals, què necessita el client, context de la conversa..."
            className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-1 resize-none"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !form.name || !form.email}
          className="rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="rounded-xl border px-4 py-3 text-sm transition-colors"
        >
          Netejar
        </button>
      </div>
    </AdminPage>
  );
}



