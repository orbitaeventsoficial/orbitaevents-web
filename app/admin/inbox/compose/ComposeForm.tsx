// app/admin/inbox/compose/ComposeForm.tsx
// Redactor de correu — 100% canònic (AdminPage + .ap-*/.adm-input)
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { formatDateSimple, getEventLabel } from '@/lib/constants';
import { fetchWithCsrf } from '@/lib/csrf';
import {
  generateSmartTemplates,
  generateAllTemplates,
  type SmartTemplate,
  type TemplateKey,
} from '@/lib/services/inboxTemplateService';
import type { BulkComposeSegmentAudience } from '@/lib/services/bulkComposeSegmentService';

interface Lead {
  id: string;
  name: string;
  email: string;
  eventType: string | null;
  eventDate: Date | null;
  eventLocation: string | null;
  guestCount: number | null;
  budget: string | null;
  status: string;
  preferredLocale: string | null;
  interestedPackId: string | null;
  interestedExtras: string[];
  message: string | null;
}

interface Props {
  leads: Lead[];
  packs: unknown[];
  returnHref: string;
  initialLeadId?: string;
  initialCustomer?: {
    id: string;
    name: string;
    email: string;
    preferredLocale: string | null;
  };
  initialTemplate?: string;
  initialTo?: string;
  initialSegmentAudience?: BulkComposeSegmentAudience;
}

const TEMPLATE_QUERY_ALIASES: Record<string, TemplateKey> = {
  recordatori: 'seguiment',
};

function normalizeInitialTemplateKey(value?: string): TemplateKey | null {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized in TEMPLATE_QUERY_ALIASES) return TEMPLATE_QUERY_ALIASES[normalized];
  const allowed: TemplateKey[] = [
    'primer-contacte',
    'seguiment',
    'seguiment-pressupost',
    'confirmacio-data',
    'agraiment-post-event',
    'reactivacio',
    'referral',
  ];
  return allowed.includes(normalized as TemplateKey) ? (normalized as TemplateKey) : null;
}

