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
          className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/5 px-3 py-1.5 text-xs font-medium text-violet-300/80 transition-colors hover:bg-violet-500/15 disabled:opacity-40"
        >
          {loading ? (
            <span className="inline-block h-3 w-3 animate-spin rounded-full border border-violet-400 border-t-transparent" />
          ) : (
            '✨'
          )}
          {loading ? 'Generant...' : (label ?? 'Suggeriments IA')}
        </button>
      )}

      {fetched && suggestions.length > 0 && (
        <div className="mt-2 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-300/70">
              ✨ Opcions IA
            </p>
            <button
              type="button"
              onClick={() => { setSuggestions([]); setFetched(false); }}
              className="text-[11px] text-white/30 hover:text-white/60"
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
                className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-left text-sm transition-colors hover:border-violet-500/40 hover:bg-violet-500/10"
              >
                <span className="mr-2 text-[11px] text-violet-400/70">{i + 1}.</span>
                {text}
              </button>
            ))}
          </div>
        </div>
      )}

      {fetched && suggestions.length === 0 && (
        <p className="mt-1 text-[11px] text-white/30">Sense suggeriments disponibles.</p>
      )}
    </div>
  );
}
