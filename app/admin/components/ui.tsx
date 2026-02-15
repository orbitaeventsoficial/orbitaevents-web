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
    gradient: 'from-cyan-500/10 to-cyan-600/5',
    border: 'border-cyan-500/25 hover:border-cyan-400/40',
    text: 'text-cyan-300',
  },
  emerald: {
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    border: 'border-emerald-500/25 hover:border-emerald-400/40',
    text: 'text-emerald-300',
  },
  rose: {
    gradient: 'from-rose-500/10 to-rose-600/5',
    border: 'border-rose-500/25 hover:border-rose-400/40',
    text: 'text-rose-300',
  },
  amber: {
    gradient: 'from-amber-500/10 to-amber-600/5',
    border: 'border-amber-500/25 hover:border-amber-400/40',
    text: 'text-amber-300',
  },
  purple: {
    gradient: 'from-purple-500/10 to-purple-600/5',
    border: 'border-purple-500/25 hover:border-purple-400/40',
    text: 'text-purple-300',
  },
  sky: {
    gradient: 'from-sky-500/10 to-sky-600/5',
    border: 'border-sky-500/25 hover:border-sky-400/40',
    text: 'text-sky-300',
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
    up: 'text-emerald-300',
    down: 'text-rose-300',
    neutral: 'text-slate-400',
  };

  const style = accentStyles[accent];

  return (
    <div className={`rounded-2xl border ${style.border} bg-slate-800/60 bg-gradient-to-br ${style.gradient} p-3 sm:p-5 shadow-sm transition-colors`}>
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-slate-400 font-medium truncate">{label}</p>
          <p className="text-2xl sm:text-3xl font-semibold text-slate-100 mt-0.5 sm:mt-1">{value}</p>
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
    <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/60 shadow-sm">
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-700/50 bg-slate-700/30 px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0 flex-1">
            {title && <h3 className="text-sm sm:text-base font-semibold text-slate-100 truncate">{title}</h3>}
            {subtitle && <p className="mt-0.5 truncate text-[11px] text-slate-400 sm:text-xs">{subtitle}</p>}
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
    primary: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-400 hover:to-amber-500',
    secondary: 'border border-slate-600/60 bg-slate-700/50 text-slate-200 hover:bg-slate-700/70',
    ghost: 'bg-transparent text-slate-300 hover:bg-slate-700/40 hover:text-slate-100',
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

