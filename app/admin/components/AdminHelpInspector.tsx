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

export default function AdminHelpInspector() {
  const [preview, setPreview] = useState<HelpPreview | null>(null);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      const target = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
      if (!target) return;

      if (target.closest('[data-help-tooltip="true"]') || target.closest('[data-help-tooltip-panel="true"]')) {
        return;
      }

      const raw = (target.textContent || '').trim();
      if (!raw || raw.length < 2) {
        setPreview(null);
        return;
      }

      const entry = matchHelpEntry(raw.slice(0, 280));
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
          className="absolute w-72 rounded-xl border border-amber-300/70 bg-white p-3 shadow-2xl"
          style={{ left: preview.x, top: preview.y }}
        >
          <p className="text-xs font-semibold text-slate-900">{preview.term}</p>
          <p className="mt-1 text-xs text-slate-700">{preview.description}</p>
        </div>
      )}
    </div>
  );
}
