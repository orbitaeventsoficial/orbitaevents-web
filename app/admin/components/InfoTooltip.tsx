'use client';

import { useState } from 'react';
import { useAdminHelpMode } from './AdminHelpMode';

type InfoTooltipProps = {
  text: string;
};

export default function InfoTooltip({ text }: InfoTooltipProps) {
  const { enabled } = useAdminHelpMode();
  const [open, setOpen] = useState(false);

  if (!enabled) return null;

  return (
    <span className="group relative inline-flex align-middle" data-help-tooltip="true">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-amber-300 bg-amber-50 text-[10px] font-bold leading-none text-amber-700 hover:bg-amber-100"
        aria-label="Informació"
        aria-expanded={open}
      >
        ?
      </button>
      <span
        data-help-tooltip-panel="true"
        className={`absolute left-1/2 top-[calc(100%+8px)] z-30 w-64 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs font-normal text-slate-700 shadow-lg ${
          open ? 'block' : 'hidden group-hover:block group-focus-within:block'
        }`}
      >
        {text}
      </span>
    </span>
  );
}
