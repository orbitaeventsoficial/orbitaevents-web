// app/admin/inbox/compose/ComposeForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  initialCustomer?: {
    id: string;
    name: string;
    email: string;
    preferredLocale: string | null;
  };
  initialTemplate?: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: '💍 Boda',
  BIRTHDAY: '🎂 Aniversari',
  CORPORATE: '🎯 Corporatiu',
  COMMUNION: '⛪ Comunió',
  BAPTISM: '👶 Bateig',
  PRIVATE_PARTY: '🎉 Festa',
  OTHER: '📋 Altre',
};

export default function ComposeForm({ leads, packs, initialCustomer, initialTemplate }: Props) {
  const router = useRouter();

  // Mode: 'email' o 'quote'
  const [mode, setMode] = useState<'email' | 'quote'>('email');

  // Common fields
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [locale, setLocale] = useState('ca');

  // Quote fields
  const [selectedPackId, setSelectedPackId] = useState('');
  const [price, setPrice] = useState('');
  const [extras, setExtras] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  // UI state
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Selected lead details
  const selectedLead = leads.find(l => l.id === selectedLeadId);
  const selectedPack = packs.find(p => p.id === selectedPackId);

  // When lead changes
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

  // When pack changes
  useEffect(() => {
    if (selectedPack) {
      setPrice(selectedPack.price.toString());
    }
  }, [selectedPackId, selectedPack]);

  async function handleSend() {
    setError('');

    if (mode === 'quote') {
      // Either need a lead selected OR a manual email
      const hasRecipient = selectedLeadId || to.trim();
      if (!hasRecipient || !selectedPackId || !price) {
        setError('Selecciona un lead o escriu un email, pack i preu');
        return;
      }

      setSending(true);
      try {
        const res = await fetch('/api/admin/emails/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId: selectedLeadId || undefined,
            customerId: initialCustomer?.id || undefined,
            to: selectedLeadId ? undefined : to.trim(), // Send manual email if no lead
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
          setTimeout(() => router.push('/admin/inbox'), 1500);
        } else {
          const data = await res.json();
          setError(data.error || 'Error enviant pressupost');
        }
      } catch (err) {
        setError('Error de connexió');
      } finally {
        setSending(false);
      }
    } else {
      // Correu normal
      if (!to || !subject || !body) {
        setError('Omple tots els camps');
        return;
      }

      setSending(true);
      try {
        const res = await fetch('/api/admin/emails/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to,
            subject,
            body,
            leadId: selectedLeadId || undefined,
            customerId: initialCustomer?.id || undefined,
            locale,
          }),
        });

        if (res.ok) {
          setSent(true);
          setTimeout(() => router.push('/admin/inbox'), 1500);
        } else {
          const data = await res.json();
          setError(data.error || 'Error enviant email');
        }
      } catch (err) {
        setError('Error de connexió');
      } finally {
        setSending(false);
      }
    }
  }

  const inputClasses = "w-full px-4 py-3 rounded-xl border border-slate-600/50 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500";

  return (
    <div className="space-y-6">
      <div className="flex gap-2 p-1 bg-slate-800/60 rounded-xl w-fit border border-slate-700/50">
        <button
          onClick={() => setMode('email')}
          type="button"
          aria-pressed={mode === 'email'}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'email' ? 'bg-slate-700/80 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          ✉️ Correu normal
        </button>
        <button
          onClick={() => setMode('quote')}
          type="button"
          aria-pressed={mode === 'quote'}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'quote' ? 'bg-slate-700/80 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          💰 Pressupost professional
        </button>
      </div>

      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm overflow-hidden">
        <div className="p-6 space-y-6">

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Selecciona entrada (opcional)
            </label>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              aria-label="Selecciona entrada"
              className={inputClasses}
            >
              <option value="">-- Escriu email manualment --</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name} ({lead.email}) - {EVENT_TYPE_LABELS[lead.eventType || ''] || 'Event'}
                </option>
              ))}
            </select>
          </div>

          {selectedLead && (
            <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-700/50">
              <h4 className="font-medium text-slate-200 mb-3">📋 Detalls de l'entrada</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Tipus:</span>
                  <p className="font-medium text-slate-200">{EVENT_TYPE_LABELS[selectedLead.eventType || ''] || 'No especificat'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Data:</span>
                  <p className="font-medium text-slate-200">
                    {selectedLead.eventDate
                      ? new Date(selectedLead.eventDate).toLocaleDateString('ca-ES')
                      : 'No especificat'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Ubicació:</span>
                  <p className="font-medium text-slate-200">{selectedLead.eventLocation || 'No especificat'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Convidats:</span>
                  <p className="font-medium text-slate-200">{selectedLead.guestCount || 'No especificat'}</p>
                </div>
              </div>
              {selectedLead.message && (
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <span className="text-slate-400 text-sm">Missatge:</span>
                  <p className="text-sm text-slate-300 mt-1">{selectedLead.message}</p>
                </div>
              )}
            </div>
          )}

          {mode === 'quote' ? (
            <>
              {!selectedLeadId && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Correu del client *
                  </label>
                  <input
                    type="email"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className={inputClasses}
                    placeholder="email@exemple.com"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Pack recomanat *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {packs.map((pack) => {
                    const name = pack.translations.find(t => t.locale === locale)?.name || pack.translations[0]?.name;
                    return (
                    <button
                      key={pack.id}
                      onClick={() => setSelectedPackId(pack.id)}
                      type="button"
                      aria-pressed={selectedPackId === pack.id}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedPackId === pack.id
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-slate-600/50 hover:border-slate-500/50 bg-slate-700/30'
                      }`}
                    >
                        <p className="font-semibold text-slate-100">{name}</p>
                        <p className="text-cyan-400 font-bold mt-1">{pack.price.toLocaleString('es-ES')}€</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Preu total (€) *
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={`${inputClasses} text-2xl font-bold`}
                  placeholder="0"
                />
              </div>

              {/* Extras */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Extras inclosos
                </label>
                <textarea
                  value={extras.join('\n')}
                  onChange={(e) => setExtras(e.target.value.split('\n').filter(Boolean))}
                  rows={3}
                  className={inputClasses}
                  placeholder="Un extra per línia..."
                />
              </div>

              {/* Custom message */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Missatge personalitzat (opcional)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={4}
                  className={inputClasses}
                  placeholder="Afegeix un missatge personalitzat..."
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Notes addicionals
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className={inputClasses}
                  placeholder="Notes que apareixeran al pressupost..."
                />
              </div>

              {/* Locale */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Idioma del pressupost
                </label>
                <div className="flex gap-2">
                  {[
                    { code: 'ca', label: '🇦🇩 Català' },
                    { code: 'es', label: '🇪🇸 Castellà' },
                  ].map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setLocale(l.code)}
                      type="button"
                      aria-pressed={locale === l.code}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        locale === l.code
                          ? 'bg-cyan-500/20 text-cyan-300 border-2 border-cyan-500/50'
                          : 'bg-slate-700/50 text-slate-300 border-2 border-transparent hover:bg-slate-600/50'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            // Normal email form
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Per a *</label>
                <input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className={inputClasses}
                  placeholder="email@exemple.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Assumpte *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={inputClasses}
                  placeholder="Assumpte de l'email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Missatge *</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={10}
                  className={inputClasses}
                  placeholder="Escriu el teu missatge..."
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-700/30 border-t border-slate-700/50">
          <div>
            {error && (
              <p className="text-rose-400 text-sm" role="alert">❌ {error}</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/admin/inbox')}
              type="button"
              className="px-4 py-2 text-slate-400 hover:text-slate-300 transition-colors"
            >
              Cancel·lar
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              type="button"
              aria-busy={sending}
              className={`px-6 py-2 rounded-xl font-medium transition-colors ${
                sent
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : sending
                  ? 'bg-slate-700/50 text-slate-500 border border-slate-600/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500'
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
