// app/admin/inbox/compose/ComposeForm.tsx
// Canvi #801 — reconstrucció des de zero (cx- classes, cap ap-*)
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { formatDateSimple, formatCurrency, getEventLabel } from '@/lib/constants';
import { fetchWithCsrf } from '@/lib/csrf';
import { generateSmartTemplates, generateAllTemplates, type SmartTemplate } from '@/lib/services/inboxTemplateService';
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

interface Pack {
  id: string;
  price: number;
  translations: { locale: string; name: string; description: string | null; features: string[] }[];
}

interface Props {
  leads: Lead[];
  packs: Pack[];
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

export default function ComposeForm({
  leads,
  packs,
  returnHref,
  initialLeadId,
  initialCustomer,
  initialTemplate,
  initialTo,
  initialSegmentAudience,
}: Props) {
  const router = useRouter();
  const lastAppliedTemplateRef = useRef<{ key: string; subject: string; body: string } | null>(null);
  const [mode, setMode] = useState<'email' | 'quote'>('email');
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeadId || '');
  const [to, setTo] = useState(initialTo || '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [activeTemplateKey, setActiveTemplateKey] = useState<string | null>(null);
  const [locale, setLocale] = useState('ca');
  const [selectedPackId, setSelectedPackId] = useState('');
  const [price, setPrice] = useState('');
  const [extras, setExtras] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const isBulkSegmentMode = Boolean(initialSegmentAudience);

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId);
  const selectedPack = packs.find((pack) => pack.id === selectedPackId);

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
    if (template.mode === 'quote') setMode('quote');
    else setMode('email');
  }

  useEffect(() => {
    if (selectedLead) {
      setTo(selectedLead.email);
      setLocale(selectedLead.preferredLocale || 'ca');
      if (selectedLead.interestedPackId) setSelectedPackId(selectedLead.interestedPackId);
      if (selectedLead.interestedExtras?.length) setExtras(selectedLead.interestedExtras);
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
    if (mode !== activeTemplate.mode) setMode(activeTemplate.mode as 'email' | 'quote');
  }, [activeTemplateKey, smartTemplates, subject, body, mode]);

  useEffect(() => {
    if (initialTemplate === 'enviament-pressupost') { setMode('quote'); return; }
    if (initialTemplate === 'primer-contacte' || initialTemplate === 'recordatori') setMode('email');
  }, [initialTemplate]);

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

  useEffect(() => {
    if (selectedPack) setPrice(selectedPack.price.toString());
  }, [selectedPackId, selectedPack]);

  async function handleSend() {
    setError('');

    if (mode === 'quote') {
      const hasRecipient = selectedLeadId || to.trim();
      if (!hasRecipient || !selectedPackId || !price) {
        setError('Selecciona un lead o escriu un email, pack i preu');
        return;
      }
      setSending(true);
      try {
        const res = await fetchWithCsrf('/api/admin/emails/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId: selectedLeadId || undefined,
            customerId: initialCustomer?.id || undefined,
            to: selectedLeadId ? undefined : to.trim(),
            packId: selectedPackId,
            price: parseFloat(price),
            extras,
            notes,
            customMessage,
            locale,
          }),
        });
        if (res.ok) {
          setSent(true);
          setTimeout(() => router.push(returnHref), 1500);
        } else {
          const data = await res.json();
          setError(data.error || 'Error enviant pressupost');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de connexió');
      } finally {
        setSending(false);
      }
      return;
    }

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
      <div className="cx__success">
        ✓ {mode === 'quote' ? 'Pressupost enviat!' : isBulkSegmentMode ? 'Campanya enviada!' : 'Correu enviat!'}
      </div>
    );
  }

  return (
    <div>
      {/* Toggle mode */}
      <div className="cx__modetoggle">
        <button
          type="button"
          onClick={() => setMode('email')}
          aria-pressed={mode === 'email'}
          className={`cx__modebtn${mode === 'email' ? ' is-on' : ''}`}
        >
          ✉ Correu normal
        </button>
        <button
          type="button"
          onClick={() => setMode('quote')}
          aria-pressed={mode === 'quote'}
          className={`cx__modebtn${mode === 'quote' ? ' is-on' : ''}`}
        >
          Pressupost
        </button>
      </div>

      {/* Plantilles intel·ligents (mode email) */}
      {mode === 'email' && smartTemplates.length > 0 && (
        <div className="cx__tplcard">
          <p className="cx__tpllabel">Plantilles intel·ligents</p>
          <div className="cx__tplgrid">
            {smartTemplates.map((tpl) => (
              <button
                key={tpl.key}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className={`cx__tplitem${activeTemplateKey === tpl.key ? ' is-on' : ''}`}
              >
                <p className="cx__tplname">{tpl.icon} {tpl.label}</p>
                <p className="cx__tpldesc">{tpl.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Audiència segmentada */}
      {mode === 'email' && initialSegmentAudience && (
        <div className="cx__segcard">
          <p className="cx__segcard-label">Audiència segmentada</p>
          <p className="cx__segcard-name">{initialSegmentAudience.label}</p>
          <p className="cx__segcard-desc">{initialSegmentAudience.description}</p>
          <p className="cx__segcard-count">
            {initialSegmentAudience.recipients.length} destinataris preparats per l&apos;enviament massiu.
          </p>
          <div className="cx__segrecipgrid">
            {initialSegmentAudience.recipients.slice(0, 4).map((recipient) => (
              <div key={recipient.id} className="cx__segrecip">
                <p className="cx__segrecip-name">{recipient.name}</p>
                <p className="cx__segrecip-email">{recipient.email}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulari principal */}
      <div className="cx__formcard">
        <div className="cx__forminner">
          {/* Selecció de lead (mode individual) */}
          {!isBulkSegmentMode && (
            <div className="cx__field">
              <label htmlFor="cf-lead" className="cx__label">Entrada (opcional)</label>
              <select
                id="cf-lead"
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                aria-label="Selecciona entrada"
                className="cx__select"
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
            <div className="cx__leaddetail">
              <p className="cx__leaddetail-title">Detalls de l&apos;entrada</p>
              <div className="cx__leaddetail-grid">
                <div>
                  <p className="cx__leaddetail-label">Tipus</p>
                  <p className="cx__leaddetail-value">
                    {getEventLabel(selectedLead.eventType || '', 'No especificat')}
                  </p>
                </div>
                <div>
                  <p className="cx__leaddetail-label">Data</p>
                  <p className="cx__leaddetail-value">
                    {selectedLead.eventDate
                      ? formatDateSimple(selectedLead.eventDate)
                      : 'No especificat'}
                  </p>
                </div>
                <div>
                  <p className="cx__leaddetail-label">Ubicació</p>
                  <p className="cx__leaddetail-value">
                    {selectedLead.eventLocation || 'No especificat'}
                  </p>
                </div>
                <div>
                  <p className="cx__leaddetail-label">Convidats</p>
                  <p className="cx__leaddetail-value">
                    {selectedLead.guestCount || 'No especificat'}
                  </p>
                </div>
              </div>
              {selectedLead.message && (
                <div className="cx__leaddetail-msg">
                  <p className="cx__leaddetail-label">Missatge</p>
                  <p className="cx__leaddetail-msgtext">
                    {selectedLead.message}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* MODE PRESSUPOST */}
          {mode === 'quote' ? (
            <>
              {!selectedLeadId && (
                <div className="cx__field">
                  <label htmlFor="cf-email-q" className="cx__label">Correu del client *</label>
                  <input
                    id="cf-email-q"
                    type="email"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="cx__input"
                    placeholder="email@exemple.com"
                  />
                </div>
              )}

              <div className="cx__field">
                <label className="cx__label">Pack recomanat *</label>
                <div className="cx__packgrid">
                  {packs.map((pack) => {
                    const name =
                      pack.translations.find((t) => t.locale === locale)?.name ||
                      pack.translations[0]?.name;
                    const isSelected = selectedPackId === pack.id;
                    return (
                      <button
                        key={pack.id}
                        type="button"
                        onClick={() => setSelectedPackId(pack.id)}
                        aria-pressed={isSelected}
                        style={{
                          padding: '14px 16px',
                          border: `2px solid ${isSelected ? 'var(--ax-hair-gold)' : 'var(--ax-line2)'}`,
                          borderRadius: 10,
                          background: isSelected
                            ? 'color-mix(in oklab, var(--ax-gold) 10%, var(--ax-panel))'
                            : 'var(--ax-sunk)',
                          color: isSelected ? 'var(--ax-gold-bright)' : 'var(--ax-t)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'border-color 120ms ease, background 120ms ease, color 120ms ease',
                        }}
                      >
                        <p className="cx__packname">{name}</p>
                        <p className="cx__packprice">
                          {formatCurrency(pack.price)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="cx__field">
                <label htmlFor="cf-price" className="cx__label">Preu total (€) *</label>
                <input
                  id="cf-price"
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="cx__input cx__priceinput"
                  placeholder="0"
                />
              </div>

              <div className="cx__field">
                <label htmlFor="cf-extras" className="cx__label">Extras inclosos</label>
                <textarea
                  id="cf-extras"
                  value={extras.join('\n')}
                  onChange={(e) => setExtras(e.target.value.split('\n').filter(Boolean))}
                  rows={3}
                  className="cx__textarea"
                  placeholder="Un extra per línia..."
                />
              </div>

              <div className="cx__field">
                <label htmlFor="cf-custmsg" className="cx__label">Missatge personalitzat (opcional)</label>
                <textarea
                  id="cf-custmsg"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={4}
                  className="cx__textarea"
                  placeholder="Afegeix un missatge personalitzat..."
                />
              </div>

              <div className="cx__field">
                <label htmlFor="cf-notes" className="cx__label">Notes addicionals</label>
                <textarea
                  id="cf-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="cx__textarea"
                  placeholder="Notes que apareixeran al pressupost..."
                />
              </div>

              <div className="cx__field">
                <label className="cx__label">Idioma del pressupost</label>
                <div className="cx__localepicker">
                  {[
                    { code: 'ca', label: 'Català' },
                    { code: 'es', label: 'Castellà' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setLocale(lang.code)}
                      aria-pressed={locale === lang.code}
                      className={`cx__localebtn${locale === lang.code ? ' is-on' : ''}`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* MODE CORREU NORMAL */
            <>
              <div className="cx__field">
                <label htmlFor="cf-to" className="cx__label">Per a *</label>
                {isBulkSegmentMode ? (
                  <div className="cx__input cx__input--between">
                    <span>{initialSegmentAudience?.label}</span>
                    <span className="cx__recipcount">
                      {initialSegmentAudience?.recipients.length} contactes
                    </span>
                  </div>
                ) : (
                  <input
                    id="cf-to"
                    type="email"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="cx__input"
                    placeholder="email@exemple.com"
                  />
                )}
              </div>

              <div className="cx__field">
                <label htmlFor="cf-subj" className="cx__label">Assumpte *</label>
                <input
                  id="cf-subj"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="cx__input"
                  placeholder="Assumpte de l'email"
                />
              </div>

              <div className="cx__field">
                <label htmlFor="cf-body" className="cx__label">Missatge *</label>
                <textarea
                  id="cf-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={10}
                  className="cx__textarea"
                  placeholder="Escriu el teu missatge..."
                />
              </div>
            </>
          )}
        </div>

        {/* Barra d'enviament */}
        <div className="cx__composebar">
          <div>
            {error && (
              <div className="cx__error" role="alert">
                {error}
              </div>
            )}
          </div>
          <div className="cx__formactions">
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
              style={sending ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
            >
              {sending
                ? 'Enviant...'
                : mode === 'quote'
                  ? 'Envia pressupost'
                  : isBulkSegmentMode
                    ? 'Envia campanya'
                    : 'Envia correu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
