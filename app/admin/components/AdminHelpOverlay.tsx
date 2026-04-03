'use client';

import { useEffect, useRef, useState } from 'react';
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

function buildPosition(clientX: number, clientY: number): Pick<HelpPreview, 'x' | 'y'> {
  return {
    x: clamp(clientX + 18, 12, window.innerWidth - 320),
    y: clamp(clientY + 18, 24, window.innerHeight - 160),
  };
}

function findStructuredHelp(target: HTMLElement): Pick<HelpPreview, 'term' | 'description'> | null {
  const structuredTarget = target.closest('[data-help-title][data-help-desc]') as HTMLElement | null;
  if (structuredTarget) {
    const term = (structuredTarget.getAttribute('data-help-title') || '').trim();
    const description = (structuredTarget.getAttribute('data-help-desc') || '').trim();
    if (term && description) {
      return { term, description };
    }
  }

  let current: HTMLElement | null = target;
  for (let i = 0; i < 8 && current; i += 1) {
    const term = (
      current.getAttribute('data-help-title') ||
      current.getAttribute('aria-label') ||
      current.getAttribute('title') ||
      ''
    ).trim();
    const description = (
      current.getAttribute('data-help-desc') ||
      current.getAttribute('aria-description') ||
      ''
    ).trim();
    if (term && description) {
      return { term, description };
    }
    current = current.parentElement;
  }
  return null;
}

function findGlossaryTarget(target: HTMLElement): HTMLElement | null {
  return target.closest(
    [
      '[data-help-match="true"]',
      'button',
      'a',
      'label',
      'input',
      'textarea',
      'select',
      '[role="button"]',
      '[role="tab"]',
      '[role="link"]',
      '[role="menuitem"]',
    ].join(', ')
  ) as HTMLElement | null;
}

function pickCandidateText(target: HTMLElement): string {
  const ownHints = [
    target.getAttribute('data-help-title') || '',
    target.getAttribute('aria-label') || '',
    target.getAttribute('title') || '',
    target.getAttribute('placeholder') || '',
    target.textContent || '',
  ]
    .map((value) => value.trim().replace(/\s+/g, ' '))
    .filter(Boolean);

  for (const value of ownHints) {
    if (value.length >= 2 && value.length <= 90) return value;
  }

  return '';
}

function resolvePreview(target: HTMLElement, clientX: number, clientY: number): HelpPreview | null {
  if (target.closest('[data-help-tooltip="true"]') || target.closest('[data-help-tooltip-panel="true"]')) {
    return null;
  }

  const position = buildPosition(clientX, clientY);
  const structured = findStructuredHelp(target);
  if (structured) {
    return { ...structured, ...position };
  }

  const glossaryTarget = findGlossaryTarget(target);
  if (!glossaryTarget) {
    return null;
  }

  const raw = pickCandidateText(glossaryTarget);
  if (!raw || raw.length < 2) {
    return null;
  }

  const entry = matchHelpEntry(raw);
  if (!entry) {
    return null;
  }

  return {
    term: entry.term,
    description: entry.description,
    ...position,
  };
}

export default function AdminHelpOverlay() {
  const [preview, setPreview] = useState<HelpPreview | null>(null);
  const lastPointRef = useRef({ x: 48, y: 48 });

  useEffect(() => {
    const updateFromTarget = (target: HTMLElement | null, clientX?: number, clientY?: number) => {
      if (!target) {
        setPreview(null);
        return;
      }

      const x = clientX ?? lastPointRef.current.x;
      const y = clientY ?? lastPointRef.current.y;
      setPreview(resolvePreview(target, x, y));
    };

    const onMove = (event: MouseEvent) => {
      lastPointRef.current = { x: event.clientX, y: event.clientY };
      const target = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
      updateFromTarget(target, event.clientX, event.clientY);
    };

    const onOver = (event: MouseEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const pointX = event.clientX || lastPointRef.current.x;
      const pointY = event.clientY || lastPointRef.current.y;
      lastPointRef.current = { x: pointX, y: pointY };
      updateFromTarget(target, pointX, pointY);
    };

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (!target) {
        setPreview(null);
        return;
      }
      const rect = target.getBoundingClientRect();
      const x = rect.left + Math.min(rect.width / 2, 40);
      const y = rect.top + Math.min(rect.height / 2, 24);
      lastPointRef.current = { x, y };
      updateFromTarget(target, x, y);
    };

    const onLeave = () => setPreview(null);

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('focusin', onFocusIn);
    window.addEventListener('blur', onLeave);
    document.addEventListener('mouseleave', onLeave);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('focusin', onFocusIn);
      window.removeEventListener('blur', onLeave);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[68]" data-help-tooltip-panel="true" aria-hidden>
      {preview && (
        <div
          className="absolute w-72 rounded-xl border bg-black/95 p-3 text-white shadow-2xl"
          style={{ left: preview.x, top: preview.y }}
        >
          <p className="text-xs font-semibold">{preview.term}</p>
          <p className="mt-1 text-xs leading-5 text-white/80">{preview.description}</p>
        </div>
      )}
    </div>
  );
}




