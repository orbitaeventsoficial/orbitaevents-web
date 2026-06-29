'use client';

import { useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import type { CopyContextType } from '@/lib/services/copyAiSuggestionsService';

interface Props {
  type: CopyContextType;
  context: string;
  onApply: (text: string) => void;
  label?: string;
}

export default function AiCopySuggestionsInline({ type, context, onApply, label }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  async function handleGenerate() {
    if (!context.trim() || loading) return;
    setLoading(true);
    setFetched(false);
    try {
      const res = await fetchWithCsrf('/api/admin/ai/copy-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, context }),
      });
      if (res.ok) {
        const data = (await res.json()) as { suggestions: string[] };
        setSuggestions(data.suggestions ?? []);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }

  return (
    <div className="mt-2">
      {!fetched && (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !context.trim()}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--hair-gold)] bg-[var(--panel)] px-3 py-1.5 text-xs font-medium text-[var(--gold)] transition-colors hover:bg-[var(--raised)] disabled:opacity-40"
        >
          {loading ? (
            <span className="inline-block h-3 w-3 animate-spin rounded-full border border-[var(--gold)] border-t-transparent" />
          ) : (
            '✨'
          )}
          {loading ? 'Generant...' : (label ?? 'Suggeriments IA')}
        </button>
      )}

      {fetched && suggestions.length > 0 && (
        <div className="mt-2 rounded-[var(--o-r-md)] border border-[var(--hair-gold)] bg-[var(--panel)] p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--gold)]">
              ✨ Opcions IA
            </p>
            <button
              type="button"
              onClick={() => { setSuggestions([]); setFetched(false); }}
              className="text-xs text-[var(--t3)] hover:text-[var(--t2)]"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {suggestions.map((text, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onApply(text)}
                className="ap-card p-3 text-left text-sm transition-colors hover:border-[var(--hair-gold)] hover:bg-[var(--raised)]"
              >
                <span className="mr-2 text-xs text-[var(--gold)]">{i + 1}.</span>
                {text}
              </button>
            ))}
          </div>
        </div>
      )}

      {fetched && suggestions.length === 0 && (
        <p className="mt-1 text-xs text-[var(--t3)]">Sense suggeriments disponibles.</p>
      )}
    </div>
  );
}
