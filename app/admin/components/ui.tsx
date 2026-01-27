/**
 * UI Components for Admin Dashboard
 * Dark elegant theme - Òrbita Events
 * Mobile-first responsive design
 */

import React from 'react';
import Link from 'next/link';

// Color accent type for MetricCard
type AccentColor = 'cyan' | 'emerald' | 'rose' | 'amber' | 'purple' | 'sky';

const accentStyles: Record<AccentColor, { gradient: string; border: string; text: string }> = {
  cyan: {
    gradient: 'from-cyan-500/10 to-blue-600/5',
    border: 'border-cyan-500/20 hover:border-cyan-500/30',
    text: 'text-cyan-400',
  },
  emerald: {
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    border: 'border-emerald-500/20 hover:border-emerald-500/30',
    text: 'text-emerald-400',
  },
  rose: {
    gradient: 'from-rose-500/10 to-rose-600/5',
    border: 'border-rose-500/20 hover:border-rose-500/30',
    text: 'text-rose-400',
  },
  amber: {
    gradient: 'from-amber-500/10 to-amber-600/5',
    border: 'border-amber-500/20 hover:border-amber-500/30',
    text: 'text-amber-400',
  },
  purple: {
    gradient: 'from-purple-500/10 to-purple-600/5',
    border: 'border-purple-500/20 hover:border-purple-500/30',
    text: 'text-purple-400',
  },
  sky: {
    gradient: 'from-sky-500/10 to-sky-600/5',
    border: 'border-sky-500/20 hover:border-sky-500/30',
    text: 'text-sky-400',
  },
};

// MetricCard - Dark theme metric card with accent colors
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
    up: 'text-emerald-400',
    down: 'text-rose-400',
    neutral: 'text-slate-400',
  };

  const style = accentStyles[accent];

  return (
    <div className={`rounded-2xl border ${style.border} bg-gradient-to-br ${style.gradient} p-3 sm:p-5 backdrop-blur-sm transition-colors`}>
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

// Card - Dark theme generic card container
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
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm overflow-hidden">
      {(title || subtitle || action) && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-700/50 flex items-center justify-between gap-3 bg-slate-700/30">
          <div className="min-w-0 flex-1">
            {title && <h3 className="text-sm sm:text-base font-semibold text-slate-100 truncate">{title}</h3>}
            {subtitle && <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-4 sm:p-6'}>{children}</div>
    </div>
  );
}

// Button - Dark theme button with variants
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
    primary: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 active:from-cyan-600 active:to-blue-700 shadow-lg shadow-cyan-500/20',
    secondary: 'border border-slate-600/50 bg-slate-700/50 text-slate-200 hover:bg-slate-600/50',
    ghost: 'bg-transparent text-slate-400 hover:bg-slate-700/50 hover:text-slate-200',
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
