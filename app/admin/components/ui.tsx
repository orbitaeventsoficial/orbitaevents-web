/**
 * UI Components for Admin Dashboard
 * Unified admin theme - Òrbita Events
 * Mobile-first responsive design
 */

import React from 'react';
import Link from 'next/link';

// Color accent type for MetricCard
type AccentColor = 'cyan' | 'emerald' | 'rose' | 'amber' | 'purple' | 'sky';

const accentStyles: Record<AccentColor, { gradient: string; border: string; text: string }> = {
  cyan: {
    gradient: 'from-amber-50 to-orange-100/50',
    border: 'border-amber-200 hover:border-amber-300',
    text: 'text-amber-800',
  },
  emerald: {
    gradient: 'from-emerald-50 to-lime-100/40',
    border: 'border-emerald-200 hover:border-emerald-300',
    text: 'text-emerald-800',
  },
  rose: {
    gradient: 'from-rose-50 to-red-100/50',
    border: 'border-rose-200 hover:border-rose-300',
    text: 'text-rose-800',
  },
  amber: {
    gradient: 'from-amber-50 to-orange-100/60',
    border: 'border-amber-200 hover:border-amber-300',
    text: 'text-amber-800',
  },
  purple: {
    gradient: 'from-stone-100 to-amber-100/50',
    border: 'border-stone-300 hover:border-stone-400',
    text: 'text-stone-800',
  },
  sky: {
    gradient: 'from-orange-50 to-amber-100/50',
    border: 'border-orange-200 hover:border-orange-300',
    text: 'text-orange-800',
  },
};

// MetricCard - Light surface metric card with accent colors
export function MetricCard({
  label,
  value,
  change,
  changeType,
  icon,
  accent = 'cyan',
}: {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon?: string;
  accent?: AccentColor;
}) {
  const changeColors = {
    up: 'text-emerald-700',
    down: 'text-rose-700',
    neutral: 'text-slate-500',
  };

  const style = accentStyles[accent];

  return (
    <div className={`rounded-2xl border ${style.border} bg-gradient-to-br ${style.gradient} p-3 sm:p-5 shadow-sm transition-colors`}>
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">{label}</p>
          <p className="text-2xl sm:text-3xl font-semibold text-slate-800 mt-0.5 sm:mt-1">{value}</p>
        </div>
        {icon && <span className={`text-xl sm:text-2xl opacity-80 shrink-0 ml-2 ${style.text}`}>{icon}</span>}
      </div>
      {change && (
        <p className={`text-[10px] sm:text-xs font-medium truncate ${changeColors[changeType || 'neutral']}`}>
          {change}
        </p>
      )}
    </div>
  );
}

// Card - Generic card container
export function Card({
  title,
  subtitle,
  action,
  noPadding,
  children,
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  noPadding?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#e0d6c3] bg-[#f4f1e8] overflow-hidden shadow-sm">
      {(title || subtitle || action) && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#e0d6c3] flex items-center justify-between gap-3 bg-[#ebe4d6]">
          <div className="min-w-0 flex-1">
            {title && <h3 className="text-sm sm:text-base font-semibold text-slate-800 truncate">{title}</h3>}
            {subtitle && <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-4 sm:p-6'}>{children}</div>
    </div>
  );
}

// Button - Unified button variants
export function Button({
  variant = 'primary',
  icon,
  label,
  href,
  onClick,
  disabled,
  size = 'default',
}: {
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: string;
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'default' | 'sm';
}) {
  const baseClasses = `inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl font-medium transition-all
    disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]
    ${size === 'sm' ? 'px-2.5 sm:px-3 py-1.5 text-xs' : 'px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm'}`;

  const variantClasses = {
    primary: 'bg-[#b8871e] text-white hover:bg-[#a57718] active:bg-[#946a14]',
    secondary: 'border border-[#d6cab7] bg-[#f7f2e8] text-[#3b342d] hover:bg-[#efe6d7]',
    ghost: 'bg-transparent text-[#6f6457] hover:bg-[#efe6d7] hover:text-[#3b342d]',
  };

  const className = `${baseClasses} ${variantClasses[variant]}`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {icon && <span>{icon}</span>}
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </button>
  );
}
