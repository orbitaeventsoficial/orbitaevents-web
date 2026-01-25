/**
 * UI Components for Admin Dashboard
 * Estil càlid i acollidor - Òrbita Events
 */

import React from 'react';
import Link from 'next/link';

// MetricCard - Tarjeta de métrica con estilo cálido
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
    <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm text-stone-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-stone-800 mt-1">{value}</p>
        </div>
        {icon && <span className="text-2xl opacity-80">{icon}</span>}
      </div>
      {change && (
        <p className={`text-xs font-medium ${changeColors[changeType || 'neutral']}`}>
          {change}
        </p>
      )}
    </div>
  );
}

// Card - Contenedor genérico con estilo cálido
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
        <div className="px-6 py-4 border-b border-amber-100 flex items-center justify-between bg-gradient-to-r from-amber-50/50 to-transparent">
          <div>
            {title && <h3 className="text-lg font-semibold text-stone-800">{title}</h3>}
            {subtitle && <p className="text-sm text-stone-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>{children}</div>
    </div>
  );
}

// Button - Botón con estilo cálido
export function Button({
  variant = 'primary',
  icon,
  label,
  href,
  onClick,
  disabled,
}: {
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: string;
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const baseClasses = 'inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-orange-400 to-amber-500 text-white hover:from-orange-500 hover:to-amber-600 shadow-sm hover:shadow',
    secondary: 'bg-amber-50 text-stone-700 hover:bg-amber-100 border border-amber-200',
    ghost: 'bg-transparent text-stone-600 hover:bg-amber-50 hover:text-stone-800',
  };

  const className = `${baseClasses} ${variantClasses[variant]}`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {icon && <span>{icon}</span>}
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
}
