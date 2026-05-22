'use client';

import { useEffect, useRef, useState } from 'react';
import { useAdminHelpMode } from './AdminHelpMode';
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
      '[data-help-title]',
      '[data-help-desc]',
      '[data-help-match="true"]',
      'button',
      'a',
      'label',
      'input',
      'textarea',
      'select',
      'summary',
      'th',
      'td',
      'h1',
      'h2',
      'h3',
      'h4',
      '[role="rowheader"]',
      '[role="columnheader"]',
      '[role="button"]',
      '[role="tab"]',
      '[role="link"]',
      '[role="menuitem"]',
    ].join(', ')
  ) as HTMLElement | null;
}

function pickCandidateText(target: HTMLElement): string {
  const ownHints = new Set<string>();

  const addHint = (value: string | null | undefined) => {
    const normalized = (value || '').trim().replace(/\s+/g, ' ');
    if (normalized) ownHints.add(normalized);
  };

  addHint(target.getAttribute('data-help-title'));
  addHint(target.getAttribute('aria-label'));
  addHint(target.getAttribute('title'));
  addHint(target.getAttribute('placeholder'));
  addHint(target.textContent);

  const labelledBy = target.getAttribute('aria-labelledby');
  if (labelledBy) {
    for (const id of labelledBy.split(/\s+/)) {
      addHint(document.getElementById(id)?.textContent);
    }
  }

  if (target instanceof HTMLInputElement && target.labels) {
    for (const label of Array.from(target.labels)) {
      addHint(label.textContent);
    }
  }

  const container = target.closest('section, article, [data-help-scope="true"], .admin-card, .admin-card-glass') as HTMLElement | null;
  if (container) {
    addHint(container.getAttribute('aria-label'));
    addHint(container.querySelector('h1, h2, h3, h4, legend, [data-help-title]')?.textContent);
  }

  for (const value of ownHints) {
    if (value.length >= 2 && value.length <= 120) return value;
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

function getUnderlyingTarget(clientX: number, clientY: number): HTMLElement | null {
  const elements = document.elementsFromPoint(clientX, clientY);
  for (const element of elements) {
    if (!(element instanceof HTMLElement)) continue;
    if (element.closest('[data-help-tooltip-panel="true"]')) continue;
    return element;
  }
  return null;
}

function isHelpToggleTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest('[data-help-toggle="true"]'));
}

function findScrollableParent(target: HTMLElement | null): HTMLElement | null {
  let current = target;
  while (current) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

export default function AdminHelpOverlay() {
  const { setEnabled } = useAdminHelpMode();
  const [preview, setPreview] = useState<HelpPreview | null>(null);
  const lastPointRef = useRef({ x: 48, y: 48 });

  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (!target || target.closest('[data-help-tooltip-panel="true"]')) {
        setPreview(null);
        return;
      }
      const rect = target.getBoundingClientRect();
      const x = rect.left + Math.min(rect.width / 2, 40);
      const y = rect.top + Math.min(rect.height / 2, 24);
      lastPointRef.current = { x, y };
      setPreview(resolvePreview(target, x, y));
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setEnabled(false);
        return;
      }

      const blockedKeys = ['Enter', ' ', 'Spacebar'];
      if (blockedKeys.includes(event.key)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [setEnabled]);

  const handlePointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
    lastPointRef.current = { x: event.clientX, y: event.clientY };
    const target = getUnderlyingTarget(event.clientX, event.clientY);
    setPreview(target ? resolvePreview(target, event.clientX, event.clientY) : null);
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const target = getUnderlyingTarget(event.clientX, event.clientY);
    const scrollable = findScrollableParent(target);

    if (scrollable) {
      event.preventDefault();
      scrollable.scrollBy({ top: event.deltaY, left: event.deltaX, behavior: 'auto' });
      return;
    }

    window.scrollBy({ top: event.deltaY, left: event.deltaX, behavior: 'auto' });
    event.preventDefault();
  };

  const blockAction = (event: React.SyntheticEvent) => {
    if (isHelpToggleTarget(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-[68] cursor-help"
      data-help-tooltip-panel="true"
      aria-hidden
      onMouseMove={handlePointerMove}
      onMouseLeave={() => setPreview(null)}
      onWheel={handleWheel}
      onClick={blockAction}
      onDoubleClick={blockAction}
      onMouseDown={blockAction}
    >
      <div className="pointer-events-none absolute inset-0 bg-black/[0.12]" />
      <button
        type="button"
        data-help-toggle="true"
        className="absolute right-4 top-4 z-[69] rounded-full border border-white/20 bg-black/90 px-4 py-2 text-xs font-semibold text-white shadow-xl"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setEnabled(false);
        }}
      >
        Tancar ajuda
      </button>
      {preview && (
        <div
          className="pointer-events-none absolute w-72 rounded-xl border border-white/15 bg-black/95 p-3 text-white shadow-2xl"
          style={{ left: preview.x, top: preview.y }}
        >
          <p className="text-xs font-semibold">{preview.term}</p>
          <p className="mt-1 text-xs leading-5 text-white/80">{preview.description}</p>
        </div>
      )}
    </div>
  );
}
