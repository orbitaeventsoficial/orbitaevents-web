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
  cyan: 'admin-ui-metric-card--cyan',
  emerald: 'admin-ui-metric-card--emerald',
  rose: 'admin-ui-metric-card--rose',
  amber: 'admin-ui-metric-card--amber',
  purple: 'admin-ui-metric-card--purple',
  sky: 'admin-ui-metric-card--sky',
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
    up: 'admin-ui-metric-change--up',
    down: 'admin-ui-metric-change--down',
    neutral: 'admin-ui-metric-change--neutral',
  };

  const accentClass = accentClassMap[accent];

  return (
    <div className={`admin-ui-metric-card ${accentClass}`}>
      <div className="admin-ui-metric-head">
        <div className="admin-ui-metric-copy">
          <p className="admin-ui-metric-label">{label}</p>
          <p className="admin-ui-metric-value">{value}</p>
        </div>
        {icon && <span className="admin-ui-metric-icon">{icon}</span>}
      </div>
      <div className="admin-ui-metric-dot" />
      {change && (
        <p className={`admin-ui-metric-change ${changeClassMap[changeType || 'neutral']}`}>
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
    <div className="admin-ui-card">
      {(title || subtitle || action) && (
        <div className="admin-ui-card-head">
          <div className="admin-ui-card-head-copy">
            {title && <h3 className="admin-ui-card-title">{title}</h3>}
            {subtitle && <p className="admin-ui-card-subtitle">{subtitle}</p>}
          </div>
          {action && <div className="admin-ui-card-head-action">{action}</div>}
        </div>
      )}
      <div className={`admin-ui-card-body ${noPadding ? 'admin-ui-card-body--none' : ''}`}>{children}</div>
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
  const className = `admin-ui-btn admin-ui-btn--${variant} ${
    size === 'sm' ? 'admin-ui-btn--sm' : 'admin-ui-btn--default'
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

