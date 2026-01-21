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

export default function ComposeForm({ leads, packs }: Props) {
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
      // Email normal
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

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <div className="flex gap-2 p-1 bg-stone-100 rounded-lg w-fit">
        <button
          onClick={() => setMode('email')}
          type="button"
          aria-pressed={mode === 'email'}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'email' ? 'bg-white shadow text-slate-700' : 'text-slate-600'
          }`}
        >
          ✉️ Email normal
        </button>
        <button
          onClick={() => setMode('quote')}
          type="button"
          aria-pressed={mode === 'quote'}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'quote' ? 'bg-white shadow text-slate-700' : 'text-slate-600'
          }`}
        >
          💰 Pressupost professional
        </button>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          
          {/* Select Lead */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Selecciona Lead (opcional)
            </label>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              aria-label="Selecciona lead"
              className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500"
            >
              <option value="">-- Escriu email manualment --</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name} ({lead.email}) - {EVENT_TYPE_LABELS[lead.eventType || ''] || 'Event'}
                </option>
              ))}
            </select>
          </div>

          {/* Lead details preview */}
          {selectedLead && (
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-medium text-slate-700 mb-3">📋 Detalls del lead</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Tipus:</span>
                  <p className="font-medium">{EVENT_TYPE_LABELS[selectedLead.eventType || ''] || 'No especificat'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Data:</span>
                  <p className="font-medium">
                    {selectedLead.eventDate 
                      ? new Date(selectedLead.eventDate).toLocaleDateString('ca-ES')
                      : 'No especificat'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Ubicació:</span>
                  <p className="font-medium">{selectedLead.eventLocation || 'No especificat'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Convidats:</span>
                  <p className="font-medium">{selectedLead.guestCount || 'No especificat'}</p>
                </div>
              </div>
              {selectedLead.message && (
                <div className="mt-3 pt-3 border-t border-stone-200">
                  <span className="text-slate-500 text-sm">Missatge:</span>
                  <p className="text-sm text-slate-700 mt-1">{selectedLead.message}</p>
                </div>
              )}
            </div>
          )}

          {mode === 'quote' ? (
            // Quote form
            <>
              {/* Manual email when no lead selected */}
              {!selectedLeadId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email del client *
                  </label>
                  <input
                    type="email"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="email@exemple.com"
                  />
                </div>
              )}

              {/* Pack selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
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
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-stone-200 hover:border-stone-200'
                      }`}
                    >
                        <p className="font-semibold text-slate-700">{name}</p>
                        <p className="text-amber-600 font-bold mt-1">{pack.price.toLocaleString('es-ES')}€</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Preu total (€) *
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-2xl font-bold"
                  placeholder="0"
                />
              </div>

              {/* Extras */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Extras inclosos
                </label>
                <textarea
                  value={extras.join('\n')}
                  onChange={(e) => setExtras(e.target.value.split('\n').filter(Boolean))}
                  rows={3}
                  className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="Un extra per línia..."
                />
              </div>

              {/* Custom message */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Missatge personalitzat (opcional)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="Afegeix un missatge personalitzat..."
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes addicionals
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="Notes que apareixeran al pressupost..."
                />
              </div>

              {/* Locale */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
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
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        locale === l.code
                          ? 'bg-amber-100 text-amber-700 border-2 border-amber-500'
                          : 'bg-stone-100 text-slate-700 border-2 border-transparent'
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
                <label className="block text-sm font-medium text-slate-700 mb-2">Per a *</label>
                <input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white text-slate-700"
                  placeholder="email@exemple.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Assumpte *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white text-slate-700"
                  placeholder="Assumpte de l'email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Missatge *</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white text-slate-700"
                  placeholder="Escriu el teu missatge..."
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-stone-200">
          <div>
            {error && (
              <p className="text-red-600 text-sm" role="alert">❌ {error}</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/admin/inbox')}
              type="button"
              className="px-4 py-2 text-slate-600 hover:text-slate-700"
            >
              Cancel·lar
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              type="button"
              aria-busy={sending}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                sent
                  ? 'bg-green-500 text-white'
                  : sending
                  ? 'bg-stone-200 text-slate-500 cursor-not-allowed'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              {sent ? '✓ Enviat!' : sending ? 'Enviant...' : mode === 'quote' ? '📤 Enviar pressupost' : '📤 Enviar email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