export default function ComposeForm({
  leads,
  packs: _packs,
  returnHref,
  initialLeadId,
  initialCustomer,
  initialTemplate,
  initialTo,
  initialSegmentAudience,
}: Props) {
  const router = useRouter();
  const lastAppliedTemplateRef = useRef<{ key: string; subject: string; body: string } | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeadId || '');
  const [to, setTo] = useState(initialTo || '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [activeTemplateKey, setActiveTemplateKey] = useState<string | null>(null);
  const [locale, setLocale] = useState('ca');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const isBulkSegmentMode = Boolean(initialSegmentAudience);

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId);
  const normalizedInitialTemplateKey = useMemo(
    () => normalizeInitialTemplateKey(initialTemplate),
    [initialTemplate]
  );

  useEffect(() => {
    if (initialLeadId) setSelectedLeadId(initialLeadId);
  }, [initialLeadId]);

  const smartTemplates: SmartTemplate[] = useMemo(() => {
    if (selectedLead) {
      return generateSmartTemplates({
        name: selectedLead.name,
        email: selectedLead.email,
        eventType: selectedLead.eventType,
        eventDate: selectedLead.eventDate ? new Date(selectedLead.eventDate).toISOString() : null,
        eventLocation: selectedLead.eventLocation,
        guestCount: selectedLead.guestCount,
        status: selectedLead.status,
        locale: selectedLead.preferredLocale || locale,
      });
    }
    if (initialCustomer) {
      return generateAllTemplates({
        name: initialCustomer.name,
        email: initialCustomer.email,
        locale: initialCustomer.preferredLocale || locale,
      });
    }
    return generateAllTemplates({ name: '', locale });
  }, [selectedLead, initialCustomer, locale]);

  function applyTemplate(template: SmartTemplate) {
    lastAppliedTemplateRef.current = {
      key: template.key,
      subject: template.subject,
      body: template.body,
    };
    setSubject(template.subject);
    setBody(template.body);
    setActiveTemplateKey(template.key);
  }

  useEffect(() => {
    if (selectedLead) {
      setTo(selectedLead.email);
      setLocale(selectedLead.preferredLocale || 'ca');
    }
  }, [selectedLeadId, selectedLead]);

  useEffect(() => {
    if (!activeTemplateKey) return;
    const activeTemplate = smartTemplates.find((t) => t.key === activeTemplateKey);
    if (!activeTemplate) return;
    const last = lastAppliedTemplateRef.current;
    const canRefresh =
      !last ||
      (last.key === activeTemplateKey && subject === last.subject && body === last.body);
    if (!canRefresh) return;
    lastAppliedTemplateRef.current = {
      key: activeTemplate.key,
      subject: activeTemplate.subject,
      body: activeTemplate.body,
    };
    if (subject !== activeTemplate.subject) setSubject(activeTemplate.subject);
    if (body !== activeTemplate.body) setBody(activeTemplate.body);
  }, [activeTemplateKey, smartTemplates, subject, body]);

  useEffect(() => {
    if (!normalizedInitialTemplateKey) return;
    if (activeTemplateKey) return;
    if (subject.trim() || body.trim()) return;
    const template = smartTemplates.find((tpl) => tpl.key === normalizedInitialTemplateKey);
    if (!template) return;
    applyTemplate(template);
  }, [activeTemplateKey, body, normalizedInitialTemplateKey, smartTemplates, subject]);

  useEffect(() => {
    if (selectedLeadId) return;
    if (!initialCustomer?.email) return;
    setTo(initialCustomer.email);
    setLocale(initialCustomer.preferredLocale || 'ca');
    if (!body.trim() && initialTemplate === 'primer-contacte') {
      setBody(`Hola ${initialCustomer.name},\n\nGracies per contactar amb nosaltres. Et podem preparar una proposta ajustada al que necessites.\n\nSi et va be, et truquem i ho tanquem en 5 minuts.`);
    }
    if (!body.trim() && initialTemplate === 'recordatori') {
      setBody(`Hola ${initialCustomer.name},\n\nEt faig un recordatori per si vols que revisem la proposta i tanquem detalls.\n\nQuan et vagi be, ho comentem.`);
    }
    if (!subject.trim() && initialTemplate === 'primer-contacte') {
      setSubject(`Primer contacte amb ${initialCustomer.name}`);
    }
    if (!subject.trim() && initialTemplate === 'recordatori') {
      setSubject(`Recordatori - seguiment ${initialCustomer.name}`);
    }
  }, [initialCustomer, initialTemplate, selectedLeadId, subject, body]);

  async function handleSend() {
    setError('');

    if ((!isBulkSegmentMode && !to) || !subject || !body) {
      setError('Omple tots els camps');
      return;
    }

    setSending(true);
    try {
      const endpoint = isBulkSegmentMode
        ? '/api/admin/emails/send-bulk'
        : '/api/admin/emails/send';
      const res = await fetchWithCsrf(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject,
          body,
          leadId: selectedLeadId || undefined,
          customerId: initialCustomer?.id || undefined,
          locale,
          templateKey: activeTemplateKey || undefined,
          segmentKey: initialSegmentAudience?.key,
        }),
      });
      if (res.ok) {
        setSent(true);
        setTimeout(() => router.push(returnHref), 1500);
      } else {
        const data = await res.json();
        setError(
          data.error ||
            (isBulkSegmentMode ? 'Error enviant campanya massiva' : 'Error enviant email'),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de connexió');
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="ap-inline-alert ap-inline-alert--success" role="status">
        ✓ {isBulkSegmentMode ? 'Campanya enviada!' : 'Correu enviat!'}
      </div>
    );
  }

  const labelClass = 'text-xs font-bold uppercase tracking-[0.1em] text-[var(--t2)]';

  return (
    <div className="grid gap-4">
      {/* Plantilles intel·ligents (mode email) */}
      {smartTemplates.length > 0 && (
        <section className="ap-card">
          <div className="ap-card-body">
            <p className={labelClass}>Plantilles intel·ligents</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {smartTemplates.map((tpl) => {
                const isActive = activeTemplateKey === tpl.key;
                return (
                  <button
                    key={tpl.key}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    aria-pressed={isActive}
                    className={`rounded-[var(--o-r-sm)] border p-3 text-left transition-colors ${
                      isActive
                        ? 'border-[var(--hair-gold)] bg-[var(--raised)] text-[var(--gold-bright)]'
                        : 'border-[var(--line)] bg-[var(--sunk)] text-[var(--t2)] hover:bg-[var(--raised)] hover:text-[var(--t)]'
                    }`}
                  >
                    <p className="text-sm font-bold">{tpl.icon} {tpl.label}</p>
                    <p className="mt-0.5 truncate text-xs opacity-60">{tpl.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Audiència segmentada */}
      {initialSegmentAudience && (
        <section className="ap-card">
          <div className="ap-card-body">
            <p className={labelClass}>Audiència segmentada</p>
            <p className="mt-1 text-base font-bold text-[var(--t)]">{initialSegmentAudience.label}</p>
            <p className="mt-0.5 text-xs text-[var(--t2)]">{initialSegmentAudience.description}</p>
            <p className="mt-2 text-sm font-semibold text-[var(--gold-bright)]">
              {initialSegmentAudience.recipients.length} destinataris preparats per l&apos;enviament massiu.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {initialSegmentAudience.recipients.slice(0, 4).map((recipient) => (
                <div
                  key={recipient.id}
                  className="rounded-[var(--o-r-sm)] border border-[var(--line)] bg-[var(--sunk)] p-2"
                >
                  <p className="text-xs font-semibold text-[var(--t)]">{recipient.name}</p>
                  <p className="text-xs text-[var(--t3)]">{recipient.email}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Formulari principal */}
      <section className="ap-card">
        <div className="ap-card-body grid gap-4">
          {/* Selecció de lead (mode individual) */}
          {!isBulkSegmentMode && (
            <div className="grid gap-1.5">
              <label htmlFor="cf-lead" className={labelClass}>Entrada (opcional)</label>
              <select
                id="cf-lead"
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                aria-label="Selecciona entrada"
                className="adm-input"
              >
                <option value="">-- Escriu email manualment --</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name} ({lead.email}) — {getEventLabel(lead.eventType || '', 'Event')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Detalls del lead seleccionat */}
          {selectedLead && (
            <div className="rounded-[var(--o-r-sm)] border border-[var(--line)] bg-[var(--sunk)] p-4">
              <p className={labelClass}>Detalls de l&apos;entrada</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-[var(--t3)]">Tipus</p>
                  <p className="text-sm font-semibold text-[var(--t)]">
                    {getEventLabel(selectedLead.eventType || '', 'No especificat')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--t3)]">Data</p>
                  <p className="text-sm font-semibold text-[var(--t)]">
                    {selectedLead.eventDate
                      ? formatDateSimple(selectedLead.eventDate)
                      : 'No especificat'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--t3)]">Ubicació</p>
                  <p className="text-sm font-semibold text-[var(--t)]">
                    {selectedLead.eventLocation || 'No especificat'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--t3)]">Convidats</p>
                  <p className="text-sm font-semibold text-[var(--t)]">
                    {selectedLead.guestCount || 'No especificat'}
                  </p>
                </div>
              </div>
              {selectedLead.message && (
                <div className="mt-3 border-t border-[var(--line)] pt-3">
                  <p className="text-xs text-[var(--t3)]">Missatge</p>
                  <p className="mt-1 text-sm text-[var(--t2)]">
                    {selectedLead.message}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-1.5">
            <label htmlFor="cf-to" className={labelClass}>Per a *</label>
            {isBulkSegmentMode ? (
              <div className="adm-input flex items-center justify-between">
                <span>{initialSegmentAudience?.label}</span>
                <span className="text-xs text-[var(--t3)]">
                  {initialSegmentAudience?.recipients.length} contactes
                </span>
              </div>
            ) : (
              <input
                id="cf-to"
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="adm-input"
                placeholder="email@exemple.com"
              />
            )}
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="cf-subj" className={labelClass}>Assumpte *</label>
            <input
              id="cf-subj"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="adm-input"
              placeholder="Assumpte de l'email"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="cf-body" className={labelClass}>Missatge *</label>
            <textarea
              id="cf-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="adm-input adm-input--textarea"
              placeholder="Escriu el teu missatge..."
            />
          </div>
        </div>

        {/* Barra d'enviament */}
        <div className="ap-card-body flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)]">
          <div>
            {error && (
              <div className="ap-inline-alert ap-inline-alert--danger" role="alert">
                {error}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push(returnHref)}
              className="ap-btn ap-btn--secondary"
            >
              Cancel·lar
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={sending}
              aria-busy={sending}
              className="ap-btn ap-btn--primary"
            >
              {sending
                ? 'Enviant...'
                : isBulkSegmentMode
                    ? 'Envia campanya'
                    : 'Envia correu'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
