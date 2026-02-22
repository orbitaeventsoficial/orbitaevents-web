'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAdminHelpMode } from './AdminHelpMode';

type InfoTooltipProps = {
  text: string;
  alwaysEnabled?: boolean;
  side?: 'top' | 'right' | 'bottom' | 'left';
};

type Pos = { top: number; left: number; transformOrigin: string };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function InfoTooltip({ text, alwaysEnabled = false, side = 'right' }: InfoTooltipProps) {
  const { enabled } = useAdminHelpMode();
  const shouldRender = alwaysEnabled || enabled;

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  const openTip = useCallback(() => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpen(true);
  }, []);

  const closeTipDelayed = useCallback(() => {
    if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = window.setTimeout(() => {
      setOpen(false);
      closeTimeoutRef.current = null;
    }, 120);
  }, []);

  useEffect(() => setMounted(true), []);
  useEffect(() => () => {
    if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current);
  }, []);

  const cleanText = useMemo(() => (text ?? '').trim(), [text]);

  const computePosition = useCallback(() => {
    const btn = btnRef.current;
    const panel = panelRef.current;
    if (!btn || !panel) return;

    const br = btn.getBoundingClientRect();
    const pr = panel.getBoundingClientRect();

    const padding = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 10;

    const canTop = br.top >= pr.height + gap + padding;
    const canBottom = vh - br.bottom >= pr.height + gap + padding;
    const canRight = vw - br.right >= pr.width + gap + padding;
    const canLeft = br.left >= pr.width + gap + padding;

    const order: Array<InfoTooltipProps['side']> = [side, 'top', 'right', 'bottom', 'left'];
    let chosen: InfoTooltipProps['side'] = side;

    for (const s of order) {
      if (s === 'top' && canTop) { chosen = 'top'; break; }
      if (s === 'bottom' && canBottom) { chosen = 'bottom'; break; }
      if (s === 'right' && canRight) { chosen = 'right'; break; }
      if (s === 'left' && canLeft) { chosen = 'left'; break; }
    }

    let top = 0;
    let left = 0;
    let transformOrigin = 'center';

    if (chosen === 'right') {
      top = br.top + br.height / 2 - pr.height / 2;
      left = br.right + gap;
      transformOrigin = 'left center';
    } else if (chosen === 'left') {
      top = br.top + br.height / 2 - pr.height / 2;
      left = br.left - pr.width - gap;
      transformOrigin = 'right center';
    } else if (chosen === 'top') {
      top = br.top - pr.height - gap;
      left = br.left + br.width / 2 - pr.width / 2;
      transformOrigin = 'center bottom';
    } else {
      top = br.bottom + gap;
      left = br.left + br.width / 2 - pr.width / 2;
      transformOrigin = 'center top';
    }

    top = clamp(top, padding, vh - pr.height - padding);
    left = clamp(left, padding, vw - pr.width - padding);

    setPos({ top, left, transformOrigin });
  }, [side]);

  useEffect(() => {
    if (!open) return;

    computePosition();

    const onResize = () => computePosition();
    const onScroll = () => computePosition();

    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, computePosition]);

  if (!shouldRender || !cleanText) return null;

  const panel = (
    <div
      ref={panelRef}
      role="tooltip"
      className="fixed z-[99999] w-[320px] max-w-[calc(100vw-24px)] rounded-xl border border-white/10 bg-[var(--at-bg)] px-3 py-2 text-left text-xs leading-4 text-white shadow-2xl"
      style={{
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        transformOrigin: pos?.transformOrigin ?? 'center',
        pointerEvents: 'auto',
      }}
      onMouseEnter={openTip}
      onMouseLeave={closeTipDelayed}
    >
      {cleanText}
    </div>
  );

  return (
    <span className="inline-flex align-middle" data-help-tooltip="true">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        onMouseEnter={openTip}
        onMouseLeave={closeTipDelayed}
        onFocus={openTip}
        onBlur={closeTipDelayed}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-white/10 text-[12px] font-bold leading-none text-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        aria-label="Ajuda"
        aria-expanded={open}
      >
        ?
      </button>

      {mounted && open ? createPortal(panel, document.body) : null}
    </span>
  );
}
