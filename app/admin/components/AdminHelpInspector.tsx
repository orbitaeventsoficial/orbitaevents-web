'use client';

import { useEffect, useState } from 'react';
import { matchHelpEntry } from './adminHelpGlossary';

type HelpPreview = {
  term: string;
  description: string;
  x: number;
  y: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function pickCandidateText(target: HTMLElement): string {
  const ownHints = [
    target.getAttribute('aria-label') || '',
    target.getAttribute('title') || '',
    target.getAttribute('placeholder') || '',
    target.textContent || '',
  ]
    .map((value) => value.trim())
    .filter(Boolean);

  for (const value of ownHints) {
    if (value.length >= 2 && value.length <= 90) return value;
  }

  let current: HTMLElement | null = target;
  for (let i = 0; i < 5 && current; i += 1) {
    const tag = current.tagName.toLowerCase();
    const text = (current.textContent || '').trim().replace(/\s+/g, ' ');
    const semanticTag = /^(label|button|a|h1|h2|h3|h4|h5|h6|dt|th|td|span|p)$/.test(tag);
    if (semanticTag && text.length >= 2 && text.length <= 90) {
      return text;
    }
    current = current.parentElement;
  }

  // Últim recurs: retall curt per evitar blocs enormes que donen falsos positius.
  const fallback = (target.textContent || '').trim().replace(/\s+/g, ' ');
  return fallback.slice(0, 90);
}

export default function AdminHelpInspector() {
  const [preview, setPreview] = useState<HelpPreview | null>(null);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      const target = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
      if (!target) return;

      if (target.closest('[data-help-tooltip="true"]') || target.closest('[data-help-tooltip-panel="true"]')) {
        return;
      }

      const raw = pickCandidateText(target);
      if (!raw || raw.length < 2) {
        setPreview(null);
        return;
      }

      const entry = matchHelpEntry(raw);
      if (!entry) {
        setPreview(null);
        return;
      }

      const x = clamp(event.clientX + 16, 12, window.innerWidth - 320);
      const y = clamp(event.clientY + 16, 80, window.innerHeight - 140);
      setPreview({
        term: entry.term,
        description: entry.description,
        x,
        y,
      });
    };

    const onLeave = () => setPreview(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('blur', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('blur', onLeave);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[68] pointer-events-none" data-help-tooltip-panel="true" aria-hidden>
      {preview && (
        <div
          className="absolute w-72 rounded-xl border p-3 shadow-2xl"
          style={{ left: preview.x, top: preview.y }}
        >
          <p className="text-xs font-semibold">{preview.term}</p>
          <p className="mt-1 text-xs">{preview.description}</p>
        </div>
      )}
    </div>
  );
}

