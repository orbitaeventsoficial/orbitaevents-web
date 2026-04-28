// app/admin/inbox/compose/ComposeForm.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { formatDateSimple, formatCurrency, getEventLabel } from '@/lib/constants';
import { fetchWithCsrf } from '@/lib/csrf';
import { generateSmartTemplates, generateAllTemplates, type SmartTemplate } from '@/lib/services/inboxTemplateService';

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
}

const INPUT_CLASSES = 'ap-input';
const IDLE_BUTTON = 'rounded-xl px-4 py-2 text-sm font-medium transition-colors admin-tone-idle';
const ACTIVE_BUTTON = 'rounded-xl border px-4 py-2 text-sm font-medium admin-tone-soft-info admin-tone-border-info admin-tone-text-info';
const CARD_SELECTED = 'rounded-xl border-2 p-4 text-left transition-colors admin-tone-soft-info admin-tone-border-info';
const CARD_IDLE = 'ap-card rounded-xl border-2 p-4 text-left transition-colors hover:admin-tone-bg-neutral';

export default function ComposeForm({
  leads,
  packs,
  returnHref,
  initialLeadId,
  initialCustomer,
  initialTemplate,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<'email' | 'quote'>('email');
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeadId || '');
  const [to, setTo] = useState('');
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

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId);
  const selectedPack = packs.find((pack) => pack.id === selectedPackId);

  useEffect(() => {
    if (initialLeadId) {
      setSelectedLeadId(initialLeadId);
    }
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
      if (selectedLead.interestedPackId) {
        setSelectedPackId(selectedLead.interestedPackId);
      }
      if (selectedLead.interestedExtras?.length) {
        setExtras(selectedLead.interestedExtras);
      }
    }
  }, [selectedLeadId, selectedLead]);

  useEffect(() => {
    if (initialTemplate === 'enviament-pressupost') {
      setMode('quote');
      return;
    }
    if (initialTemplate === 'primer-contacte' || initialTemplate === 'recordatori') {
      setMode('email');
    }
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
    if (selectedPack) {
      setPrice(selectedPack.price.toString());
    }
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
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Error de connexio');
      } finally {
        setSending(false);
      }
      return;
    }

    if (!to || !subject || !body) {
      setError('Omple tots els camps');
      return;
    }

    setSending(true);
    try {
      const res = await fetchWithCsrf('/api/admin/emails/send', {
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
        }),
      });

      if (res.ok) {
        setSent(true);
        setTimeout(() => router.push(returnHref), 1500);
      } else {
        const data = await res.json();
        setError(data.error || 'Error enviant email');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error de connexio');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex w-fit gap-2 rounded-xl border p-1">
        <button
          onClick={() => setMode('email')}
          type="button"
          aria-pressed={mode === 'email'}
          className={mode === 'email' ? ACTIVE_BUTTON : IDLE_BUTTON}
        >
          ✉️ Correu normal
        </button>
        <button
          onClick={() => setMode('quote')}
          type="button"
          aria-pressed={mode === 'quote'}
          className={mode === 'quote' ? ACTIVE_BUTTON : IDLE_BUTTON}
        >
          💰 Pressupost professional
        </button>
      </div>

      {mode === 'email' && smartTemplates.length > 0 && (
        <div className="admin-card-glass rounded-xl border border-white/10 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider opacity-60">Plantilles intel·ligents</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {smartTemplates.map((tpl) => (
              <button
                key={tpl.key}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="admin-stagger-item rounded-lg border border-white/10 p-3 text-left transition-colors hover:bg-white/[0.05]"
              >
                <p className="text-sm font-medium">{tpl.icon} {tpl.label}</p>
                <p className="mt-0.5 text-[11px] opacity-50 line-clamp-1">{tpl.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border admin-card-glass">
        <div className="space-y-6 p-4 sm:p-6">
          <div>
            <label className="mb-2 block text-sm font-medium">Selecciona entrada (opcional)</label>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              aria-label="Selecciona entrada"
              className={INPUT_CLASSES}
            >
              <option value="">-- Escriu email manualment --</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name} ({lead.email}) - {getEventLabel(lead.eventType || '', 'Event')}
                </option>
              ))}
            </select>
          </div>

          {selectedLead && (
            <div className="rounded-xl border p-4">
              <h4 className="mb-3 font-medium">📋 Detalls de l'entrada</h4>
              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <div>
                  <span>Tipus:</span>
                  <p className="font-medium">{getEventLabel(selectedLead.eventType || '', 'No especificat')}</p>
                </div>
                <div>
                  <span>Data:</span>
                  <p className="font-medium">{selectedLead.eventDate ? formatDateSimple(selectedLead.eventDate) : 'No especificat'}</p>
                </div>
                <div>
                  <span>Ubicacio:</span>
                  <p className="font-medium">{selectedLead.eventLocation || 'No especificat'}</p>
                </div>
                <div>
                  <span>Convidats:</span>
                  <p className="font-medium">{selectedLead.guestCount || 'No especificat'}</p>
                </div>
              </div>
              {selectedLead.message && (
                <div className="mt-3 border-t pt-3">
                  <span className="text-sm">Missatge:</span>
                  <p className="mt-1 text-sm">{selectedLead.message}</p>
                </div>
              )}
            </div>
          )}

          {mode === 'quote' ? (
            <>
              {!selectedLeadId && (
                <div>
                  <label className="mb-2 block text-sm font-medium">Correu del client *</label>
                  <input
                    type="email"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className={INPUT_CLASSES}
                    placeholder="email@exemple.com"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium">Pack recomanat *</label>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {packs.map((pack) => {
                    const name = pack.translations.find((translation) => translation.locale === locale)?.name || pack.translations[0]?.name;
                    return (
                      <button
                        key={pack.id}
                        onClick={() => setSelectedPackId(pack.id)}
                        type="button"
                        aria-pressed={selectedPackId === pack.id}
                        className={selectedPackId === pack.id ? CARD_SELECTED : CARD_IDLE}
                      >
                        <p className="font-semibold">{name}</p>
                        <p className="mt-1 font-bold">{formatCurrency(pack.price)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="cf-price" className="mb-2 block text-sm font-medium">
                  Preu total (€) *
                </label>
                <input
                  id="cf-price"
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={`${INPUT_CLASSES} text-2xl font-bold`}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Extras inclosos</label>
                <textarea
                  value={extras.join('\n')}
                  onChange={(e) => setExtras(e.target.value.split('\n').filter(Boolean))}
                  rows={3}
                  className={INPUT_CLASSES}
                  placeholder="Un extra per linia..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Missatge personalitzat (opcional)</label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={4}
                  className={INPUT_CLASSES}
                  placeholder="Afegeix un missatge personalitzat..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Notes addicionals</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className={INPUT_CLASSES}
                  placeholder="Notes que apareixeran al pressupost..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Idioma del pressupost</label>
                <div className="flex gap-2">
                  {[
                    { code: 'ca', label: '🇦🇩 Català' },
                    { code: 'es', label: '🇪🇸 Castellà' },
                  ].map((language) => (
                    <button
                      key={language.code}
                      onClick={() => setLocale(language.code)}
                      type="button"
                      aria-pressed={locale === language.code}
                      className={locale === language.code ? ACTIVE_BUTTON : IDLE_BUTTON}
                    >
                      {language.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium">Per a *</label>
                <input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className={INPUT_CLASSES}
                  placeholder="email@exemple.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Assumpte *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={INPUT_CLASSES}
                  placeholder="Assumpte de l'email"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Missatge *</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={10}
                  className={INPUT_CLASSES}
                  placeholder="Escriu el teu missatge..."
                />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t px-6 py-4">
          <div>
            {error && (
              <p className="text-sm admin-tone-text-danger" role="alert">
                ❌ {error}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push(returnHref)} type="button" className="ap-btn ap-btn--secondary">
              Cancel·lar
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              type="button"
              aria-busy={sending}
              className={`rounded-xl px-6 py-2 font-medium transition-colors ${
                sent
                  ? 'border admin-tone-soft-success admin-tone-border-success admin-tone-text-success'
                  : sending
                    ? 'border border-white/10 bg-white/5 text-white/30 cursor-not-allowed'
                    : 'ap-btn ap-btn--primary'
              }`}
            >
              {sent ? '✓ Enviat!' : sending ? 'Enviant...' : mode === 'quote' ? '📤 Envia pressupost' : '📤 Envia correu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

