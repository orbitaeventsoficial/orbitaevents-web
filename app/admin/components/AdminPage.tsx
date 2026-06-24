/**
 * AdminPage — Layout unificat per a totes les pàgines d'admin
 * ============================================================
 *
 * Usage:
 *
 * // Pàgina bàsica
 * <AdminPage title="Tasques" subtitle="34 tasques obertes">
 *   <AdminSection>...</AdminSection>
 * </AdminPage>
 *
 * // Amb accions i back link
 * <AdminPage
 *   title="Inventari"
 *   subtitle="Material tècnic"
 *   back={{ href: '/admin/catalog', label: 'Catàleg' }}
 *   actions={<Link href="/admin/inventory/new" className="ap-btn-primary">+ Nou element</Link>}
 * >
 *   ...
 * </AdminPage>
 *
 * // Amb KPIs
 * <AdminPage title="Economia" kpis={<AdminKpiRow>...</AdminKpiRow>}>
 *   ...
 * </AdminPage>
 */

'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import InfoTooltip from './InfoTooltip';
import type { HelpCopy } from './adminHelpContent';
import { helpAttrs } from './adminHelpContent';
import { getAdminOrganLabel } from '../lib/adminNav';

interface AdminPageProps {
  title: string;
  /** Eyebrow / coordenada canònica (mono, uppercase) sobre el títol — patró Temporada. */
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  back?: { href: string; label: string; help?: HelpCopy };
  actions?: ReactNode;
  kpis?: ReactNode;
  tabs?: ReactNode;
  alert?: ReactNode;
  children: ReactNode;
  className?: string;
  help?: HelpCopy;
  headerHelp?: HelpCopy;
  kpisHelp?: HelpCopy;
  tabsHelp?: HelpCopy;
  alertHelp?: HelpCopy;
  contentHelp?: HelpCopy;
}

export function AdminPage({
  title,
  eyebrow,
  subtitle,
  back,
  actions,
  kpis,
  tabs,
  alert,
  children,
  className = '',
  help,
  headerHelp,
  kpisHelp,
  tabsHelp,
  alertHelp,
  contentHelp,
}: AdminPageProps) {
  const pathname = usePathname();
  // Eyebrow = coordenada d'òrgan (canon Temporada). Si la pàgina no en passa,
  // es deriva de la ruta → grup de nav (font única `adminNav`).
  const resolvedEyebrow = eyebrow ?? getAdminOrganLabel(pathname ?? '');
  return (
    <div className={`ap-page ${className}`} {...helpAttrs(help)}>
      <header className="ap-header" {...helpAttrs(headerHelp)}>
        <div className="ap-header-left">
          {back && (
            <Link href={back.href} className="ap-back" {...helpAttrs(back.help)}>
              ← {back.label}
            </Link>
          )}
          {resolvedEyebrow && <span className="ap-eyebrow">{resolvedEyebrow}</span>}
          <h1 className="ap-title">{title}</h1>
          {subtitle && <p className="ap-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="ap-header-actions">{actions}</div>}
      </header>

      {kpis && <div className="ap-kpis" {...helpAttrs(kpisHelp)}>{kpis}</div>}
      {alert && <div className="ap-alert" {...helpAttrs(alertHelp)}>{alert}</div>}
      {tabs && <nav className="ap-tabs-nav" {...helpAttrs(tabsHelp)}>{tabs}</nav>}
      <div className="ap-content" {...helpAttrs(contentHelp)}>{children}</div>
    </div>
  );
}

interface AdminSectionProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  compact?: boolean;
  flush?: boolean;
  className?: string;
  help?: HelpCopy;
  headerHelp?: HelpCopy;
}

export function AdminSection({
  title,
  description,
  actions,
  children,
  compact = false,
  flush = false,
  className = '',
  help,
  headerHelp,
}: AdminSectionProps) {
  const padClass = flush ? 'ap-section--flush' : compact ? 'ap-section--compact' : '';
  return (
    <section className={`ap-section ${padClass} ${className}`} {...helpAttrs(help)}>
      {(title || actions) && (
        <div className="ap-section-head" {...helpAttrs(headerHelp)}>
          <div>
            {title && <h2 className="ap-section-title">{title}</h2>}
            {description && <p className="ap-section-desc">{description}</p>}
          </div>
          {actions && <div className="ap-section-actions">{actions}</div>}
        </div>
      )}
      <div className="ap-section-body">{children}</div>
    </section>
  );
}

export function AdminKpiRow({ children }: { children: ReactNode }) {
  return <div className="ap-kpi-row">{children}</div>;
}

interface AdminKpiProps {
  label: string;
  value: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  trend?: ReactNode;
  href?: string;
  tooltip?: string;
  help?: HelpCopy;
}

export function AdminKpi({ label, value, tone = 'neutral', trend, href, tooltip, help }: AdminKpiProps) {
  const content = (
    <div className={`ap-kpi ap-kpi--${tone}`} {...helpAttrs(help)}>
      <span className="ap-kpi-label">{label} {tooltip && <InfoTooltip text={tooltip} />}</span>
      <span className="ap-kpi-value">{value}</span>
      {trend && <span className="ap-kpi-trend">{trend}</span>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

interface AdminEmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  help?: HelpCopy;
}

export function AdminEmptyState({ icon = '📭', title, description, action, help }: AdminEmptyStateProps) {
  return (
    <div className="ap-empty" {...helpAttrs(help)}>
      <span className="ap-empty-icon">{icon}</span>
      <p className="ap-empty-title">{title}</p>
      {description && <p className="ap-empty-desc">{description}</p>}
      {action && <div className="ap-empty-action">{action}</div>}
    </div>
  );
}
