'use client';

import { useState, useEffect } from 'react';
import type { UnifiedEmail } from './inbox-types';
import { fetchWithCsrf } from '@/lib/csrf';

interface Props {
  email: UnifiedEmail;
  onApply: (text: string) => void;
}

export default function AiReplySuggestions({ email, onApply }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSuggestions([]);
    const bodyText =
      email.imapData?.bodyText ||
      email.imapData?.bodyHtml?.replace(/<[^>]+>/g, ' ').slice(0, 800) ||
      email.leadData?.message ||
      email.preview ||
      '';

    if (!bodyText.trim()) return;

    setLoading(true);
    fetchWithCsrf('/api/admin/ai/inbox-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromName: email.fromName,
        subject: email.subject,
        bodyText,
        eventType: email.leadData?.eventType ?? null,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { suggestions: string[] } | null) => {
        if (data?.suggestions?.length) setSuggestions(data.suggestions);
      })
      .catch(() => {
        setSuggestions([]);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- només volem regenerar suggeriments quan canvia l'email seleccionat; afegir totes les sub-propietats provocaria refetches innecessaris quan l'usuari ja té respostes carregades
  }, [email.id]);

  if (loading) {
    return (
      <div className="mb-4 rounded-xl border border-white/10 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider opacity-40">Suggeriments IA</p>
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (!suggestions.length) return null;

  return (
    <div className="mb-4 rounded-[var(--o-r-md)] border border-[var(--hair-gold)] bg-[var(--panel)] p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--gold)]">
        ✨ Suggeriments de resposta IA
      </p>
      <div className="flex flex-col gap-2">
        {suggestions.map((text, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onApply(text)}
            className="ap-card p-3 text-left text-sm transition-colors hover:border-[var(--hair-gold)] hover:bg-[var(--raised)]"
          >
            <span className="mr-2 text-[var(--gold)] text-xs">{i + 1}.</span>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
