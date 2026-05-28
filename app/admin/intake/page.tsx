'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '@/app/admin/components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
import { INTAKE_EVENT_TYPE_OPTIONS, INTAKE_PRIORITY_OPTIONS, INTAKE_SOURCE_OPTIONS } from '@/lib/constants';
import './intake.css';

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
        fallbackReason?: 'quota' | 'unavailable';
      };
      setForm((prev) => ({
        ...prev,
        name: data.name || prev.name,
        email: data.email || prev.email,
        phone: data.phone || prev.phone,
        dni: data.dni || prev.dni,
        address: data.address || prev.address,
        eventType: data.eventType || prev.eventType,
        eventDate: data.eventDate || prev.eventDate,
        eventTime: data.eventTime || prev.eventTime,
        eventEndTime: data.eventEndTime || prev.eventEndTime,
        eventLocation: data.eventLocation || prev.eventLocation,
        guestCount: data.guestCount || prev.guestCount,
        budget: data.budget || prev.budget,
        message: data.message || prev.message,
        source: data.source || prev.source,
      }));
      setPasteText('');
      if (fallback) {
        toast.warning(
          fallbackReason === 'quota'
            ? 'Extracció local parcial: la quota IA està limitada ara mateix'
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
    if (!form.name || !form.email) {
      setError('Nom i email són obligatoris');
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

      const eventDateTime = form.eventDate
        ? form.eventTime
          ? `${form.eventDate}T${form.eventTime}`
          : form.eventDate
        : undefined;

      const body: Record<string, unknown> = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        dni: form.dni.trim().toUpperCase() || undefined,
        source: form.source || 'OTHER',
        eventType: form.eventType,
        eventDate: eventDateTime,
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
    <div className="ni">

      {/* Capçalera */}
      <div className="ni__head">
        <span className="ni__eyebrow">Pipeline · Nova entrada</span>
        <h1 className="ni__h1">Nova entrada</h1>
        <p className="ni__sub">Crea una entrada des de qualsevol canal · detecció de duplicats en temps real</p>
      </div>

      {/* ── IA Extractor ─────────────────────────────────────────────────── */}
      <div className="ni__card ni__card--ai">
        <p className="ni__card-title">IA · Extracció automàtica</p>
        <p className="ni__card-hint">
          Enganxa un WhatsApp, email o text amb la info del client — s&apos;ompliran els camps del formulari automàticament.
        </p>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          onPaste={handlePaste}
          className="ni__input ni__textarea"
          rows={6}
          placeholder={"Bon dia, sóc l'Adrià de l'Associació de Veïns de Rubí...\n(copia i enganxa aquí la conversa completa)"}
          aria-label="Text per extreure informació del client"
        />
        {extracting && (
          <p className="ni__card-hint" style={{ marginTop: 8 }}>⟳ Extraient informació…</p>
        )}
      </div>

      {/* ── Èxit ─────────────────────────────────────────────────────────── */}
      {success && (
        <div className="ni__success">
          <p className="ni__success-title">Entrada creada per a {success.name}</p>
          <div className="ni__success-btns">
            <Link href={buildLeadWorkspaceHref(success.id)} className="ni__btn ni__btn--primary">
              Obrir entrada →
            </Link>
            <button type="button" onClick={() => setSuccess(null)} className="ni__btn ni__btn--ghost">
              Crear una altra
            </button>
          </div>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="ni__error">{error}</div>
      )}

      {/* ── Duplicats ────────────────────────────────────────────────────── */}
      {duplicates.length > 0 && (
        <div className="ni__dups">
          <p className="ni__dups-title">
            {checkingDuplicates && <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>}
            Possibles duplicats ({duplicates.length})
          </p>
          {duplicates.map((dup) => (
            <Link key={dup.id} href={buildCustomerHubHref(dup.id)} className="ni__dup-row">
              <div>
                <p className="ni__dup-name">{dup.name}</p>
                <p className="ni__dup-meta">{dup.email}{dup.phone ? ` · ${dup.phone}` : ''}</p>
              </div>
              <span className={`ni__dup-badge ${
                dup.matchScore >= 80 ? 'ni__dup-badge--high' :
                dup.matchScore >= 50 ? 'ni__dup-badge--med' :
                'ni__dup-badge--low'
              }`}>
                {dup.matchScore}%
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* ── Canal d'entrada ──────────────────────────────────────────────── */}
      <div className="ni__card">
        <p className="ni__card-title">Canal d&apos;entrada</p>
        <div className="ni__pills">
          {INTAKE_SOURCE_OPTIONS.map((src) => (
            <button
              key={src.value}
              type="button"
              onClick={() => updateField('source', src.value)}
              aria-pressed={form.source === src.value}
              className={`ni__pill${form.source === src.value ? ' ni__pill--on' : ''}`}
            >
              <span className="ni__pill-icon">{src.icon}</span>
              {src.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Dades del client ─────────────────────────────────────────────── */}
      <div className="ni__card">
        <p className="ni__card-title">Dades del client</p>
        <div className="ni__grid ni__grid--2">
          <div className="ni__field">
            <label htmlFor="intake-name" className="ni__label">Nom *</label>
            <input
              id="intake-name"
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Nom i cognom"
              className="ni__input"
              autoComplete="off"
            />
          </div>
          <div className="ni__field">
            <label htmlFor="intake-email" className="ni__label">Email *</label>
            <input
              id="intake-email"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="client@exemple.com"
              className="ni__input"
              autoComplete="off"
            />
          </div>
          <div className="ni__field">
            <label htmlFor="intake-phone" className="ni__label">Telèfon</label>
            <input
              id="intake-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="+34 600 000 000"
              className="ni__input"
              autoComplete="off"
            />
          </div>
          <div className="ni__field">
            <label htmlFor="intake-dni" className="ni__label">DNI / NIF / CIF</label>
            <input
              id="intake-dni"
              type="text"
              value={form.dni}
              onChange={(e) => updateField('dni', e.target.value.toUpperCase())}
              placeholder="12345678A"
              className="ni__input"
              autoComplete="off"
            />
          </div>
          <div className="ni__field ni__col2">
            <label htmlFor="intake-address" className="ni__label">Adreça</label>
            <input
              id="intake-address"
              type="text"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Carrer, número, CP, ciutat"
              className="ni__input"
              autoComplete="off"
            />
          </div>
          <div className="ni__field ni__col2">
            <label className="ni__label">Prioritat</label>
            <div className="ni__pills" style={{ marginTop: '2px' }}>
              {INTAKE_PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => updateField('priority', p.value)}
                  aria-pressed={form.priority === p.value}
                  className={`ni__pill${form.priority === p.value ? ' ni__pill--on' : ''}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Detalls de l'event ───────────────────────────────────────────── */}
      <div className="ni__card">
        <p className="ni__card-title">Detalls de l&apos;event</p>

        <div className="ni__field" style={{ marginBottom: '18px' }}>
          <label className="ni__label">Tipus d&apos;event</label>
          <div className="ni__tiles">
            {INTAKE_EVENT_TYPE_OPTIONS.map((et) => (
              <button
                key={et.value}
                type="button"
                onClick={() => updateField('eventType', et.value)}
                aria-pressed={form.eventType === et.value}
                className={`ni__tile${form.eventType === et.value ? ' ni__tile--on' : ''}`}
              >
                <span className="ni__tile-icon">{et.icon}</span>
                {et.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ni__grid ni__grid--3" style={{ marginBottom: '14px' }}>
          <div className="ni__grid ni__grid--2" style={{ gap: '10px' }}>
            <div className="ni__field">
              <label htmlFor="intake-date" className="ni__label">Data</label>
              <input
                id="intake-date"
                type="date"
                value={form.eventDate}
                onChange={(e) => updateField('eventDate', e.target.value)}
                className="ni__input"
              />
            </div>
            <div className="ni__field">
              <label htmlFor="intake-time" className="ni__label">
                Hora inici
                {form.eventTime && form.eventEndTime && (() => {
                  const [sh, sm] = form.eventTime.split(':').map(Number);
                  const [eh, em] = form.eventEndTime.split(':').map(Number);
                  const mins = (eh * 60 + em) - (sh * 60 + sm);
                  if (mins > 0) {
                    const h = Math.floor(mins / 60);
                    const m = mins % 60;
                    return <span className="ni__label-hint">{h > 0 ? `${h}h` : ''}{m > 0 ? `${m}min` : ''}</span>;
                  }
                  return null;
                })()}
              </label>
              <input
                id="intake-time"
                type="time"
                value={form.eventTime}
                onChange={(e) => updateField('eventTime', e.target.value)}
                className="ni__input"
              />
            </div>
          </div>
          <div className="ni__field">
            <label htmlFor="intake-end-time" className="ni__label">Hora fi</label>
            <input
              id="intake-end-time"
              type="time"
              value={form.eventEndTime}
              onChange={(e) => updateField('eventEndTime', e.target.value)}
              className="ni__input"
            />
          </div>
          <div className="ni__field">
            <label htmlFor="intake-location" className="ni__label">Ubicació</label>
            <input
              id="intake-location"
              type="text"
              value={form.eventLocation}
              onChange={(e) => updateField('eventLocation', e.target.value)}
              placeholder="Lloc de celebració"
              className="ni__input"
              autoComplete="off"
            />
          </div>
          <div className="ni__grid ni__grid--2" style={{ gap: '10px' }}>
            <div className="ni__field">
              <label htmlFor="intake-guests" className="ni__label">Convidats</label>
              <input
                id="intake-guests"
                type="number"
                min={1}
                value={form.guestCount}
                onChange={(e) => updateField('guestCount', e.target.value)}
                placeholder="60"
                className="ni__input"
              />
            </div>
            <div className="ni__field">
              <label htmlFor="intake-budget" className="ni__label">Pressupost</label>
              <input
                id="intake-budget"
                type="text"
                value={form.budget}
                onChange={(e) => updateField('budget', e.target.value)}
                placeholder="2.000€"
                className="ni__input"
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        <div className="ni__field">
          <label htmlFor="intake-message" className="ni__label">Notes</label>
          <textarea
            id="intake-message"
            value={form.message}
            onChange={(e) => updateField('message', e.target.value)}
            rows={3}
            placeholder="Detalls addicionals, context de la conversa..."
            className="ni__input ni__textarea"
            style={{ minHeight: 'unset' }}
          />
        </div>
      </div>

      {/* ── Accions ──────────────────────────────────────────────────────── */}
      <div className="ni__actions">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !form.name || !form.email}
          className="ni__btn ni__btn--submit"
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
          className="ni__btn ni__btn--ghost"
        >
          Netejar
        </button>
      </div>

    </div>
  );
}
