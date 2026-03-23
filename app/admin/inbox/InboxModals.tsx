'use client';

import { useState } from 'react';
import { log } from '@/lib/logger';
import { fetchWithCsrf } from '@/lib/csrf';
import { ADMIN_INBOX_FALLBACK_PACK_OPTIONS } from '@/lib/constants/admin';
import type { UnifiedEmail, QuotePackOption } from './inbox-types';

function resolvePackOptions(packOptions: QuotePackOption[]): QuotePackOption[] {
  return packOptions.length > 0 ? packOptions : [...ADMIN_INBOX_FALLBACK_PACK_OPTIONS];
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="presentation">
      <div
        className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-2xl border shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="compose-title"
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 id="compose-title" className="text-lg font-semibold">
            {replyTo ? `↩️ Respondre a ${replyTo.fromName}` : '✏️ Nou email'}
          </h2>
          <button onClick={onClose} type="button" aria-label="Tancar modal" className="rounded-xl p-2">
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          <div>
            <label className="mb-1 block text-sm font-medium">Per a</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="ap-input px-4 py-2"
              placeholder="email@exemple.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Assumpte</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="ap-input px-4 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Missatge</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="w-full resize-none rounded-xl border px-4 py-3 focus:ring-1"
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
                  <label className="mb-1 block text-xs">Pack</label>
                  <select
                    value={quotePackId}
                    onChange={(e) => {
                      const next = PACK_OPTIONS.find((p) => p.id === e.target.value);
                      setQuotePackId(e.target.value);
                      if (next) setQuotePrice(next.price);
                    }}
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                  >
                    {PACK_OPTIONS.map((pack) => (
                      <option key={pack.id} value={pack.id}>
                        {pack.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="ib-quote-price" className="mb-1 block text-xs">
                    Preu base (€)
                  </label>
                  <input
                    id="ib-quote-price"
                    type="number"
                    min={0}
                    value={quotePrice}
                    onChange={(e) => setQuotePrice(Number(e.target.value) || 0)}
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-6 py-4" aria-live="polite">
          {error && (
            <span className="mr-auto text-xs admin-tone-text-danger" role="alert">
              {error}
            </span>
          )}
          {success && (
            <span className="mr-auto text-xs admin-tone-text-success" role="status">
              {success}
            </span>
          )}
          <button onClick={onClose} type="button" className="px-4 py-2">
            Cancel·lar
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !to || !subject || !body || (attachQuote && quotePrice <= 0)}
            type="button"
            aria-busy={sending}
            className={`rounded-xl px-6 py-2 font-medium transition-colors ${
              sent
                ? 'border admin-tone-soft-success admin-tone-border-success admin-tone-text-success'
                : sending
                  ? 'border border-white/10 bg-white/15 text-white/40'
                  : 'ap-btn ap-btn--primary'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="presentation">
      <div className="w-full max-w-xl rounded-2xl border shadow-xl" role="dialog" aria-modal="true" aria-labelledby="quote-title">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 id="quote-title" className="text-lg font-semibold">
            📄 Pressupost personalitzat
          </h2>
          <button onClick={onClose} type="button" className="rounded-xl p-2">
            ✕
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm">Destinatari</label>
            <input value={recipient} disabled className="w-full rounded-xl border px-4 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm">Pack</label>
            <select
              value={packId}
              onChange={(e) => {
                const next = PACK_OPTIONS.find((p) => p.id === e.target.value);
                setPackId(e.target.value);
                if (next) setPrice(next.price);
              }}
              className="w-full rounded-xl border px-4 py-2 text-sm"
            >
              {PACK_OPTIONS.map((pack) => (
                <option key={pack.id} value={pack.id}>
                  {pack.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">Preu base (€)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value) || 0)}
              className="w-full rounded-xl border px-4 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Missatge personalitzat</label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              className="w-full rounded-xl border px-4 py-2 text-sm"
              placeholder="Detalls per al client..."
            />
          </div>
          {error && (
            <p className="text-xs admin-tone-text-danger" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
          <button onClick={onClose} type="button" className="px-4 py-2">
            Cancel·lar
          </button>
          <button
            onClick={handleSendQuote}
            disabled={sending || !recipient || !packId || price <= 0}
            type="button"
            className="ap-btn ap-btn--primary px-6 py-2 disabled:opacity-50"
          >
            {sending ? 'Enviant...' : 'Envia pressupost'}
          </button>
        </div>
      </div>
    </div>
  );
}

