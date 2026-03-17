/**
 * Tooltip — Reutilitzable hover/focus tooltip
 * Usa CSS pures (admin-theme.css) per animació
 */

import { useId } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export default function Tooltip({ text, children }: TooltipProps) {
  const id = useId();

  return (
    <span className="admin-tooltip-wrap" aria-describedby={id}>
      {children}
      <span
        id={id}
        role="tooltip"
        className="admin-tooltip-bubble admin-tooltip-bubble--top"
      >
        {text}
      </span>
    </span>
  );
}

