/**
 * UI Components for Admin Dashboard
 * Unified admin theme - Òrbita Events
 * Mobile-first responsive design
 */

import React from 'react';
import Link from 'next/link';

// Color accent type for MetricCard
type AccentColor = 'cyan' | 'emerald' | 'rose' | 'amber' | 'purple' | 'sky';

const accentClassMap: Record<AccentColor, string> = {
  cyan: '',
  emerald: '',
  rose: '',
  amber: '',
  purple: '',
  sky: '',
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
  const changeClassMap = {
    up: '',
    down: '',
    neutral: '',
  };

  const accentClass = accentClassMap[accent];

  return (
    <div className={`${accentClass}`}>
      <div className="">
        <div className="">
          <p className="">{label}</p>
          <p className="">{value}</p>
        </div>
        {icon && <span className="">{icon}</span>}
      </div>
      <div className="" />
      {change && (
        <p className={`${changeClassMap[changeType || 'neutral']}`}>
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
    <div className="">
      {(title || subtitle || action) && (
        <div className="">
          <div className="">
            {title && <h3 className="">{title}</h3>}
            {subtitle && <p className="">{subtitle}</p>}
          </div>
          {action && <div className="">{action}</div>}
        </div>
      )}
      <div className={`${noPadding ? '' : ''}`}>{children}</div>
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
  const className = ` --${variant} ${
    size === 'sm' ? '' : ''
  }`;

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

