/**
 * UI Components for Admin Dashboard
 * Estil càlid i acollidor - Òrbita Events
 * Mobile-first responsive design
 */

import React from 'react';
import Link from 'next/link';

// MetricCard - Tarjeta de métrica con responsive
export function MetricCard({
  label,
  value,
  change,
  changeType,
  icon,
}: {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon?: string;
}) {
  const changeColors = {
    up: 'text-emerald-600',
    down: 'text-rose-600',
    neutral: 'text-stone-500',
  };

  return (
    <div className="bg-white rounded-2xl p-3 sm:p-5 border border-amber-100 shadow-sm hover:shadow-md active:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-stone-500 font-medium truncate">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-stone-800 mt-0.5 sm:mt-1">{value}</p>
        </div>
        {icon && <span className="text-xl sm:text-2xl opacity-80 shrink-0 ml-2">{icon}</span>}
      </div>
      {change && (
        <p className={`text-[10px] sm:text-xs font-medium truncate ${changeColors[changeType || 'neutral']}`}>
          {change}
        </p>
      )}
    </div>
  );
}

// Card - Contenedor genérico con responsive
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
    <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden shadow-sm">
      {(title || subtitle || action) && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-amber-100 flex items-center justify-between gap-3 bg-gradient-to-r from-amber-50/50 to-transparent">
          <div className="min-w-0 flex-1">
            {title && <h3 className="text-base sm:text-lg font-semibold text-stone-800 truncate">{title}</h3>}
            {subtitle && <p className="text-xs sm:text-sm text-stone-500 mt-0.5 truncate">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-4 sm:p-6'}>{children}</div>
    </div>
  );
}

// Button - Botón con áreas táctiles para móvil
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
    primary: 'bg-gradient-to-r from-orange-400 to-amber-500 text-white hover:from-orange-500 hover:to-amber-600 active:from-orange-600 active:to-amber-700 shadow-sm hover:shadow',
    secondary: 'bg-amber-50 text-stone-700 hover:bg-amber-100 active:bg-amber-200 border border-amber-200',
    ghost: 'bg-transparent text-stone-600 hover:bg-amber-50 active:bg-amber-100 hover:text-stone-800',
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
