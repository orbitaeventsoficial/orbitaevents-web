'use client';

import { useState } from 'react';
import { log } from '@/lib/logger';
import { fetchWithCsrf } from '@/lib/csrf';
import type { UnifiedEmail, QuotePackOption } from './inbox-types';

const FALLBACK_PACK_OPTIONS: QuotePackOption[] = [
  { id: 'disco-basico', label: 'Bàsic (Festes)', price: 350 },
  { id: 'disco-completo', label: 'Complet (Festes)', price: 400 },
  { id: 'disco-premium', label: 'Premium (Festes)', price: 700 },
  { id: 'bodas-premium', label: 'Premium (Bodes)', price: 800 },
  { id: 'empresas-evento', label: 'Estàndard (Empreses)', price: 850 },
];

function resolvePackOptions(packOptions: QuotePackOption[]): QuotePackOption[] {
  return packOptions.length > 0 ? packOptions : FALLBACK_PACK_OPTIONS;
}

export function ComposeModal({
  replyTo,
  packOptions,
  onClose,
}: {
  replyTo: UnifiedEmail | null;
  packOptions: QuotePackOption[];
  onClose: () => void;
}) {
  const PACK_OPTIONS = resolvePackOptions(packOptions);
  const initialPack = PACK_OPTIONS[0];
  const [to, setTo] = useState(replyTo?.from || '');
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
  const [body, setBody] = useState('');
  const [locale] = useState((replyTo?.leadData?.preferredLocale || 'ca').toLowerCase());
  const [attachQuote, setAttachQuote] = useState(false);
  const [quotePackId, setQuotePackId] = useState(initialPack.id);
  const [quotePrice, setQuotePrice] = useState(initialPack.price);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSend() {
    if (!to || !subject || !body) return;

    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const res = await fetchWithCsrf('/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject,
          body,
          replyToId: replyTo?.leadData?.id,
          locale,
          quote: attachQuote
            ? {
                packId: quotePackId,
                price: Number(quotePrice),
              }
            : undefined,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Error enviant email');
        setSending(false);
        return;
      }

      setSuccess('Email enviat correctament');
      setSent(true);
      setSending(false);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (error) {
      log.error('Error enviant correu', error);
      if (error instanceof Error && error.name === 'AbortError') {
        setError('Temps d\'espera esgotat. Intenta-ho de nou.');
      } else {
        setError('Error enviant email');
      }
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="presentation">
      <div
        className="border rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="compose-title"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 id="compose-title" className="text-lg font-semibold">
            {replyTo ? `↩️ Respondre a ${replyTo.fromName}` : '✏️ Nou email'}
          </h2>
          <button
            onClick={onClose}
            type="button"
            aria-label="Tancar modal"
            className="p-2 rounded-xl"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Per a</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
              placeholder="email@exemple.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Assumpte</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Missatge</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 rounded-xl border focus:ring-1 resize-none"
              placeholder="Escriu el teu missatge..."
            />
          </div>
          <div className="rounded-xl border p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={attachQuote}
                onChange={(e) => setAttachQuote(e.target.checked)}
              />
              Adjuntar pressupost personalitzat
            </label>
            {attachQuote && (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs mb-1">Pack</label>
                  <select
                    value={quotePackId}
                    onChange={(e) => {
                      const next = PACK_OPTIONS.find((p) => p.id === e.target.value);
                      setQuotePackId(e.target.value);
                      if (next) setQuotePrice(next.price);
                    }}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                  >
                    {PACK_OPTIONS.map((pack) => (
                      <option key={pack.id} value={pack.id}>
                        {pack.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="ib-quote-price" className="block text-xs mb-1">Preu base (€)</label>
                  <input
                    id="ib-quote-price"
                    type="number"
                    min={0}
                    value={quotePrice}
                    onChange={(e) => setQuotePrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t" aria-live="polite">
          {error && <span className="text-xs mr-auto" role="alert">{error}</span>}
          {success && <span className="text-xs mr-auto" role="status">{success}</span>}
          <button onClick={onClose} type="button" className="px-4 py-2">Cancel·lar</button>
          <button
            onClick={handleSend}
            disabled={sending || !to || !subject || !body || (attachQuote && quotePrice <= 0)}
            type="button"
            aria-busy={sending}
            className={`px-6 py-2 rounded-xl font-medium ${
              sent ? 'bg-emerald-500 text-white' :
              sending ? 'bg-white/15 text-white/40' :
              'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500'
            }`}
          >
            {sent ? '✓ Enviat!' : sending ? 'Enviant...' : '📤 Envia'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function QuoteModal({
  target,
  packOptions,
  onClose,
  onSent,
}: {
  target: UnifiedEmail;
  packOptions: QuotePackOption[];
  onClose: () => void;
  onSent: (message: string) => void;
}) {
  const PACK_OPTIONS = resolvePackOptions(packOptions);
  const initialPack = PACK_OPTIONS[0];
  const [packId, setPackId] = useState(initialPack.id);
  const [price, setPrice] = useState(initialPack.price);
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recipient = target.leadData?.email || target.imapData?.from.address || target.from;
  const leadId = target.leadData?.id;

  async function handleSendQuote() {
    setSending(true);
    setError(null);
    try {
      const res = await fetchWithCsrf('/api/admin/emails/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          to: recipient,
          packId,
          price: Number(price),
          customMessage,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setError(data?.error || 'Error enviant pressupost');
        setSending(false);
        return;
      }

      onSent(`Pressupost enviat (${data.quoteNumber}) a ${recipient}`);
      onClose();
    } catch (error) {
      console.error('Error sending quote:', error);
      setError('Error enviant pressupost');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="presentation">
      <div className="border rounded-2xl shadow-xl max-w-xl w-full" role="dialog" aria-modal="true" aria-labelledby="quote-title">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 id="quote-title" className="text-lg font-semibold">📄 Pressupost personalitzat</h2>
          <button onClick={onClose} type="button" className="p-2 rounded-xl">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm mb-1">Destinatari</label>
            <input value={recipient} disabled className="w-full px-4 py-2 rounded-xl border text-sm" />
          </div>
          <div>
            <label className="block text-sm mb-1">Pack</label>
            <select
              value={packId}
              onChange={(e) => {
                const next = PACK_OPTIONS.find((p) => p.id === e.target.value);
                setPackId(e.target.value);
                if (next) setPrice(next.price);
              }}
              className="w-full px-4 py-2 rounded-xl border text-sm"
            >
              {PACK_OPTIONS.map((pack) => (
                <option key={pack.id} value={pack.id}>{pack.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Preu base (€)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value) || 0)}
              className="w-full px-4 py-2 rounded-xl border text-sm"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Missatge personalitzat</label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 rounded-xl border text-sm"
              placeholder="Detalls per al client..."
            />
          </div>
          {error && <p className="text-xs" role="alert">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t">
          <button onClick={onClose} type="button" className="px-4 py-2">Cancel·lar</button>
          <button
            onClick={handleSendQuote}
            disabled={sending || !recipient || !packId || price <= 0}
            type="button"
            className="px-6 py-2 rounded-xl text-white disabled:opacity-50"
          >
            {sending ? 'Enviant...' : 'Envia pressupost'}
          </button>
        </div>
      </div>
    </div>
  );
}
