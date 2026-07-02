'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '@/app/admin/components/ToastProvider';
import { useFormAutosave } from '@/lib/hooks/useFormAutosave';
import { fetchWithCsrf } from '@/lib/csrf';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
import { INTAKE_EVENT_TYPE_OPTIONS, INTAKE_PRIORITY_OPTIONS, INTAKE_SOURCE_OPTIONS } from '@/lib/constants';
import { AdminPage, AdminSection } from '@/app/admin/components/AdminPage';

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
  eventTime: string;
  eventEndTime: string;
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
  eventTime: '',
  eventEndTime: '',
  eventLocation: '',
  guestCount: '',
  budget: '',
  message: '',
  priority: 'MEDIUM',
};

const INTAKE_SOURCE_STORAGE_KEY = 'admin.intake.source';

function pickOptionValue<T extends readonly { value: string }[]>(
  options: T,
  value: unknown,
  fallback: string,
) {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toUpperCase();
  if (normalized === 'EMAIL') return 'OTHER';
  return options.some((option) => option.value === normalized) ? normalized : fallback;
}

export default function IntakePage() {
  const toast = useToast();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [duplicates, setDuplicates] = useState<DuplicateWarning[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicateOverride, setDuplicateOverride] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: string; name: string } | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const { restored: autosaveRestored, clear: clearAutosave } = useFormAutosave('intake-lead', form, setForm);

  const handleExtract = useCallback(async (textOverride?: string) => {
    const text = textOverride ?? pasteText;
    if (!text.trim()) return;
    setExtracting(true);
    try {
      const res = await fetchWithCsrf('/api/admin/leads/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(errData.error || 'Error extreient');
      }
      const { data, fallback, fallbackReason } = await res.json() as {
        data: Partial<FormData>;
        fallback?: boolean;
        fallbackReason?: 'quota' | 'unavailable' | 'too-short';
      };
      setForm((prev) => ({
        ...prev,
        name: data.name || prev.name,
        email: data.email || prev.email,
        phone: data.phone || prev.phone,
        dni: data.dni || prev.dni,
        address: data.address || prev.address,
        eventType: pickOptionValue(INTAKE_EVENT_TYPE_OPTIONS, data.eventType, prev.eventType),
        eventDate: data.eventDate || prev.eventDate,
        eventTime: data.eventTime || prev.eventTime,
        eventEndTime: data.eventEndTime || prev.eventEndTime,
        eventLocation: data.eventLocation || prev.eventLocation,
        guestCount: data.guestCount || prev.guestCount,
        budget: data.budget || prev.budget,
        message: data.message || prev.message,
        source: pickOptionValue(INTAKE_SOURCE_OPTIONS, data.source, prev.source),
      }));
      setPasteText('');
      if (fallback) {
        toast.warning(
          fallbackReason === 'quota'
            ? 'Extracció local parcial: la quota IA està limitada ara mateix'
            : fallbackReason === 'too-short'
              ? 'Text massa curt: enganxa la conversa o dades com nom, telèfon, data o lloc'
              : 'Extracció local parcial: la IA no ha respost correctament'
        );
      } else {
        toast.success('Camps omplerts automàticament');
      }
    } catch (err) {
      console.error('[intake] extract error:', err);
      toast.error(err instanceof Error ? err.message : 'No he pogut extreure la informació');
    } finally {
      setExtracting(false);
    }
  }, [pasteText, toast]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (!pasted.trim()) return;
    const fullText = (pasteText + pasted).trim();
    setPasteText(fullText);
    handleExtract(fullText);
  }, [pasteText, handleExtract]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedSource = window.localStorage.getItem(INTAKE_SOURCE_STORAGE_KEY);
    if (storedSource && INTAKE_SOURCE_OPTIONS.some((opt) => opt.value === storedSource)) {
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
        // silent
      } finally {
        setCheckingDuplicates(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [debounceName, debounceEmail, debouncePhone]);

  const handleSubmit = useCallback(async () => {
    if (!form.name || (!form.email && !form.phone)) {
      setError('Nom i email o telèfon són obligatoris');
      return;
    }
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
      const extraParts: string[] = [];
      if (form.address.trim()) extraParts.push(`Adreça: ${form.address.trim()}`);
      const baseMessage = form.message.trim();
      const fullMessage = [...extraParts, baseMessage].filter(Boolean).join('\n') || undefined;

      const body: Record<string, unknown> = {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        dni: form.dni.trim().toUpperCase() || undefined,
        source: form.source || 'OTHER',
        eventType: form.eventType,
        eventDate: form.eventDate || undefined,
        eventStartTime: form.eventTime || undefined,
        eventEndTime: form.eventEndTime || undefined,
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
      clearAutosave();
      setForm((prev) => ({ ...INITIAL_FORM, source: prev.source }));
      setDuplicates([]);
    } catch (err) {
      console.error('[intake] submit error:', err);
      const msg = err instanceof Error ? err.message : 'Error desconegut';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }, [form, duplicates, duplicateOverride, toast]);

  return (
    <AdminPage
      title="Nova entrada"
      eyebrow="Pipeline · Nova entrada"
      subtitle="Crea una entrada des de qualsevol canal · detecció de duplicats en temps real"
      className="max-w-3xl"
    >
      {/* ── IA Extractor ─────────────────────────────────────────────────── */}
      <AdminSection
        title="IA · Extracció automàtica"
        description="Enganxa un WhatsApp, email o text amb la info del client — s'ompliran els camps del formulari automàticament."
      >
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          onPaste={handlePaste}
          className="adm-input adm-input--textarea"
          rows={6}
          placeholder={"Bon dia, sóc l'Adrià de l'Associació de Veïns de Rubí...\n(copia i enganxa aquí la conversa completa)"}
          aria-label="Text per extreure informació del client"
        />
        {extracting && (
          <p className="mt-2 text-xs text-[var(--t3)]">⟳ Extraient informació…</p>
        )}
      </AdminSection>

      {/* ── Èxit ─────────────────────────────────────────────────────────── */}
      {success && (
        <div className="ap-card ap-card--success">
          <div className="ap-card-body">
            <p className="text-sm font-bold admin-tone-text-success">Entrada creada per a {success.name}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={buildLeadWorkspaceHref(success.id)} className="ap-btn ap-btn--primary">
                Obrir entrada →
              </Link>
              <button type="button" onClick={() => setSuccess(null)} className="ap-btn">
                Crear una altra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Esborrany recuperat ──────────────────────────────────────────── */}
      {autosaveRestored && !success && (
        <div className="ap-card" role="status">
          <div className="ap-card-body flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-[var(--t2)]">S&apos;ha recuperat un esborrany d&apos;aquest formulari.</span>
            <button
              type="button"
              className="ap-btn ap-btn--xs"
              onClick={() => { clearAutosave(); setForm((prev) => ({ ...INITIAL_FORM, source: prev.source })); }}
            >
              Descartar i començar de nou
            </button>
          </div>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="ap-card ap-card--danger">
          <div className="ap-card-body text-sm admin-tone-text-danger">{error}</div>
        </div>
      )}

      {/* ── Duplicats ────────────────────────────────────────────────────── */}
      {duplicates.length > 0 && (
        <AdminSection
          title={
            <span className="inline-flex items-center gap-2">
              {checkingDuplicates && <span className="inline-block animate-spin" aria-hidden="true">⟳</span>}
              Possibles duplicats ({duplicates.length})
            </span>
          }
        >
          <div className="flex flex-col gap-2">
            {duplicates.map((dup) => (
              <Link
                key={dup.id}
                href={buildCustomerHubHref(dup.id)}
                className="adm-row-hover flex items-center justify-between gap-3 rounded-[var(--o-r-md)] border border-[var(--line)] bg-[var(--sunk)] px-3 py-2.5 no-underline"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--t)]">{dup.name}</p>
                  <p className="truncate text-xs text-[var(--t3)]">{dup.email}{dup.phone ? ` · ${dup.phone}` : ''}</p>
                </div>
                <span className={
                  dup.matchScore >= 80 ? 'ap-badge ap-badge--danger' :
                  dup.matchScore >= 50 ? 'ap-badge ap-badge--warning' :
                  'ap-badge'
                }>
                  {dup.matchScore}%
                </span>
              </Link>
            ))}
          </div>
        </AdminSection>
      )}

      {/* ── Canal d'entrada ──────────────────────────────────────────────── */}
      <AdminSection title="Canal d'entrada">
        <div className="flex flex-wrap gap-2">
          {INTAKE_SOURCE_OPTIONS.map((src) => (
            <button
              key={src.value}
              type="button"
              onClick={() => updateField('source', src.value)}
              aria-pressed={form.source === src.value}
              className={`ap-btn${form.source === src.value ? ' ap-btn--primary' : ''}`}
            >
              <span aria-hidden="true">{src.icon}</span>
              {src.label}
            </button>
          ))}
        </div>
      </AdminSection>

      {/* ── Dades del client ─────────────────────────────────────────────── */}
      <AdminSection title="Dades del client">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block" htmlFor="intake-name">
            <span className="text-xs text-[var(--t2)]">Nom *</span>
            <input
              id="intake-name"
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Nom i cognom"
              className="adm-input mt-1"
              autoComplete="off"
            />
          </label>
          <label className="block" htmlFor="intake-email">
            <span className="text-xs text-[var(--t2)]">Email</span>
            <input
              id="intake-email"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="client@exemple.com"
              className="adm-input mt-1"
              autoComplete="off"
            />
          </label>
          <label className="block" htmlFor="intake-phone">
            <span className="text-xs text-[var(--t2)]">Telèfon</span>
            <input
              id="intake-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="+34 600 000 000"
              className="adm-input mt-1"
              autoComplete="off"
            />
          </label>
          <label className="block" htmlFor="intake-dni">
            <span className="text-xs text-[var(--t2)]">DNI / NIF / CIF</span>
            <input
              id="intake-dni"
              type="text"
              value={form.dni}
              onChange={(e) => updateField('dni', e.target.value.toUpperCase())}
              placeholder="12345678A"
              className="adm-input mt-1"
              autoComplete="off"
            />
          </label>
          <label className="block sm:col-span-2" htmlFor="intake-address">
            <span className="text-xs text-[var(--t2)]">Adreça</span>
            <input
              id="intake-address"
              type="text"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Carrer, número, CP, ciutat"
              className="adm-input mt-1"
              autoComplete="off"
            />
          </label>
          <div className="sm:col-span-2">
            <span className="text-xs text-[var(--t2)]">Prioritat</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {INTAKE_PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => updateField('priority', p.value)}
                  aria-pressed={form.priority === p.value}
                  className={`ap-btn${form.priority === p.value ? ' ap-btn--primary' : ''}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </AdminSection>

      {/* ── Detalls de l'event ───────────────────────────────────────────── */}
      <AdminSection title="Detalls de l'event">
        <div className="mb-4">
          <span className="text-xs text-[var(--t2)]">Tipus d&apos;event</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {INTAKE_EVENT_TYPE_OPTIONS.map((et) => (
              <button
                key={et.value}
                type="button"
                onClick={() => updateField('eventType', et.value)}
                aria-pressed={form.eventType === et.value}
                className={`ap-btn${form.eventType === et.value ? ' ap-btn--primary' : ''}`}
              >
                <span aria-hidden="true">{et.icon}</span>
                {et.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block" htmlFor="intake-date">
            <span className="text-xs text-[var(--t2)]">Data</span>
            <input
              id="intake-date"
              type="date"
              value={form.eventDate}
              onChange={(e) => updateField('eventDate', e.target.value)}
              className="adm-input mt-1"
            />
          </label>
          <label className="block" htmlFor="intake-time">
            <span className="text-xs text-[var(--t2)]">
              Hora inici
              {form.eventTime && form.eventEndTime && (() => {
                const [sh, sm] = form.eventTime.split(':').map(Number);
                const [eh, em] = form.eventEndTime.split(':').map(Number);
                const mins = (eh * 60 + em) - (sh * 60 + sm);
                if (mins > 0) {
                  const h = Math.floor(mins / 60);
                  const m = mins % 60;
                  return <span className="ml-1.5 font-semibold text-[var(--gold)]">{h > 0 ? `${h}h` : ''}{m > 0 ? `${m}min` : ''}</span>;
                }
                return null;
              })()}
            </span>
            <input
              id="intake-time"
              type="time"
              value={form.eventTime}
              onChange={(e) => updateField('eventTime', e.target.value)}
              className="adm-input mt-1"
            />
          </label>
          <label className="block" htmlFor="intake-end-time">
            <span className="text-xs text-[var(--t2)]">Hora fi</span>
            <input
              id="intake-end-time"
              type="time"
              value={form.eventEndTime}
              onChange={(e) => updateField('eventEndTime', e.target.value)}
              className="adm-input mt-1"
            />
          </label>
          <label className="block sm:col-span-2 lg:col-span-1" htmlFor="intake-location">
            <span className="text-xs text-[var(--t2)]">Ubicació</span>
            <input
              id="intake-location"
              type="text"
              value={form.eventLocation}
              onChange={(e) => updateField('eventLocation', e.target.value)}
              placeholder="Lloc de celebració"
              className="adm-input mt-1"
              autoComplete="off"
            />
          </label>
          <label className="block" htmlFor="intake-guests">
            <span className="text-xs text-[var(--t2)]">Convidats</span>
            <input
              id="intake-guests"
              type="number"
              min={1}
              value={form.guestCount}
              onChange={(e) => updateField('guestCount', e.target.value)}
              placeholder="60"
              className="adm-input mt-1"
            />
          </label>
          <label className="block" htmlFor="intake-budget">
            <span className="text-xs text-[var(--t2)]">Pressupost</span>
            <input
              id="intake-budget"
              type="text"
              value={form.budget}
              onChange={(e) => updateField('budget', e.target.value)}
              placeholder="2.000€"
              className="adm-input mt-1"
              autoComplete="off"
            />
          </label>
        </div>

        <label className="mt-3 block" htmlFor="intake-message">
          <span className="text-xs text-[var(--t2)]">Notes</span>
          <textarea
            id="intake-message"
            value={form.message}
            onChange={(e) => updateField('message', e.target.value)}
            rows={3}
            placeholder="Detalls addicionals, context de la conversa..."
            className="adm-input adm-input--textarea mt-1"
          />
        </label>
      </AdminSection>

      {/* ── Accions ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !form.name || (!form.email && !form.phone)}
          className="ap-btn ap-btn--primary"
        >
          {submitting ? 'Creant…' : 'Crear entrada'}
        </button>
        <button
          type="button"
          onClick={() => {
            setForm((prev) => ({ ...INITIAL_FORM, source: prev.source }));
            setDuplicates([]);
            setError(null);
            setSuccess(null);
          }}
          className="ap-btn"
        >
          Netejar
        </button>
      </div>
    </AdminPage>
  );
}
