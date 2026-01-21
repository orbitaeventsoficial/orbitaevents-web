/**
 * UI Components for Admin Dashboard
 * Minimal components required by admin/page.tsx
 */

import React from 'react';
import Link from 'next/link';

// MetricCard - Simple metric display card
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
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-slate-600',
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-stone-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        {icon && <span className="text-3xl">{icon}</span>}
      </div>
      {change && (
        <p className={`text-xs font-medium ${changeColors[changeType || 'neutral']}`}>
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
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      {(title || subtitle || action) && (
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-bold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>{children}</div>
    </div>
  );
}

// Button - Simple button component
export function Button({
  variant = 'primary',
  icon,
  label,
  href,
  onClick,
}: {
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: string;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const baseClasses = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm';

  const variantClasses = {
    primary: 'bg-orange-500 text-white hover:bg-orange-600',
    secondary: 'bg-stone-100 text-slate-700 hover:bg-stone-200',
    ghost: 'bg-transparent text-slate-600 hover:bg-stone-100',
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
    <button type="button" onClick={onClick} className={className}>
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
}
